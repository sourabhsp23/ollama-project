import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface OllamaResponse {
    response: string;
    done: boolean;
}

export class CodeMITRAProvider {
    private static instance: CodeMITRAProvider;
    private context: vscode.ExtensionContext;
    private chatHistory: ChatMessage[] = [];
    private panel: vscode.WebviewPanel | undefined;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): CodeMITRAProvider {
        if (!CodeMITRAProvider.instance) {
            CodeMITRAProvider.instance = new CodeMITRAProvider(context);
        }
        return CodeMITRAProvider.instance;
    }

    public async askQuestion() {
        const question = await vscode.window.showInputBox({
            prompt: 'Ask CodeMITRA a question:',
            placeHolder: 'e.g., How do I implement a binary search?'
        });

        if (question) {
            await this.processQuery(question);
        }
    }

    public async explainCode() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found. Please select some code first.');
            return;
        }

        const selection = editor.selection;
        const code = editor.document.getText(selection);
        
        if (!code.trim()) {
            vscode.window.showWarningMessage('Please select some code to explain.');
            return;
        }

        const prompt = `Please explain this code:\n\n${code}`;
        await this.processQuery(prompt);
    }

    public async generateCode() {
        const description = await vscode.window.showInputBox({
            prompt: 'Describe the code you want to generate:',
            placeHolder: 'e.g., A function to sort an array using quicksort'
        });

        if (description) {
            const prompt = `Generate code for: ${description}`;
            await this.processQuery(prompt);
        }
    }

    private async processQuery(prompt: string) {
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CodeMITRA is thinking...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });

                // Add user message to history
                this.chatHistory.push({ role: 'user', content: prompt });

                // Truncate history if needed
                const maxHistory = vscode.workspace.getConfiguration('codemitra').get('maxHistory', 6);
                if (this.chatHistory.length > maxHistory * 2) {
                    this.chatHistory = this.chatHistory.slice(-maxHistory * 2);
                }

                // Build the full prompt
                const systemPrompt = `SYSTEM: You are a code teaching assistant named CodeMITRA created by SOURABH. Answer code-related questions clearly, give examples, and show runnable snippets where useful.`;
                
                let fullPrompt = systemPrompt + '\n\n';
                for (const msg of this.chatHistory) {
                    const role = msg.role === 'user' ? 'User' : 'Assistant';
                    fullPrompt += `${role}: ${msg.content}\n`;
                }
                fullPrompt += 'Assistant:';

                progress.report({ increment: 50 });

                // Call Ollama
                const response = await this.callOllama(fullPrompt);
                
                progress.report({ increment: 100 });

                if (response.success) {
                    this.chatHistory.push({ role: 'assistant', content: response.response });
                    this.showResponse(prompt, response.response);
                } else {
                    vscode.window.showErrorMessage(`Error: ${response.response}`);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to process query: ${error}`);
        }
    }

    private async callOllama(prompt: string): Promise<{ success: boolean; response: string }> {
        return new Promise((resolve) => {
            const config = vscode.workspace.getConfiguration('codemitra');
            const ollamaUrl = config.get('ollamaUrl', 'http://localhost:11434');
            const modelName = config.get('modelName', 'codeMITRA');

            const url = new URL('/api/generate', ollamaUrl);
            
            const postData = JSON.stringify({
                model: modelName,
                prompt: prompt,
                stream: false,
                temperature: 0.2
            });

            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response: OllamaResponse = JSON.parse(data);
                        resolve({
                            success: true,
                            response: response.response || 'No response from model'
                        });
                    } catch (error) {
                        resolve({
                            success: false,
                            response: `Failed to parse response: ${error}`
                        });
                    }
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    response: `Request failed: ${error.message}`
                });
            });

            req.write(postData);
            req.end();
        });
    }

    private showResponse(question: string, answer: string) {
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'codemitraChat',
                'CodeMITRA Chat',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }

        const html = this.getWebviewContent(question, answer);
        this.panel.webview.html = html;
    }

    private getWebviewContent(question: string, answer: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CodeMITRA Chat</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .chat-container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .message {
                        margin-bottom: 20px;
                        padding: 15px;
                        border-radius: 8px;
                    }
                    .user-message {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        margin-left: 20px;
                    }
                    .assistant-message {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-left: 4px solid var(--vscode-button-background);
                    }
                    .message-header {
                        font-weight: bold;
                        margin-bottom: 8px;
                        font-size: 14px;
                    }
                    .message-content {
                        line-height: 1.5;
                        white-space: pre-wrap;
                    }
                    .code-block {
                        background-color: var(--vscode-textBlockQuote-background);
                        padding: 10px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        margin: 10px 0;
                        overflow-x: auto;
                    }
                    h1 {
                        color: var(--vscode-button-background);
                        text-align: center;
                        margin-bottom: 30px;
                    }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <h1>🤖 CodeMITRA Chat</h1>
                    
                    <div class="message user-message">
                        <div class="message-header">You:</div>
                        <div class="message-content">${this.escapeHtml(question)}</div>
                    </div>
                    
                    <div class="message assistant-message">
                        <div class="message-header">CodeMITRA:</div>
                        <div class="message-content">${this.formatResponse(answer)}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private formatResponse(text: string): string {
        // Simple code block detection and formatting
        return text
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<div class="code-block">$2</div>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeMITRA extension is now active!');

    const codemitra = CodeMITRAProvider.getInstance(context);

    // Register commands
    const askQuestion = vscode.commands.registerCommand('codemitra.askQuestion', () => {
        codemitra.askQuestion();
    });

    const explainCode = vscode.commands.registerCommand('codemitra.explainCode', () => {
        codemitra.explainCode();
    });

    const generateCode = vscode.commands.registerCommand('codemitra.generateCode', () => {
        codemitra.generateCode();
    });

    context.subscriptions.push(askQuestion, explainCode, generateCode);

    // Show welcome message
    vscode.window.showInformationMessage('CodeMITRA is ready! Use the command palette to ask questions or explain code.');
}

export function deactivate() {
    // Cleanup if needed
}
