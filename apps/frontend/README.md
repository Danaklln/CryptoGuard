# CryptoGuard — frontend

Primera versión del dashboard visual, implementada con React, Vite y Tailwind CSS.
Los datos de usuario, desafíos y progreso son **demostrativos**. No hay autenticación,
API, conexiones blockchain, persistencia ni ejecución de contratos.

## Desarrollo local

Requiere npm y una versión de Node compatible con Vite: `^20.19.0 || >=22.12.0`.
La implementación se verificó con Node 25.0.0 y npm 11.6.2.

Desde la raíz del repositorio:

```bash
cd apps/frontend
npm ci
npm run dev
```

Abrí http://127.0.0.1:5173/. El servidor escucha únicamente en la interfaz local.
El puerto es estricto: si está ocupado, Vite informa el error en lugar de elegir
otro puerto. Para detenerlo, usá Ctrl+C en la terminal que lo ejecuta.

```bash
npm run build      # Producción en dist/
npm run preview    # Vista previa del build, normalmente en http://127.0.0.1:4173/
```

No se necesita backend, Foundry, Anvil ni variables de entorno para este dashboard.
Las dependencias quedan registradas en `package-lock.json`. Tailwind se compila
mediante `@tailwindcss/vite`, sin CDN. Inter, Space Grotesk y JetBrains Mono se
incluyen localmente mediante Fontsource; los iconos son SVG de Lucide.

## Organización

```text
public/favicon.svg
src/
  main.jsx                      # Entrada, fuentes y estilos
  App.jsx                       # Composición del dashboard
  styles.css                    # Tailwind, tokens y estilos compartidos
  data/demo.js                  # Fixtures de usuario, desafíos y progreso
  components/
    Header.jsx
    Welcome.jsx
    SectionHeading.jsx          # Encabezado y ayuda contextual
    Recommendations.jsx
    ChallengeCard.jsx           # Tarjeta, ilustración y marcador local
    ProgressPanel.jsx           # Progreso y objetivos ilustrativos
    Footer.jsx
```

Para integrar datos reales en el futuro, sustituir la fuente de datos en `App.jsx`
y mantener los componentes de presentación alimentados por props. No se agregaron
endpoints ficticios ni copias de contratos. El código Solidity permanece en el
proyecto Foundry de la raíz; su eventual visualización con Monaco queda fuera de
esta versión.

## Funcionalidad y límites

- El dashboard adapta las tarjetas a cuatro columnas en escritorio, dos en tablet
  y una en móvil. Los objetivos también se reorganizan y permiten envolver texto.
- Los marcadores de tarjetas funcionan en memoria y se reinician al recargar;
  no guardan progreso ni modifican cuentas.
- Los iconos de información abren explicaciones del carácter demostrativo de los
  datos. Home y el enlace de salto navegan dentro de la misma página.
- Perfil, áreas de interés, paginación y reanudación del laboratorio están
  deshabilitados. Las cuatro tarjetas ya están visibles; no hay páginas adicionales.
- La barra y los objetivos representan fixtures, no resultados de una ejecución.
- Hay foco visible, etiquetas accesibles, uso por teclado y reducción de movimiento
  según la preferencia del sistema.

## Referencia visual

Fuente: `stitch_cryptoguard_web3_security_platform.zip` (`screen.png`, `code.html`
y `DESIGN.md`). Se priorizaron la captura y el HTML para la distribución, fondos,
tarjetas, bordes violetas y barra azul. `DESIGN.md` aporta las familias tipográficas
y la guía de estilos; sus variantes de paleta y de layout IDE no sustituyen este
dashboard. Se preservaron las transiciones de las tarjetas y sus ilustraciones.

Se reemplazó el avatar remoto por un emblema SVG local y se adaptaron los textos
que afirmaban sesiones, torneos o servicios activos: ahora se identifican como
datos de ejemplo o funciones no disponibles. El contenido está adaptado al español de Argentina, con voseo y etiquetas de
accesibilidad en español; los nombres de vulnerabilidades, laboratorios y desafíos se mantienen en inglés, al igual que los nombres de herramientas y las siglas técnicas, según la convención de `AGENTS.md` en la raíz. No se reproducen los cortes de palabras accidentales
de la captura original.

## Verificación de esta versión

- `npm run build`: correcto.
- Revisión visual contra la captura y comprobación responsive a 1280, 768, 390
  y 320 píxeles; sin desbordamiento horizontal en las comprobaciones del DOM.
- Marcadores probados con clic y teclado; ayudas abiertas y cerradas.
- Sin errores ni advertencias de consola observados durante la revisión.

No hay suite automatizada de frontend todavía. No se ejecutaron pruebas Foundry:
esta implementación no modifica contratos, pruebas ni backend.
