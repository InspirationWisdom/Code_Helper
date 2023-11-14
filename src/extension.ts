import * as vscode from 'vscode';
import OpenAI from "openai";

export function activate(context: vscode.ExtensionContext) {

    let fixedCode = "No answer found";
    
    console.log('Extension activated.');
    const APIKEY:string = process.env.APIKEY ? process.env.APIKEY : "";
    const openai = new OpenAI({apiKey: "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"});

    async function getAnswer(text: String, error: String, activeEditor: vscode.TextEditor, fixRange: vscode.Range) {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Here is a line of code, the code content is '" + text + "' and the error message is '" + error + "'. Please return the text of the correct code only" }],
            model: "gpt-3.5-turbo",
        });

        completion.choices[0].message.content ? fixedCode = completion.choices[0].message.content : fixedCode = "No answer found";
        
        activeEditor.edit(editBuilder => {
            console.log(fixRange);
            // fixRange = new vscode.Range(fixRange.start.translate(1, 0), fixRange.end.translate(-1, 50));
            console.log(fixedCode);
            editBuilder.replace(fixRange, fixedCode);
            editBuilder.insert(fixRange.start.translate(1, 30), " #" + error + "  ");
        });
    }
    
    let fixErrorCommand = vscode.commands.registerCommand('code-helper.helloWorld', () => {
        
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return;
        }
        vscode.window.showInformationMessage('script is running');
        const diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
        
        diagnostics.forEach(diagnostic => {
            
            console.log(diagnostic);
            const errorRange = diagnostic.range;
            const errorText = diagnostic.message;
            
            const fixRange = new vscode.Range(errorRange.start.translate(-1, 0), errorRange.end.translate(-1, 50));

            const selectedText = activeEditor.document.getText(fixRange);

            console.log(selectedText);

            getAnswer(selectedText, errorText, activeEditor, fixRange);
        
            
            context.subscriptions.push(fixErrorCommand);   
        });
    });
}

export function deactivate() {
    console.log('Extension deactivated.');
}
    
        
  
