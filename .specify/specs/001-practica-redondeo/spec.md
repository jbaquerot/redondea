# Especificación: práctica de redondeo

**Estado:** Borrador actualizado con ampliaciones solicitadas  
**Producto:** Redondea los Números  
**Público principal:** Alumnado de primaria

## 1. Propósito

Ofrecer al alumnado de primaria una práctica guiada para comprender el valor posicional y redondear números enteros o decimales. Antes de empezar, cada jugador elige el tipo de números y puede indicar su nombre. El juego debe permitir resolver ejercicios, recibir orientación y ánimo cuando hay errores, y avanzar con una dificultad gradual.

## 2. Usuarios y necesidades

### Alumnado de primaria

- Quiere practicar el redondeo de forma clara y motivadora.
- Quiere elegir si practica con números enteros o decimales.
- Puede indicar su nombre para recibir mensajes dirigidos a él o ella.
- Necesita identificar las cifras de un número y relacionarlas con sus posiciones.
- Necesita saber qué parte de una respuesta debe corregir y recibir ánimo para volver a intentarlo.
- Puede querer practicar con un número concreto elegido por sí mismo o por una persona que le acompaña.

### Persona adulta que acompaña (supuesto por validar)

- Puede querer proponer un número y una posición de redondeo concretos para orientar la práctica.

## 3. Recorrido principal

1. Antes de empezar, el jugador puede indicar su nombre y elige practicar con números enteros o decimales.
2. El jugador ve un número y la posición a la que debe redondearlo.
3. Coloca las cifras del número original en una tabla de valor posicional.
4. Escribe el resultado redondeado en una segunda fila de la tabla.
5. Comprueba su respuesta.
6. Si hay un error, recibe una indicación del paso que debe revisar y un mensaje de ánimo; puede intentarlo otra vez.
7. Si acierta, recibe confirmación, suma un acierto y puede pasar al siguiente ejercicio.
8. Tras tres aciertos consecutivos, se le ofrece avanzar al siguiente nivel, hasta el nivel máximo previsto.

También puede abrir una misión personalizada, introducir un número y seleccionar una posición válida para redondearlo.

## 4. Historias de usuario y requisitos funcionales

### HU-01: Resolver un ejercicio de redondeo

Como alumno, quiero ver un número y una posición de redondeo para practicar cómo aproximarlo.

**Requisitos:**

- **RF-01.1** Antes de iniciar la partida, el jugador elige el modo de números enteros o el modo de números decimales.
- **RF-01.2** En el modo elegido, el juego presenta un número y una posición objetivo compatibles con ese tipo de número.
- **RF-01.3** En modo entero se pueden practicar las posiciones desde unidades hasta centenas de millar; el comportamiento actual genera ejercicios progresivos de dos a seis cifras.
- **RF-01.4** En modo decimal se puede redondear a millares, centenas, decenas, unidades, décimas, centésimas y milésimas, siempre que la posición sea pertinente para el número.
- **RF-01.5** En modo decimal, el número distingue claramente la parte entera y la parte decimal mediante coma decimal; los millares se agrupan con espacios.

### HU-08: Preparar una partida

Como jugador, quiero elegir el tipo de números y, si quiero, indicar mi nombre antes de jugar.

**Requisitos:**

- **RF-08.1** Antes de generar el primer ejercicio, el juego permite elegir entre números enteros y números decimales.
- **RF-08.2** No comienza una partida hasta que se ha elegido uno de los dos modos.
- **RF-08.3** El jugador puede indicar su nombre al comienzo; el nombre es opcional.
- **RF-08.4** Cuando se ha proporcionado un nombre, los mensajes del juego se dirigen al jugador usando ese nombre.
- **RF-08.5** Si no se proporciona un nombre, el juego utiliza mensajes neutrales que no incluyan un nombre vacío.

### HU-09: Practicar el redondeo decimal

Como alumno, quiero practicar con números decimales para aprender el valor de sus posiciones.

**Requisitos:**

- **RF-09.1** El modo decimal genera ejercicios con parte entera y parte decimal entre 0 y 9 999,999, ambos incluidos.
- **RF-09.2** La tabla permite representar hasta millares en la parte entera y hasta milésimas en la parte decimal.
- **RF-09.3** La posición objetivo puede ser millares, centenas, decenas, unidades, décimas, centésimas o milésimas.
- **RF-09.4** Los ejercicios admiten como máximo tres cifras decimales. Con esta precisión, redondear a milésimas conserva el mismo valor numérico; esta posición permite practicar su valor posicional.
- **RF-09.5** El resultado se calcula y valida según la posición seleccionada y la regla de redondeo acordada.
- **RF-09.6** El alumno puede pedir una pista y consultar la solución también en modo decimal.

