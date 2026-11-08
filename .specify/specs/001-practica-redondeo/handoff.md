# Handoff de implementación: práctica de redondeo

## Instrucciones para el agente de implementación

Implementa la ampliación del juego **Redondea los Números** en este repositorio. Antes de modificar el código, lee y sigue estos documentos, en este orden:

1. `.specify/memory/constitution.md`
2. `.specify/specs/001-practica-redondeo/spec.md`
3. `.specify/specs/001-practica-redondeo/plan.md`
4. `.specify/specs/001-practica-redondeo/tasks.md`

Usa `tasks.md` como lista de trabajo y marca las tareas al completarlas. Respeta sus dependencias y las marcas `[P]`. Mantén el alcance acordado y actualiza la documentación si el comportamiento final difiere de estos artefactos.

## Objetivo

Ampliar el juego web estático actual para que el alumnado de primaria elija, antes de jugar, entre el modo de números enteros y el modo de números decimales. El jugador puede indicar su nombre; los mensajes del juego lo usan cuando está disponible. Los errores muestran una corrección clara junto con ánimo para volver a intentarlo.

El modo decimal permite practicar redondeos a millares, centenas, decenas, unidades, décimas y centésimas. El número decimal se escribe con coma.

## Decisiones de producto cerradas

- El nombre del jugador es opcional y solo se conserva durante la sesión.
- La selección del modo es obligatoria antes del primer ejercicio y solo se conserva durante la sesión.
- El modo decimal acepta valores entre `0` y `9.999,999`, ambos incluidos, con hasta tres cifras decimales.
- El modo entero acepta valores entre `0` y `9.999.999`, ambos incluidos.
- En modo entero se puede pedir redondear a decenas, centenas, unidades de millar, decenas de millar, centenas de millar, millones o decenas de millón; las unidades no son una posición objetivo.
- Las misiones personalizadas aceptan números dentro del rango definido para el modo elegido.
- La tabla posicional debe representar el acarreo hasta decenas de millón al redondear el máximo entero a centenas de millar.
- Los empates con cifra siguiente igual o superior a 5 se redondean hacia arriba.
- La tabla conserva la columna de milésimas para colocar el número original y consultar la cifra siguiente al redondear a centésimas; no se ofrece como objetivo.
- El nivel y los aciertos son compartidos entre los modos y se conservan entre visitas. La racha y la pregunta actual son temporales.
- Los errores deben mostrar mensajes amables y alentadores sin ocultar la corrección ni modificar la puntuación o las reglas de reintento.
- GitHub Pages publica el sitio desde `main` y la carpeta raíz, bajo la ruta de proyecto `/redondea/`.
- La compatibilidad objetivo son las versiones estables actuales de Chrome, Edge, Firefox y Safari.

## Límites técnicos

- Conserva la arquitectura actual: HTML, CSS y JavaScript del navegador, sin servidor, API, base de datos, framework ni paso de compilación.
- Los archivos principales son `index.html`, `styles.css` y `app.js`.
- Mantén el progreso compartido en el formato actual `{ level, score }` bajo `jurassicRoundGame_v5`; no migres ni dividas puntuaciones por modo.
- Analiza y calcula decimales sin depender de errores de coma flotante binaria. El plan propone representar valores como milésimas enteras.
- Acepta la coma decimal y agrupa millares con espacios en la presentación.
- Usa referencias de recursos compatibles con el prefijo `/redondea/` de GitHub Pages.
- Inserta el nombre como texto seguro; no lo concatenes como HTML sin escapar.
- Conserva las etiquetas accesibles, el uso con teclado y el diseño móvil del juego actual.

## Verificación esperada

Amplía las pruebas existentes indicadas en `tasks.md` para cubrir modos, entradas decimales, redondeo, empates, posiciones, acarreos, misiones personalizadas, feedback con y sin nombre, persistencia compartida, teclado, móvil y la ruta de GitHub Pages. Ejecuta las pruebas automatizadas disponibles y verifica la interfaz en navegador antes de finalizar. Si no se puede verificar algún navegador o la publicación de Pages, informa exactamente qué quedó sin comprobar.

## Resultado esperado

Completa las tareas `T001`–`T017` de `.specify/specs/001-practica-redondeo/tasks.md`, entrega un resumen de archivos modificados y resultados de verificación, e identifica cualquier requisito que no se haya podido completar.
