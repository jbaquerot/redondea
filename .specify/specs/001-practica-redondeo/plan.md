# Plan técnico: práctica de redondeo

**Estado:** Borrador actualizado  
**Especificación de producto:** [spec.md](spec.md)  
**Constitution:** [constitution.md](../../memory/constitution.md)

## 1. Enfoque

Mantener la aplicación como sitio web estático en HTML, CSS y JavaScript del navegador, y ampliar el flujo actual para incluir selección de modo, nombre del jugador y ejercicios decimales. El remoto del repositorio es `jbaquerot/redondea`; GitHub Pages se publicará como sitio de proyecto en la ruta `/redondea/`, desde la rama `main` y la carpeta raíz, sin compilación.

No se requiere un servidor de aplicación, una API ni servicios externos para el alcance definido.

## 2. Arquitectura

La aplicación se ejecuta íntegramente en el navegador:

1. **Inicio de partida:** `index.html` ofrece el campo opcional de nombre y la selección obligatoria entre enteros y decimales antes de mostrar ejercicios.
2. **Presentación del juego:** `index.html` contiene el tablero, controles, estadísticas, mensajes, diálogos y regiones accesibles.
3. **Estilos:** `styles.css` define la pantalla inicial, las columnas enteras y decimales, los estados de interacción y el diseño adaptable.
4. **Lógica:** `app.js` administra el modo elegido, el nombre, la generación de ejercicios, la validación, las ayudas, los mensajes personalizados, el progreso y el flujo de niveles.
5. **Persistencia:** `localStorage` conserva una puntuación y un nivel compartidos por los dos modos. La racha, el ejercicio actual, el modo elegido y el nombre permanecen en memoria durante la sesión y no se guardan.
6. **Verificación:** `tests/game.test.js` cubre la lógica con `node:test`; `tests/browser.test.js` comprueba el sitio y las interacciones en Chrome o Chromium headless.

El script seguirá cargándose con `defer`. Se conservará la política CSP del documento, permitiendo los recursos del mismo origen. Los enlaces a CSS, JavaScript y cualquier otro recurso del sitio serán relativos a la página para que funcionen bajo el prefijo de GitHub Pages.

## 3. Componentes y responsabilidades

| Componente | Responsabilidad prevista | Archivo principal |
| --- | --- | --- |
| Inicio/configuración | Capturar nombre opcional, exigir la elección del modo y comenzar la partida. | `index.html`, `app.js`, `styles.css` |
| Estado de partida | Mantener modo, nombre, nivel, aciertos, racha, número, posición objetivo y estado de respuesta. | `app.js` |
| Generador de ejercicios | Producir ejercicios del modo elegido dentro de los límites de la especificación y elegir una posición válida. | `app.js` |
| Tabla posicional | Mostrar posiciones enteras y, en modo decimal, décimas, centésimas y milésimas en las filas del número y del resultado. | `index.html`, `styles.css` |
| Lectura y validación | Leer las cifras, validar primero el número original y después el resultado redondeado. | `app.js` |
| Operaciones numéricas | Analizar la coma decimal, calcular redondeos exactos y formatear números para presentación. | `app.js` |
| Ayudas y feedback | Mostrar pista, solución, corrección alentadora y mensajes que pueden usar el nombre del jugador. | `app.js`, `index.html` |
| Progreso | Recuperar, guardar y reiniciar nivel y aciertos compartidos entre ambos modos. | `app.js` |
| Misión personalizada | Validar entradas enteras o decimales según el modo y ofrecer posiciones disponibles. | `index.html`, `app.js` |
| Publicación estática | Servir el sitio desde GitHub Pages sin rutas absolutas que fallen bajo el prefijo del repositorio. | Repositorio completo |

Las responsabilidades actuales se concentran en el objeto `Game` de `app.js`. Se pueden mantener ahí con funciones numéricas puras y separadas por responsabilidad; no se requiere introducir un framework ni una etapa de compilación.

## 4. Interfaz y flujo

