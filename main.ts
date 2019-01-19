//% icon="\uf2c8" color="#138D75"
namespace MPRLS {
    enum STATUS {
        MPRLS_STATUS_POWER = 0x40,
        MPRLS_STATUS_BUSY = 0x20,
        MPRLS_STATUS_ERROR = 0x04,
        MPRLS_STATUS_MATHSAT = 0x01,
    }
    /**
     * I2C addresses that the MPRLS can appear at.
     */
    export enum Addr {
        //% block="I2C 0x08"
        I2C08 = 0x08,
        //% block="I2C 0x18"
        I2C18 = 0x18,
        //% block="I2C 0x28"
        I2C28 = 0x28,
        //% block="I2C 0x38"
        I2C38 = 0x38,
    }

    /**
     * The MPRLS pressure sensor.
     */
    export class Device {
        i2cAddr: Addr;
        readonly debug: number;

        readonly pMin: number;
        readonly pMax: number;
        readonly outputMax: number;
        readonly outputMin: number;

        constructor(i2cAddr: Addr = Addr.I2C18) {
            this.i2cAddr = i2cAddr;
            this.debug = 1;

            this.pMin = 1677722;
            this.pMax = 15099494;
            this.outputMin = 0;
            this.outputMax = 25;
        }

        protected readPressure(): number {
            // Request the pressure.
            //pins.i2cWriteNumber(this.i2cAddr, 0xAA, NumberFormat.UInt8BE, true);
            //pins.i2cWriteNumber(this.i2cAddr, 0x00, NumberFormat.UInt8BE, true);
            //pins.i2cWriteNumber(this.i2cAddr, 0x00, NumberFormat.UInt8BE, false);
            pins.i2cWriteNumber(this.i2cAddr, 0xAA000000, NumberFormat.UInt32BE, false);

            // Monitor the status byte
            basic.pause(10);
            let attempt = 0;
            for (attempt = 0; attempt < 50; attempt++) {
                let stat = pins.i2cReadNumber(this.i2cAddr, NumberFormat.UInt8BE, false);
                if ((stat & STATUS.MPRLS_STATUS_BUSY) == 0) {
                    break;
                }
                basic.pause(10);
            }
            //serial.writeValue("attempts", attempt);

            let val = pins.i2cReadNumber(this.i2cAddr, NumberFormat.UInt32BE, false);
            let stat = (val >> 24) & 0xFF;
            let v1 = (val >> 16) & 0xFF;
            let v2 = (val >> 8) & 0xFF;
            let v3 = (val) & 0xFF;
            if (stat & STATUS.MPRLS_STATUS_BUSY) {
                return 0xFFFFFFF1;
            }
            if (stat & STATUS.MPRLS_STATUS_MATHSAT) {
                return 0xFFFFFFF2;
            }
            if (stat & STATUS.MPRLS_STATUS_ERROR) {
                return 0xFFFFFFF3;
            }

            return (v1 << 16) | (v2 << 8) | v3;
        }

        /**
         * Request a reading from the MPRLS.
         */
        //% blockId="mprls_query"
        //% block="%mprls| pressure"
        //% weight=70
        public query(): number {
            let raw = this.readPressure();
            if (raw >= 0xFFFFFFF0) {
                return -1;
            }
            let psi = (((raw - this.pMin) * (this.outputMax - this.outputMin)) / (this.pMax - this.pMin)) + this.outputMin;
            let hpa = psi * 68.947572932;
            return hpa;
        }
    }

    /**
     * Create a new MPRLS driver.
     * @param i2caddr Addr address of the MPRLS.
     */
    //% blockId="mprls_create"
    //% block="MPRLS at address %i2caddr"
    //% blockSetVariable=mprls
    //% weight=90
    export function create(i2caddr: Addr): Device {
        let device = new Device(i2caddr);
        return device;
    }

}  // namespace