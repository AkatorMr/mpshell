# mpshell

mpShell es una herramienta para interactuar con MicroPython a través de una conexión serial.

mpShell te permite manipular los archivos de las placas con MicroPython a través de una conexión serial. mpShell envía los archivos desde tu computadora al sistema de archivos de la placa.

mpShell está diseñado para operar con accesos gráficos proporcionados por vscode.

Revisa otras herramientas realizadas en python como [rshell](https://github.com/dhylands/rshell)
, [mpfshell](https://github.com/wendlers/mpfshell) or [ampy](https://github.com/scientifichackers/ampy) para otro tipo de interacción.

## Instalación

Busca la extensión mpShell en el administración de extensiones de vscode.

## Uso

La extensión incorpora nuevos comandos para interactuar con la placa con MicroPyton

### Obtener

Obtiene el archivo contenido en la placa y lo guarda en el directorio de trabajo.


### Eliminar

Elimina el archivo seleccionado solo en la placa.

### Select Port

Lista los puertos disponibles para conexión y luego seleccionarlo

### Soft Reset

Ejecuta un soft reset de la placa

### Sync Files

ToDo - Sincroniza los archivo de la carpeta de trabajo con los archivos de la placa.

### Modificar configuración

Modifica la configuración de la conexión sin ateneder a los datos previamente cargados

### Send current file

Envía el archivo .py abierto en el editor a la placa.