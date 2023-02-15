
import { EventEmitter } from "stream";
import { InterByteTimeoutParser, SerialPort } from "serialport";
import * as path from 'path';

import * as fs from 'fs'


export class Dispositivo extends EventEmitter {

    private port: SerialPort;
    private last: number = 0;
    private readyToReceive = false;
    private lstEvent = new EventEmitter();

    private onReadyQueqe: Array<Function> = new Array<Function>();

    private readyRaw = false;
    private readyExitRaw = false;
    private onReadyRaw = new Array<Function>();

    private waitingFor: Function = (data: string) => { };
    private flagUno: boolean = false;

    private bufferCompleto: Buffer = Buffer.alloc(100 * 1024);
    private offset: number = 0;


    constructor(_port: SerialPort) {
        super();
        this.port = _port;

        //let parse = this.port.pipe(new ByteLengthParser({ length: 1 }));

        //Cada 30 ms enviar los datos a precesar
        let parse = this.port.pipe(
            new InterByteTimeoutParser({ interval: 30 })
        );

        /* let onlyRaw = parse.pipe(
            new RegexParser({ regex: />OK.+/ })
        );
 */
        let self = this;

        this.onData = this.onData.bind(this);
        this.onReady = this.onReady.bind(this);
        this.onRaw = this.onRaw.bind(this);
        this.OnExitRaw = this.OnExitRaw.bind(this);
        this.onOnlyRaw = this.onOnlyRaw.bind(this);
        this.FinDeCadena = this.FinDeCadena.bind(this);

        parse.on("data", this.onData)


        this.lstEvent.on("onReady", this.onReady);
        this.lstEvent.on("onRaw", this.onRaw);
        this.lstEvent.on("OnExitRaw", this.OnExitRaw);
        this.lstEvent.on("OnOnlyRaw", this.onOnlyRaw);
        this.lstEvent.on("FinDeCadena", this.FinDeCadena);

        this.onReadyQueqe = new Array<Function>();
        /* 
                this.port.open();
        
                setTimeout(() => {
                    this.port.close();
                }, 3000); */
    }

    private FinDeCadena() {
        this.port.write([0x0a]);
    }

    public openPort() {
        this.port.open();
    }

    public closePort() {
        this.flagUno = false;
        this.bufferCompleto.fill('\0');
        this.offset = 0;
        this.port.close();
    }
    /** Listeners */

    /** */
    private onOnlyRaw(arg1: Buffer) {
        console.log("this.offset", this.offset);
        //
        //console.log("OnlyRaw", arg0.toString());

        let arg0 = Buffer.alloc(this.offset);
        this.offset = 0;

        let localOffset = 0;
        for (let i = 0; i < arg1.length; i++) {
            let b = arg1.readInt8(i);
            if (b != 64) {
                arg0.writeUInt8(b, localOffset);
                localOffset++;
            }
        }
        console.log(localOffset);

        let arg3 = Buffer.alloc(localOffset);
        arg0.copy(arg3, 0, 0, localOffset);

        const str = arg3.toString();

        //console.log(str);

        let hex = str.split(/(?=(?:..)*$)/);

        let result = "";
        if (localOffset % 2 == 0)
            hex.forEach(element => {
                result += String.fromCharCode(parseInt("0x" + element));
                //console.log(element);
                return;
            });

        //console.log(result);

        this.waitingFor(result);

    }

    private onReady() {
        if (this.onReadyQueqe == undefined) {
            console.log("Undefined");

            return;
        }
        //console.log(this.onReadyQueqe.length);
        if (this.onReadyQueqe.length > 0) {
            let cb = this.onReadyQueqe.splice(0, 1)[0];
            cb();
        }
    }

    private onRaw() {
        if (this.onReadyRaw == undefined) {
            console.log("Undefined OR");

            return;
        }
        //console.log(this.onReadyQueqe.length);
        while (this.onReadyRaw.length > 0) {
            let cb = this.onReadyRaw.splice(0, 1)[0];
            cb();
        }
    }

    private OnExitRaw() {

    }

