// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SerialPort } from 'serialport';
import { autoDetect } from '@serialport/bindings-cpp'

import { MPWorkspace } from './WorkSpace';
import { Board } from './board';

let myStatusBarItem: vscode.StatusBarItem;

let workFolder: string;

const port = new SerialPort({ path: 'COM35', baudRate: 115200 }, function (err) {
	if (err) {
		return console.log('Error: ', err.message)
	}
})

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mpshell" is now active!');

	let temp = vscode.workspace.workspaceFolders;
	if (temp != undefined)
		workFolder = temp[0].uri.fsPath;


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('mpshell.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from mpShell!');
		console.log(MPWorkspace.rootPath);

		port.open();

		let board = new Board(port);

		board.sendTest();

		port.close();

	});

	let myCommandId = "mpshell.syncdata";
	let syncdata = vscode.commands.registerCommand(myCommandId, async () => {

		const ports = await SerialPort.list();

		console.log(ports);
		/* 
		SerialPort.list().then((value: PortInfo[]): void => {

		}).catch((reason: any) => { }); */

	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(syncdata);

	// create a new status bar item that we can now manage
	myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	myStatusBarItem.command = myCommandId;
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
		myStatusBarItem.text = `$(megaphone) ${n} line(s) selected`;
		myStatusBarItem.show();
	} else {
		myStatusBarItem.hide();
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
