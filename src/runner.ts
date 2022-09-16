import * as vscode from "vscode";
import * as path from "path";
import { Executor, IExecutable } from "./executor";

export interface ICommand {
  match?: string;
  notMatch?: string;
  cmd: string;
  isAsync: boolean;
  isShellCommand: boolean;
  useShortcut?: boolean;
  silent?: boolean;
}

export interface IWatcher {
  match?: string; // use globPattern, https://code.visualstudio.com/api/references/vscode-api#GlobPattern
  cmd: string;
  isAsync: boolean;
  isShellCommand: boolean;
  silent?: boolean;
}

interface IConfig {
  shell: string;
  autoClearConsole: boolean;
  commands?: Array<ICommand>;
  watchers?: Array<IWatcher>;
}

export class RunOnSaveExtExtension {
  private outputChannel: vscode.OutputChannel;
  private context: vscode.ExtensionContext;
  private config: IConfig;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.outputChannel = vscode.window.createOutputChannel("Run It On!");
    this.loadConfig();
  }

  private runInTerminal(command: ICommand | IWatcher, name: string) {
    const exe: IExecutable = {
      cmd: command.cmd,
      silent: command.silent,
    };

    Executor.runInTerminal(exe, name);
  }

  private runAll(commands: ICommand[], terminalName): void {
    commands.forEach((command) => {
      if (command.isShellCommand) this.runInTerminal(command, terminalName);
      else vscode.commands.executeCommand(command.cmd);
    });
  }

  public get isEnabled(): boolean {
    return !!this.context.globalState.get("isEnabled", true);
  }
  public set isEnabled(value: boolean) {
    this.context.globalState.update("isEnabled", value);
    this.showOutputMessage();
  }

  public get shell(): string {
    return this.config.shell;
  }

  public get autoClearConsole(): boolean {
    return !!this.config.autoClearConsole;
  }

  public get commands(): Array<ICommand> {
    return this.config.commands || [];
  }

  public loadConfig(): void {
    const uri = vscode.window.activeTextEditor.document.uri;
    console.log("uri", uri);
    // @ts-ignore
    let config = vscode.workspace.getConfiguration("", uri);
    let saveAndRunExt = config.get<IConfig>("runItOn");
    this.config = saveAndRunExt;
  }

  public showOutputMessage(message?: string): void {
    message =
      message || `Run It On! ${this.isEnabled ? "enabled" : "disabled"}.`;
    this.outputChannel.appendLine(message);
  }

  public showStatusMessage(message: string): vscode.Disposable {
    this.showOutputMessage(message);
    return vscode.window.setStatusBarMessage(message);
  }

  private findActiveCommands(
    config: IConfig,
    document: vscode.TextDocument,
    onlyShortcut: boolean
  ) {
    let match = (pattern: string) =>
      pattern &&
      pattern.length > 0 &&
      new RegExp(pattern).test(document.fileName);

    let commandConfigs = config.commands.filter((cfg) => {
      let matchPattern = cfg.match || "";
      let negatePattern = cfg.notMatch || "";
      // if no match pattern was provided, or if match pattern succeeds
      let isMatch = matchPattern.length === 0 || match(matchPattern);
      // negation has to be explicitly provided
      let isNegate = negatePattern.length > 0 && match(negatePattern);
      // negation wins over match
      return !isNegate && isMatch;
    });

    if (commandConfigs.length === 0) {
      return [];
    }

    this.showStatusMessage("Running on save commands...");

    // build our commands by replacing parameters with values
    let commands: ICommand[] = [];
    for (let cfg of commandConfigs) {
      let cmdStr = cfg.cmd;
      let extName = path.extname(document.fileName);

      const rootFolder = this.getWorkspaceFolder();
      console.log("rootFolder", rootFolder);
      const root = rootFolder.path;

      let relativeFile = "." + document.fileName.replace(root, "");
      cmdStr = cmdStr.replace(/\${relativeFile}/g, relativeFile);
      cmdStr = cmdStr.replace(/\${workspaceFolder}/g, root);
      cmdStr = cmdStr.replace(/\${file}/g, `${document.fileName}`);
      cmdStr = cmdStr.replace(/\${workspaceRoot}/g, root);
      cmdStr = cmdStr.replace(
        /\${fileBasename}/g,
        `${path.basename(document.fileName)}`
      );
      cmdStr = cmdStr.replace(
        /\${fileDirname}/g,
        `${path.dirname(document.fileName)}`
      );
      cmdStr = cmdStr.replace(/\${fileExtname}/g, `${extName}`);
      cmdStr = cmdStr.replace(
        /\${fileBasenameNoExt}/g,
        `${path.basename(document.fileName, extName)}`
      );
      cmdStr = cmdStr.replace(/\${cwd}/g, `${process.cwd()}`);

      // replace environment variables ${env.Name}
      cmdStr = cmdStr.replace(
        /\${env\.([^}]+)}/g,
        (sub: string, envName: string) => {
          return process.env[envName];
        }
      );
      commands.push({
        cmd: cmdStr,
        silent: cfg.silent,
        isAsync: !!cfg.isAsync,
        useShortcut: cfg.useShortcut,
        isShellCommand: !!(cfg.isShellCommand === false ? false : true),
      });
    }

    if (onlyShortcut) {
      return commands.filter((x) => x.useShortcut === true);
    } else {
      return commands.filter((x) => x.useShortcut !== true);
    }
  }

  public runCommands(
    document: vscode.TextDocument,
    onlyShortcut: boolean
  ): void {
    if (this.autoClearConsole) {
      this.outputChannel.clear();
    }

    let commands = this.findActiveCommands(this.config, document, onlyShortcut);

    if (!this.isEnabled || this.commands.length === 0) {
      this.showStatusMessage("");
      this.showOutputMessage();
      return;
    }

    let terminalName = this.getWorkspaceFolder().name;
    this.runAll(commands, `Run ${terminalName}`);
    this.showStatusMessage("");
  }

  private getWorkspaceFolder() {
    const editor = vscode.window.activeTextEditor;
    const resource = editor.document.uri;
    // @ts-ignore
    const rootFolder = vscode.workspace.getWorkspaceFolder(resource);
    return rootFolder;
  }

  private findAllWatchers(config: IConfig, document: vscode.TextDocument) {
    let watcherConfigs: IWatcher[] = config.watchers || [];

    if (watcherConfigs.length <= 0) return [];

    let watchers: IWatcher[] = [];
    for (let cfg of watcherConfigs) {
      let cmdStr = cfg.cmd;
      let extName = path.extname(document.fileName);

      const rootFolder = this.getWorkspaceFolder();
      const root = rootFolder.path;

      let relativeFile = "." + document.fileName.replace(root, "");
      cmdStr = cmdStr.replace(/\${relativeFile}/g, relativeFile);
      cmdStr = cmdStr.replace(/\${workspaceFolder}/g, root);
      cmdStr = cmdStr.replace(/\${file}/g, `${document.fileName}`);
      cmdStr = cmdStr.replace(/\${workspaceRoot}/g, root);
      cmdStr = cmdStr.replace(
        /\${fileBasename}/g,
        `${path.basename(document.fileName)}`
      );
      cmdStr = cmdStr.replace(
        /\${fileDirname}/g,
        `${path.dirname(document.fileName)}`
      );
      cmdStr = cmdStr.replace(/\${fileExtname}/g, `${extName}`);
      cmdStr = cmdStr.replace(
        /\${fileBasenameNoExt}/g,
        `${path.basename(document.fileName, extName)}`
      );
      cmdStr = cmdStr.replace(/\${cwd}/g, `${process.cwd()}`);

      // replace environment variables ${env.Name}
      cmdStr = cmdStr.replace(
        /\${env\.([^}]+)}/g,
        (sub: string, envName: string) => {
          return process.env[envName];
        }
      );
      watchers.push({
        cmd: cmdStr,
        silent: cfg.silent,
        isAsync: !!cfg.isAsync,
        isShellCommand: !!(cfg.isShellCommand === false ? false : true),
        match: cfg.match,
      });
    }
    return watchers;
  }

  public watch(document: vscode.TextDocument): vscode.FileSystemWatcher[] {
    const watcherConfigs = this.findAllWatchers(this.config, document);

    let terminalName = this.getWorkspaceFolder().name;
    let watchers = [];

    watcherConfigs.forEach((watcherConfig) => {
      const watcher = vscode.workspace.createFileSystemWatcher(
        watcherConfig.match
      );

      watcher.onDidChange((e) => {
        if (watcherConfig.isShellCommand)
          this.runInTerminal(watcherConfig, terminalName);
        else vscode.commands.executeCommand(watcherConfig.cmd);
      });

      watchers.push(watcher);
    });

    return watchers;
  }
}
