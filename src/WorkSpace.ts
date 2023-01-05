import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";

const constante = require("./constantes");

export class MPWorkspace {
    static get rootPath() {

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return undefined;
        }

        for (const workspaceFolder of workspaceFolders) {
            const workspaceFolderPath = workspaceFolder.uri.fsPath;
            const arduinoConfigPath = path.join(workspaceFolderPath, constante.CONFIG_FILE);
            if (fs.existsSync(arduinoConfigPath)) {
                return workspaceFolderPath;
            }
        }
        return workspaceFolders[0].uri.fsPath;
    }
}
