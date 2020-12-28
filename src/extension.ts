import * as vscode from 'vscode';
import { RunOnSaveExtExtension } from "./runner";
import { Executor } from "./executor";

export function activate(context: vscode.ExtensionContext): void {

	let extension = new RunOnSaveExtExtension(context);
	extension.showOutputMessage();

	if ("onDidCloseTerminal" in vscode.window as any) {
		(vscode.window as any).onDidCloseTerminal((terminal) => {
			Executor.onDidCloseTerminal(terminal)
		});
	}

	let document = vscode.window.activeTextEditor.document;
	let watchers = extension.watch(document);

	vscode.workspace.onDidChangeConfiguration(() => {
		let disposeStatus = extension.showStatusMessage('Run On Save Ext: Reloading config.');
		extension.loadConfig();
		disposeStatus.dispose();
		watchers.forEach(e => {
			e.dispose();
		});
		// rerun watchers after config load
		watchers = extension.watch(document);
	});

	vscode.commands.registerCommand('extension.saveAndRunExt.enable', () => {
		extension.isEnabled = true;
		watchers.forEach(e => {
			e.dispose();
		});
		watchers = extension.watch(document);
	});

	vscode.commands.registerCommand('extension.saveAndRunExt.disable', () => {
		extension.isEnabled = false;
		watchers.forEach(e => {
			e.dispose();
		});
	});

	vscode.commands.registerCommand("extension.saveAndRunExt.execute", () => {
		document.save();
		extension.runCommands(document, true);
	});


	vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		extension.runCommands(document, false);
	});
}
