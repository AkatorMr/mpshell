// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SerialPort } from 'serialport';
import { autoDetect, PortInfo } from '@serialport/bindings-cpp'

import * as fs from "fs";
import { join } from 'path';

import { Archivo, DepNodeProvider } from './depNodeProvider';
import { Dispositivo } from './device';


const SYNC_DATA_ID = "mpshell.syncdata";
const CONNECT_ID = "mpshell.connect";
const CHANGE_SETTING_ID = "mpshell.changesetting";
const SELECT_PORT_ID = "mpshell.selectport";
const SEND_CURRENT_FILE_ID = "mpshell.sendcurrentfile";
const LIST_FILES_ID = "mpshell.listfiles";
const SOFT_RESET_ID = "mpshell.soft_reset";



let sendCurrentBarItem: vscode.StatusBarItem;
let listFileBarItem: vscode.StatusBarItem;
let changeSettings: vscode.StatusBarItem;

let workFolder: string;

//Control de los puertos
let portString = "";
let baudrateString = "";
let globalReady: boolean = false;

let globalPort: SerialPort;
let globalDevice: Dispositivo;

function errorPort(error: Error | null) {
	if (error == null) {
		globalReady = true;
		globalDevice = new Dispositivo(globalPort);
		globalDevice.on("UpdateListFiles", ListFilesHandler);
		globalDevice.on("FileContent", FileContentHandler);
		globalDevice.on("FilesChanges", FilesChangeHandler);
		return
	};
	globalReady = false;
	vscode.window.showInformationMessage('El puerto ingresado no sirve o está ocupado');

	portString = "";
	baudrateString = "";
	console.error(error);
	setPlaceHolder();
}

function setPlaceHolder() {
	if (portPrompt != undefined)
		portPrompt.placeholder = portString;

	if (bratePrompt != undefined)
		bratePrompt.placeholder = baudrateString;

}
function testConnection() {
	if (portString.length == 0) {
		portPrompt.show();
		return;
	}

	if (baudrateString.length == 0) {
		bratePrompt.show();
		return;
	}

	globalPort = new SerialPort({
		path: portString,
		baudRate: Number(baudrateString)
	}, errorPort);


}

let portPrompt: vscode.InputBox;
let bratePrompt: vscode.InputBox;
let listaDeArchivos: DepNodeProvider;

let portListPrompt: vscode.QuickPick<vscode.QuickPickItem>;

function prepareUI() {

	portListPrompt = vscode.window.createQuickPick();
	portListPrompt.canSelectMany = false;
	portListPrompt.onDidChangeSelection(selection => {
		portString = selection[0].label;

	});
	portListPrompt.onDidHide(() => portListPrompt.dispose());
	portListPrompt.onDidAccept((e: void) => {

		portString = portListPrompt.selectedItems[0].label;
		portListPrompt.dispose();
		if (baudrateString.length == 0) {
			bratePrompt.show();
		} else {
			testConnection();
		}
	});

	portPrompt = vscode.window.createInputBox();
	portPrompt.prompt = "Selecciona un Puerto";
	portPrompt.onDidHide(() => portPrompt.dispose());

	portPrompt.onDidAccept((e: void) => {
		portString = portPrompt.value;
		console.log(portPrompt.value);
		portPrompt.dispose();
		if (baudrateString.length == 0) {
			bratePrompt.show();
		}
	});

	bratePrompt = vscode.window.createInputBox();
	bratePrompt.prompt = "Ingrese la velocidad";
	bratePrompt.placeholder = "115200";
	bratePrompt.onDidHide(() => bratePrompt.dispose());

	bratePrompt.onDidAccept((e: void) => {

		baudrateString = bratePrompt.value;
		bratePrompt.dispose();

		testConnection();
	});



	// create a new status bar item that we can now manage
	sendCurrentBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		105
	);
	sendCurrentBarItem.command = SEND_CURRENT_FILE_ID;

	listFileBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		105
	);
	listFileBarItem.command = LIST_FILES_ID;
	listFileBarItem.text = `$(folder) Listar archivos`;
	listFileBarItem.show();


	changeSettings = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		105
	);
	changeSettings.command = CHANGE_SETTING_ID;
	changeSettings.text = `$(gear) Cambiar configuración`;
	changeSettings.show();

	listaDeArchivos = new DepNodeProvider("Este");

	vscode.window.registerTreeDataProvider('fileList', listaDeArchivos);
}

function checkConfigFile(workFolder: string) {

	let folder = join(workFolder, ".vscode");
	if (fs.existsSync(folder)) {
		let fileSetting = join(folder, "mpshell.json");
		if (fs.existsSync(fileSetting)) {
			const setting = fs.readFileSync(fileSetting).toString();
			const json = JSON.parse(setting);

			baudrateString = json.baudrate;
			portString = json.port;
			testConnection();
			setPlaceHolder();

			console.log(baudrateString, portString);
		} else {
			console.log("Crear archvo")
		}
	} else {
		//Crear directorio
		console.log("Crear directorio");
	}
}

