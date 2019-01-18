//% icon="\uf2c8" color="#138D75"
namespace MS5803 {
    /**
     * A reading from the MS5803 pressure sensor.
     */
    export class Reading {
        //% block="%ms5803reading|D1"
        //% weight=11
        readonly D1: number;
        //% block="%ms5803reading|D2"
        //% weight=10
        readonly D2: number;
        readonly dT: number;
        readonly off: number;
        readonly sens: number;
        //% block="%ms5803reading|temperature"
        //% weight=21
        readonly temperature: number;
        //% block="%ms5803reading|pressure"
        //% weight=20
        readonly pressure: number;

        constructor(D1: number, D2: number, coefficients: number[]) {
            this.D1 = D1;
            this.D2 = D2;
            // TODO: Support other devices than the MS5803-05.
            this.dT = D2 - coefficients[5] * 256;
            this.off = coefficients[2] * 262144 + coefficients[4] * this.dT / 32;
            this.sens = coefficients[1] * 131072 + coefficients[3] * this.dT / 128;
            this.temperature = Math.trunc(2000 + this.dT * (coefficients[6] / 8388608));
            this.pressure = Math.trunc((D1 * (this.sens / 2097152) - this.off) / 32768);
        }

        public toSerial() {
            serial.writeValue("D1", this.D1);
            serial.writeValue("D2", this.D2);
            serial.writeValue("dT", this.dT);
            serial.writeValue("temperature", this.temperature);
            serial.writeValue("pressure", this.pressure);
        }
    }

    /**
     * I2C addresses that the MS5803 can appear at.
     */
    export enum Addr {
        //% block="I2C 0x76 (CSB high)"
        I2C76 = 0x76,
        //% block="I2C 0x77 (CSB low)"
        I2C77 = 0x77,
    }

    /**
     * The MS5803 pressure and temperature sensor.
     */
    export class Device {
        i2cAddr: Addr;
        coefficients: number[];
        readonly debug: number;

        readonly cmdAdcRead: number;
        readonly cmdConvD1OSR256: number;
        readonly cmdConvD2OSR256: number;
        readonly cmdRead: number;
        readonly cmdReset: number;

        constructor(i2cAddr: Addr = Addr.I2C77) {
            this.i2cAddr = i2cAddr;
            this.debug = 1;
            this.cmdAdcRead = 0x00;
            // TODO: Support other oversample rates.
            this.cmdConvD1OSR256 = 0x47;
            this.cmdConvD2OSR256 = 0x57;
            this.cmdRead = 0xA0;
            this.cmdReset = 0x1E;
            this.coefficients = [];
        }

        private cmd(command: number) {
            pins.i2cWriteNumber(this.i2cAddr, command, NumberFormat.UInt8BE, false);
        }

        /**
         * Send a reset command (init does this for you too)
         */
        public reset() {
            control.assert(this.cmdReset == 0x1E, "Class not initialized");
            for (let attempt = 0; attempt < 3; attempt++) {
                this.cmd(this.cmdReset);
                basic.pause(3);
            }
        }

        protected promRead() {
            for (let index = 0; index <= 7; index++) {
                let command = this.cmdRead + (index * 2);
                this.cmd(command);
                let content = pins.i2cReadNumber(
                    this.i2cAddr, NumberFormat.UInt16BE, false);
                this.coefficients[index] = content;
                if (this.debug != 0) {
                    serial.writeValue(index.toString(), content);
                }
            }
        }

        protected adcRead(): number {
            this.cmd(this.cmdAdcRead);
            let adc = pins.i2cReadNumber(
                this.i2cAddr, NumberFormat.UInt32BE, false);
            return Math.trunc(adc / 256);
        }

        /**
         * Prepare the MS5803 for use.
         */
        public init() {
            this.reset();
            this.promRead();
        }

        /**
         * Request a reading from the MS5803.
         */
        //% blockId="ms5803_query"
        //% block="%ms5803|current pressure and temperature"
        //% blockSetVariable=ms5803reading
        //% weight=70
        public query(): Reading {
            if (this.coefficients.length == 0) {
                this.init();
            }
            this.cmd(this.cmdConvD1OSR256);
            basic.pause(10);
            let D1 = this.adcRead();
            this.cmd(this.cmdConvD2OSR256);
            basic.pause(10);
            let D2 = this.adcRead();
            let reading = new Reading(D1, D2, this.coefficients);
            if (this.debug != 0) {
                reading.toSerial();
            }
            return reading;
        }
    }

    /**
     * Create a new MS5803 driver.
     * @param i2caddr Addr address of the MS5803.
     */
    //% blockId="ms5803_create"
    //% block="MS5803 at address %i2caddr"
    //% blockSetVariable=ms5803
    //% weight=90
    export function create(i2caddr: Addr): Device {
        let device = new Device(i2caddr);
        device.init();
        return device;
    }

}  // namespace
