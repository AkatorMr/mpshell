// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SerialPort } from 'serialport';
import { autoDetect, PortInfo } from '@serialport/bindings-cpp'

import * as fs from "fs";
import { join } from 'path';

import { MPWorkspace } from './WorkSpace';
import { Board } from './board';
import { Archivo, DepNodeProvider } from './depNodeProvider';


const SYNC_DATA_ID = "mpshell.syncdata";
const CONNECT_ID = "mpshell.connect";
const SELECT_PORT_ID = "mpshell.selectport";
const SEND_CURRENT_FILE_ID = "mpshell.sendcurrentfile";
const LIST_FILES_ID = "mpshell.listfiles";



let myStatusBarItem: vscode.StatusBarItem;
let listFileBarItem: vscode.StatusBarItem;

let workFolder: string;

//Control de los puertos
let portString = "";
let baudrateString = "";
let globalReady: boolean = false;

let globalPort: SerialPort;

function errorPort(error: Error | null) {
	if (error == null) {
		globalReady = true;
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
	myStatusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		100
	);
	myStatusBarItem.command = SEND_CURRENT_FILE_ID;

	listFileBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		105
	);
	listFileBarItem.command = LIST_FILES_ID;


	const listaDeArchivos = new DepNodeProvider("Este");
	
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

async function SyncData() {

}

async function Connect() {

}

async function ListFiles() {
	if (!isConnected()) return;

	//UpdateListFiles evento
	ListFilesHandler(["uno", "dos", "tres"]);
}

function ListFilesHandler(files: string[]) {
	//vscode.window.createWebviewPanel("webView","Lista de archivos",)
}


async function SendcurrentFile() {

	if (!isConnected()) return;

	let current_doc = vscode.window.activeTextEditor?.document.fileName;
	if (!current_doc?.endsWith(".py")) return;


	const contenido = fs.readFileSync(current_doc, 'ascii');
	let fileName = current_doc.substring(workFolder.length + 1);
	fileName.replace("\\", "/");
	//Subir current file

}

async function SelectPort() {
	SerialPort.list().then((lista) => {

		portListPrompt.items = lista.map(
			element => ({ label: element.path })
		);
		if (lista.length == 0) {
			portPrompt.show();
		} else {
			portListPrompt.show();
		}
	});
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
		console.log(MPWorkspace.rootPath);


	});


	//


	let syncdata = vscode.commands.registerCommand(
		SYNC_DATA_ID,
		SyncData
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
		(node:Archivo)=>{console.log(node)}
	);

	context.subscriptions.push(send_current_file);
	context.subscriptions.push(obtenercommand);
	context.subscriptions.push(disposable);
	context.subscriptions.push(select_port);
	context.subscriptions.push(list_files);
	context.subscriptions.push(syncdata);
	context.subscriptions.push(myStatusBarItem);

	// register some listener that make sure the status bar 
	// item always up-to-date
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem));
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateStatusBarItem));

	// update status bar item once at start
	updateStatusBarItem();
}

function updateStatusBarItem(): void {
	const n = 5;
	if (n > 0) {
		listFileBarItem.text = "Mostrar textos";
		myStatusBarItem.text = `$(file) $(terminal) $(folder) ${n} line(s) selected`;
		myStatusBarItem.show();
		listFileBarItem.show();
	} else {
		myStatusBarItem.hide();
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (globalPort.isOpen) {
		globalPort.close();
	}
}


