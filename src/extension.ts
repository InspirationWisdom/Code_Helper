import * as vscode from 'vscode';
import OpenAI from "openai";

export function activate(context: vscode.ExtensionContext) {

    let fixedCode = "No answer found";
    
    console.log('Extension activated.');
    const openai = new OpenAI({apiKey: process.env.APIKEY});

    async function getAnswer(text: String, error: String, activeEditor: vscode.TextEditor, fixRange: vscode.Range) {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Here is a line of code, the code content is '" + text + "' and the error message is '" + error + "'. Please return the correct code only" }],
            model: "gpt-3.5-turbo",
        });

        completion.choices[0].message.content ? fixedCode = completion.choices[0].message.content : fixedCode = "No answer found";
        console.log(fixedCode);

        activeEditor.edit(editBuilder => {
            editBuilder.replace(fixRange, fixedCode);
            editBuilder.insert(fixRange.start.translate(0, 30), "//" + error + "  ");
        });
    }
    
    let fixErrorCommand = vscode.commands.registerCommand('fixerrordemo1.helloWorld', () => {
        
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
    
        
  
