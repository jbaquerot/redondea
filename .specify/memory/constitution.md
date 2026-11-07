# Constitution del proyecto Redondea los Números

## Propósito

Esta Constitution establece los principios que deben guiar la evolución del juego educativo **Redondea los Números**. Se aplica a los cambios de producto, código, interfaz y documentación del repositorio.

## Principios

### 1. Priorizar el aprendizaje matemático

- Cada interacción debe ayudar a practicar el redondeo y el valor posicional.
- Las instrucciones, pistas y correcciones deben explicar el paso que se está practicando con lenguaje claro y adecuado para el público escolar.
- La respuesta debe distinguir entre una descomposición incorrecta del número original y un redondeo incorrecto, para que el alumno sepa qué corregir.
- Las ayudas y la solución deben apoyar el aprendizaje sin alterar el resultado de una respuesta ya validada.

### 2. Mantener reglas matemáticas correctas y coherentes

- Las reglas de generación, selección de posición, cálculo, validación y explicación deben describir el mismo comportamiento de redondeo.
- Los límites de números y posiciones deben validarse tanto al ofrecer opciones como al iniciar una misión personalizada.
- Los casos límite, incluidos los acarreos a una posición superior, deben representarse y comprobarse correctamente.
- Toda modificación de las reglas debe incluir ejemplos verificables para los casos habituales y los límites afectados.

### 3. Hacer la interacción accesible y comprensible

- Toda entrada debe tener una etiqueta o nombre accesible que indique su posición y función.
- Las acciones principales deben poder usarse con teclado y mostrar un foco visible.
- Los mensajes de progreso, validación y resultado deben ser perceptibles para tecnologías de asistencia.
- La interfaz debe conservar su legibilidad en pantallas estrechas; las tablas amplias pueden desplazarse horizontalmente sin romper el resto de la página.
- El color y la decoración no deben ser la única forma de comunicar estados o instrucciones.

### 4. Favorecer una experiencia segura y respetuosa

- El progreso del juego se conserva localmente en el navegador; no se recopilan ni transmiten datos personales.
- La aplicación no debe incorporar solicitudes de datos personales, analítica remota ni conexiones externas sin una decisión de producto documentada.
- Los datos persistidos deben tratarse como entrada no confiable: los errores o valores inválidos no deben impedir iniciar el juego.
- El contenido educativo debe ser respetuoso, no penalizar al alumno por equivocarse y permitir reintentar.

### 5. Mantener una experiencia rápida, adaptable y sencilla

- La experiencia principal debe seguir funcionando como una página web ligera, sin exigir cuenta ni instalación.
- Los cambios deben preservar la compatibilidad con los navegadores definidos por el proyecto y probarse en las capacidades afectadas.
- La interfaz debe responder a escritorio y móvil y mantener controles utilizables con ratón, tacto y teclado.
- Las dependencias y la complejidad añadidas deben justificarse por una necesidad concreta del producto.

### 6. Proteger la claridad del código y la capacidad de verificar cambios

- La lógica matemática debe mantenerse fácil de localizar y revisar, separada conceptualmente de la presentación cuando el cambio lo permita.
- Los nombres, mensajes y documentación visibles para el usuario deben estar en español, salvo términos técnicos necesarios.
- Los cambios en reglas del juego deben cubrirse con pruebas automatizadas de lógica; los cambios de interacción o presentación deben verificarse en navegador cuando corresponda.
- La documentación debe describir el comportamiento existente y señalar las decisiones aún no confirmadas, sin presentar supuestos como requisitos.

## Criterios de aceptación para cambios

Un cambio se considera listo cuando:

1. Resuelve una necesidad del alumno o del mantenimiento del proyecto claramente identificada.
2. Respeta los principios anteriores o documenta por qué requiere una excepción.
3. Incluye validación acorde al riesgo y al área modificada.
4. No introduce regresiones conocidas en el flujo de práctica, el progreso local, la accesibilidad o la experiencia móvil.
5. Actualiza la documentación afectada y deja explícitas las limitaciones o decisiones pendientes.

## Gobierno

- Esta Constitution es la referencia para las especificaciones, planes y tareas del proyecto.
- Las excepciones deben quedar justificadas en la especificación o en la revisión del cambio correspondiente.
- Una modificación de estos principios debe actualizar este archivo y resumir el motivo del cambio.

**Versión:** 1.0  
**Estado:** Inicial  
**Alcance:** Repositorio Redondea los Números
