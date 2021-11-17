const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const extend = require('zigbee-herdsman-converters/lib/extend');
const e = exposes.presets;
const ea = exposes.access;
const tuya = require("zigbee-herdsman-converters/lib/tuya");
const moes = require("zigbee-herdsman-converters/devices/moes");

const definition = {
    fingerprint: [{modelID: 'TS0601', manufacturerName: '_TZE200_e9ba97vf'},
        {modelID: 'TS0601', manufacturerName: '_TZE200_husqqvux'}],
    model: 'TV01-ZB',
    vendor: 'Moes',
    description: 'Thermostat radiator valve',
    fromZigbee: [fz.moes_thermostat_tv, fz.ignore_tuya_set_time],
    whiteLabel: [{vendor: 'Tesla Smart', model: 'TSL-TRV-TV01ZG'}],
    toZigbee: [tz.moes_thermostat_tv],
    exposes: [
        e.battery(), e.child_lock(), e.window_detection(),
        exposes.binary('frost_detection', ea.STATE_SET, true, false).withDescription('Enables/disables frost detection on the device'),
        exposes.binary('heating_stop', ea.STATE_SET, true, false).withDescription('Stop heating'),
        exposes.numeric('holiday_temperature', ea.STATE_SET).withDescription('Holiday mode temperature'),
        exposes.numeric('comfort_temperature', ea.STATE_SET).withDescription('Comfort mode temperature'),
        exposes.numeric('eco_temperature', ea.STATE_SET).withDescription('Eco mode temperature'),
        exposes.numeric('open_window_temperature', ea.STATE_SET).withDescription('Open window mode temperature'),
        exposes.numeric('boost_heating_countdown', ea.STATE).withDescription('Boost heating countdown'),
        exposes.numeric('error_status', ea.STATE).withDescription('Error status'),
        exposes.binary('boost_mode', ea.STATE_SET).withDescription('Enables/disables boost mode'),
        exposes.climate().withSetpoint('current_heating_setpoint', 5, 29.5, 1, ea.STATE_SET)
            .withLocalTemperature(ea.STATE).withLocalTemperatureCalibration(-20, 20, 1, ea.STATE_SET)
            .withSystemMode(Object.values(tuya.tvThermostatMode), ea.STATE_SET)
            .withPreset(Object.values(tuya.tvThermostatPreset)),
    ],
    onEvent: tuya.onEventSetLocalTime,
};

module.exports = definition;