function isConnected(): boolean {
	return globalReady;
}

async function CambiarConfig() {

}
async function SyncData() {

}

async function Connect() {

}

async function ListFiles() {
	if (!isConnected()) return;
	globalDevice.openPort();
	globalDevice.listFiles()

	//UpdateListFiles evento
	//ListFilesHandler(["uno", "dos", "tres"]);
}

function ListFilesHandler(files: string[]) {
	//vscode.window.createWebviewPanel("webView","Lista de archivos",)
	console.log(files);
	listaDeArchivos.updateList(files);
	globalDevice.closePort();
}


async function SendcurrentFile() {

	if (!isConnected()) return;

	let current_doc = vscode.window.activeTextEditor?.document.fileName;
	if (!current_doc?.endsWith(".py")) return;


	const contenido = fs.readFileSync(current_doc, 'ascii');
	let fileName = current_doc.substring(workFolder.length + 1);
	fileName = fileName.replace(/\\/g, "/");
	console.log(fileName);
	//Subir current file
	globalDevice.openPort();
	globalDevice.sendFile(fileName, contenido);
	setTimeout(() => {
		globalDevice.closePort();
	}, 2000);
}

async function SelectPort() {
	SerialPort.list().then((lista) => {

		portListPrompt.items = lista.map(
			element => ({ label: element.path })
		);
		//portPrompt.show();
		if (lista.length == 0) {
			portPrompt.show();
		} else {
			portListPrompt.show();
		}
	});
}

async function ObtenerArchivo(archivo: Archivo) {
	let path = archivo.path;
	//FileContent evento donde se obtiene el archivo
	if (!isConnected()) return;

	globalDevice.openPort();
	globalDevice.getFile(path);
}
async function EliminarArchivo(archivo: Archivo) {
	let path = archivo.path;
	//FileContent evento donde se obtiene el archivo
	if (!isConnected()) return;

	globalDevice.openPort();
	globalDevice.deleteFile(path);
}

function FileContentHandler(archi: { path: string, contenido: string }) {
	let filename = join(workFolder, archi.path);

	fs.writeFileSync(filename, archi.contenido);
	globalDevice.closePort();
}
function FilesChangeHandler() {

	globalDevice.closePort();
	ListFiles();
}


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mpshell" is now active!');

	let temp = vscode.workspace.workspaceFolders;
	if (temp != undefined) {
		if (temp.length > 1) {
			vscode.window.showInformationMessage('No se poyi');
		} else {
			workFolder = temp[0].uri.fsPath;

			checkConfigFile(workFolder)
		}
	}


	prepareUI();

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('mpshell.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from mpShell!');



	});


	//


	let syncdata = vscode.commands.registerCommand(
		SYNC_DATA_ID,
		SyncData
	);
	let changesettin = vscode.commands.registerCommand(
		CHANGE_SETTING_ID,
		() => {
			baudrateString = "";
			portString = "";
			setPlaceHolder();
			SelectPort();
		}
	);

	let select_port = vscode.commands.registerCommand(
		SELECT_PORT_ID,
		SelectPort
	);
	let send_current_file = vscode.commands.registerCommand(
		SEND_CURRENT_FILE_ID,
		SendcurrentFile
	);
	let list_files = vscode.commands.registerCommand(
		LIST_FILES_ID,
		ListFiles
	);

	let obtenercommand = vscode.commands.registerCommand(
		"fileList.obtener",
		ObtenerArchivo
	);
	let eliminarCommand = vscode.commands.registerCommand(
		"fileList.eliminar",
		EliminarArchivo
	);
	let softReset = vscode.commands.registerCommand(
		SOFT_RESET_ID,
		() => {
			globalDevice.openPort();
			globalDevice.softReset();
		}
	);

	context.subscriptions.push(send_current_file);
	context.subscriptions.push(softReset);
	context.subscriptions.push(changesettin);
	context.subscriptions.push(obtenercommand);
	context.subscriptions.push(eliminarCommand);
	context.subscriptions.push(disposable);
	context.subscriptions.push(select_port);
	context.subscriptions.push(list_files);
	context.subscriptions.push(syncdata);
	context.subscriptions.push(sendCurrentBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(showUploadFile));

}

function showUploadFile(): void {
	let current_doc = vscode.window.activeTextEditor?.document.fileName;
	if (!current_doc?.endsWith(".py")) {
		sendCurrentBarItem.hide();
		return;
	}

	sendCurrentBarItem.text = `$(file) Subir archivo`;
	sendCurrentBarItem.show();

}



function updateStatusBarItem(): void {
	const n = 5;
	if (n > 0) {
		//listFileBarItem.text = "Mostrar textos";
		sendCurrentBarItem.text = `$(file) $(terminal) $(folder) ${n} line(s) selected`;
		sendCurrentBarItem.show();
		//listFileBarItem.show();
	} else {
		sendCurrentBarItem.hide();
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (globalPort.isOpen) {
		globalPort.close();
	}
}


