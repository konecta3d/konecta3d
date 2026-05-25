Necesito hacer una nueva implementacion en la pagina /landing/new (el editor de la landing), esta implementacion consiste en añadir un tercer contenedor al lado izquierdo de los que hay actualmente, debes mantener las proporciones y la anchura entre todos los contenedores para que tenga una coherencia visual.

La implementacion consiste en añadir dentro de este nuevo contenedor un chat con el que el negocio va a poder mantener una conversacion para personalizar los parametros de la landing. Para realizar esto había pensado en utilizar un GPT personalizado con el que en base a la conversación se pueda crear esa landing. Para ello debo de usar la API de chatGPT y conectarla a mi backend.

En base a la respuesta de chatgpt necesito establecer ciertos parametros para que segun esa respuesta yo pueda reflejar esos cambios en la UI. Quiero definir respuesta específicas para poder parametrizarlas y personalizar la landing del cliente en función de la conversación previa ¿como podemos definir este flujo en la conversacion para obtener este resultado?

Esta conversación debe de almacenarse en la base de datos con motivos revision posterior, pero no debe de ser accesible por el usuario una vez termine, unicamente nos importa el resultado de la conversacion entregado por el GPT.

Dime como puedo definir más esta implementacón y qué dudas te surgen para llevarla a cabo.

-----------------------------------------------------

1. No tengo aun acceso a la API de chatgpt, crea el proyecto sin ella y más adelante me indicas como conectarlo.

2. Prefiero un boton 'Aplicar Sugerencias'

3. Quiero que sean editables excepto el logo.

4. el chat debe ver el estado actual del editor para trabajar desde ahí

5. Boton explicito 'finalizar y guardar'

6. Debes de utilizar el contexto que ya tienes del cliente en la pagina /gpt-fidelizacion.

7. Por el momento esto es un MVP, no quiero poner limite, más adelante lo haré.

¿Tienes alguna duda o algo que no esté claro para desarrollar esta implementacion? Hasta el momento tu propuesta me parece correcta. No quiero que cambies nada aun en el codigo.

------------------------------------------------------------

Si no tienes más preguntas ni nada por definir quiero que me des un prompt completo con todo lujo de detalles sobre esta implementacion. 

---------------------------------------------------------------

Quiero que la conversación con el GPT tenga el orden que tiene la estructura de la pagina /landing/new de arriba a abajo. Respecto a tus dudas:

1. Aplica los cambios del ultimo mensaje unicamente.

2. Realiza todas esas acciones

3. Prefiero mostrar un aviso que les dirija a rellenar el cuestionario.

4. Que empiece una conversacion nueva.

5. Si, para pantallas inferiores a 13".

Voy a iniciar esta implementacion en otra conversacion, por lo que no va a tener un contexto de todo lo que hemos hablado. Dame el prompt perfecto con todo lujo de detalles con todo lo que hemos definido para poder realizar esta implementacion.