- Añadir una vista inicial con nombre opcional y selector de modo; el tablero de preguntas no empieza hasta escoger uno.
- Mantener nombre y modo en el estado de la partida mientras se juega.
- Incluir en el tablero decimal columnas para décimas, centésimas y milésimas, además de las posiciones enteras existentes.
- Mantener una casilla por cifra para que la descomposición posicional y el avance de foco sigan funcionando con teclado.
- En el campo de misión decimal, aceptar la coma como separador decimal y validar rango y máximo de tres cifras decimales.
- Personalizar con el nombre los mensajes de bienvenida, corrección, ánimo y resultado cuando se haya proporcionado; si no hay nombre, usar mensajes neutrales.
- Después de un error, presentar el motivo y el mensaje de ánimo en el mismo feedback para que ninguno oculte al otro.
- Conservar diseño móvil mediante desplazamiento horizontal del tablero y comprobar el acceso a las columnas recién añadidas.
- Mostrar el número con coma decimal y agrupación de millares mediante espacios. La normalización de ceros finales debe ser consistente entre pregunta, tabla, pista y solución.

## 5. Lógica numérica y modelo de datos

### Representación y redondeo

- Los valores son no negativos. El modo entero mantiene el rango y las posiciones enteras de la especificación.
- El modo decimal acepta valores desde `0` hasta `9 999,999`, con un máximo de tres cifras después de la coma.
- Internamente, el modo decimal debe evitar cálculos con coma flotante binaria para que validación y redondeo no dependan de errores de precisión. Una representación propuesta es convertir el valor a milésimas enteras: `12,345` se representa como `12345` unidades de milésima.
- Las posiciones de redondeo se convierten a pasos de esa unidad: millares `1 000 000`, centenas `100 000`, decenas `10 000`, unidades `1 000`, décimas `100`, centésimas `10` y milésimas `1`.
- Se redondea al múltiplo más próximo y los empates suben. En la posición de milésimas, si la entrada ya tiene como máximo tres cifras decimales, el resultado conserva el mismo valor.
- Los resultados deben admitir los acarreos necesarios, incluidos `9 999,999` redondeado a millares, cuyo resultado es `10 000`.
- La verificación comprueba primero la representación del número original y después el valor redondeado. Las entradas se comparan por valor posicional, no por su formato visual.

### Estado de partida

```text
mode: "integer" | "decimal"
playerName: texto opcional
level: entero positivo
score: entero no negativo
streak: entero no negativo
currentNumber: valor del modo activo
targetPlace: posición de redondeo
isAnswered: booleano
```

### Persistencia

No existe una base de datos. La versión actual guarda `{ level, score }` bajo `jurassicRoundGame_v5`. Se debe proteger la carga contra JSON inválido, valores de tipo incorrecto y falta de disponibilidad de `localStorage`.

El progreso separado para modo entero y decimal está pendiente de decisión de producto. Como propuesta técnica, el formato siguiente evita mezclar resultados y permite migrar el progreso existente al modo entero:

```json
{
  "integer": { "level": 1, "score": 0 },
  "decimal": { "level": 1, "score": 0 }
}
```

Si se adopta esa propuesta, se usará una nueva versión de clave y se mapearán los valores de `jurassicRoundGame_v5` al bloque entero; el progreso decimal comenzará con valores iniciales. El nombre no se guarda entre visitas en este plan.

## 6. Backend, API e integraciones

- **Backend:** no hay servicio de servidor de aplicación.
- **API:** no hay endpoints ni llamadas remotas.
- **Base de datos:** no hay MongoDB ni otra base de datos; el progreso se almacena localmente en el navegador.
- **Integraciones:** no se requieren servicios externos, autenticación, analítica ni recursos remotos.
- **Publicación:** GitHub Pages sirve los archivos estáticos desde `main` y la carpeta raíz. Para el repositorio `jbaquerot/redondea`, los recursos deben cargar en la ruta `/redondea/` y no depender de rutas desde `/`.

## 7. Estructura del repositorio

```text
.
├── index.html
├── app.js
├── styles.css
├── tests/
│   ├── game.test.js
│   └── browser.test.js
└── .specify/
    ├── memory/
    │   └── constitution.md
    └── specs/
        └── 001-practica-redondeo/
            ├── spec.md
            ├── plan.md
            └── tasks.md   (fase siguiente)
```

