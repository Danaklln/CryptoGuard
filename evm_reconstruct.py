import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from bisect import bisect_left, bisect_right
from pathlib import Path

try:
    import evmole  #evmole: extrae funciones, argumentos, mutabilidad y storage del bytecode
except ImportError:
    evmole = None

OPCODES = {
    0x00:"STOP",0x01:"ADD",0x02:"MUL",0x03:"SUB",0x04:"DIV",0x05:"SDIV",0x06:"MOD",0x08:"ADDMOD",0x09:"MULMOD",0x0a:"EXP",0x10:"LT",0x11:"GT",0x12:"SLT",0x13:"SGT",0x14:"EQ",0x15:"ISZERO",0x16:"AND",0x17:"OR",0x18:"XOR",0x19:"NOT",0x1a:"BYTE",0x1b:"SHL",0x1c:"SHR",0x1d:"SAR",
    0x20:"KECCAK256",0x30:"ADDRESS",0x31:"BALANCE",0x32:"ORIGIN",0x33:"CALLER",0x34:"CALLVALUE",0x35:"CALLDATALOAD",0x36:"CALLDATASIZE",0x37:"CALLDATACOPY",0x38:"CODESIZE",0x39:"CODECOPY",0x3a:"GASPRICE",0x3b:"EXTCODESIZE",0x3c:"EXTCODECOPY",0x3d:"RETURNDATASIZE",0x3e:"RETURNDATACOPY",0x3f:"EXTCODEHASH",
    0x40:"BLOCKHASH",0x41:"COINBASE",0x42:"TIMESTAMP",0x43:"NUMBER",0x44:"PREVRANDAO",0x45:"GASLIMIT",0x46:"CHAINID",0x47:"SELFBALANCE",0x48:"BASEFEE",0x50:"POP",0x51:"MLOAD",0x52:"MSTORE",0x53:"MSTORE8",0x54:"SLOAD",0x55:"SSTORE",0x56:"JUMP",0x57:"JUMPI",0x58:"PC",0x59:"MSIZE",0x5a:"GAS",0x5b:"JUMPDEST",0x5f:"PUSH0",0xf0:"CREATE",0xf1:"CALL",0xf2:"CALLCODE",0xf3:"RETURN",0xf4:"DELEGATECALL",0xf5:"CREATE2",0xfa:"STATICCALL",0xfd:"REVERT",0xfe:"INVALID",0xff:"SELFDESTRUCT",
}
for i in range(1, 33): OPCODES[0x5f+i] = f"PUSH{i}"
for i in range(1, 17): OPCODES[0x7f+i] = f"DUP{i}"
for i in range(1, 17): OPCODES[0x8f+i] = f"SWAP{i}"
for i in range(0, 5): OPCODES[0xa0+i] = f"LOG{i}"


def read_bin(path: Path) -> bytes:
    raw = path.read_text(encoding="utf-8-sig").strip()
    raw = re.sub(r"\s+", "", raw)
    if raw.startswith(("0x", "0X")): raw = raw[2:]
    if not raw or len(raw) % 2 or not re.fullmatch(r"[0-9a-fA-F]+", raw):
        raise ValueError("El archivo no contiene hexadecimal válido (con o sin prefijo 0x).")
    return bytes.fromhex(raw)


def disassemble(code: bytes):
    rows, i = [], 0
    while i < len(code):
        pc, op = i, code[i]
        name = OPCODES.get(op, f"INVALID_{op:02x}")
        i += 1
        arg = ""
        if 0x60 <= op <= 0x7f:
            n = op - 0x5f
            chunk = code[i:i+n]
            arg = "0x" + chunk.hex()
            i += n
        rows.append((pc, name, arg))
    return rows


def metadata(code: bytes):
    if len(code) < 4: return None
    n = int.from_bytes(code[-2:], "big")
    start = len(code) - 2 - n
    if start < 0: return None
    trailer = code[start:-2]
    if not trailer or trailer[0] >> 5 != 5: return None
    info = {"offset": start, "length": n, "raw_hex": trailer.hex()}
    m = re.search(rb"solc(\x43)(.{3})", trailer)
    if m:
        v = m.group(2)
        info["solc"] = f"{v[0]}.{v[1]}.{v[2]}"
    return info


def selectors(rows):
    found = []

    for i, (_, op, arg) in enumerate(rows[:-1]):
        if op in ("PUSH3", "PUSH4") and arg:
            nxt = [r[1] for r in rows[i+1:i+5]]
            if "EQ" in nxt[:2] and "JUMPI" in nxt:
                found.append("0x" + arg[2:].lower().rjust(8, "0"))
    return list(dict.fromkeys(found))


def split_runtime(code: bytes, rows):
    """Si es bytecode de creación, devuelve (constructor, runtime). Si ya es runtime, (b"", code).

    Patrón de solc: PUSH size, DUP1, PUSH offset, PUSH0/PUSH1 0, CODECOPY, PUSH0/PUSH1 0, RETURN.
    """
    for k, (_, op, _) in enumerate(rows):
        if op != "CODECOPY" or k < 4:
            continue
        if "RETURN" not in [r[1] for r in rows[k+1:k+4]]:
            continue
        pushes = [int(r[2], 16) if r[2] else 0 for r in rows[k-4:k] if r[1].startswith("PUSH")]
        if len(pushes) < 3:
            continue
        size, offset = pushes[-3], pushes[-2]
        if 0 < offset < len(code) and size > 0 and offset + size <= len(code):
            return code[:offset], code[offset:offset + size]
    return b"", code


def lookup_4byte(selector: str, base_url: str, timeout: int = 5):
    """Return all known text signatures for a selector from 4byte.directory."""
    query = urllib.parse.urlencode({"hex_signature": selector})
    url = base_url.rstrip("/") + "/api/v1/signatures/?" + query
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "evm-reconstruct/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    results = sorted((r for r in data.get("results", []) if r.get("text_signature")), key=lambda r: r.get("id", 0))
    return list(dict.fromkeys(r["text_signature"] for r in results))


@lru_cache(maxsize=None)
def lookup_4byte_cached(selector: str, base_url: str, timeout: int):
    return tuple(lookup_4byte(selector, base_url, timeout))


def evmole_info(runtime: bytes):
    """Funciones (selector, argumentos, mutabilidad) y layout de storage vía evmole, si está instalado."""
    if evmole is None or not runtime:
        return None, None
    info = evmole.contract_info(runtime, selectors=True, arguments=True, state_mutability=True, storage=True)
    functions = [{
        "selector": "0x" + f.selector,
        "arguments": f.arguments,
        "state_mutability": f.state_mutability,
        "bytecode_offset": f.bytecode_offset,
    } for f in (info.functions or [])]
    storage = [{
        "slot": int(r.slot, 16), "offset": r.offset, "type": r.type,
        "read_by": ["0x" + x for x in r.reads], "written_by": ["0x" + x for x in r.writes],
    } for r in (info.storage or [])]
    return functions, storage


