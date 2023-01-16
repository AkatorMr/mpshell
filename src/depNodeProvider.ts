import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class DepNodeProvider implements vscode.TreeDataProvider<Dependency> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Dependency | undefined | void
  > = new vscode.EventEmitter<Dependency | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<
    Dependency | undefined | void
  > = this._onDidChangeTreeData.event

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    return Promise.resolve(this.getDepsInPackageJson())
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(): Dependency[] {
    let list: Dependency[] = []

    list.push(
      new Dependency('Hola', 'una', vscode.TreeItemCollapsibleState.None),
    )
    list.push(
      new Dependency('Que', 'dos', vscode.TreeItemCollapsibleState.None),
    )
    list.push(
      new Dependency('Tal', 'tres', vscode.TreeItemCollapsibleState.None),
    )

    return list
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p)
    } catch (err) {
      return false
    }

    return true
  }
}

export class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
  ) {
    super(label, collapsibleState)

    this.tooltip = `${this.label}-${this.version}`
    this.description = this.version
  }

  iconPath = {
    light: path.join(
      __filename,
      '..',
      '..',
      'resources',
      'light',
      'dependency.svg',
    ),
    dark: path.join(
      __filename,
      '..',
      '..',
      'resources',
      'dark',
      'dependency.svg',
    ),
  }

  contextValue = 'dependency'
}