    private onData(data: Buffer) {

        //console.log(data);
        this.readyToReceive = checkEnd(
            data,
            Buffer.from([62, 62, 62, 32])
        );
        //console.log(data);
        this.readyRaw = checkEnd(
            data,
            Buffer.from("raw REPL; CTRL-B to exit\r\n>")
        );

        this.readyExitRaw = checkEnd(
            data,
            Buffer.from([0x3e, 0x4f, 0x4b, 0x04, 0x04, 0x3e])
        );

        //console.log(this.readyToReceive);

        if (this.readyToReceive) {
            this.lstEvent.emit("onReady");
        }

        if (this.readyRaw) {
            console.log("OnRaw")
            this.lstEvent.emit("onRaw");
        }
        if (this.readyExitRaw) {
            console.log("OnExitRaw")
            this.lstEvent.emit("OnExitRaw");
        }

        //console.log("Data ", data.toString());
        let uno = checkStart(
            data,
            Buffer.from("OK")
        );
        uno = uno || checkStart(
            data,
            Buffer.from("M")
        );


        if (uno || this.flagUno) {
            if (uno) {
                data = data.subarray(2);
            }
            this.flagUno = true;
            let firstIndex = data.indexOf(Buffer.from([0x04, 0x04, 0x3e]));
            console.log("FirstIndex", firstIndex);
            if (firstIndex > -1) {
                this.flagUno = false;
                const newData = data.subarray(0, firstIndex);

                this.bufferCompleto.write(newData.toString(), this.offset);
                this.offset += newData.length;


                this.lstEvent.emit(
                    "OnOnlyRaw",
                    this.bufferCompleto.subarray(0, this.offset)
                );

            } else {

                this.bufferCompleto.write(data.toString(), this.offset);
                this.offset += data.length;


            }

            if (Contiene(data, "@@@")) {
                this.lstEvent.emit("FinDeCadena");
            }

        }
        //console.log(data.toString());
        //self.port.pause();
        return data;

    }




    private hexlify(data: string): string {
        const change = "0123456789abcdef";

        let buf = Buffer.from(data);

        let ret = Buffer.alloc(data.length * 2);

        for (let i = 0; i < buf.length; i++) {
            let num = buf.readUInt8(i);
            let dig = num % 16;
            num = num - dig;
            num = num / 16;
            //console.log(change.charAt(num), change.charAt(dig));
            ret.write(change.charAt(num), i * 2);
            ret.write(change.charAt(dig), i * 2 + 1);

        }

        return ret.toString();
    }
    /**sendFile
     * @param path del fichero
     * @param contenido del fichero
     */
    public sendFile(path: string, contenido: string) {

        let line: string[] = contenido.split("\n");
        console.log("Antes de enviar");
        this.onReadyRaw.push(
            () => {
                this.port.write("import os");
                this.Enter();
                this.port.write("import ubinascii");
                this.Enter();
                this.port.write("f = open('{0}','wb')".replace("{0}", path))
                this.Enter();

            }
        );

        line.forEach(element => {
            this.onReadyRaw.push(
                () => {
                    let datos = "f.write(ubinascii.unhexlify('" + this.hexlify(element + "\n") + "'))";
                    console.log(datos);
                    this.port.write(datos);
                    this.Enter();
                }
            );
            //Cada 30 lineas enviamos un Ctrl+D para ejecutar esa parte
            if (this.onReadyRaw.length % 30 == 0)
                this.onReadyRaw.push(
                    () => {
                        this.CtrlD();
                    }
                );

        });


        this.onReadyRaw.push(
            () => {

                console.log("Send: Ctrl+D");
                this.port.write("f.close()");
                this.CtrlD();
                this.ExitRawMode();

                this.Enter();
            }
        );



        this.Enter();
        this.CtrlC();
        this.CtrlC();
        this.EnterRawMode();
        console.log("Enviando");
    }

