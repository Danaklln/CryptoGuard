# 📋 Funciones del módulo `evm_reconstruct.py`

## Una oración por cada función

1. **`read_bin(path)`** - Lee un archivo hexadecimal (con o sin prefijo `0x`) y lo convierte en bytes, levantando un error si el contenido no es válido.

2. **`disassemble(code)`** - Convierte bytecode EVM en una lista de tuplas (PC, nombre_del_opcode, argumento) iterando byte a byte e interpretando cada instrucción.

3. **`metadata(code)`** - Extrae la metadata CBOR incrustada al final del bytecode (versión de Solc, hash IPFS) si está presente y es válida.

4. **`selectors(rows)`** - Busca selectores de función (4 bytes) en el bytecode detectando el patrón típico de Solc: `PUSH3/PUSH4 x; EQ; JUMPI`.

5. **`split_runtime(code, rows)`** - Divide el bytecode de creación en sus partes (constructor y runtime) buscando el patrón de `CODECOPY` seguido de `RETURN`, o devuelve el bytecode como runtime si ya es uno.

6. **`lookup_4byte(selector, base_url, timeout)`** - Consulta la API de 4byte.directory en línea para obtener todas las firmas de función conocidas que corresponden a un selector dado.

7. **`lookup_4byte_cached(selector, base_url, timeout)`** - Versión cached con `@lru_cache` de `lookup_4byte` para evitar consultas duplicadas a 4byte durante el análisis.

8. **`evmole_info(runtime)`** - Extrae funciones (selector, argumentos, mutabilidad) y layout de storage del bytecode runtime usando la librería evmole si está instalada.

9. **`split_types(args)`** - Divide una cadena de tipos Solidity respetando los paréntesis anidados (ej. `address,(uint256,bool)[]` → `['address', '(uint256,bool)[]']`).

10. **`pick_name(fn)`** - Elige el nombre de función más probable entre candidatos de 4byte, priorizando aquellos cuyos argumentos coinciden con los detectados por evmole.

11. **`solidity_type(t, idx)`** - Convierte un tipo EVM genérico a una declaración de parámetro Solidity legible, manejando tipos complejos y calldata.

12. **`facts_lines(facts)`** - Convierte un diccionario de hechos verificados sobre el control flow (llamadas externas, storage, etc.) en líneas de comentario descriptivas para el esqueleto.

13. **`build_skeleton(contract_name, a)`** - Genera un esqueleto Solidity determinístico incluyendo pragma, state variables, firmas de funciones y hechos verificados, todo sin usar información del modelo.

14. **`classify_call(prev_rows, op)`** - Clasifica el tipo de llamada externa (`.call` bajo nivel, `.transfer`, `.send`, o llamada a otro contrato) analizando los opcodes que la preceden.

15. **`called_selectors(rows_list, own)`** - Extrae los selectores de función externa que el bytecode intenta llamar en otros contratos buscando patrones de `PUSH3/PUSH4` seguido de `SHL` o shifts.

16. **`_successors(btype, visited)`** - Devuelve los bloques sucesor de un bloque en el grafo de control, respetando saltos estáticos y dinámicos (retornos de funciones internas).

17. **`_reach(blocks, entries, stop, allowed)`** - Realiza un alcance (reachability) desde un conjunto de bloques iniciales hasta donde se puede llegar dentro de las restricciones, devolviendo todos los bloques alcanzables.

18. **`per_function_analysis(runtime, rows, functions)`** - Analiza cada función del contrato determinando qué bloques ejecuta, qué opcodes relevantes usa (CALL, SSTORE, etc.) y si escribe storage después de una llamada externa.

19. **`analyze(path, signatures, use_4byte, fourbyte_url, fourbyte_timeout)`** - Orquesta el análisis completo de un archivo binario: lo lee, divide, disensambla, busca funciones y storage, y anotaciones de 4byte en paralelo.