def split_types(args: str):
    """Separa 'address,(uint256,bool)[]' respetando paréntesis."""
    out, depth, cur = [], 0, ""
    for ch in args or "":
        if ch == "," and depth == 0:
            out.append(cur); cur = ""
            continue
        depth += ch == "("
        depth -= ch == ")"
        cur += ch
    if cur: out.append(cur)
    return out


def pick_name(fn: dict):
    """Nombre de función: candidato de 4byte cuyos argumentos coinciden con evmole, si existe."""
    cands = fn.get("candidates") or []
    args = fn.get("arguments")
    for c in cands:
        name, _, rest = c.partition("(")
        if args is not None and rest[:-1] == args:
            return name, "4byte (argumentos coinciden con evmole)"
    if cands:
        return cands[0].partition("(")[0], "4byte (sin verificar argumentos)"
    return "func_" + fn["selector"][2:], "desconocido"


def solidity_type(t: str, idx: int):
    if "(" in t: 
        return f"bytes calldata arg{idx} /* {t} */"
    if t in ("string", "bytes") or t.endswith("]"):
        return f"{t} calldata arg{idx}"
    return f"{t} arg{idx}"


def facts_lines(facts):
    """Hechos verificados sobre el grafo de control, en líneas legibles para el esqueleto."""
    if not facts:
        return []
    out = []
    if facts["llamadas_externas"]:
        out.append("HECHO: hace llamada(s) externa(s): " + ", ".join(facts["llamadas_externas"]))
    if facts.get("tipos_de_llamada"):
        out.append("HECHO: tipo de llamada: " + "; ".join(facts["tipos_de_llamada"]))
    for c in facts.get("funciones_llamadas", []):
        out.append(f"HECHO: llama en otro contrato a {c['firma_probable'] or 'selector desconocido'} ({c['selector']})")
    if facts["escribe_storage_despues_de_llamada_externa"]:
        out.append("HECHO: escribe storage DESPUÉS de la llamada externa (patrón de reentrancy)")
    flags = [label for key, label in (("lee_storage", "lee storage"), ("escribe_storage", "escribe storage"),
                                      ("usa_msg_sender", "usa msg.sender"), ("usa_msg_value", "usa msg.value"),
                                      ("consulta_balance", "consulta balance"), ("emite_eventos", "emite eventos"),
                                      ("selfdestruct", "SELFDESTRUCT")) if facts.get(key)]
    if flags:
        out.append("HECHO: " + ", ".join(flags))
    return out


def build_skeleton(contract_name: str, a: dict) -> str:
    """Esqueleto determinístico: firmas, mutabilidad, storage y pragma salen del bytecode, no del modelo."""
    solc = (a.get("metadata") or {}).get("solc")
    lines = ["// SPDX-License-Identifier: UNLICENSED",
             f"pragma solidity ^{solc};" if solc else "pragma solidity ^0.8.0; // versión de solc desconocida",
             "",
             "// Esqueleto generado automáticamente a partir del bytecode (no es el fuente original).",
             f"contract {contract_name} {{"]
    for st in a.get("storage") or []:
        suffix = f"_{st['offset']}" if st["offset"] else ""
        lines.append(f"    {st['type']} internal slot{st['slot']}{suffix}; "
                     f"// leído por {', '.join(st['read_by']) or '-'}; escrito por {', '.join(st['written_by']) or '-'}")
    if a.get("storage"):
        lines.append("")
    if a.get("constructor_bytes"):
        lines.append(f"    // Hay constructor ({a['constructor_bytes']} bytes); ver constructor_disassembly.")
        lines.append("")
    for fn in a["functions"]:
        name, source = pick_name(fn)
        fn["name"], fn["name_source"] = name, source
        args = fn.get("arguments")
        params = ", ".join(solidity_type(t, i) for i, t in enumerate(split_types(args))) if args is not None else "/* argumentos desconocidos */"
        mut = fn.get("state_mutability")
        mut_kw = "" if mut in (None, "nonpayable") else f" {mut}"
        lines.append(f"    // selector {fn['selector']}; nombre: {source}")
        lines.extend(f"    // {line}" for line in facts_lines(fn.get("facts")))
        lines.append(f"    function {name}({params}) external{mut_kw} {{")
        lines.append("        // TODO: cuerpo no reconstruido")
        lines.append("    }")
        lines.append("")
    fb = a.get("fallback")
    if fb:
        lines.append("    // Código sin selector (receive/fallback): verificar en el desensamblado cuál de los dos es.")
        lines.extend(f"    // {line}" for line in facts_lines(fb["facts"]))
        lines.append("    receive() external payable {")
        lines.append("        // TODO: cuerpo no reconstruido")
        lines.append("    }")
        lines.append("")
    lines.append("}")
    return "\n".join(lines)


CALL_OPS = ("CALL", "DELEGATECALL", "STATICCALL", "CALLCODE")
INTERNAL_SELECTORS = {"0x4e487b71", "0x08c379a0"}  # Panic(uint256), Error(string)


def classify_call(prev_rows, op):
    """Tipo de llamada según el código que arma los argumentos justo antes del CALL."""
    if op != "CALL":
        return op
    near = prev_rows[-16:]
    if any(arg == "0x08fc" for _, _, arg in near):
        return "transfer/send (2300 de gas)"
    if any(o == "EXTCODESIZE" for _, o, _ in prev_rows[-25:]):
        return "llamada de alto nivel a otro contrato (Interfaz(x).funcion(...))"
    if called_selectors(prev_rows, set()):
        return "llamada a una función de otro contrato (Interfaz(x).funcion(...) o .call con abi.encode)"
    return "llamada de bajo nivel .call (reenvía todo el gas)"


