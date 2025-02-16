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
    // Since a lot of Tuya devices use the same modelID, but use different data points
    // it's usually necessary to provide a fingerprint instead of a zigbeeModel
    fingerprint: [
        {
            // The model ID from: Device with modelID 'TS0601' is not supported
            // You may need to add \u0000 at the end of the name in some cases
            modelID: 'TS0601',
            // The manufacturer name from: Device with modelID 'TS0601' is not supported.
            manufacturerName: '_TZE200_husqqvux'
        },
    ],
    model: 'TSL-TRV-TV01ZG',
    vendor: 'TESLA',
    description: 'TESLA Smart Thermostatic Valve',
    supports: 'thermostat, temperature',
    fromZigbee: [
        // fz.ignore_basic_report, // Add this if you are getting no converter for 'genBasic'
        // fz.tuya_data_point_dump, // This is a debug converter, it will be described in the next part
        fz.ignore_tuya_set_time,
        fz.moes_thermostat_tv
    ],
    toZigbee: [
        tz.tuya_data_point_test, // Another debug converter
        tz.moes_thermostat_tv
    ],
    onEvent: tuya.onEventSetLocalTime, // Add this if you are getting no converter for 'commandSetTimeRequest'
    configure: async (device, coordinatorEndpoint, logger) => {
        const endpoint = device.getEndpoint(1);
        await reporting.bind(endpoint, coordinatorEndpoint, ['genBasic']);
    },
    exposes: [
        // Here you should put all functionality that your device exposes
    ],
};

module.exports = definition;