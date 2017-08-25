import * as vscode from 'vscode';
import { RunOnSaveExtExtension } from "./runner";

export function activate(context: vscode.ExtensionContext): void {

	var extension = new RunOnSaveExtExtension(context);
	extension.showOutputMessage();

	vscode.workspace.onDidChangeConfiguration(() => {
		let disposeStatus = extension.showStatusMessage('Run On Save Ext: Reloading config.');
		extension.loadConfig();
		disposeStatus.dispose();
	});

	vscode.commands.registerCommand('extension.saveAndRunExt.enable', () => {
		extension.isEnabled = true;
	});

	vscode.commands.registerCommand('extension.saveAndRunExt.disable', () => {
		extension.isEnabled = false;
	});

	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		extension.runCommands(document);
	});
}