def called_selectors(rows_list, own):
    """Selectores que el código arma para llamar a otros contratos: PUSH3/PUSH4 x; PUSH1 0xe0; SHL."""
    out = []
    for i, (_, op, arg) in enumerate(rows_list):
        if op == "PUSH32" and arg and len(arg) == 66 and set(arg[10:]) == {"0"} and arg[2:10] != "00000000":
            sel = "0x" + arg[2:10].lower()
            if sel not in INTERNAL_SELECTORS and sel not in own:
                out.append(sel)
            continue
        if op in ("PUSH3", "PUSH4") and arg:
            nxt = rows_list[i+1:i+3]
            if len(nxt) == 2 and nxt[0][1] == "PUSH1" and nxt[0][2] == "0xe0" and nxt[1][1] == "SHL":
                sel = "0x" + arg[2:].lower().rjust(8, "0")
                if sel not in INTERNAL_SELECTORS and sel not in own:
                    out.append(sel)
    for i, (_, op, arg) in enumerate(rows_list):
        if op == "PUSH4" and arg and arg.lower() != "0xffffffff":
            nxt = rows_list[i+1][1] if i + 1 < len(rows_list) else ""
            sel = "0x" + arg[2:].lower()
            if nxt not in ("EQ", "GT", "LT") and sel not in INTERNAL_SELECTORS and sel not in own:
                out.append(sel)
    return list(dict.fromkeys(out))


def _successors(btype, visited):
    """Sucesores de un bloque. Los saltos dinámicos (retornos de funciones internas) solo se siguen
    si el camino que los produce pasa por bloques ya alcanzados, para no mezclar funciones."""
    if isinstance(btype, evmole.BlockType.Jump):
        return [btype.to]
    if isinstance(btype, evmole.BlockType.Jumpi):
        return [btype.true_to, btype.false_to]
    if isinstance(btype, evmole.BlockType.DynamicJump):
        return [d.to for d in btype.to if d.to is not None and all(p in visited for p in d.path)]
    if isinstance(btype, evmole.BlockType.DynamicJumpi):
        return [d.to for d in btype.true_to if d.to is not None and all(p in visited for p in d.path)] + [btype.false_to]
    return []


def _reach(blocks, entries, stop=frozenset(), allowed=None):
    seen = {e for e in entries if e in blocks}
    while True:
        new = set()
        for b in seen:
            for nxt in _successors(blocks[b].btype, seen):
                if nxt in blocks and nxt not in seen and nxt not in stop and (allowed is None or nxt in allowed):
                    new.add(nxt)
        if not new:
            return seen
        seen |= new


def per_function_analysis(runtime: bytes, rows, functions):
    """Para cada función: qué bloques ejecuta, qué opcodes relevantes usa y si escribe storage
    después de una llamada externa. También detecta receive()/fallback()."""
    if evmole is None or not runtime:
        return None
    cfg = evmole.contract_info(runtime, control_flow_graph=True).control_flow_graph
    blocks = {b.id: b for b in cfg.blocks}
    start_to_id = {b.start: b.id for b in cfg.blocks}
    pcs = [r[0] for r in rows]

    def block_rows(bid):
        b = blocks[bid]
        return rows[bisect_left(pcs, b.start):bisect_right(pcs, b.end)]

    own = {f["selector"] for f in functions}

    def summarize(region):
        ordered = sorted(region, key=lambda b: blocks[b].start)
        region_rows = [r for bid in ordered for r in block_rows(bid)]
        ops = [(pc, op) for pc, op, _ in region_rows]
        names = [op for _, op in ops]
        calls = []
        for k, (pc, op, _) in enumerate(region_rows):
            if op in CALL_OPS:
                calls.append((pc, op, classify_call(region_rows[max(0, k - 40):k], op)))
        store_after_call = False
        for bid in region:
            brs = block_rows(bid)
            call_pcs = [pc for pc, op, _ in brs if op in CALL_OPS]
            if not call_pcs:
                continue
            if any(op == "SSTORE" and pc > call_pcs[0] for pc, op, _ in brs):
                store_after_call = True
            after = _reach(blocks, _successors(blocks[bid].btype, region), allowed=region)
            if any(op == "SSTORE" for a in after for _, op, _ in block_rows(a)):
                store_after_call = True
        facts = {
            "llamadas_externas": [f"{op} en pc 0x{pc:x}" for pc, op, _ in calls],
            "tipos_de_llamada": list(dict.fromkeys(kind for _, _, kind in calls)),
            "selectores_llamados": called_selectors(region_rows, own),
            "escribe_storage": "SSTORE" in names,
            "lee_storage": "SLOAD" in names,
            "escribe_storage_despues_de_llamada_externa": store_after_call,
            "usa_msg_sender": "CALLER" in names,
            "usa_msg_value": "CALLVALUE" in names,
            "consulta_balance": "BALANCE" in names or "SELFBALANCE" in names,
            "emite_eventos": any(n.startswith("LOG") for n in names),
            "selfdestruct": "SELFDESTRUCT" in names,
        }
        text = "\n".join(f"{pc:06x}: {op:<14} {arg}".rstrip() for bid in ordered for pc, op, arg in block_rows(bid))
        return facts, text

    entries = {}
    for fn in functions:
        off = fn.get("bytecode_offset")
        if off is not None and off in start_to_id:
            entries[fn["selector"]] = start_to_id[off]

    result = {"functions": {}, "fallback": None}
    for sel, entry in entries.items():
        region = _reach(blocks, [entry])
        facts, text = summarize(region)
        result["functions"][sel] = {"facts": facts, "disassembly": text}
    if 0 in blocks:
        region = _reach(blocks, [0], stop=frozenset(entries.values()))
        facts, text = summarize(region)
        ok_exit = any(isinstance(blocks[b].btype, evmole.BlockType.Terminate) and blocks[b].btype.success for b in region)
        if ok_exit or facts["llamadas_externas"] or facts["escribe_storage"]:
            result["fallback"] = {"facts": facts, "disassembly": text}
    return result


