import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class DepNodeProvider implements vscode.TreeDataProvider<Archivo> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Archivo | undefined | void
  > = new vscode.EventEmitter<Archivo | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<
    Archivo | undefined | void
  > = this._onDidChangeTreeData.event

  private _list: string[] = [];

  constructor(private workspaceRoot: string | undefined) {

  }
  public updateList(data: string[]) {
    this._list = [];
    data.forEach(element => {
      this._list.push(element.trim());
    });

    this.refresh();

  }
  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: Archivo): vscode.TreeItem {
    return element
  }

  getChildren(element?: Archivo): Thenable<Archivo[]> {
    return Promise.resolve(this.getDepsInPackageJson())
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(): Archivo[] {
    let list: Archivo[] = []
    this._list.forEach(element => {
      list.push(
        new Archivo(element, vscode.TreeItemCollapsibleState.None),
      );
    });



    return list
  }

}

export class Archivo extends vscode.TreeItem {
  constructor(
    public readonly path: string /**Nombre de archivo completo desde la base root */,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState /**Requerido por el sistema */,
  ) {
    super(path, collapsibleState)

    this.tooltip = `${this.label}`
    /* this.command = {
      command: "fileList.obtener",
      title: "",
      arguments: [path]
    } */

  }

  contextValue = 'archivo'
}
