import * as vscode from 'vscode';
import * as dotenv from 'dotenv';
dotenv.config();
 
const { GoogleGenerativeAI } = require("@google/generative-ai");

export async function activate(context: vscode.ExtensionContext) {

    let fixedCode = "No answer found";
    console.log('Extension activated.');
    const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    async function getAnswer(text: String, error: String, activeEditor: vscode.TextEditor, fixRange: vscode.Range, fullText: String) {
        const prompt = "Here is a line of python code: " + text + "', it has an error and the error message is '" + error + "', the full code text is here: '" + fullText + "'. Please fix it and make sure your answer is based on the context provided and contains ONLY ONE LINE of the CORRECTED PYTHON code, nothing else";
        const result = await model.generateContent(prompt);
        var resultText = result.response.text();
        console.log("Gemini response: \n" + resultText);
        // 按行分割
        const lines = resultText.trim().split('\n');
        lines.length === 1 ? resultText = lines[0] : resultText = lines[1];
        if (resultText[0] === '`') {
            resultText = resultText.slice(1, -1);
        }
        resultText ? fixedCode = resultText : fixedCode = "No answers found";
        console.log("Gemini response: \n" + fixedCode);
        
        vscode.window.showInformationMessage('The original code is \'' + text + '\' and' 
                                            + 'your fixed code is \'' + fixedCode + 
                                            '\', would you like to proceed the change?', 'Yes', 'No').then(selection => {
            // Handle the selection
            if (selection === 'Yes') {
                // User selected 'Yes'
                activeEditor.edit(editBuilder => {
                    console.log('fix range');
                    console.log(fixRange);
                    console.log('fixed code');
                    console.log(fixedCode);
                    editBuilder.delete(fixRange);
                    editBuilder.insert(fixRange.start, fixedCode);
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

                        const selectedTextRange = new vscode.Range(errorRange.start.translate(0, -errorRange.start.character), errorRange.end.translate(0, 50));
                        const fixRange = new vscode.Range(selectedTextRange.start, selectedTextRange.end);

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
    }, 20000);

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
    
        
  
