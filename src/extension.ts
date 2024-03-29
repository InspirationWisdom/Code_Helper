import * as vscode from 'vscode';
import OpenAI from "openai";
import * as dotenv from 'dotenv';
dotenv.config();
 


export function activate(context: vscode.ExtensionContext) {

    let fixedCode = "No answer found";
    console.log('Extension activated.');
    const openai = new OpenAI({apiKey: ''});
    
    async function getAnswer(text: String, error: String, activeEditor: vscode.TextEditor, fixRange: vscode.Range, fullText: String) {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Here is a line of code, the code content is '" + text + "', the error message is '" + error + "', and the full code text is '" + fullText + "'. Please make sure your answer is based on the context provided and contains the TEXT of the correct code ONLY" }],
            model: "gpt-3.5-turbo",
        });

        completion.choices[0].message.content ? fixedCode = completion.choices[0].message.content : fixedCode = "No answer found";
        
        vscode.window.showInformationMessage('The original code is \'' + text + '\' and' 
                                            + 'your fixed code is \'' + fixedCode + 
                                            '\', would you like to proceed the change?', 'Yes', 'No').then(selection => {
            // Handle the selection
            if (selection === 'Yes') {
                // User selected 'Yes'
                activeEditor.edit(editBuilder => {
                    console.log('fix range');
                    console.log(fixRange);
                    fixRange = new vscode.Range(fixRange.start.translate(0, fixRange.start.character * (-1)), fixRange.end.translate(0, 0));
                    console.log('fixed code');
                    console.log(fixedCode);
                    editBuilder.replace(fixRange, fixedCode);
                    editBuilder.insert(fixRange.start.translate(0, 30), " #" + error + "  ");
                });
            } else {
              // User selected 'No' or closed the prompt

            }
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
                'There are ' + diagnostics.length + ' errors in your code, do you wish Code Helper to fix it?',
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
                        const document = activeEditor.document;
                        const fullText = document.getText();
                        
                        console.log('error range');
                        console.log(errorRange);

                        const selectedTextRange = new vscode.Range(errorRange.start.translate(0, errorRange.start.character * (-1)), errorRange.end.translate(-1, 50));
                        const fixRange = new vscode.Range(errorRange.start.translate(0, 0), errorRange.end.translate(-1, 50));
            
                        const selectedText = activeEditor.document.getText(selectedTextRange);
                        
                        console.log('selected text range');
                        console.log(selectedTextRange);
                        console.log('selected text'); 
                        console.log(selectedText);
                        getAnswer(selectedText, errorText, activeEditor, fixRange, fullText);
                    
                        
                        context.subscriptions.push(fixErrorCommand);   
                    });
                } else {
                  // User selected 'No' or closed the prompt

                }
              });
              
        }
    });

    // Set an interval to execute the command every 30 seconds
    let interval = setInterval(() => {
        vscode.commands.executeCommand('code-helper.codeHelper');
    }, 30000);

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
    
        
  
