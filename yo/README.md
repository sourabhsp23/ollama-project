# CodeMITRA - AI Code Teaching Assistant

A powerful VS Code extension that brings AI-powered code teaching assistance directly into your editor. Powered by Ollama and your custom CodeMITRA model.

## Features

- 🤖 **Ask Questions**: Get instant answers to coding questions
- 📝 **Explain Code**: Select code and get detailed explanations
- 🚀 **Generate Code**: Describe what you need and get working code
- 💬 **Chat Interface**: Beautiful chat interface for conversations
- ⚙️ **Configurable**: Customize Ollama server and model settings
- 🔄 **Conversation History**: Maintains context across multiple questions

## Prerequisites

1. **Ollama**: Make sure you have Ollama installed and running
2. **CodeMITRA Model**: Your custom model should be built and available

### Installing Ollama

Visit [ollama.ai](https://ollama.ai) and follow the installation instructions for your platform.

### Building the CodeMITRA Model

Make sure your `modelfile` is in place and build the model:

```bash
ollama create codeMITRA -f modelfile
ollama pull codeMITRA
```

## Installation

1. Clone or download this extension
2. Open the `yo` folder in VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and run "Developer: Reload Window"
4. The extension should now be active

## Usage

### Commands

The extension provides three main commands accessible via the Command Palette (`Ctrl+Shift+P`):

1. **CodeMITRA: Ask a Question** - Ask any coding-related question
2. **CodeMITRA: Explain Selected Code** - Select code and get an explanation
3. **CodeMITRA: Generate Code** - Describe what you need and get code

### How to Use

#### Asking Questions
1. Press `Ctrl+Shift+P` and type "CodeMITRA: Ask a Question"
2. Enter your question in the input box
3. Wait for CodeMITRA to respond
4. View the response in the chat panel

#### Explaining Code
1. Select the code you want explained in your editor
2. Press `Ctrl+Shift+P` and type "CodeMITRA: Explain Selected Code"
3. CodeMITRA will analyze the selected code and provide an explanation

#### Generating Code
1. Press `Ctrl+Shift+P` and type "CodeMITRA: Generate Code"
2. Describe what you need (e.g., "A function to sort an array using quicksort")
3. CodeMITRA will generate the requested code

## Configuration

You can customize the extension behavior in VS Code settings:

1. Press `Ctrl+,` to open Settings
2. Search for "CodeMITRA"
3. Configure the following options:

- **Ollama URL**: The URL of your Ollama server (default: `http://localhost:11434`)
- **Model Name**: The name of your Ollama model (default: `codeMITRA`)
- **Max History**: Maximum conversation history to keep (default: 6)

## Development

### Building the Extension

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run compile
   ```

3. For development with auto-reload:
   ```bash
   npm run watch
   ```

### Project Structure

```
yo/
├── src/
│   └── extension.ts      # Main extension logic
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **"Request failed" error**: Make sure Ollama is running and accessible
2. **"No response from model"**: Check if your model name is correct
3. **Extension not activating**: Try reloading the window or checking the console

### Debug Mode

To enable debug mode:
1. Press `Ctrl+Shift+P` and run "Developer: Toggle Developer Tools"
2. Check the Console tab for any error messages

## Contributing

Feel free to submit issues and enhancement requests!

## License

This extension is created by SOURABH for educational purposes.

---

**Happy Coding with CodeMITRA! 🚀**