def analyze(path: Path, signatures: dict, use_4byte: bool, fourbyte_url: str, fourbyte_timeout: int = 5):
    code = read_bin(path)
    full_rows = disassemble(code)
    constructor, runtime = split_runtime(code, full_rows)
    rows = disassemble(runtime)
    ops = [r[1] for r in rows]
    runtime_meta = metadata(runtime)
    meta = runtime_meta or metadata(code)

    functions, storage = evmole_info(runtime)
    heuristic = selectors(rows)
    if functions is None:
        functions = [{"selector": s, "arguments": None, "state_mutability": None} for s in heuristic]
    else:
        known = {f["selector"] for f in functions}
        functions += [{"selector": s, "arguments": None, "state_mutability": None, "note": "solo heurística"}
                      for s in heuristic if s not in known]
    sels = [f["selector"] for f in functions]

    calls = {name: ops.count(name) for name in ("CALL", "DELEGATECALL", "STATICCALL", "SLOAD", "SSTORE", "KECCAK256", "REVERT", "SELFDESTRUCT")}
    hints = []
    for i, op in enumerate(ops):
        if op == "CALL" and "SSTORE" in ops[i+1:i+150]:
            hints.append("Hay un CALL externo seguido de un SSTORE: posible actualización de estado después de una "
                         "llamada externa (patrón de reentrancy). Verificar el orden en el desensamblado.")
            break
    if calls["CALL"] and not any(f.get("selector") for f in functions):
        hints.append("Hace CALLs pero no se detectaron funciones públicas.")

    per_fn = per_function_analysis(runtime, rows, functions)
    if per_fn:
        for fn in functions:
            pf = per_fn["functions"].get(fn["selector"])
            if pf:
                fn["facts"] = pf["facts"]
                fn["disassembly"] = pf["disassembly"]
                if fn.get("state_mutability") != "payable":
                    fn["facts"]["usa_msg_value"] = False

    fact_sets = [fn["facts"] for fn in functions if fn.get("facts")]
    if per_fn and per_fn["fallback"]:
        fact_sets.append(per_fn["fallback"]["facts"])
    external = list(dict.fromkeys(x for f in fact_sets for x in f["selectores_llamados"]))

    to_lookup = list(dict.fromkeys(sels + external))
    futures, executor = {}, None
    if use_4byte and to_lookup:
        executor = ThreadPoolExecutor(max_workers=min(8, len(to_lookup)))
        futures = {s: executor.submit(lookup_4byte_cached, s, fourbyte_url, fourbyte_timeout) for s in to_lookup}

    def resolve(sel):
        candidates, error = [], None
        if sel in signatures:
            candidates.extend(signatures[sel] if isinstance(signatures[sel], list) else [signatures[sel]])
        if use_4byte:
            try:
                candidates.extend(futures[sel].result())
            except (OSError, json.JSONDecodeError, KeyError, ValueError) as e:
                error = str(e)
        return list(dict.fromkeys(candidates)), error

    try:
        for fn in functions:
            fn["candidates"], fn["lookup_error"] = resolve(fn["selector"])
        names = {sel: resolve(sel)[0] for sel in external}
    finally:
        if executor:
            for f in futures.values():
                f.cancel()
            executor.shutdown(wait=False)
    for f in fact_sets:
        f["funciones_llamadas"] = [{"selector": sel, "firma_probable": (names.get(sel) or [None])[0]}
                                   for sel in f["selectores_llamados"]]

    fmt = lambda rs: "\n".join(f"{pc:06x}: {op:<14} {arg}".rstrip() for pc, op, arg in rs)
    a = {
        "file": str(path), "byte_length": len(code),
        "kind": "creation" if constructor else "runtime",
        "constructor_bytes": len(constructor), "runtime_bytes": len(runtime),
        "metadata": meta,
        "runtime_metadata_offset": runtime_meta["offset"] if runtime_meta else None,
        "evmole": evmole is not None,
        "functions": functions,
        "storage": storage,
        "opcode_counts": calls,
        "hints": hints,
        "fallback": per_fn["fallback"] if per_fn else None,
        "runtime_hex": runtime.hex(),
        "has_revert_strings": "08c379a0" in fmt(rows).lower(),
        "disassembly": fmt(full_rows),
        "runtime_disassembly": fmt(rows),
        "constructor_disassembly": fmt(disassemble(constructor)) if constructor else "",
    }
    a["skeleton"] = build_skeleton(re.sub(r"\W", "_", path.stem) or "Contract", a)
    return a


def compact_disasm(a: dict, max_lines: int):
    """Desensamblado del runtime para el prompt: sin trailer CBOR y con tope de líneas.

    Devuelve (texto, recortado). Los PCs son relativos al runtime, como los ve la EVM al ejecutar.
    """
    lines = a["runtime_disassembly"].splitlines()
    cutoff = a.get("runtime_metadata_offset")
    if cutoff is not None:
        lines = [l for l in lines if int(l.split(":", 1)[0], 16) < cutoff]
    truncated = max_lines > 0 and len(lines) > max_lines
    if truncated:
        omitted = len(lines) - max_lines
        lines = lines[:max_lines] + [f"// ... {omitted} líneas omitidas por límite de contexto"]
    return "\n".join(lines), truncated


CONTRACT_SCHEMA = {
    "type": "object",
    "properties": {
        "input": {"type": "string"}, "contract_name": {"type": "string"},
        "solidity": {"type": "string"}, "confidence": {"type": "string"},
        "confirmed": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
        "inferred": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
        "caveats": {"type": "array", "items": {"type": "string"}, "maxItems": 10},
        "summary": {"type": "string"},
    },
    "required": ["input", "contract_name", "solidity", "confidence", "confirmed", "inferred", "caveats", "summary"],
}


class TruncatedResponse(RuntimeError):
    """La generación llegó a num_predict; conserva el texto crudo para diagnóstico."""
    def __init__(self, msg, raw):
        super().__init__(msg)
        self.raw = raw


