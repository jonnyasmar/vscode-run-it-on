## Run It On!
[![vsm-version](https://img.shields.io/visual-studio-marketplace/v/fsevenm.run-it-on?style=flat-square&label=VS%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=fsevenm.run-it-on) [![vsm-installs](https://img.shields.io/visual-studio-marketplace/i/fsevenm.run-it-on?style=flat-square&label=installs&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=fsevenm.run-it-on) [![Apache License](https://img.shields.io/badge/license-Apache%202.0-orange.svg?style=flat-square)](http://www.apache.org/licenses/LICENSE-2.0)

> Run terminal or VS Code commands on save or watched files changed

Fork from [vscode-save-and-run-ext](https://github.com/padjon/vscode-save-and-run-ext)

`UPDATE` The original version seems not updated and no longer works as it should. This fork is the updated one and also adds new feature named *watchers*, that will allow it to just watch file (s) change then once the matched files changed, it will run the command.

![](https://github.com/wk-j/vscode-save-and-run/raw/master/images/save-and-run.png)

## Features

- Configure multiple commands (terminal or command from VSCode/extension) that run when a file is saved.
- Regex pattern matching for files that trigger commands running.
- `NEW` watch files' changes then run a command.

## Note

- Commands only get run when saving an existing file. Creating new files, and `Save as...` don't trigger the commands.
- Property `match` on watchers config uses [globPattern](https://code.visualstudio.com/api/references/vscode-api#GlobPattern) NOT regex.

## Configuration

Add `runItOn` configuration to user or workspace settings.

- **`commands`** - array of commands that will be run whenever a file is saved.
  - `match` - a regex for matching which files to run commands on. Default `.*`.
  - `cmd` - command to execute on save. Can include parameters that will be replaced at runtime (see [Placeholder Tokens](#placeholder-tokens) section below). Default `echo ${file}`.
  - `isAsync` - run command asynchronously. Default `false`.
  - `isShellCommand` - run command in terminal. Default `true`.
  - `useShortcut` - only execute when press shortcut keys `Ctrl/Command + Shift + R`. Default `false`.
  - `silent` - suppress terminal when command is executing.
- **`watchers`** - array of commands that will be run whenever matching files changed.
  - `match` - a [globPattern](https://code.visualstudio.com/api/references/vscode-api#GlobPattern) for matching which files to run commands on. Default `**/*.*`.
  - `cmd` - command to execute when matching files have changed. Can include parameters that will be replaced at runtime (see [Placeholder Tokens](#placeholder-tokens) section below). Default `echo ${file}`.
  - `isAsync` - run command asynchronously. Default `false`.
  - `isShellCommand` - run command in terminal. Default `true`.
  - `silent` - command to execute when matching files have changed.

### Sample Config

```json
"runItOn": {
	"commands": [
		{
			"match": ".*",
			"isShellCommand" : false,
			"cmd": "myExtension.amazingCommand"
		},
		{
			"match": "\\.txt$",
			"cmd": "echo 'Executed in the terminal: I am a .txt file ${file}.'"
		}
	],
	"watchers": [
		{
			"match": "**/*.js",
			"cmd": "echo 'Changes detected on js files.'"
		}
	]
}
```

## Commands

The following commands are exposed in the command palette

- `Run It On! : Enable` to enable Run It On!
- `Run It On! : Disable` to disable Run It On!
- `Run It On! : Execute` to force executing `save` then `run` on matching files. This has no effect to watchers.

## Placeholder Tokens

Commands support placeholders similar to tasks.json.

- `${workspaceRoot}`: workspace root folder
- `${workspaceFolder}`: the path of the folder opened in VS Code
- `${file}`: path of saved file
- `${relativeFile}`: relative path of saved file
- `${fileBasename}`: saved file's basename
- `${fileDirname}`: directory name of saved file
- `${fileExtname}`: extension (including .) of saved file
- `${fileBasenameNoExt}`: saved file's basename without extension
- `${cwd}`: current working directory

### Environment Variable Tokens

- `${env.Name}`

## Todo

- [ ] Update the preview image

## License

[Apache](https://github.com/padjon/vscode-save-and-run-ext/blob/master/LICENSE)