### HU-10: Recibir ánimo después de un error

Como alumno, quiero recibir un mensaje de ánimo cuando me equivoco para seguir practicando.

**Requisitos:**

- **RF-10.1** Cada respuesta incorrecta muestra una corrección clara acompañada de un mensaje amable y alentador.
- **RF-10.2** El mensaje anima a revisar el paso correspondiente e intentarlo de nuevo, sin ridiculizar ni culpabilizar al alumno.
- **RF-10.3** Si el jugador proporcionó su nombre, el mensaje puede dirigirse a él o ella por su nombre.
- **RF-10.4** El ánimo no oculta cuál parte de la respuesta debe corregirse ni altera la puntuación o las reglas de reintento.

### HU-02: Descomponer el número por posiciones

Como alumno, quiero colocar cada cifra en su columna para entender el valor posicional del número.

**Requisitos:**

- **RF-02.1** El tablero ofrece posiciones enteras y, en modo decimal, columnas para décimas, centésimas y milésimas; admite el acarreo del resultado hasta millones cuando sea necesario.
- **RF-02.2** Hay una fila para representar el número original y otra para representar el resultado redondeado.
- **RF-02.3** Cada casilla admite como máximo una cifra y solo acepta dígitos.
- **RF-02.4** Al introducir una cifra, el foco pasa a la casilla siguiente para facilitar la entrada con teclado.
- **RF-02.5** El alumno puede comprobar la respuesta con el teclado o mediante el control visible correspondiente.

### HU-03: Recibir una corrección comprensible

Como alumno, quiero saber qué parte de mi respuesta está mal para poder corregirla.

**Requisitos:**

- **RF-03.1** Si la fila del número original está vacía, el juego pide completarla.
- **RF-03.2** Si la descomposición no coincide con el número mostrado, el juego identifica que debe corregirse el primer paso.
- **RF-03.3** Si la descomposición es correcta y falta el resultado, el juego pide completar el segundo paso.
- **RF-03.4** Si el redondeo es incorrecto, el juego explica que el número original está bien colocado, muestra un mensaje de ánimo y permite volver a intentarlo.
- **RF-03.5** Un error de redondeo reinicia la racha consecutiva, pero no resta aciertos acumulados.

### HU-04: Consultar una pista o la solución

Como alumno, quiero pedir una pista y, si la necesito, consultar la solución para aprender el procedimiento.

**Requisitos:**

- **RF-04.1** La pista identifica la cifra inmediatamente a la derecha de la posición objetivo e indica si se redondea hacia arriba o se mantiene la posición.
- **RF-04.2** Después de pedir una pista, el alumno puede solicitar la solución completa.
- **RF-04.3** La solución muestra el resultado y lo representa en las columnas de la tabla.
- **RF-04.4** Consultar la solución permite avanzar al ejercicio siguiente, pero no suma un acierto.

### HU-05: Progresar y conservar avances

Como alumno, quiero ver mis aciertos y mi progreso para continuar practicando.

**Requisitos:**

- **RF-05.1** El juego muestra el nivel actual, los aciertos acumulados y la racha actual respecto al objetivo de tres aciertos.
- **RF-05.2** Una respuesta correcta incrementa los aciertos y la racha.
- **RF-05.3** Al alcanzar tres aciertos consecutivos, el juego ofrece avanzar un nivel, salvo que ya se haya alcanzado el nivel máximo.
- **RF-05.4** El nivel y los aciertos se comparten entre los modos entero y decimal y se conservan entre visitas; la racha corresponde a la sesión de práctica actual.
- **RF-05.5** El alumno puede solicitar el reinicio del progreso y debe confirmar antes de que se borren los aciertos y el nivel guardados.
- **RF-05.6** El reinicio devuelve el juego al primer nivel y pone a cero la puntuación y la racha.

### HU-06: Elegir una misión personalizada

Como alumno o persona que le acompaña, quiero indicar un número y una posición para practicar un caso concreto.

**Requisitos:**

- **RF-06.1** En modo entero se puede elegir un número entre 10 y 999 999, ambos incluidos.
- **RF-06.2** En modo entero no se aceptan valores decimales ni valores fuera del rango permitido.
- **RF-06.3** En modo decimal se puede introducir un número decimal personalizado, usando coma decimal.
- **RF-06.4** Las posiciones disponibles dependen del modo y del valor introducido: el modo decimal permite elegir entre millares, centenas, decenas, unidades, décimas, centésimas y milésimas, cuando sean pertinentes.
- **RF-06.5** No se inicia la misión hasta que el número y una posición válida estén seleccionados.
- **RF-06.6** Iniciar una misión personalizada no cambia el nivel ni los aciertos acumulados.
- **RF-06.7** Para números decimales personalizados se admite el rango de 0 a 9 999,999, ambos incluidos, con un máximo de tres cifras decimales.

