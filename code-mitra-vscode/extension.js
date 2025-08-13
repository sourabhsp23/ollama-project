const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

function activate(context) {
    context.subscriptions.push(
        vscode.commands.registerCommand("codemitra.start", () => {
            const panel = vscode.WebviewPanel(
                "codemitra",
                "CodeMITRA",
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            const htmlPath = path.join(context.extensionPath, "webview", "index.html");
            panel.webview.html = fs.readFileSync(htmlPath, "utf8");
        })
    );
}

function deactivate() {}

module.exports = { activate, deactivate };
