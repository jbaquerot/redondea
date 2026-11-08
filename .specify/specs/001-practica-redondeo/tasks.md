# Tareas de implementación: práctica de redondeo

**Estado:** Implementación completada; matriz de navegadores pendiente
**Especificación:** [spec.md](spec.md)  
**Plan técnico:** [plan.md](plan.md)  
**Orden:** las tareas siguen sus dependencias; `[P]` indica que pueden hacerse en paralelo.

## Fase 1: Preparar el inicio y el tablero

- [x] **T001** Añadir pantalla inicial en `index.html` con campo opcional para el nombre, selección obligatoria de modo entero o decimal y botón para empezar. Mantener oculto o inactivo el tablero hasta elegir el modo.
- [x] **T002 [P]** Añadir estilos para la pantalla inicial en `styles.css`, incluidos foco visible, etiquetas legibles y adaptación a pantallas estrechas.
- [x] **T003** Ampliar la tabla de posiciones en `index.html` para incluir decenas de millón, la columna fija de coma decimal y décimas, centésimas y milésimas después de unidades, en las filas del número original y del resultado. Mantener etiquetas accesibles por columna.
- [x] **T004 [P]** Adaptar en `styles.css` la tabla ampliada y el desplazamiento horizontal en móvil, conservando el ancho legible de los controles y los encabezados.

## Fase 2: Gestionar el inicio de partida

- [x] **T005** Actualizar `app.js` para bloquear la generación de preguntas hasta que se elija un modo, cargar el nombre opcional y guardar modo y nombre solo en el estado de la sesión.
- [x] **T006** Actualizar `app.js` para iniciar el ejercicio al confirmar la pantalla inicial, conservar el progreso compartido de nivel y aciertos entre modos y devolver a la pantalla inicial al reiniciar el juego.

## Fase 3: Añadir el modo decimal

- [x] **T007** Añadir en `app.js` funciones numéricas puras para analizar la coma decimal, representar valores como milésimas enteras, formatear con coma y espacios de millares y redondear con empates hacia arriba. Aceptar decimales de `0` a `9.999,999`, con hasta tres cifras decimales; representar correctamente el acarreo a `10 000`.
- [x] **T008** Actualizar en `app.js` la lectura y validación de las filas para admitir decenas de millón en el resultado entero, mantener la columna de milésimas y limitar los objetivos decimales a centésimas.
- [x] **T009** Actualizar en `app.js` la generación de ejercicios enteros y decimales para respetar los rangos `0`–`9.999.999` y `0`–`9.999,999`, respectivamente, además de la precisión, nivel compartido y posiciones permitidas para cada modo.
- [x] **T010** Actualizar `index.html` y `app.js` para que las misiones personalizadas acepten los límites de ambos modos, validen formato y precisión y ofrezcan las posiciones permitidas; el modo entero no ofrece unidades.

## Fase 4: Personalizar los mensajes

- [x] **T011** Actualizar `app.js` para incluir el nombre proporcionado en bienvenida, corrección, ánimo y resultado; usar mensajes neutrales cuando el nombre esté vacío e insertar el nombre como texto seguro.
- [x] **T012** Revisar `index.html` y `app.js` para que cada error muestre ánimo junto con la corrección concreta, sin cambiar las reglas de puntuación, racha o reintento.

## Fase 5: Verificación automatizada y publicación

- [x] **T013 [P]** Ampliar `tests/game.test.js` con pruebas para los límites `0` y máximos de ambos modos en generación y misiones personalizadas, las posiciones permitidas en cada modo, el reinicio a la pantalla inicial, y la exclusión de unidades enteras y milésimas decimales como objetivos.
- [x] **T014 [P]** Ampliar `tests/browser.test.js` para probar los nuevos límites, el reinicio a la pantalla inicial, la coma fija entre unidades y décimas, el flujo de inicio, los objetivos disponibles, mensajes personalizados, teclado y adaptación móvil.
- [x] **T015** Verificar que los enlaces de recursos en `index.html` son relativos y que CSS y JavaScript cargan desde la ruta de proyecto `/redondea/` en GitHub Pages.
- [x] **T016** Configurar o comprobar en los ajustes de GitHub Pages del repositorio `jbaquerot/redondea` que la publicación se sirve desde la rama `main` y la carpeta raíz; confirmar que la página publicada corresponde a `/redondea/`.
- [ ] **T017** Ejecutar las pruebas automatizadas disponibles y hacer una comprobación de humo en las versiones estables actuales de Chrome, Edge, Firefox y Safari antes de dar por terminado el cambio.

**Verificación (2026-11-08):** suites de lógica y Chrome headless completadas (32 pruebas, todas correctas), incluidos los límites, los acarreos, la exclusión de unidades y milésimas como objetivos, la coma no editable entre unidades y décimas, el reinicio a la pantalla inicial, teclado, vista móvil y ruta `/redondea/`. Pages responde HTTP 200 y su configuración indica `main` y `/`. No se hizo humo en Edge, Firefox o Safari: Edge no está instalado; Firefox está instalado pero no hay `geckodriver`; Safari y `safaridriver` están instalados, pero no se ejecutó esa comprobación.

## Criterio de finalización

- El jugador elige el modo antes del primer ejercicio y puede indicar un nombre.
- Las modalidades entera y decimal funcionan con progreso compartido.
- El modo entero admite valores de `0` a `9.999.999`; el modo decimal admite valores de `0` a `9.999,999` con coma y hasta tres cifras decimales. Ambos modos redondean a las posiciones especificadas y muestran correctamente los acarreos.
- En modo entero se redondea desde decenas y no se ofrece la posición de unidades.
- Los errores reciben corrección y ánimo; los mensajes personalizados usan el nombre de forma segura.
- La página y sus recursos cargan en GitHub Pages bajo `/redondea/`.
- Las pruebas y comprobaciones de navegador definidas en T013–T017 se completan correctamente.