def ollama_chat(model: str, base_url: str, prompt: str, options: dict, timeout: int):
    url = base_url.rstrip("/") + "/api/chat"
    payload = json.dumps({
        "model": model, "stream": True, "think": False, "format": CONTRACT_SCHEMA,
        "options": options,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        parts, done_reason = [], None
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            for line in resp:
                if not line.strip(): continue
                chunk = json.loads(line)
                if "error" in chunk:
                    raise RuntimeError(f"Ollama devolvió un error: {chunk['error']}")
                parts.append(chunk.get("message", {}).get("content", ""))
                if chunk.get("done"):
                    done_reason = chunk.get("done_reason")
                    break
        text = "".join(parts)
        if done_reason == "length":
            raise TruncatedResponse("La respuesta se cortó por --num-predict (probablemente el modelo entró en un loop); "
                                    "revisa el .raw.txt generado.", text)
        return json.loads(text)
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode("utf-8", errors="replace").strip()
        except Exception:
            detail = ""
        suffix = f" Respuesta del servidor: {detail}" if detail else ""
        raise RuntimeError(f"Ollama respondió HTTP {e.code}.{suffix}") from e
    except (OSError, KeyError, json.JSONDecodeError) as e:
        raise RuntimeError(f"No se pudo obtener una reconstrucción de Ollama: {e}") from e


def has_solidity(c) -> bool:
    return isinstance(c, dict) and isinstance(c.get("solidity"), str) and bool(c["solidity"].strip())


def move_strays_inside_contract(src: str) -> str:
    """Si el modelo dejó funciones o receive() después de la llave que cierra el contrato, las mete adentro."""
    m = re.search(r"\bcontract\s+\w+[^{]*\{", src)
    if not m:
        return src
    depth = 0
    for j in range(m.end() - 1, len(src)):
        depth += src[j] == "{"
        depth -= src[j] == "}"
        if depth == 0:
            close = j
            break
    else:
        return src
    tail = src[close + 1:]
    if not re.search(r"\b(function\s+\w+|receive|fallback)\s*\(", tail):
        return src
    if re.search(r"\b(contract|interface|library)\s+\w+", tail):
        return src  # hay otro contrato después; no tocar
    indented = "\n".join(("    " + l) if l.strip() else l for l in tail.strip("\n").splitlines())
    return src[:close].rstrip() + "\n\n" + indented + "\n}\n"


def deterministic_fixes(src: str, a: dict) -> str:
    """Correcciones que no necesitan al modelo."""
    src = move_strays_inside_contract(src)
    src = re.sub(r"\.\s*\{\s*(value\s*:[^}]*)\}\s*(\w+)\s*\(", lambda m: f".{m.group(2)}{{{m.group(1).strip()}}}(", src)
    names = {f["selector"][2:]: f.get("name") for f in a["functions"] if f.get("name")}
    for facts in [f.get("facts") for f in a["functions"]] + [(a.get("fallback") or {}).get("facts")]:
        for c in (facts or {}).get("funciones_llamadas", []):
            if c.get("firma_probable"):
                names.setdefault(c["selector"][2:], c["firma_probable"].partition("(")[0])
    for sel, name in names.items():
        src = re.sub(rf"\b[Uu]nresolved_{sel}\b", name, src)
    if not a.get("has_revert_strings", True):
        src = re.sub(r'(\brequire\s*\((?:[^()]|\([^()]*\))*?)\s*,\s*"[^"]*"\s*\)', r"\1)", src)
        src = re.sub(r'\brevert\s*\(\s*"[^"]*"\s*\)', "revert()", src)
    src = re.sub(r"\.call(\s*\{[^}]*\})\s*\(\s*\)", r'.call\1("")', src)
    for f in a["functions"]:
        if f.get("state_mutability") == "payable" or not f.get("name"):
            continue
        m = re.search(rf"function\s+{re.escape(f['name'])}\s*\(", src)
        if not m:
            continue
        start = src.find("{", m.end())
        depth, end = 0, len(src)
        for j in range(start, len(src)):
            depth += src[j] == "{"
            depth -= src[j] == "}"
            if depth == 0:
                end = j
                break
        body = re.sub(r"[ \t]*require\s*\(\s*msg\.value\s*==\s*0\s*(,[^)]*)?\)\s*;[ \t]*\n?", "", src[start:end])
        src = src[:start] + body + src[end:]
    return src


def force_pragma(src: str, solc):
    """El pragma sale de la metadata del bytecode; el modelo no lo puede inventar."""
    if not solc:
        return src
    pragma = f"pragma solidity ^{solc};"
    if re.search(r"pragma\s+solidity\s+[^;]+;", src):
        return re.sub(r"pragma\s+solidity\s+[^;]+;", pragma, src, count=1)
    return pragma + "\n" + src


EXTERNAL_CALL_RE = re.compile(
    r"\.\s*(call|delegatecall|staticcall|transfer|send)\s*[({]"   # addr.call{...}(...), .transfer(...)
    r"|[\w\)\]]\s*\.\s*(?!encode|decode|push\b|pop\b)\w+\s*(\{[^}]*\})?\s*\("  # Interfaz(x).metodo(...)
)


def function_body(src: str, header_re: str):
    """Devuelve el cuerpo (entre llaves) de la primera función que matchea header_re, o None."""
    m = re.search(header_re, src)
    if not m:
        return None
    i = src.find("{", m.end())
    if i < 0:
        return None
    depth = 0
    for j in range(i, len(src)):
        depth += src[j] == "{"
        depth -= src[j] == "}"
        if depth == 0:
            return src[i + 1:j]
    return src[i + 1:]


def _blank(m):
    return " " * len(m.group(0))


def clean_body(body: str) -> str:
    """Quita comentarios y abi./msg./etc. conservando las posiciones."""
    body = re.sub(r"//[^\n]*", _blank, body)
    body = re.sub(r"/\*.*?\*/", _blank, body, flags=re.S)
    return re.sub(r"\b(abi|msg|block|tx|type)\s*\.", _blank, body)


def first_external_call(body: str):
    m = EXTERNAL_CALL_RE.search(clean_body(body))
    return m.start() if m else None


def has_external_call(body: str) -> bool:
    return first_external_call(body) is not None


def state_variables(src: str):
    """Nombres de variables de estado: declaraciones a profundidad 1 (dentro del contrato, fuera de funciones)."""
    depth, cur, stmts = 0, "", []
    for ch in re.sub(r"//[^\n]*", "", src):
        if ch == "{":
            depth += 1; cur = ""
            continue
        if ch == "}":
            depth -= 1; cur = ""
            continue
        if depth == 1:
            if ch == ";":
                stmts.append(cur); cur = ""
            else:
                cur += ch
    names = []
    for st in stmts:
        st = re.split(r"=(?!>)", st, 1)[0].strip()  # cortar el inicializador, no el "=>" de mapping
        if not st or re.match(r"(function|event|error|modifier|using|struct|enum)\b", st):
            continue
        m = re.search(r"([A-Za-z_]\w*)\s*$", st)
        if m:
            names.append(m.group(1))
    return names


def last_storage_write(body: str, state_vars):
    body = clean_body(body)
    last = None
    for v in state_vars:
        for m in re.finditer(rf"\b{re.escape(v)}\b\s*(\[[^\]]*\]\s*)*(\+\+|--|[-+*/%|&^]?=(?!=))", body):
            last = m.start() if last is None else max(last, m.start())
        for m in re.finditer(rf"\bdelete\s+{re.escape(v)}\b", body):
            last = m.start() if last is None else max(last, m.start())
    return last


def validate(src: str, a: dict):
    """Compara el Solidity del modelo con los hechos del bytecode. Devuelve la lista de problemas."""
    problems = []
    svars = state_variables(src)
    clean_all = clean_body(src)
    if re.search(r"\.\s*\{\s*value", clean_all):
        problems.append("Hay sintaxis de heimdall que no compila (x.{ value: v }f()); en Solidity es Interfaz(x).f{value: v}().")
    if re.search(r"\b[Uu]nresolved_[0-9a-fA-F]{8}\b", clean_all):
        problems.append("Quedaron nombres Unresolved_<selector> de heimdall; usa los nombres del esqueleto y de los HECHO.")
    if re.search(r"\bstorage_map_\w+|\bmapping\s*\(\s*bytes32\s*=>\s*bytes32\s*\)", clean_all):
        problems.append("Se copió el storage genérico de heimdall (storage_map_*/mapping(bytes32 => bytes32)); usa los tipos del esqueleto.")
    units = [(f["name"], rf"function\s+{re.escape(f['name'])}\s*\(", f.get("facts")) for f in a["functions"]]
    if a.get("fallback"):
        units.append(("receive/fallback", r"\b(receive|fallback)\s*\(\s*\)", a["fallback"]["facts"]))
    for name, header, facts in units:
        body = function_body(src, header)
        if body is None and name != "receive/fallback" and re.search(rf"\bpublic\b[^;{{}}]*\b{re.escape(name)}\s*(=[^;]*)?;", src):
            continue  # getter de una variable public: es válido y no tiene cuerpo
        if body is None:
            problems.append(f"Falta la función {name}, que existe en el bytecode.")
            continue
        if not facts:
            continue
        code = clean_body(body)
        call_pos = first_external_call(body)
        if facts["llamadas_externas"] and call_pos is None:
            problems.append(f"{name}: el bytecode hace una llamada externa ({', '.join(facts['llamadas_externas'])}) "
                            f"pero el cuerpo no tiene ninguna (.call, .transfer, .send o llamada a otro contrato).")
            continue
        kinds = " ".join(facts.get("tipos_de_llamada", []))
        uses_transfer = re.search(r"\.\s*(transfer|send)\s*\(", code)
        uses_lowlevel = re.search(r"\.\s*call\s*[({]", code)
        if "bajo nivel" in kinds and "transfer" not in kinds and uses_transfer and not uses_lowlevel:
            problems.append(f"{name}: el bytecode usa .call (reenvía todo el gas), no .transfer/.send.")
        if "transfer" in kinds and "bajo nivel" not in kinds and uses_lowlevel and not uses_transfer:
            problems.append(f"{name}: el bytecode usa .transfer/.send (2300 de gas), no .call.")
        if "transfer" not in kinds and uses_transfer and "alto nivel" in kinds:
            problems.append(f"{name}: el bytecode hace una llamada de alto nivel a otro contrato "
                            f"(Interfaz(x).funcion(...)), no .transfer/.send.")
        for c in facts.get("funciones_llamadas", []):
            sig = c.get("firma_probable")
            if not sig:
                continue
            fname, _, rest = sig.partition("(")
            expected = len(split_types(rest[:-1]))
            calls = [m.group(2) for m in re.finditer(rf"\b{re.escape(fname)}\s*(\{{[^}}]*\}})?\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)", code)]
            if calls and all(len([x for x in split_types(args) if x.strip()]) != expected for args in calls):
                problems.append(f"{name}: {sig} recibe {expected} argumento(s) y tu código lo llama con otra cantidad.")
        if facts["escribe_storage_despues_de_llamada_externa"] and call_pos is not None:
            last_write = last_storage_write(body, svars)
            if last_write is not None and last_write < call_pos:
                problems.append(f"{name}: en el bytecode la escritura de storage ocurre DESPUÉS de la llamada externa; "
                                f"en tu código está antes. Respeta el orden del bytecode aunque sea vulnerable.")
        for c in facts.get("funciones_llamadas", []):
            fname = (c["firma_probable"] or "").partition("(")[0]
            if not ((fname and re.search(rf"\b{re.escape(fname)}\b", code)) or c["selector"][2:] in body.lower()):
                problems.append(f"{name}: el bytecode llama a {c['firma_probable'] or c['selector']} en otro contrato "
                                f"y tu código no lo hace.")
    return problems


def find_heimdall(explicit=None):
    """Busca el binario de heimdall: argumento, PATH o la ruta por defecto de bifrost."""
    if explicit:
        return explicit if Path(explicit).exists() or shutil.which(explicit) else None
    found = shutil.which("heimdall")
    if found:
        return found
    default = Path.home() / ".bifrost" / "bin" / "heimdall"
    return str(default) if default.exists() else None


def run_heimdall(heimdall: str, a: dict, runtime_hex: str, workdir: Path, timeout: int):
    """Decompila el runtime con heimdall y devuelve el Solidity (sin el encabezado de licencia/créditos)."""
    workdir.mkdir(parents=True, exist_ok=True)
    hex_file = workdir / "runtime.hex"
    hex_file.write_text(runtime_hex + "\n", encoding="utf-8")
    cmd = [heimdall, "decompile", str(hex_file), "--include-sol", "--skip-resolving", "-d", "-o", str(workdir)]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"heimdall tardó más de {timeout} s")
    sol = next(workdir.glob("*decompiled.sol"), None)
    if proc.returncode != 0 or sol is None:
        raise RuntimeError(f"heimdall falló (código {proc.returncode}): {(proc.stderr or proc.stdout)[-400:]}")
    src = sol.read_text(encoding="utf-8")
    src = re.sub(r"^// SPDX.*?\n(?=contract )", "", src, flags=re.S)
    names = {f["selector"][2:]: f["name"] for f in a["functions"] if f.get("name")}
    fact_sets = [f["facts"] for f in a["functions"] if f.get("facts")] + ([a["fallback"]["facts"]] if a.get("fallback") else [])
    for facts in fact_sets:
        for c in facts.get("funciones_llamadas", []):
            if c.get("firma_probable"):
                names.setdefault(c["selector"][2:], c["firma_probable"].partition("(")[0])
    for sel, name in names.items():
        src = re.sub(rf"\b[Uu]nresolved_{sel}\b", name, src)
    return src.strip()


def ask_ollama_one(model: str, base_url: str, a: dict, options: dict, timeout: int, max_lines: int):
    """Una llamada por contrato: prompts chicos y un fallo no arrastra a los demás."""
    input_name = Path(a["file"]).name
    disasm, truncated = compact_disasm(a, max_lines)
    facts = {
        "archivo": input_name,
        "tipo_de_bytecode": a["kind"],
        "version_solc": (a["metadata"] or {}).get("solc"),
        "funciones_publicas": [{k: f.get(k) for k in ("selector", "name", "name_source", "arguments", "state_mutability", "facts")}
                               for f in a["functions"]],
        "receive_o_fallback": a["fallback"]["facts"] if a.get("fallback") else None,
        "storage": a["storage"],
        "pistas": a["hints"],
    }
    constructor = a["constructor_disassembly"]
    if constructor:
        constructor = "\n".join(constructor.splitlines()[:200])

    sections = []
    for f in a["functions"]:
        if f.get("disassembly"):
            body = "\n".join(f["disassembly"].splitlines()[:max_lines or None])
            sections.append(f"--- función {f['name']} ({f['selector']}) ---\n{body}")
    if a.get("fallback"):
        body = "\n".join(a["fallback"]["disassembly"].splitlines()[:max_lines or None])
        sections.append(f"--- código sin selector: dispatcher + receive/fallback ---\n{body}")
    heimdall_src = a.get("heimdall")
    if heimdall_src and max_lines:
        # Con heimdall el desensamblado es de respaldo: se acorta para no saturar a modelos chicos.
        sections = ["\n".join(sec.splitlines()[:max(40, max_lines // 4)]) for sec in sections]
    if sections:
        disasm_title = "DESENSAMBLADO POR FUNCIÓN (solo los bloques que ejecuta cada una; PCs relativos al runtime)"
        disasm = "\n\n".join(sections)
        truncated_note = "el desensamblado está COMPLETO; no digas que está recortado."
    else:
        disasm_title = "DESENSAMBLADO DEL RUNTIME (PCs relativos al runtime)"
        truncated_note = ("falta parte del desensamblado; menciónalo en caveats." if truncated
                          else "el desensamblado está COMPLETO; no digas que está recortado.")

    if heimdall_src:
        heimdall_rules = ("10. Tienes la salida del decompilador heimdall: úsala como BASE para la lógica de cada cuerpo, "
                          "pero heimdall se equivoca a menudo: puede omitir funciones, confundir .call con .transfer, "
                          "invertir condiciones de require (verifica contra el desensamblado: el require debe dejar pasar "
                          "el caso normal) y declarar storage como mapping(bytes32 => bytes32). Si heimdall contradice "
                          "un HECHO o el esqueleto, ganan el HECHO y el esqueleto. Usa los tipos de storage del esqueleto.")
        heimdall_section = f"SALIDA DE HEIMDALL (decompilador; puede tener errores):\n{heimdall_src}\n\n"
    else:
        heimdall_rules, heimdall_section = "", ""

    prompt = f'''Eres un experto en ingeniería inversa de la EVM. Completa el ESQUELETO Solidity de abajo para que refleje lo que hace el bytecode.

REGLAS:
1. El esqueleto se generó con análisis estático confiable. NO cambies el pragma, los nombres de función, los tipos de argumentos ni la mutabilidad (payable/view). No agregues ni quites funciones públicas.
2. Puedes renombrar las variables slotN y los parámetros argN con nombres descriptivos.
3. Escribe el cuerpo de cada función siguiendo SU sección del desensamblado: qué slots lee y escribe, qué llamadas hace, qué valida (REVERT) y qué devuelve. Si una función view devuelve algo, agrega returns.
4. Si el esqueleto tiene receive(), complétalo con la sección "código sin selector" del desensamblado.
5. Las líneas "// HECHO:" del esqueleto están verificadas sobre el grafo de control y son OBLIGATORIAS: si una función hace una llamada externa, su cuerpo debe tenerla (por ejemplo msg.sender.call{{value: x}}("") o una llamada a otro contrato). Si escribe storage DESPUÉS de la llamada, mantén ese orden exacto aunque sea inseguro. No corrijas vulnerabilidades: reconstruye lo que hace el bytecode.
6. Lo que no puedas determinar, déjalo como comentario // TODO explicando por qué. No inventes lógica ni mensajes de error: si el bytecode revierte sin mensaje, usa require(cond) sin texto.
8. En funciones que no son payable, el CALLVALUE seguido de REVERT es el chequeo automático de Solidity: NO escribas require(msg.value == 0).
9. Si un HECHO dice que llama a una función de otro contrato, declara una interface con esa firma y llámala; no uses address(this) ni selectores inventados.
{heimdall_rules}
7. Sobre el desensamblado: {truncated_note}

Devuelve SOLO JSON: {{"input":"{input_name}","contract_name":"...","solidity":"código completo","confidence":"baja|media|alta","confirmed":[...],"inferred":[...],"caveats":[...],"summary":"resumen en español"}}

ESQUELETO:
{a["skeleton"]}

HECHOS:
{json.dumps(facts, ensure_ascii=False)}

DESENSAMBLADO DEL CONSTRUCTOR:
{constructor or "(no hay; el archivo es bytecode runtime)"}

{heimdall_section}{disasm_title}:
{disasm}'''
    result = ollama_chat(model, base_url, prompt, options, timeout)
    if not has_solidity(result):
        # Reparación liviana: sin reenviar el desensamblado.
        repair_prompt = f'''Tu respuesta anterior no incluyó código en la propiedad solidity. Devuelve SOLO JSON {{"input":"{input_name}","contract_name":"...","solidity":"código Solidity completo","confidence":"baja","confirmed":[],"inferred":[],"caveats":[],"summary":"..."}} completando este esqueleto sin cambiar firmas ni pragma:

{a["skeleton"]}

Respuesta anterior:
{json.dumps(result, ensure_ascii=False)}'''
        result = ollama_chat(model, base_url, repair_prompt, options, timeout)
        if not has_solidity(result):
            raise RuntimeError(f"Ollama no devolvió código Solidity para {input_name} después de dos intentos.")

    # Verificación contra los hechos del bytecode; si falla, un reintento con los problemas concretos.
    result["solidity"] = deterministic_fixes(result["solidity"], a)
    problems = validate(result["solidity"], a)
    if problems:
        print(f"[ollama] {Path(a['file']).stem}: la reconstrucción no respeta el bytecode, reintentando: {'; '.join(problems)}", file=sys.stderr)
        fix_prompt = f'''Tu reconstrucción no coincide con el bytecode. Problemas detectados automáticamente:
{chr(10).join("- " + p for p in problems)}

Corrige SOLO eso y devuelve el contrato completo en el mismo formato JSON. Mantén las firmas del esqueleto.

ESQUELETO CON LOS HECHOS:
{a["skeleton"]}

{disasm_title}:
{disasm}

TU RESPUESTA ANTERIOR:
{json.dumps(result, ensure_ascii=False)}'''
        try:
            fixed = ollama_chat(model, base_url, fix_prompt, options, timeout)
            if has_solidity(fixed):
                fixed["solidity"] = deterministic_fixes(fixed["solidity"], a)
                if len(validate(fixed["solidity"], a)) < len(problems):
                    result = fixed
        except RuntimeError as e:
            print(f"[ollama] el reintento falló: {e}", file=sys.stderr)
        problems = validate(result["solidity"], a)

    result["input"] = input_name
    result["solidity"] = force_pragma(result["solidity"], (a["metadata"] or {}).get("solc"))
    caveats = result.get("caveats") if isinstance(result.get("caveats"), list) else []
    caveats += [f"[verificación automática] {p}" for p in problems]
    result["caveats"] = caveats
    if problems:
        # Que quede visible en el propio .sol, no solo en el JSON.
        result["solidity"] = "\n".join(f"// ADVERTENCIA (verificación automática): {p}" for p in problems) + "\n" + result["solidity"]
    return result


def main():
    p = argparse.ArgumentParser(description="Analiza bytecode EVM y, opcionalmente, propone Solidity con Ollama.")
    p.add_argument("bins", nargs="+", help="Uno o más archivos .bin")
    p.add_argument("-o", "--out", default="reconstruction-output", help="Directorio de salida")
    p.add_argument("--ollama", action="store_true", help="Pedir a Ollama una reconstrucción semántica aproximada")
    p.add_argument("--model", default="qwen2.5-coder:14b", help="Modelo local disponible en Ollama")
    p.add_argument("--ollama-url", default="http://localhost:11434", help="URL de Ollama")
    p.add_argument("--ollama-timeout", type=int, default=600, help="Segundos máximos sin recibir datos de Ollama (incluye el prefill)")
    p.add_argument("--num-ctx", type=int, default=16384, help="Ventana de contexto que se pide a Ollama")
    p.add_argument("--num-predict", type=int, default=4096, help="Máximo de tokens de salida por contrato")
    p.add_argument("--temperature", type=float, default=0.3, help="Temperatura de muestreo")
    p.add_argument("--repeat-penalty", type=float, default=1.1, help="Penalización de repetición (1.0 = desactivada)")
    p.add_argument("--max-disasm-lines", type=int, default=1500, help="Máximo de líneas de desensamblado por contrato en el prompt (0 = sin límite)")
    p.add_argument("--heimdall", help="Ruta al binario de heimdall (por defecto se busca en el PATH y en ~/.bifrost/bin)")
    p.add_argument("--no-heimdall", action="store_true", help="No usar heimdall aunque esté instalado")
    p.add_argument("--heimdall-timeout", type=int, default=180, help="Segundos máximos de heimdall por contrato")
    p.add_argument("--signatures-file", help="JSON local adicional de selectores a firmas")
    p.add_argument("--no-signature-lookup", action="store_true", help="No consultar 4byte.directory")
    p.add_argument("--fourbyte-url", default="https://www.4byte.directory", help="Base URL de 4byte.directory")
    p.add_argument("--fourbyte-timeout", type=int, default=5, help="Timeout en segundos por consulta a 4byte.directory")
    args = p.parse_args()

    signatures = {}
    if args.signatures_file:
        signatures.update({k.lower(): v for k,v in json.loads(Path(args.signatures_file).read_text(encoding="utf-8")).items()})
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    if evmole is None:
        print("[aviso] evmole no está instalado: sin argumentos, mutabilidad ni storage. Instálalo con: pip install evmole", file=sys.stderr)
    heimdall = None if args.no_heimdall else find_heimdall(args.heimdall)
    if args.heimdall and not heimdall:
        raise RuntimeError(f"No se encontró heimdall en {args.heimdall}")
    if not heimdall and not args.no_heimdall:
        print("[aviso] heimdall no encontrado: los cuerpos se reconstruyen solo desde el desensamblado.", file=sys.stderr)
    analyses = []
    for x in args.bins:
        a = analyze(Path(x), signatures, not args.no_signature_lookup, args.fourbyte_url, args.fourbyte_timeout)
        analyses.append(a)
        base = Path(a["file"]).stem
        (out / f"{base}.disasm.txt").write_text(a["disassembly"] + "\n", encoding="utf-8")
        (out / f"{base}.skeleton.sol").write_text(a["skeleton"] + "\n", encoding="utf-8")
        a["heimdall"] = None
        if heimdall:
            try:
                a["heimdall"] = run_heimdall(heimdall, a, a["runtime_hex"], out / "heimdall" / base, args.heimdall_timeout)
                (out / f"{base}.heimdall.sol").write_text(a["heimdall"] + "\n", encoding="utf-8")
            except RuntimeError as e:
                print(f"[heimdall] {base}: {e}", file=sys.stderr)
        summary = {k: v for k, v in a.items() if not k.endswith("disassembly") and k not in ("skeleton", "functions", "fallback", "runtime_hex", "heimdall", "has_revert_strings")}
        summary["functions"] = [{k: v for k, v in f.items() if k != "disassembly"} for f in a["functions"]]
        if a.get("fallback"):
            summary["fallback"] = {"facts": a["fallback"]["facts"]}
        (out / f"{base}.analysis.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"[bytecode] {base}: {a['kind']}, {a['runtime_bytes']} bytes de runtime, {len(a['functions'])} funciones"
              + (", decompilado con heimdall" if a["heimdall"] else ""), file=sys.stderr)

    if not args.ollama:
        print("Informe de bytecode guardado en", out.resolve())
        print("Para generar una propuesta semántica: vuelve a ejecutar con --ollama --model NOMBRE_MODELO")
        return

    # repeat_penalty desalienta los loops de repetición; temperatura muy baja los favorece.
    options = {"num_ctx": args.num_ctx, "num_predict": args.num_predict,
               "temperature": args.temperature, "repeat_penalty": args.repeat_penalty}
    contracts, errors, written = [], [], 0
    for a in analyses:
        base = Path(a["file"]).stem
        print(f"[ollama] reconstruyendo {base}...", file=sys.stderr)
        try:
            item = ask_ollama_one(args.model, args.ollama_url, a, options, args.ollama_timeout, args.max_disasm_lines)
        except RuntimeError as e:
            raw = getattr(e, "raw", None)
            if raw:
                raw_path = out / f"{base}.raw.txt"
                raw_path.write_text(raw, encoding="utf-8")
                print(f"[ollama] {base}: salida cruda guardada en {raw_path}", file=sys.stderr)
            errors.append({"input": Path(a["file"]).name, "error": str(e)})
            print(f"[ollama] {base}: {e}", file=sys.stderr)
            continue
        contracts.append(item)
        # Nunca usar un nombre de archivo generado por el modelo: sale del .bin original.
        name = re.sub(r"[^A-Za-z0-9_.-]", "_", base)[:80] or f"contract_{len(contracts)}"
        (out / f"{name}.sol").write_text(item["solidity"].rstrip() + "\n", encoding="utf-8")
        written += 1

    overview = "\n\n".join(f"{c['input']}: {c.get('summary', '')}".strip() for c in contracts)
    result = {"contracts": contracts, "overview": overview, "errors": errors}
    (out / "reconstruction.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if not written:
        raise RuntimeError("Ollama respondió sin código Solidity; no se generó ningún .sol.")
    print(f"Análisis y propuesta Solidity guardados en {out.resolve()} ({written}/{len(analyses)} contratos)")
    if errors:
        print(f"Fallaron {len(errors)} contrato(s); detalle en reconstruction.json", file=sys.stderr)


if __name__ == "__main__":
    try: main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)