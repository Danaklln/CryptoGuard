# CryptoGuard — frontend

Portada, dashboard y laboratorio guiado Reentrancy Vault, implementados con React,
Vite, JavaScript y Tailwind CSS. El usuario es de demostración y el progreso del
laboratorio se guarda en el navegador.

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

La portada, el dashboard y el laboratorio guiado funcionan con Vite.
Las dependencias quedan registradas en `package-lock.json`. Tailwind se compila
mediante `@tailwindcss/vite`, sin CDN. Inter, Space Grotesk y JetBrains Mono se
incluyen localmente mediante Fontsource; los iconos son SVG de Lucide.

## Organización

```text
public/favicon.svg
src/
  main.jsx                      # Entrada, fuentes y estilos
  App.jsx                       # Navegación y progreso local
  styles.css                    # Tailwind, tokens y estilos compartidos
  data/demo.js                  # Usuario y tarjetas del dashboard
  components/
    Header.jsx
    Welcome.jsx
    SectionHeading.jsx          # Encabezado y ayuda contextual
    Recommendations.jsx
    ChallengeCard.jsx           # Tarjeta, ilustración y marcador local
    ProgressPanel.jsx           # Progreso del laboratorio en el dashboard
    ReentrancyLab.jsx           # Lecciones, visor y preguntas
    Footer.jsx
```

El contenido de Reentrancy Vault se define en `labs/reentrancy/lesson.js` desde
la raíz del repositorio. Vite importa los archivos Solidity y la prueba existentes
como texto para mostrarlos en el visor de solo lectura.

## Funcionalidad y límites

- El dashboard adapta las tarjetas a tres columnas en escritorio, dos en tablet
  y una en móvil. Los objetivos también se reorganizan y permiten envolver texto.
- Los marcadores de tarjetas funcionan en memoria y se reinician al recargar;
  no guardan progreso ni modifican cuentas.
- La tarjeta Reentrancy Vault y el panel de progreso abren `/#reentrancy`. Una
  respuesta correcta completa su sección y actualiza la barra de progreso.
- La sección de demostración muestra paso a paso los saldos esperados de la prueba
  `ReentranceTest.test_drain`. La ejecución real sigue disponible desde Forge.
- Perfil, registro y paginación están deshabilitados.
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