    public deleteFile(fileName: string) {

        this.onReadyRaw.push(
            () => {

                this.port.write("import os");
                this.port.write([13]);
            }
        );
        this.onReadyRaw.push(
            () => {

                this.port.write("os.remove('" + fileName + "')");
                this.port.write([13]);
            }
        );


        this.onReadyRaw.push(
            () => {
                let thePort = this.port;
                console.log("Send: Ctrl+D");
                //this.port.write([127, 13]);
                this.port.write([0x04]);//Ctrl+D
                this.ExitRawMode();

                this.port.write([13]);
            }
        );

        this.waitingFor = (data: string) => {
            //formato: ['foo.barr','bar.py']
            const content = data;

            this.emit("FilesChanges");

        };


        this.port.write('\r');//Enter
        this.port.write([3]);   //Ctrl+C
        this.port.write([3]);//Ctrl+C
        this.EnterRawMode();
    }

    public getFileSize(fileName: string) {

        this.onReadyRaw.push(
            () => {

                this.port.write("import os");
                this.port.write([13]);
                this.port.write("import ubinascii");
                this.port.write([13]);
                this.port.write("sys.stdout.write(ubinascii.hexlify(''+os.stat('" + fileName + "')[6]))");
                this.port.write([13]);
            }
        );

        this.onReadyRaw.push(
            () => {
                let thePort = this.port;
                console.log("Send: Ctrl+D");
                //this.port.write([127, 13]);
                this.port.write([0x04]);//Ctrl+D
                this.ExitRawMode();

                this.port.write([13]);
            }
        );

        this.waitingFor = (data: string) => {
            //formato: ['foo.barr','bar.py']
            const content = data;

            this.emit("FilesChanges");

        };


        this.port.write('\r');//Enter
        this.port.write([3]);   //Ctrl+C
        this.port.write([3]);//Ctrl+C
        this.EnterRawMode();
    }

    public softReset() {
        this.Enter();
        this.CtrlC();
        this.CtrlC();
        this.port.write("machine.soft_reset()\n");

    }

    /**getFile(fileName) 
     * @param fileName Path del fichero que se quiere obtener
     */
    public getFile(fileName: string) {
        //const toSend: string = require("./command/get.file.py");
        const text = fs.readFileSync(path.join(__dirname, './command/get.file.py'), 'utf-8');

        const toSend: string = text;

        let part = "0";
        let line: string[] = toSend.replace("{0}", fileName).replace("{2}", part).replace("{1}", "256").split("\n");

        line.push("get_file2('" + fileName + "')");

        line.forEach(element => {
            this.onReadyRaw.push(
                () => {

                    console.log("Send: ", element);
                    this.port.write(element);
                    this.Enter();
                }
            );
        });

        this.onReadyRaw.push(
            () => {
                this.CtrlD();
                this.ExitRawMode();

                this.Enter();
            }
        );

        this.waitingFor = (data: string) => {
            //formato: ['foo.barr','bar.py']
            const content = data;

            this.emit("FileContent", { path: fileName, contenido: content });

        };


        this.Enter();
        this.CtrlC();
        this.CtrlC();
        this.EnterRawMode();
    }

    /**getFilePart(fileName,part) 
     * @param fileName Path del fichero que se quiere obtener
     * @param part numero que indica la parte
     */
    public getFilePart(fileName: string, part: number) {

        let line: string = ""
        console.log("Part", part);

        line = "get_file_n('" + fileName + "'," + part + ")";

        let thePort = this.port;
        console.log("Send: ", line);
        this.port.write(line);

        this.Enter();
        this.Enter();
        this.CtrlD();
        //this.port.write([127, 13]);



    }