20. **`compact_disasm(a, max_lines)`** - Genera una versión compacta del disassembly del runtime (sin trailer CBOR) con tope de líneas para usar en prompts, indicando si fue truncada.

21. **`ollama_chat(model, base_url, prompt, options, timeout)`** - Realiza una consulta streaming a Ollama solicitando una respuesta JSON estructurada, levantando `TruncatedResponse` si el modelo llega al límite de predicción.

22. **`has_solidity(c)`** - Verifica si una respuesta de Ollama contiene código Solidity válido (no vacío) en el campo `solidity`.

23. **`move_strays_inside_contract(src)`** - Si el modelo generó funciones o `receive()` después de la llave que cierra el contrato, las mueve adentro respetando la estructura.

24. **`deterministic_fixes(src, a)`** - Aplica correcciones automáticas al código Solidity generado (sintaxis de heimdall, nombres sin resolver, mensajes de error fantasma) basadas en los hechos del bytecode.

25. **`force_pragma(src, solc)`** - Reemplaza o agrega el pragma Solidity correcto basado en la versión extraída de la metadata del bytecode.

26. **`function_body(src, header_re)`** - Extrae el cuerpo (entre llaves) de la primera función cuyo header matchea la expresión regular, o devuelve `None` si no existe.

27. **`_blank(m)`** - Función auxiliar que devuelve espacios en blanco de igual longitud que el match, usada para limpiar comentarios manteniendo posiciones.

28. **`clean_body(body)`** - Elimina comentarios y referencias de librerías globales (abi, msg, block, tx, type) del cuerpo de función manteniendo las posiciones.

29. **`first_external_call(body)`** - Devuelve el índice de la primera llamada externa detectada en el cuerpo, o `None` si no hay.

30. **`has_external_call(body)`** - Verifica si el cuerpo contiene al menos una llamada externa (`.call`, `.transfer`, `.send` o a otro contrato).

31. **`state_variables(src)`** - Extrae los nombres de todas las variables de estado declaradas a profundidad 1 (dentro del contrato pero fuera de funciones).

32. **`last_storage_write(body, state_vars)`** - Encuentra el índice del último write a storage en el cuerpo, buscando `=`, `++`, `--` o `delete` en las variables de estado.

33. **`validate(src, a)`** - Compara el código Solidity generado con los hechos extraídos del bytecode, devolviendo una lista de problemas o inconsistencias encontradas.

34. **`find_heimdall(explicit)`** - Busca el ejecutable de heimdall en el argumento explícito, en PATH o en la ruta por defecto de bifrost.

35. **`run_heimdall(heimdall, a, runtime_hex, workdir, timeout)`** - Ejecuta heimdall para decompilaciónar el runtime a Solidity y devuelve el código sin encabezados, reemplazando selectores sin resolver.

36. **`ask_ollama_one(model, base_url, a, options, timeout, max_lines)`** - Realiza una reconstrucción semántica de un contrato mediante Ollama, con validación automática y reintento si hay inconsistencias con el bytecode.

37. **`main()`** - Función principal que parsea argumentos de línea de comandos, analiza uno o más archivos binarios, opcionalmente corre heimdall, y guarda análisis y propuestas Solidity en el directorio de salida.

---

## Resumen por categoría

### Lectura y Parsing (1-3)
Funciones que leen y convierten bytecode en estructuras manipulables.

### Detección de Funciones y Storage (4-8)
Funciones que identifican qué funciones públicas existen y qué storage utilizan.

### Análisis Estático (9-20)
Funciones que analizan el grafo de control, opcodes y flujo de ejecución.

### Generación de Esqueleto (21-28)
Funciones que construyen la base determinística del código Solidity.

### Validación y Reparación (29-33)
Funciones que verifican consistencia entre el Solidity y el bytecode.

### Decompilación Externa y Ollama (34-37)
Funciones que invocan herramientas externas (heimdall, Ollama) para reconstrucción semántica.
