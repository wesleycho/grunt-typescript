///<reference path="../typings/gruntjs/gruntjs.d.ts" />
///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/q/Q.d.ts" />
///<reference path="../typings/typescript/tsc.d.ts" />

///<reference path="./option.ts" />
///<reference path="./host.ts" />
///<reference path="./io.ts" />

module GruntTs{

    var Q = require("q");

    export function execute(options: GruntOptions, host: GruntHost): Q.Promise<any>{

        return Q.Promise((resolve: (val: any) => void, reject: (val: any) => void, notify: (val: any) => void) => {
            var start = Date.now(),
                program = ts.createProgram(options.targetFiles(), options, host),
                errors: ts.Diagnostic[] = program.getDiagnostics();

            if(writeDiagnostics(errors)){
                reject(false);
                return;
            }

            var checker = program.getTypeChecker(/*fullTypeCheckMode*/ true);
            errors = checker.getDiagnostics();

            if(writeDiagnostics(errors, !!options.ignoreError)){
                if(!options.ignoreError){
                    reject(false);
                    return;
                }
            }

            var emitOutput = checker.emitFiles();
            var emitErrors = emitOutput.errors;
            if(writeDiagnostics(emitErrors)){
                reject(false);
                return;
            }

            host.writeResult(Date.now() - start);
            resolve(true);

        });

    }

    function writeDiagnostics(diags: ts.Diagnostic[],isWarn: boolean = false): boolean{
        diags.forEach((d) => {
            var output = "";
            if (d.file) {
                var loc = d.file.getLineAndCharacterFromPosition(d.start);
                output += d.file.filename + "(" + loc.line + "," + loc.character + "): ";
            }
            var category = ts.DiagnosticCategory[d.category].toLowerCase();
            output += category + " TS" + d.code + ": " + d.messageText;
            if(isWarn){
                util.writeWarn(output);
            }else{
                util.writeError(output);
            }
        });
        return !!diags.length;
    }

}