### HU-07: Usar el juego en distintos dispositivos

Como alumno, quiero poder completar ejercicios en una pantalla grande o pequeña.

**Requisitos:**

- **RF-07.1** El tablero conserva legibles sus columnas en pantallas estrechas y permite desplazarse para verlas.
- **RF-07.2** Las acciones y entradas principales se pueden utilizar con teclado, ratón o pantalla táctil.
- **RF-07.3** Los mensajes de ejercicio, validación y resultado se distinguen también mediante texto, no únicamente por color.

## 5. Criterios de éxito del producto

- Un alumno puede completar el recorrido de un ejercicio, desde la descomposición hasta la validación del redondeo.
- Antes de jugar, el alumno puede elegir el modo entero o decimal y puede indicar su nombre.
- En modo decimal, el alumno puede resolver ejercicios hasta la posición de milésimas.
- Ante una respuesta incompleta o incorrecta, el alumno puede identificar qué paso debe revisar y volver a intentarlo.
- Ante un error, el mensaje de corrección incluye ánimo adecuado para alumnado de primaria y puede usar el nombre elegido.
- El alumno puede practicar con una pista, consultar la solución o iniciar un número personalizado dentro de los límites indicados.
- Los aciertos y el nivel permanecen disponibles al regresar al juego; el reinicio requiere confirmación.
- Las funciones principales se pueden utilizar en escritorio y móvil sin perder acceso al tablero ni a sus controles.

## 6. Límites del producto

- El alcance descrito es una herramienta de práctica individual de redondeo y valor posicional.
- No se especifican cuentas, perfiles, gestión de aula, informes para docentes, competición entre alumnos ni sincronización entre dispositivos.
- No se especifican otros contenidos matemáticos distintos del valor posicional y el redondeo de números enteros y decimales.
- No se establecen requisitos de currículo, curso, país o edad concreta dentro de primaria; quedan pendientes de confirmar.

## 7. Supuestos y decisiones pendientes

- El público principal es alumnado de primaria, confirmado por el usuario; no se ha indicado curso ni rango de edad.
- La aplicación actual practica con enteros; el modo decimal, la selección inicial de modo, el nombre del jugador y los mensajes de ánimo son ampliaciones solicitadas que aún no están implementadas.
- Debe confirmarse si la persona adulta que acompaña es un usuario objetivo formal o solo un contexto posible para las misiones personalizadas.
- El nivel máximo 5 y los ejercicios progresivos de dos a seis cifras describen los límites actuales de la versión. Su validez pedagógica queda pendiente de confirmar.
- Para números no negativos, cuando la cifra inmediatamente a la derecha de la posición objetivo es 5 o más, se redondea hacia arriba; decisión confirmada para el modo entero y aplicada al modo decimal.
- «Decimales» en la lista de posiciones significa «décimas»; confirmado por el usuario.
- Se usa coma decimal y espacios para agrupar millares; confirmado por el usuario.
- Las misiones personalizadas aceptan decimales en el modo decimal; confirmado por el usuario. El rango de 0 a 9 999,999 y el máximo de tres cifras decimales están confirmados. También está confirmado mantener la posición de milésimas aunque el resultado pueda ser igual al original, y compartir nivel y aciertos entre ambos modos.

## 8. Fuera de alcance en esta especificación

- Decisiones de arquitectura, lenguajes, bibliotecas, almacenamiento o despliegue.
- Desglose de tareas de implementación.
- Contenidos matemáticos diferentes del redondeo de enteros y decimales.

## 9. Revisión y aceptación

- **Claridad:** Sí. Los modos, las posiciones, los límites decimales, la personalización del nombre y los mensajes de ánimo están definidos. Se documenta que redondear a milésimas puede conservar el valor cuando ya tiene tres cifras decimales.
- **Completitud:** Adecuada como borrador de producto. El curso concreto, la edad y la validación curricular no están definidos.
- **Verificabilidad:** Sí. Cada requisito describe resultados observables que pueden comprobarse en el juego.
- **Valor para el usuario:** Sí. Los requisitos cubren práctica con dos tipos de número, corrección comprensible, ánimo, ayuda y progreso para alumnado de primaria.
- **Supuestos pendientes:** El nivel 5 y los máximos de cifras actuales aún no están validados pedagógicamente; queda definir la persistencia del nombre y confirmar si la persona adulta acompañante es un usuario objetivo formal.
- **Decisión matemática confirmada:** Para números no negativos, una cifra siguiente de 5 o más implica redondear hacia arriba.