    public getFileNew(fileName: string) {
        //const toSend: string = require("./command/get.file.py");
        const text = fs.readFileSync(path.join(__dirname, './command/get.file.py'), 'utf-8');

        const toSend: string = text;

        let part = "0";
        let line: string[] = toSend.replace("{0}", fileName).replace("{2}", part).replace("{1}", "128").replace("{1}", "128").split("\n");

        line.forEach(element => {
            this.onReadyRaw.push(
                () => {
                    let thePort = this.port;
                    console.log("Send: ", element);
                    this.port.write(element);
                    this.port.write([13]);
                }
            );
        });

        this.onReadyRaw.push(
            () => {

                this.port.write("import os");
                this.port.write([13]);
                this.port.write("import ubinascii");
                this.port.write([13]);
                this.port.write("sys.stdout.write(ubinascii.hexlify(str(os.stat('" + fileName + "')[6])))");
                this.port.write([0x04]);//Ctrl+D
                this.port.write([13]);
            }
        );


        this.waitingFor = (data: string) => {
            //formato: ['foo.barr','bar.py']

            console.log(data);
            if (parseInt(data) <= 512) {
                this.getFile(fileName);
                return;
            }

            //Aca se obtiene el archivo por parte
            let partes = Math.ceil(parseInt(data) / 128);



            this.waitingFor = (data: string) => {
                //formato: ['foo.barr','bar.py']
                const content = data;

                this.emit("FileContent", { path: fileName, contenido: content });

            };
            this.EnterRawMode();
            this.getFilePart(fileName, 0);

        };




        this.Enter();
        this.CtrlC();
        this.CtrlC();
        this.EnterRawMode();
    }

    public listFiles() {
        let toSend: string;

        const text = fs.readFileSync(path.join(__dirname, './command/list.files.py'), 'utf-8');
        toSend = text;

        let line: string[] = toSend.split("\n");


        line.forEach(element => {
            this.onReadyRaw.push(
                () => {

                    console.log("Send: ", element);
                    this.port.write(element);
                    this.port.write([13]);
                }
            );
        });

        this.onReadyRaw.push(
            () => {
                console.log("Send: Ctrl+D");
                //this.port.write([127, 13]);
                this.CtrlD();
                this.ExitRawMode();

                this.port.write([13]);

            }
        );

        this.waitingFor = (data: string) => {
            //formato: ['foo.barr','bar.py']
            /* data = data.substring(1, data.length - 2);
            data = data.replace("'", ""); */
            let list: string[] = data.split(",");
            console.log("waitFor", list);
            this.emit("UpdateListFiles", list);

        };


        this.Enter();
        this.CtrlC();
        this.CtrlC();
        this.EnterRawMode();
    }

    /**Control function */
    private ExitRawMode() {
        this.port.write("\r\x02"); // Ctrl + B - para salir del modo raw
    }

    private EnterRawMode() {
        this.port.write("\r\x01");//Enter Ctrl+A - para ingresar en modo raw
    }

    private CtrlC() {
        this.port.write([3]);//Ctrl+C
    }
    private CtrlD() {
        this.port.write([0x04]);//Ctrl+D
    }
    private Enter() {
        this.port.write('\r');//Ctrl+C
    }



    public sendTest() {

        this.onReadyQueqe.push(
            () => {
                this.port.write("import machine");
                this.port.write([13]);
            }
        );

        this.onReadyQueqe.push(
            () => {
                this.port.write("led = machine.Pin(25,machine.Pin.OUT)");
                this.port.write([13]);
            }
        );

        this.onReadyQueqe.push(
            () => {
                this.port.write("led.toggle()");
                this.port.write([13]);
            }
        );
        this.onReadyQueqe.push(
            () => {
                this.port.write("led.toggle()");
                this.port.write([13]);
            }
        );
        this.onReadyQueqe.push(
            () => {
                this.port.write("led.toggle()");
                this.port.write([13]);
            }
        );
        //console.log(this.onReadyQueqe.length);
        this.port.write('\r');
        this.port.write([3]);
        this.port.write([3]);

    }
}


function Contiene(data: Buffer, arg1: string) {
    const ori = Buffer.from(data);
    return ori.includes(arg1);
}

function checkEnd(_toView: Buffer, toCheck: Buffer): boolean {

    let toView = Buffer.from(_toView);

    toCheck.reverse();
    toView.reverse();

    if (toView.length < toCheck.length)
        return false;

    for (let i = 0; i < toCheck.length; i++) {
        if (toCheck.readUint8() == toView.readUint8())
            continue;

        return false;
    }

    return true;
}

function checkStart(_toView: Buffer, toCheck: Buffer): boolean {

    let toView = Buffer.from(_toView);

    if (toView.length < toCheck.length)
        return false;


    for (let i = 0; i < toCheck.length; i++) {
        if (toCheck.readUint8() == toView.readUint8())
            continue;

        return false;
    }

    return true;

}
