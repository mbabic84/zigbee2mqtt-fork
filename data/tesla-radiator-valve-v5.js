//// Based on:
// https://gist.github.com/drdownload/b720bd1b179db04aea9cacb7d7360b46

const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const tuya = require('zigbee-herdsman-converters/lib/tuya');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const utils = require('zigbee-herdsman-converters/lib/utils');
const e = exposes.presets;
const ea = exposes.access;

const tuyaLocal = {
    dataPoints: {
        // ZONNSMART
        zsHeatingSetpoint: 16,
        zsFrostProtection: 10,
        zsWindowDetection: 8,
        zsChildLock: 40,
        zsTempCalibration: 27,
        zsLocalTemp: 24,
        zsBattery: 35,
        zsHeatingBoostCountdown: 101,
        zsComfortTemp: 104,
        zsEcoTemp: 105,
        zsAwayTemp: 32,
        zsErrorStatus: 45,
        zsMode: 2,
        zsHeatingStop: 107,
        zsIsOnline: 115,
        zsAwayModeDate: 46,
    },
};
const fzLocal = {
    zs_thermostat: {
        cluster: 'manuSpecificTuya',
        type: ['commandGetData', 'commandSetDataResponse'],
        convert: (model, msg, publish, options, meta) => {
            let data;

            if (msg.data) {
                data = msq.data;
            } else if (msg.dpValues && msg.dpValues.length === 1) {
                data = msg.dpValues[0];
            }

            if (!data) {
                return;
            }

            const dp = msg.data.dp;
            const value = tuya.getDataValue(msg.data.datatype, msg.data.data);

            // if (dp >= 101 && dp <=107) return; // handled by tuya_thermostat_weekly_schedule

            switch (dp) {
                case tuya.dataPoints.state: // on/off
                    return !value ? { system_mode: 'off' } : {};

                case tuyaLocal.dataPoints.zsChildLock:
                    return { child_lock: value ? 'LOCK' : 'UNLOCK' };

                case tuyaLocal.dataPoints.zsHeatingSetpoint:
                    return { current_heating_setpoint: (value / 10).toFixed(1) };

                case tuyaLocal.dataPoints.zsLocalTemp:
                    return { local_temperature: (value / 10).toFixed(1) };

                case tuyaLocal.dataPoints.zsBattery:
                    return { battery: value };

                case tuyaLocal.dataPoints.zsTempCalibration:
                    return {
                        local_temperature_calibration: value > 55 ?
                            ((value - 0x100000000) / 10).toFixed(1) : (value / 10).toFixed(1)
                    };

                case tuyaLocal.dataPoints.zsHeatingBoostCountdown:
                    return { boost_time: value };

                case tuyaLocal.dataPoints.zsIsOnline:
                    return { is_online: value ? 'ON' : 'OFF' };

                case tuyaLocal.dataPoints.zsWindowDetection:
                    return { window_detection: value ? 'ON' : 'OFF' };

                case tuyaLocal.dataPoints.zsAwayModeDate:
                    return { away_mode_date: value };

                case tuyaLocal.dataPoints.zsErrorStatus:
                    return { fault_alarm: value };

                case tuyaLocal.dataPoints.zsFrostProtection:
                    return { frost_protection: value ? 'ON' : 'OFF' };

                case tuyaLocal.dataPoints.zsComfortTemp:
                    return { comfort_temperature: (value / 10).toFixed(1) };

                case tuyaLocal.dataPoints.zsEcoTemp:
                    return { eco_temperature: (value / 10).toFixed(1) };

                case tuyaLocal.dataPoints.zsAwayTemp:
                    return { away_preset_temperature: (value / 10).toFixed(1) };

                case tuyaLocal.dataPoints.zsMode:
                    switch (value) {
                        case 1: // manual
                            return { system_mode: 'heat', away_mode: 'OFF', preset: 'manual' };
                        case 2: // away
                            return { system_mode: 'heat', away_mode: 'ON', preset: 'holiday' };
                        case 0: // auto
                            return { system_mode: 'auto', away_mode: 'OFF', preset: 'schedule' };
                        default:
                            meta.logger.warn('zigbee-herdsman-converters:zsThermostat: ' +
                                `preset ${value} is not recognized.`);
                            break;
                    }
                    break;
                case tuyaLocal.dataPoints.zsHeatingStop:
                    if (value == 1) {
                        return { system_mode: 'off', heating_stop: 'ON' }
                    } else {
                        return { heating_stop: 'OFF' }
                    }

                case tuya.dataPoints.runningState: system_mode
                    return { running_state: value ? 'heat' : 'idle' };

                default:
                    meta.logger.warn(`zigbee-herdsman-converters:zsThermostat: Unrecognized DP #${dp} with data ${JSON.stringify(msg.data)}`);
            }
        },
    },
};
const tzLocal = {
    zs_thermostat_child_lock: {
        key: ['child_lock'],
        convertSet: async (entity, key, value, meta) => {
            await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsChildLock, value === 'LOCK');
        },
    },
    zs_thermostat_window_detection: {
        key: ['window_detection'],
        convertSet: async (entity, key, value, meta) => {
            await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsWindowDetection, value === 'ON');
        },
    },
    zs_thermostat_is_online: {
        key: ['is_online'],
        convertSet: async (entity, key, value, meta) => {
            await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsIsOnline, value === 'ON');
        },
    },
    zs_thermostat_current_heating_setpoint: {
        key: ['current_heating_setpoint'],
        convertSet: async (entity, key, value, meta) => {
            const temp = Math.round(value * 10);
            await tuya.sendDataPointValue(entity, tuyaLocal.dataPoints.zsHeatingSetpoint, temp);
        },
    },
    zs_thermostat_comfort_temp: {
        key: ['comfort_temperature'],
        convertSet: async (entity, key, value, meta) => {
            const temp = Math.round(value * 10);
            await tuya.sendDataPointValue(entity, tuyaLocal.dataPoints.zsComfortTemp, temp);
        },
    },
    zs_thermostat_away_temp: {
        key: ['away_preset_temperature'],
        convertSet: async (entity, key, value, meta) => {
            const temp = Math.round(value * 10);
            await tuya.sendDataPointValue(entity, tuyaLocal.dataPoints.zsAwayTemp, temp);
        },
    },
    zs_thermostat_eco_temp: {
        key: ['eco_temperature'],
        convertSet: async (entity, key, value, meta) => {
            const temp = Math.round(value * 10);
            await tuya.sendDataPointValue(entity, tuyaLocal.dataPoints.zsEcoTemp, temp);
        },
    },
    zs_thermostat_preset: {
        key: ['preset'],
        convertSet: async (entity, key, value, meta) => {
            await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsHeatingStop, 0);
            const lookup = { 'schedule': 0, 'manual': 1, 'holiday': 2 };
            utils.validateValue(value, Object.keys(lookup));
            await tuya.sendDataPointEnum(entity, tuyaLocal.dataPoints.zsMode, lookup[value]);
        },
    },
    zs_thermostat_system_mode: {
        key: ['system_mode'],
        convertSet: async (entity, key, value, meta) => {
            if (value != 'off') {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsHeatingStop, 0);
                const lookup = { 'heat': 1, 'auto': 0 };
                utils.validateValue(value, Object.keys(lookup));
                await tuya.sendDataPointEnum(entity, tuyaLocal.dataPoints.zsMode, lookup[value]);
            }
            else {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsHeatingStop, 1);
            }
        },
    },
    zs_thermostat_away: {
        key: ['away_mode'],
        convertSet: async (entity, key, value, meta) => {
            value = value.toUpperCase();
            if (value == 'ON') {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsMode, 2);
            } else {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsMode, 0);
            }
        },
    },
    zs_thermostat_heating_stop: {
        key: ['heating_stop'],
        convertSet: async (entity, key, value, meta) => {
            value = value.toUpperCase();
            if (value == 'ON') {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsHeatingStop, 1);
            } else {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsHeatingStop, 0);
                await tuya.sendDataPointEnum(entity, tuyaLocal.dataPoints.zsMode, 1);
            }
        },
    },
    zs_thermostat_frost_protection: {
        key: ['frost_protection'],
        convertSet: async (entity, key, value, meta) => {
            value = value.toUpperCase();
            if (value == 'ON') {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsFrostProtection, 1);
            } else {
                await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsFrostProtection, 0);
                await tuya.sendDataPointEnum(entity, tuyaLocal.dataPoints.zsMode, 1);
            }
        },
    },
    zs_thermostat_local_temperature_calibration: {
        key: ['local_temperature_calibration'],
        convertSet: async (entity, key, value, meta) => {
            if (value > 0) value = value * 10;
            if (value < 0) value = value * 10 + 0x100000000;
            await tuya.sendDataPointValue(entity, tuyaLocal.dataPoints.zsTempCalibration, value);
        },
    },
    zs_thermostat_boost_time: {
        key: ['boost_time'],
        convertSet: async (entity, key, value, meta) => {
            meta.logger.warn(`${value} is not recognized.`);
            await tuya.sendDataPointValue(entity, tuyaLocal.dataPoints.zsHeatingBoostCountdown, value);
        },
    },
    zs_thermostat_local_temp: {
        key: ['local_temperature'],
        convertGet: async (entity, key, meta) => {
            await tuya.sendDataPointBool(entity, tuyaLocal.dataPoints.zsIsOnline, 1);
        },
    },
};
const device = {
    // Moes Tuya Alt Thermostat
    zigbeeModel: ['TS601'],
    fingerprint: [{ modelID: 'TS0601', manufacturerName: '_TZE200_e9ba97vf' }, { modelID: 'TS0601', manufacturerName: '_TZE200_husqqvux' }],
    model: 'TS601',
    vendor: 'TuYa',
    whiteLabel: [{ vendor: 'ZONNSMART', model: 'TV01-ZG' }],
    description: 'Radiator valve with thermostat',
    fromZigbee: [
        fz.ignore_basic_report,
        fz.ignore_tuya_set_time,  // handled in onEvent
        fzLocal.zs_thermostat,
        // fz.tuya_data_point_dump,
    ],
    toZigbee: [
        tzLocal.zs_thermostat_current_heating_setpoint,
        tzLocal.zs_thermostat_child_lock,
        tzLocal.zs_thermostat_comfort_temp,
        tzLocal.zs_thermostat_eco_temp,
        tzLocal.zs_thermostat_system_mode,
        tzLocal.zs_thermostat_preset,
        tzLocal.zs_thermostat_local_temperature_calibration,
        tzLocal.zs_thermostat_away_temp,
        tzLocal.zs_thermostat_away,
        tzLocal.zs_thermostat_window_detection,
        tzLocal.zs_thermostat_heating_stop,
        tzLocal.zs_thermostat_boost_time,
        tzLocal.zs_thermostat_frost_protection,
        tzLocal.zs_thermostat_is_online,
        tzLocal.zs_thermostat_local_temp,
        tz.tuya_data_point_test
    ],
    onEvent: tuya.onEventSetLocalTime,
    meta: {
        configureKey: 1,
    },
    configure: async (device, coordinatorEndpoint, logger) => {
        const endpoint = device.getEndpoint(1);
        await reporting.bind(endpoint, coordinatorEndpoint, ['genBasic']);
    },
    exposes: [
        e.battery(), e.window_detection(), e.child_lock(), e.comfort_temperature(), e.eco_temperature(), e.away_preset_temperature(), e.boost_time(),
        exposes.climate().withSetpoint('current_heating_setpoint', 0.5, 29.5, 0.5, ea.STATE_SET)
            .withLocalTemperature()
            .withLocalTemperatureCalibration(ea.STATE_SET)
            .withSystemMode(['off', 'heat', 'auto'], ea.STATE_SET) //system mode only: off, heat, auto
            .withPreset(['schedule', 'manual', 'holiday']),
        exposes.binary('frost_protection', ea.STATE_SET, 'ON', 'OFF').withDescription('Enable the frost protection mode'),
        exposes.binary('heating_stop', ea.STATE_SET, 'ON', 'OFF').withDescription('Stop heating'),
        exposes.binary('is_online', ea.STATE_SET, 'ON', 'OFF').withDescription('Is the device online')
    ],
};

module.exports = device;