No hay manifiesto de dependencias, configuración de compilación ni configuración de GitHub Pages en los archivos del repositorio inspeccionado. La publicación prevista es desde la rama `main` y la carpeta raíz; se deberá dejar activa esa fuente en la configuración Pages del repositorio. Las pruebas usan módulos nativos de Node.js; la prueba de navegador requiere Chrome o Chromium disponible en el entorno.

## 8. Verificación técnica

Ampliar la cobertura existente para verificar:

- selección obligatoria de modo y flujo de inicio con nombre vacío o informado;
- normalización y validación de coma decimal, límites `0` y `9 999,999`, entradas inválidas y máximo de tres cifras decimales;
- redondeo decimal a millares, centenas, decenas, unidades, décimas, centésimas y milésimas, con casos por debajo, en y por encima de 5;
- acarreos, incluido el resultado `10 000` al redondear `9 999,999` a millares;
- aceptación de misiones personalizadas decimales dentro de los mismos límites;
- inclusión segura del nombre en mensajes, mensajes neutrales si no se indicó nombre, y feedback alentador después de cada error;
- persistencia, migración del registro existente y tratamiento de datos guardados inválidos, según la decisión sobre progreso por modo;
- carga del sitio desde la ruta de proyecto en GitHub Pages, incluyendo CSS, JavaScript y navegación interna;
- tabla decimal en escritorio y móvil, y entrada con teclado.

La compatibilidad objetivo son las versiones estables actuales de Chrome, Edge, Firefox y Safari. La suite automatizada existente cubre Chrome/Chromium; el resto de la matriz requiere una comprobación de humo en navegador.

Al cambiar la lógica, ejecutar las pruebas de unidad correspondientes. Al cambiar estructura, interacción, accesibilidad o estilos, verificar en navegador y en vista móvil. Este cambio documental no ha ejecutado pruebas.

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación prevista |
| --- | --- |
| Los decimales pueden dar resultados incorrectos si se comparan como números binarios de coma flotante. | Convertir a unidades enteras de milésima y operar con enteros. |
| Redondear a milésimas con una entrada limitada a tres cifras decimales no altera su valor. | Mostrar esa posición conforme a la especificación y dejar claro que sirve para practicar su valor posicional. |
| Redondear el máximo decimal a millares genera un número mayor que el máximo de entrada. | Separar límites de entrada de capacidad de resultado y admitir el acarreo a `10 000`. |
| El nivel y los aciertos se comparten entre los modos, por decisión del usuario. | Conservar el registro `{ level, score }` y la clave `jurassicRoundGame_v5`; no se requiere migrar datos existentes. |
| Nombre y modo se añaden a un flujo sin pantalla inicial. | Mantenerlos en estado de sesión y bloquear la generación de preguntas hasta elegir modo. |
| Las rutas absolutas pueden funcionar localmente y fallar en GitHub Pages bajo el prefijo del repositorio. | Usar referencias relativas y verificar la publicación en una ruta de proyecto. |
| La tabla ampliada puede exceder el ancho de móvil. | Mantener el desplazamiento horizontal del tablero y probar que cada nueva columna sea alcanzable. |
| Los mensajes incorporan un nombre escrito por el jugador. | Insertar el nombre como texto y conservar el feedback dinámico con contenido seguro. |
| El flujo de foco de los diálogos existentes puede no ser suficiente. | Verificar foco inicial, cierre con teclado, foco de retorno y avisos accesibles. |

## 10. Decisiones técnicas cerradas

- Se mantiene la ejecución estática y local en el navegador, sin servicios externos.
- GitHub Pages es el destino y se debe comprobar el sitio bajo la ruta real del repositorio.
- El modo y el nombre solo duran la sesión actual; el nombre no se persiste.
- El nivel y los aciertos se comparten entre los modos; el modo seleccionado y el nombre solo duran la sesión.
- Se conserva el formato y la clave de progreso existentes porque el modelo compartido no requiere migración.
- El máximo de entrada decimal es `9 999,999`, con hasta tres cifras decimales; la salida puede superar el máximo de entrada por redondeo.
- La compatibilidad objetivo son las versiones estables actuales de Chrome, Edge, Firefox y Safari.
- GitHub Pages se publica desde `main` y la carpeta raíz en `/redondea/`; no se añade paso de compilación ni flujo de despliegue basado en dependencias.
