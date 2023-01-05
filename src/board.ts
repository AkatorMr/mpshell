import { SerialPort } from "serialport";

export class Board {
    _port;
    constructor(port: SerialPort) {
        this._port = port;
    }

    private sendCtlC() {
        this._port.flush();
        this._port.write('\r');

        this._port.write([0x03]);
        this._port.write([0x03]);



    }

    public sendTest() {
        this.sendCtlC();
        this._port.write([13]);

        let d: Buffer | null;
        let b = true;
        let c = 0;

        console.log(this._port.isOpen);

        d = this._port.read();
        if (d == null) return;
        if (!d.compare(Buffer.from([13, 10, 62, 62, 62, 32]))) {
            return;
        }
        console.log(d);

        let data = "import os\n";
        data += "def listdir(directory):\n";
        data += "\tresult = set()\n";
        data += "\tdef _listdir(dir_or_file):\n";
        data += "\t\ttry:\n";
        data += "\t\t\tchildren = os.listdir(dir_or_file)\n";
        data += "\t\texcept OSError:\n";
        data += "\t\t\tos.stat(dir_or_file)\n";
        data += "\t\t\tresult.add(dir_or_file)\n";
        data += "\t\telse:\n";
        data += "\t\t\tif children:\n";
        data += "\t\t\t\tfor child in children:\n";
        data += "\t\t\t\t\tif dir_or_file == '/':\n";
        data += "\t\t\t\t\t\tnext = dir_or_file + child\n";
        data += "\t\t\t\telse:\n";
        data += "\t\t\t\t\tnext = dir_or_file + '/' + child\n";

        data += "\t\t\t\t_listdir(next)\n";
        data += "\t\t\telse:\n";
        data += "\t\t\t\tresult.add(dir_or_file)\n";
        data += "\t_listdir(directory)\n";
        data += "\treturn sorted(result)\n";
        this._port.write(data);
    }
}