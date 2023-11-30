import * as vscode from 'vscode';
import OpenAI from "openai";
require('dotenv').config(); 


export function activate(context: vscode.ExtensionContext) {

    let fixedCode = "No answer found";
    console.log('Extension activated.');
    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    
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
    
    let fixErrorCommand = vscode.commands.registerCommand('code-helper.codeHelper', () => {
        
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return;
        }

        // vscode.window.showInformationMessage('script is running');
        const diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);

        if(diagnostics.length !== 0) {
            vscode.window.showInformationMessage(
                'There is some errors in your code, do you wish Code Helper to fix it?',
                'Yes',
                'No'
              ).then(selection => {
                // Handle the selection
                if (selection === 'Yes') {
                    // User selected 'Yes'
                    diagnostics.forEach(diagnostic => {
            
                        // console.log(diagnostic);
                        const errorRange = diagnostic.range;
                        const errorText = diagnostic.message;
                        
                        const selectedTextRange = new vscode.Range(errorRange.start.translate(-1, 0), errorRange.end.translate(-1, 50));
                        const fixRange = new vscode.Range(errorRange.start.translate(0, 0), errorRange.end.translate(-1, 50));
            
                        const selectedText = activeEditor.document.getText(selectedTextRange);
            
                        // console.log(selectedText);
            
                        getAnswer(selectedText, errorText, activeEditor, fixRange);
                    
                        
                        context.subscriptions.push(fixErrorCommand);   
                    });
                } else {
                  // User selected 'No' or closed the prompt

                }
              });
              
        }
        else{
            vscode.window.showInformationMessage('Yes! There is no error in your code!');
        }
    });

    // Set an interval to execute the command every 5 seconds
    let interval = setInterval(() => {
        vscode.commands.executeCommand('code-helper.codeHelper');
    }, 5000);

    // Ensure to clear the interval when the extension is deactivated
    context.subscriptions.push({
        dispose: () => {
            clearInterval(interval);
        }
    });
}

export function deactivate() {
    console.log('Extension deactivated.');
}
    
        
  
