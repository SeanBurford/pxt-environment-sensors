let coeff: number[] = [0, 34197, 30040, 41947, 20137, 32329, 28398];
let ms5803 = MS5803.create(MS5803.Addr.I2C77);
let mprls = MPRLS.create(MPRLS.Addr.I2C18);

// Test conversion of D1 and D2 with known coefficients
let reading = new MS5803.Reading(5173016, 8509400, coeff);
control.assert(reading.temperature == 2789,
    "temperature " + reading.temperature + " != 2789");
control.assert(reading.pressure == 98367,
    "pressure " + reading.pressure + " != 98367");

// Test zero coefficients with D1=0 and D2=0
let result = ms5803.query();
control.assert(result.temperature == 2000,
    "temperature " + result.temperature + " != 2000");
control.assert(result.pressure == 0,
    "pressure " + result.pressure + " != 0");

// Test known coefficients with D1=0 and D2=0
ms5803.coefficients = coeff;
result = ms5803.query();
control.assert(result.temperature == -26017,
    "temperature " + result.temperature + " != -26017");
control.assert(result.pressure == -81382,
    "pressure " + result.pressure + " != -81382");

// Test MPRLS with raw pressure=0
let pressure = mprls.query()
control.assert(pressure == 0, "pressure " + pressure + " != 0");