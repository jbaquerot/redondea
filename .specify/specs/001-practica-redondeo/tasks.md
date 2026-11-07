# Tareas de implementación: práctica de redondeo

**Estado:** Implementación en curso; matriz de navegadores pendiente
**Especificación:** [spec.md](spec.md)  
**Plan técnico:** [plan.md](plan.md)  
**Orden:** las tareas siguen sus dependencias; `[P]` indica que pueden hacerse en paralelo.

## Fase 1: Preparar el inicio y el tablero

- [x] **T001** Añadir pantalla inicial en `index.html` con campo opcional para el nombre, selección obligatoria de modo entero o decimal y botón para empezar. Mantener oculto o inactivo el tablero hasta elegir el modo.
- [x] **T002 [P]** Añadir estilos para la pantalla inicial en `styles.css`, incluidos foco visible, etiquetas legibles y adaptación a pantallas estrechas.
- [x] **T003** Ampliar la tabla de posiciones en `index.html` para mostrar décimas, centésimas y milésimas después de unidades, en las filas del número original y del resultado. Mantener etiquetas accesibles por columna.
- [x] **T004 [P]** Adaptar en `styles.css` la tabla ampliada y el desplazamiento horizontal en móvil, conservando el ancho legible de los controles y los encabezados.

## Fase 2: Gestionar el inicio de partida

- [x] **T005** Actualizar `app.js` para bloquear la generación de preguntas hasta que se elija un modo, cargar el nombre opcional y guardar modo y nombre solo en el estado de la sesión.
- [x] **T006** Actualizar `app.js` para iniciar el ejercicio al confirmar la pantalla inicial y conservar el progreso compartido de nivel y aciertos entre ambos modos mediante el registro actual `jurassicRoundGame_v5`.

## Fase 3: Añadir el modo decimal

- [x] **T007** Añadir en `app.js` funciones numéricas puras para analizar la coma decimal, representar valores como milésimas enteras, formatear con coma y espacios de millares y redondear con empates hacia arriba. Aceptar valores de `0` a `9 999,999`, con hasta tres cifras decimales; representar correctamente acarreos como `10 000`.
- [x] **T008** Actualizar en `app.js` la lectura y validación de las filas para comprobar las posiciones decimales y admitir los objetivos millares, centenas, decenas, unidades, décimas, centésimas y milésimas en el modo decimal.
- [x] **T009** Actualizar en `app.js` la generación de ejercicios decimales y la selección de posiciones, respetando rango, precisión, nivel compartido y las posiciones pertinentes para cada número.
- [x] **T010** Actualizar `index.html` y `app.js` para que la misión personalizada en modo decimal acepte coma decimal, valide el rango y precisión acordados y ofrezca las posiciones válidas.

## Fase 4: Personalizar los mensajes

- [x] **T011** Actualizar `app.js` para incluir el nombre proporcionado en bienvenida, corrección, ánimo y resultado; usar mensajes neutrales cuando el nombre esté vacío e insertar el nombre como texto seguro.
- [x] **T012** Revisar `index.html` y `app.js` para que cada error muestre ánimo junto con la corrección concreta, sin cambiar las reglas de puntuación, racha o reintento.

## Fase 5: Verificación automatizada y publicación

- [x] **T013 [P]** Ampliar `tests/game.test.js` con pruebas para selección de modo, números decimales, coma, límites, posiciones, empates, milésimas, acarreos, misiones personalizadas, mensajes con/sin nombre y progreso compartido.
- [x] **T014 [P]** Ampliar `tests/browser.test.js` para probar el flujo de inicio, las dos modalidades, mensajes personalizados, teclado y adaptación móvil de las columnas decimales.
- [x] **T015** Verificar que los enlaces de recursos en `index.html` son relativos y que CSS y JavaScript cargan desde la ruta de proyecto `/redondea/` en GitHub Pages.
- [x] **T016** Configurar o comprobar en los ajustes de GitHub Pages del repositorio `jbaquerot/redondea` que la publicación se sirve desde la rama `main` y la carpeta raíz; confirmar que la página publicada corresponde a `/redondea/`.
- [ ] **T017** Ejecutar las pruebas automatizadas disponibles y hacer una comprobación de humo en las versiones estables actuales de Chrome, Edge, Firefox y Safari antes de dar por terminado el cambio.

**Avance de T017 (2026-11-07):** suites de lógica y Chrome headless completadas (26 pruebas, todas correctas), con teclado, vista móvil y ruta `/redondea/`. Pages responde HTTP 200 y su configuración indica `main` y `/`. No se hizo humo en Edge, Firefox o Safari: Edge no está instalado; Firefox está instalado pero no hay `geckodriver`; Safari y `safaridriver` están instalados, pero no se ejecutó esa comprobación.

## Criterio de finalización

- El jugador elige el modo antes del primer ejercicio y puede indicar un nombre.
- Las modalidades entera y decimal funcionan con progreso compartido.
- El modo decimal admite entrada con coma hasta `9 999,999`, redondea a todas las posiciones especificadas y muestra correctamente los acarreos.
- Los errores reciben corrección y ánimo; los mensajes personalizados usan el nombre de forma segura.
- La página y sus recursos cargan en GitHub Pages bajo `/redondea/`.
- Las pruebas y comprobaciones de navegador definidas en T013–T017 se completan correctamente.
