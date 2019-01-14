// tests go here; this will not be compiled when this package is used as a library

let coeff: number[] = [0, 34197, 30040, 41947, 20137, 32329, 28398];
let reading = new MS5803Reading(5173016, 8509400, coeff);
control.assert(reading.temperature == 2789,
               "temperature " + reading.temperature + " != 2789");
control.assert(reading.pressure == 98367,
               "pressure " + reading.pressure + " != 98367");

let ms5803 = new MS5803();
// ms5803.init(0x77);
// let result = ms5803.query();
// control.assert(result.temperature == 2000,
//                "temperature " + result.temperature + " != 2000");
