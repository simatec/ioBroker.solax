'use strict';

// @ts-ignore
const utils = require('@iobroker/adapter-core');
// @ts-ignore
const schedule = require('node-schedule');
// @ts-ignore
const SunCalc = require('suncalc2');
// @ts-ignore
const axios = require('axios');

const createStates = require('./lib/createObjects.js');

let requestTimer;
let astroTimer;
let longitude;
let latitude;
let timerSleep = 0;

const _inverterType = {
    1: 'X1-LX',
    2: 'X-Hybrid',
    3: 'X1-Hybiyd/Fit',
    4: 'X1-Boost/Air/Mini',
    5: 'X3-Hybiyd/Fit',
    6: 'X3-20K/30K',
    7: 'X3-MIC/PRO',
    8: 'X1-Smart',
    9: 'X1-AC',
    10: 'A1-Hybrid',
    11: 'A1-Fit',
    12: 'A1-Grid',
    13: 'J1-ESS',
    14: 'X3-Hybrid-G4',
    15: 'X1-Hybrid-G4',
    16: 'X3-MIC/PRO-G2',
    17: 'X1-SPT',
    18: 'X1-Boost/Mini-G4',
    19: 'A1-HYB-G2',
    20: 'A1-AC-G2',
    21: 'A1-SMT-G2',
    22: 'X3-FTH',
    23: 'X3-MGA-G2'
};

const _inverterStateLocal = {
    0: 'Wait Mode',
    1: 'Check Mode',
    2: 'Normal Mode',
    3: 'Fault Mode',
    4: 'Permanent Fault Mode',
    5: 'Update Mode',
    6: 'EPS Check Mode',
    7: 'EPS Mode',
    8: 'Self-Test Mode',
    9: 'Idle Mode',
    10: 'Standby Mode',
    11: 'Pv Wake Up Bat Mode',
    12: 'Gen Check Mode',
    13: 'Gen Run Mode'
};

const _inverterStateAPI = {
    100: 'Wait Mode',
    101: 'Check Mode',
    102: 'Normal Mode',
    103: 'Fault Mode',
    104: 'Permanent Fault Mode',
    105: 'Update Mode',
    106: 'EPS Check Mode',
    107: 'EPS Mode',
    108: 'Self-Test Mode',
    109: 'Idle Mode',
    110: 'Standby Mode',
    111: 'Pv Wake Up Bat Mode',
    112: 'Gen Check Mode',
    113: 'Gen Run Mode'
};

let adapter;
const adapterName = require('./package.json').name.split('.').pop();

function startAdapter(options) {
    return adapter = utils.adapter(Object.assign({}, options, {
        name: adapterName,

        ready: main,

        unload: (callback) => {
            try {
                schedule.cancelJob('dayHistory');
                clearInterval(requestTimer);
                clearInterval(astroTimer);
                clearTimeout(timerSleep);
                clearTimeout(requestTimeOut);
                callback();
            } catch (e) {
                callback();
            }
        },
    }));
}

async function sleep(ms) {
    return new Promise(async (resolve) => {
        // @ts-ignore
        timerSleep = setTimeout(async () => resolve(), ms);
    });
}

async function getSystemData() {
    return new Promise(async (resolve) => {
        if (adapter.config.systemGeoData) {
            try {
                const state = await adapter.getForeignObjectAsync('system.config', 'state');

                if (state) {
                    longitude = state.common.longitude;
                    latitude = state.common.latitude;
                    adapter.log.debug('System longitude: ' + state.common.longitude + ' System latitude: ' + state.common.latitude);
                    // @ts-ignore
                    resolve();

                } else {
                    adapter.log.error('Astro data from the system settings cannot be called up. Please check configuration!');
                    // @ts-ignore
                    resolve();
                }
            } catch (err) {
                adapter.log.warn('Astro data from the system settings cannot be called up. Please check configuration!');
                // @ts-ignore
                resolve();
            }
        } else {
            try {
                longitude = adapter.config.longitude;
                latitude = adapter.config.latitude;
                adapter.log.debug('longitude: ' + adapter.config.longitude + ' latitude: ' + adapter.config.latitude);
                // @ts-ignore
                resolve();
            } catch (err) {
                adapter.log.warn('Astro data from the system settings cannot be called up. Please check configuration!');
                // @ts-ignore
                resolve();
            }
        }
    });
}

function getDate(d) {
    d = d || new Date();
    return (('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2));
}

async function nightCalc(_isNight) {
    return new Promise(async (resolve) => {
        adapter.log.debug('nightCalc started ...');

        try {
            const times = SunCalc.getTimes(new Date(), latitude, longitude);

            const nauticalDusk = ('0' + times.nauticalDusk.getHours()).slice(-2) + ':' + ('0' + times.nauticalDusk.getMinutes()).slice(-2);
            const nauticalDawn = ('0' + times.nauticalDawn.getHours()).slice(-2) + ':' + ('0' + times.nauticalDawn.getMinutes()).slice(-2);

            adapter.log.debug(`nauticalDusk: ${nauticalDusk}`);
            adapter.log.debug(`nauticalDawn: ${nauticalDawn}`);

            const currentTime = getDate();
            adapter.log.debug(`current local Time: ${currentTime}`);

            if ((currentTime > nauticalDusk || currentTime < nauticalDawn) && !adapter.config.nightMode) {
                _isNight = true;
            } else {
                _isNight = false;
            }
        } catch (e) {
            adapter.log.warn('cannot calculate astrodata ... please check your config for latitude und longitude!!');
        }
        resolve(_isNight);
    });
}

async function sunPos() {
    return new Promise(async (resolve) => {
        let currentPos;
        try {
            currentPos = SunCalc.getPosition(new Date(), latitude, longitude);
            adapter.log.debug('calculate astrodata ...');
        } catch (e) {
            adapter.log.error('cannot calculate astrodata ... please check your config for latitude und longitude!!');
        }

        const currentAzimuth = currentPos.azimuth * 180 / Math.PI + 180;
        const currentAltitude = currentPos.altitude * 180 / Math.PI;
        const azimuth = Math.round(10 * currentAzimuth) / 10;
        const altitude = Math.round(10 * currentAltitude) / 10;

        adapter.log.debug('Sun Altitude: ' + altitude + '°');
        adapter.log.debug('Sun Azimut: ' + azimuth + '°');

        await adapter.setStateAsync('suninfo.Azimut', azimuth, true);
        await adapter.setStateAsync('suninfo.Altitude', altitude, true);

        // @ts-ignore
        resolve();
    });
}

/*************************** Cloud Mode **********************/

let num = 0;

async function requestAPI() {
    return new Promise(async (resolve) => {
        const solaxURL = (`https://www.eu.solaxcloud.com:9443/proxy/api/getRealtimeInfo.do?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);
        //const solaxURL = (`https://www.eu.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);

        try {
            const solaxRequest = await axios({
                method: 'get',
                url: solaxURL,
                timeout: 5000,
                headers: {
                    'User-Agent': 'axios/1.3.6'
                },
                responseType: 'json'
            });

            if (solaxRequest.data && solaxRequest.data.result && solaxRequest.data.success === true) {
                adapter.log.debug(`request-result: ${JSON.stringify(solaxRequest.data)}`)
                num = 0;
                resolve(solaxRequest);
            } else if (solaxRequest.data && solaxRequest.data.result && solaxRequest.data.success === false && num <= 5) {
                num++;
                await sleep(5000);
                return await fillData();
            } else if (num > 5) {
                adapter.log.debug(`${num} request attempts were started: ${solaxRequest.data.result ? solaxRequest.data.result : ''}`)
                num = 0;
                resolve(solaxRequest);
            }
        } catch (err) {
            adapter.log.debug(`request error: ${err}`);
        }
    });
}

async function fillData() {
    return new Promise(async (resolve) => {
        try {
            const solaxRequest = await requestAPI();

            if (solaxRequest.data && solaxRequest.data.result) {
                adapter.log.debug('API Request successfully completed');

                await createStates.createdDataStates(solaxRequest.data, adapter);

                adapter.log.debug(`solaxRequest: ${JSON.stringify(solaxRequest.data)}`);

                const inverterState = solaxRequest.data.result.inverterStatus ? _inverterStateAPI[`${solaxRequest.data.result.inverterStatus}`] : 'Offline';
                const inverterType = solaxRequest.data.result.inverterType ? _inverterType[`${solaxRequest.data.result.inverterType}`] : 'unknown';

                if (solaxRequest.data.success === true) {
                    // set State for inverter informations => success = true
                    await adapter.setStateAsync('info.exception', solaxRequest.data.exception, true);
                    await adapter.setStateAsync('info.inverterSN', solaxRequest.data.result.inverterSN ? solaxRequest.data.result.inverterSN : 'unknown', true);
                    await adapter.setStateAsync('info.sn', solaxRequest.data.result.sn ? solaxRequest.data.result.sn : 'unknown', true);
                    await adapter.setStateAsync('info.uploadTime', solaxRequest.data.result.uploadTime ? solaxRequest.data.result.uploadTime : 'unknown', true);
                    await adapter.setStateAsync('info.inverterType', inverterType, true);

                    // set State for inverter data  => success = true
                    await adapter.setStateAsync('data.yieldtoday', solaxRequest.data.result.yieldtoday ? solaxRequest.data.result.yieldtoday : 0, true);
                    await adapter.setStateAsync('data.yieldtotal', solaxRequest.data.result.yieldtotal ? solaxRequest.data.result.yieldtotal : 0, true);

                    if (solaxRequest.data.result.batPower) {
                        await adapter.setStateAsync('data.batPower', solaxRequest.data.result.batPower ? solaxRequest.data.result.batPower : 0, true);
                    }
                }

                // set State for inverter informations
                await adapter.setStateAsync('info.inverterStatus', inverterState, true);
                await adapter.setStateAsync('info.success', solaxRequest.data.success, true);

                // set State for inverter data
                await setData(solaxRequest);

                await createdJSON();
            } else {
                adapter.log.debug('SolaX API is currently unavailable');
            }
        } catch (err) {
            adapter.log.warn('request error: ' + err);
        }
        // @ts-ignore
        resolve();
    });
}

async function setData(solaxRequest) {
    return new Promise(async (resolve) => {

        const list = await adapter.getForeignObjectsAsync(adapter.namespace + '.data.*', 'state');

        if (list) {
            let num = 0;
            for (const i in list) {
                num++;
                const resID = list[i]._id;
                const objectID = resID.split('.');
                const resultID = objectID[3];

                if (resultID !== 'yieldtoday' && resultID !== 'yieldtotal' && resultID !== 'batPower' && resultID !== 'feedinpower') {
                    const state = await adapter.getStateAsync(`data.${resultID}`);

                    if (state) {
                        await adapter.setStateAsync(`data.${resultID}`, solaxRequest.data.result[resultID] ? solaxRequest.data.result[resultID] : 0, true);
                    }
                }

                if (resultID === 'feedinpower') {
                    await adapter.setStateAsync(`data.${resultID}`, solaxRequest.data.result[resultID] ? solaxRequest.data.result[resultID] : 0, true);
                }

                if (num == Object.keys(list).length) {
                    await sleep(1000);
                    // @ts-ignore
                    resolve();
                }
            }
        }
    });
}

/*************************** Cloud Mode End **********************/

/*************************** JSON State **************************/

async function createdJSON() {
    return new Promise(async (resolve) => {
        const json = {};
        const infoList = await adapter.getForeignObjectsAsync(adapter.namespace + '.info.*', 'state');

        if (infoList) {
            for (const i in infoList) {
                const resID = infoList[i]._id;
                const objectID = resID.split('.');
                const resultID = objectID[3];

                const state = await adapter.getStateAsync(`info.${resultID}`);

                if (state && state.val !== undefined) {
                    json[`${resultID}`] = state.val;
                }
            }
        }

        const dataList = await adapter.getForeignObjectsAsync(adapter.namespace + '.data.*', 'state');

        if (dataList) {
            let num = 0;
            for (const i in dataList) {
                num++;
                const resID = dataList[i]._id;
                const objectID = resID.split('.');
                const resultID = objectID[3];

                const state = await adapter.getStateAsync(`data.${resultID}`);

                if (state && state.val !== null && resultID != 'json') {
                    json[`${resultID}`] = state.val;
                }

                if (num == Object.keys(dataList).length) {
                    await adapter.setStateAsync('data.json', JSON.stringify(json), true);
                    // @ts-ignore
                    resolve();
                }
            }
        }
    });
}

/*************************** History **********************/

async function setDayHistory(days) {
    const historyDays = days - 1;

    for (let c = historyDays; c >= 0; c--) {
        try {
            let state;

            if (c == 0) {
                state = await adapter.getStateAsync(`data.yieldtoday`);
            } else {
                state = await adapter.getStateAsync(`history.yield_${c}_days_ago`);
            }

            if (state && state.val !== undefined) {
                const _c = c + 1;
                await adapter.setStateAsync(`history.yield_${_c}_days_ago`, state.val, true);
                adapter.log.debug(`history yield ${_c} days ago: ${state.val} KW/h`);
            }
        } catch (err) {
            adapter.log.warn(err);
        }
    }
    await adapter.setStateAsync('data.yieldtoday', 0, true);
}

async function delHistoryStates(days) {
    const _historyStates = await adapter.getForeignObjectsAsync(`${adapter.namespace}.history.*`, 'state');

    for (const i in _historyStates) {
        const historyID = _historyStates[i]._id;
        const historyName = historyID.split('.').pop();
        const historyNumber = historyName.split('_');

        if (historyNumber[1] > days) {
            try {
                await adapter.delObjectAsync(historyID);
                adapter.log.debug(`Delete old History State "${historyName}"`);
            } catch (e) {
                adapter.log.warn(`Cannot Delete old History State "${historyName}"`);
            }
        }
    }
}

/*************************** Expert Local Mode **********************/

let requestTimeOut;
let offlineCounter = 0;
let isOnline = false;
let type = 1

const stateCache = [];

const root_dataPoints = {
    type: { name: 'info.inverterType', description: 'Inverter Type', type: 'string', role: 'text' },
    sn: { name: 'info.sn', description: 'Unique identifier of communication module (Registration No.)', type: 'string', role: 'text' },
    ver: { name: 'info.firmwareVersion', description: 'Firmware of communication module', type: 'string', role: 'text' },
};

const information_dataPoints = {
    1: { /****************************************** X1 mini *****************************************/
        0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
        3: { name: 'info.inverterSN', description: 'Unique identifier of inverter (Serial No.)', type: 'string', role: 'text' },
    },
    2: { /****************************************** X1 boost *****************************************/
        0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
        2: { name: 'info.inverterSN', description: 'Unique identifier of inverter (Serial No.)', type: 'string', role: 'text' },
    },
    3: { /************************ X3-Hybiyd/Fit / X3-20K/30K / X3-MIC/PRO ****************************/
        0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
        2: { name: 'info.inverterSN', description: 'Unique identifier of inverter (Serial No.)', type: 'string', role: 'text' },
        4: { name: 'info.dspVersion', description: 'DSP Version', type: 'number', role: 'text' },
        6: { name: 'info.armVersion', description: 'ARM Version', type: 'number', role: 'text' },
    },
    4: { /***************************************** X3-Hybrid-G4 ***************************************/
        0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
        2: { name: 'info.inverterSN', description: 'Unique identifier of inverter (Serial No.)', type: 'string', role: 'text' },
    }
};

const data_dataPoints = {
    1: { /****************************************** X1 mini *****************************************/
        isOnline: { name: 'info.online', description: 'Inverter Online', type: 'boolean', role: 'switch' },
        0: { name: 'data.currentdc1', description: 'PV1 Current', type: 'number', unit: 'A', role: 'value.power' }, // 'PV1 Current': (0, 'A'),
        1: { name: 'data.currentdc2', description: 'PV2 Current', type: 'number', unit: 'A', role: 'value.power' }, // 'PV2 Current': (1, 'A'),
        2: { name: 'data.voltagedc1', description: 'PV1 Voltage', type: 'number', unit: 'V', role: 'value.power' }, // 'PV1 Voltage': (2, 'V'),
        3: { name: 'data.voltagedc2', description: 'PV2 Voltage', type: 'number', unit: 'V', role: 'value.power' }, // 'PV2 Voltage': (3, 'V'),
        4: { name: 'data.outputcurrent', description: 'Output Current', type: 'number', unit: 'A', role: 'value.power' }, // 'Output Current': (4, 'A'),
        5: { name: 'data.acvoltage', description: 'AC Voltage', type: 'number', unit: 'V', role: 'value.power' }, // 'AC Voltage': (5, 'V'),
        6: { name: 'data.acpower', description: 'Inverter AC-Power total', type: 'number', unit: 'W', role: 'value.power' }, // 'AC Power': (6, 'W'),
        7: { name: 'data.inverterTemp', description: 'Inverter Temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Inverter Temperature': (7, '°C'),
        8: { name: 'data.yieldtoday', description: 'Inverter AC-Energy out Daily', type: 'number', unit: 'kWh', role: 'value.power.consumption' }, // 'Today's Energy': (8, 'kWh'),
        9: { name: 'data.yieldtotal', description: 'Inverter AC-Energy out total', type: 'number', unit: 'kWh', role: 'value.power.consumption' }, // 'Total Energy': (9, 'kWh'),
        10: { name: 'data.exportedPower', description: 'Exported Power', type: 'number', unit: 'W', role: 'value.power' }, // 'Exported Power': (10, 'W'),
        11: { name: 'data.powerdc1', description: 'Inverter DC PV power MPPT1', type: 'number', unit: 'W', role: 'value.power' }, // 'PV1 Power': (11, 'W'),
        12: { name: 'data.powerdc2', description: 'Inverter DC PV power MPPT2', type: 'number', unit: 'W', role: 'value.power' }, // 'PV2 Power': (12, 'W'),
        13: { name: 'data.batteryVoltage', description: 'battery voltage', type: 'number', unit: 'V', role: 'value.power' }, // 'Battery DC Voltage'
        14: { name: 'data.batteryCurrent', description: 'battery current', type: 'number', unit: 'A', role: 'value.power' }, // 'Battery Current
        15: { name: 'data.batteryPower', description: 'battery power', type: 'number', unit: 'W', role: 'value.power' }, // 'Battery Power
        16: { name: 'data.batteryTemperature', description: 'battery temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Battery Temperature
        21: { name: 'data.batteryCapacityRemainig', description: 'battery capacity remainig', type: 'number', unit: '%', role: 'value.power' }, // 'Battery Capacity Remainig
        41: { name: 'data.totalFeed', description: 'Total Feed-in Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption' }, // 'Total Feed-in Energy': (41, 'kWh'),
        42: { name: 'data.totalconsumption', description: 'Total Consumption', type: 'number', unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
        43: { name: 'data.powernow', description: 'Power Now', type: 'number', unit: 'W', role: 'value.power' }, // 'Power Now': (43, 'W'),
        50: { name: 'data.gridfrequency', description: 'Grid Frequency', type: 'number', unit: 'Hz', role: 'value.power' }, // 'Grid Frequency': (50, 'Hz'),
        68: { name: 'info.inverterStatus', description: 'Inverter Mode', type: 'string', role: 'text' }, // 'Inverter Mode': (68, '')
    },
    2: { /****************************************** X1 boost *****************************************/
        isOnline: { name: 'info.online', description: 'Inverter Online', type: 'boolean', role: 'switch' },
        0: { name: 'data.acvoltage', description: 'AC Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'AC Voltage': (5, 'V'),
        1: { name: 'data.outputcurrent', description: 'Output Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'Output Current': (4, 'A'),
        2: { name: 'data.acpower', description: 'Inverter AC-Power total', type: 'number', unit: 'W', role: 'value.power' }, // 'AC Power': (6, 'W'),
        3: { name: 'data.voltagedc1', description: 'PV1 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV1 Voltage': (2, 'V'),
        4: { name: 'data.voltagedc2', description: 'PV2 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV2 Voltage': (3, 'V'),
        5: { name: 'data.currentdc1', description: 'PV1 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV1 Current': (0, 'A'),
        6: { name: 'data.currentdc2', description: 'PV2 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV2 Current': (1, 'A'),
        7: { name: 'data.powerdc1', description: 'Inverter DC PV power MPPT1', type: 'number', unit: 'W', role: 'value.power' }, // 'PV1 Power': (11, 'W'),
        8: { name: 'data.powerdc2', description: 'Inverter DC PV power MPPT2', type: 'number', unit: 'W', role: 'value.power' }, // 'PV2 Power': (12, 'W'),
        9: { name: 'data.gridfrequency', description: 'Grid Frequency', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency': (50, 'Hz'),
        10: { name: 'info.inverterStatus', description: 'Inverter Mode', type: 'string', role: 'text' }, // 'Inverter Mode': (10, ''),
        11: { name: 'data.yieldtotal', description: 'Inverter AC-Energy out total', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Energy': (19, 'kWh'),
        13: { name: 'data.yieldtoday', description: 'Inverter AC-Energy out Daily', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Today's Energy': (21, 'kWh'),
        39: { name: 'data.inverterTemp', description: 'Inverter Temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Inverter Temperature': (7, '°C'),
        48: { name: 'data.exportedPower', description: 'Exported Power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'Exported Power': (10, 'W'),
        50: { name: 'data.totalFeed', description: 'Total Feed-in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Feed-in Energy': (41, 'kWh'),
        52: { name: 'data.totalconsumption', description: 'Total Consumption', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
    },
    3: { /****************************************** X3-Hybiyd/Fit / X3-20K/30K / X3-MIC/PRO *****************************************/
        isOnline: { name: 'info.online', description: 'Inverter Online', type: 'boolean', role: 'switch' },
        0: { name: 'data.acvoltage1', description: 'Grid Voltage 1', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'AC Voltage 1': (0, 'V'),
        1: { name: 'data.acvoltage2', description: 'Grid Voltage 2', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'AC Voltage 2': (1, 'V'),
        2: { name: 'data.acvoltage3', description: 'Grid Voltage 3', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'AC Voltage 3': (2, 'V'),
        3: { name: 'data.accurrent1', description: 'Grid Current 1', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'Output Current 1': (3, 'A'),
        4: { name: 'data.accurrent2', description: 'Grid Current 2', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'Output Current 2': (4, 'A'),
        5: { name: 'data.accurrent3', description: 'Grid Current 3', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'Output Current 3': (5, 'A'),
        6: { name: 'data.acpower1', description: 'Grid Power 1', type: 'number', unit: 'W', role: 'value.power' }, // 'AC Power 1': (6, 'W'),
        7: { name: 'data.acpower2', description: 'Grid Power 2', type: 'number', unit: 'W', role: 'value.power' }, // 'AC Power 2': (7, 'W'),
        8: { name: 'data.acpower3', description: 'Grid Power 3', type: 'number', unit: 'W', role: 'value.power' }, // 'AC Power 3': (8, 'W'),
        9: { name: 'data.dcvoltage1', description: 'PV1 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV1 Voltage': (9, 'V'),
        10: { name: 'data.dcvoltage2', description: 'PV2 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV2 Voltage': (10, 'V'),
        11: { name: 'data.dccurrent1', description: 'PV1 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV1 Current': (11, 'A'),
        12: { name: 'data.dccurrent2', description: 'PV2 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV2 Current': (12, 'A'),
        13: { name: 'data.dcpower1', description: 'PV1 Power', type: 'number', unit: 'W', role: 'value.power' }, // 'PV1 Power': (13, 'W'),
        14: { name: 'data.dcpower2', description: 'PV2 Power', type: 'number', unit: 'W', role: 'value.power' }, // 'PV2 Power': (14, 'W'),
        15: { name: 'data.acfrequency1', description: 'Grid Frequency 1', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 1': (15, 'Hz'),
        16: { name: 'data.acfrequency2', description: 'Grid Frequency 2', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 2': (16, 'Hz'),
        17: { name: 'data.acfrequency3', description: 'Grid Frequency 3', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 3': (17, 'Hz'),
        18: { name: 'info.inverterStatus', description: 'Inverter Mode', type: 'string', role: 'text' }, // 'Inverter Mode': (18, '')
        19: { name: 'data.yieldtotal', description: 'Inverter AC-Energy out total', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Energy': (19, 'kWh'),
        21: { name: 'data.yieldtoday', description: 'Inverter AC-Energy out Daily', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Today's Energy': (21, 'kWh'),
        49: { name: 'data.inverterTemp1', description: 'Inverter Temperature 1', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Inverter Temperature': (49, '°C'),
        72: { name: 'data.inverterTemp2', description: 'Inverter Temperature 2', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Inverter Temperature': (72, '°C'),
        74: { name: 'data.feedinpower', description: 'Feed in Power M1', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // Feed in Power: (561,'W')
        76: { name: 'data.feedinenergy', description: 'Feed in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Feed in Energy: (12.2,'kWh')
        78: { name: 'data.consumeenergy', description: 'Consume Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Consume Energy: (7.8,'kWh')
        80: { name: 'data.acpower', description: 'Inverter AC-Power now', type: 'number', unit: 'W', role: 'value.power' }, // 'AC Power': (80, 'W'),
    },
    4: { /****************************************** X3-Hybrid-G4 *****************************************/
        isOnline: { name: 'info.online', description: 'Inverter Online', type: 'boolean', role: 'switch' },
        0: { name: 'data.acvoltage1', description: 'Grid Voltage 1', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'AC Voltage 1': (0, 'V'),
        1: { name: 'data.acvoltage2', description: 'Grid Voltage 2', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'AC Voltage 2': (1, 'V'),
        2: { name: 'data.acvoltage3', description: 'Grid Voltage 3', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'AC Voltage 3': (2, 'V'),
        3: { name: 'data.accurrent1', description: 'Grid Current 1', type: 'number', maxValue: 32768, multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'Output Current 1': (3, 'A'),
        4: { name: 'data.accurrent2', description: 'Grid Current 2', type: 'number', maxValue: 32768, multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'Output Current 2': (4, 'A'),
        5: { name: 'data.accurrent3', description: 'Grid Current 3', type: 'number', maxValue: 32768, multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'Output Current 3': (5, 'A'),
        6: { name: 'data.acpower1', description: 'Grid Power 1', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'AC Power 1': (6, 'W'),
        7: { name: 'data.acpower2', description: 'Grid Power 2', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'AC Power 2': (7, 'W'),
        8: { name: 'data.acpower3', description: 'Grid Power 3', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'AC Power 3': (8, 'W'),
        9: { name: 'data.acpower', description: 'Inverter AC-Power now', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'AC Power': (80, 'W'),
        10: { name: 'data.dcvoltage1', description: 'PV1 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV1 Voltage': (9, 'V'),
        11: { name: 'data.dcvoltage2', description: 'PV2 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV2 Voltage': (10, 'V'),
        12: { name: 'data.dccurrent1', description: 'PV1 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV1 Current': (11, 'A'),
        13: { name: 'data.dccurrent2', description: 'PV2 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV2 Current': (12, 'A'),
        14: { name: 'data.dcpower1', description: 'PV1 Power', type: 'number', unit: 'W', role: 'value.power' }, // 'PV1 Power': (13, 'W'),
        15: { name: 'data.dcpower2', description: 'PV2 Power', type: 'number', unit: 'W', role: 'value.power' }, // 'PV2 Power': (14, 'W'),
        16: { name: 'data.acfrequency1', description: 'Grid Frequency 1', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 1': (15, 'Hz'),
        17: { name: 'data.acfrequency2', description: 'Grid Frequency 2', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 2': (16, 'Hz'),
        18: { name: 'data.acfrequency3', description: 'Grid Frequency 3', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 3': (17, 'Hz'),
        19: { name: 'info.inverterStatus', description: 'Inverter Mode', type: 'string', role: 'text' }, // 'Inverter Mode': (18, ''),
        34: { name: 'data.feedinpower', description: 'Feed in Power M1', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // Feed in Power: (561,'W'),
        39: { name: 'data.batteryVoltage', description: 'battery voltage', type: 'number', multiplier: 0.01, unit: 'V', role: 'value.power' }, // 'Battery DC Voltage',
        40: { name: 'data.batteryCurrent', description: 'battery current', type: 'number', maxValue: 32768, multiplier: 0.01, unit: 'A', role: 'value.power' }, // 'Battery Current,
        41: { name: 'data.batteryPower', description: 'battery power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'Battery Power,
        47: { name: 'data.powerConsumer', description: 'Consumer power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'Consumer Power  ,   
        68: { name: 'data.yieldtotal', description: 'Inverter AC-Energy out total', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Energy': (19, 'kWh'),
        70: { name: 'data.yieldtoday', description: 'Inverter AC-Energy out Daily', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Today's Energy': (21, 'kWh'),
        80: { name: 'data.totalpvenergy', description: 'Total PV Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
        82: { name: 'data.pvenergy', description: 'PV Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
        86: { name: 'data.totalFeed', description: 'Total Feed-in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Feed-in Energy': (41, 'kWh'),
        88: { name: 'data.totalconsumption', description: 'Total Consumption', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
        90: { name: 'data.feedinenergy', description: 'Feed in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Feed in Energy: (12.2,'kWh'),
        92: { name: 'data.consumeenergy', description: 'Consume Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Consume Energy: (7.8,'kWh'),
        103: { name: 'data.batteryCapacityRemainig', description: 'battery capacity remainig', type: 'number', unit: '%', role: 'value.power' }, // 'Battery Capacity Remainig,
        105: { name: 'data.batteryTemperature', description: 'battery temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Battery Temperature,
    }
};

async function requestLocalAPI() {
    return new Promise(async (resolve) => {
        try {
            const cancelToken = axios.CancelToken;
            const source = cancelToken.source();

            let apiData;

            requestTimeOut = setTimeout(async () => source.cancel(), 3000);

            const data = `optType=ReadRealTimeData&pwd=${adapter.config.passwordWifi}`;

            if (adapter.config.firmwareVersion == 2) {
                const url = `http://${adapter.config.hostIP}:80/?${data}`;
                apiData = (await axios.post(url, null, { cancelToken: source.token, headers: { 'X-Forwarded-For': '5.8.8.8' } })).data;
            } else if (adapter.config.firmwareVersion == 3) {
                const url = `http://${adapter.config.hostIP}`;
                apiData = (await axios.post(url, data, { cancelToken: source.token })).data;
            }

            adapter.log.debug(`local request: ${JSON.stringify(apiData)}`);

            clearTimeout(requestTimeOut);
            offlineCounter = 0;
            isOnline = true;

            switch (apiData.type) {
                case 4:
                    type = 2;
                    break;
                case 5:
                case 6:
                case 7:
                case 16:
                    type = 3;
                    break;
                case 14:
                case 15:
                    type = 4;
                    break;
                default:
                    type = 1;
                    break;
            }

            for (const key in apiData) {
                const dataPoint = root_dataPoints[key.toLowerCase()];
                if (!dataPoint) continue;
                let data = apiData[key]
                if (key == 'type' && _inverterType[data]) {
                    data = _inverterType[data];
                }
                await setDataPoint(dataPoint, data);
            }

            for (const key in apiData.Data) {
                const dataPoint = data_dataPoints[type][key];
                if (!dataPoint) continue;
                let data = apiData.Data[key];

                if ((dataPoint.maxValue && data > dataPoint.maxValue) || (dataPoint.minValue && data < dataPoint.minValue)) {
                    data = (data - 65536);
                }

                if (dataPoint.multiplier) {
                    data = data * dataPoint.multiplier;
                }

                if ((type == 1 && key == '68') || (type == 3 && key == '18') || (type == 4 && key == '19') || (type == 2 && key == '10')) {
                    data = data !== undefined ? _inverterStateLocal[data] : 'Offline';
                }
                await setDataPoint(dataPoint, data);
            }

            for (const key in apiData.Information) {
                const dataPoint = information_dataPoints[type][key];
                if (!dataPoint) continue;
                await setDataPoint(dataPoint, apiData.Information[key]);
            }

            if (isOnline) {
                await adapter.setStateAsync('info.uploadTime', new Date().toString(), true);
            }

        } catch (e) {
            if (offlineCounter == adapter.config.countsOfOffline) {
                isOnline = false;
                resetValues();
            } else {
                offlineCounter++;
            }
        }

        if (requestTimeOut) clearTimeout(requestTimeOut);

        await adapter.setStateAsync(data_dataPoints[type]['isOnline'].name, isOnline, true);

        await createdJSON();
        // @ts-ignore
        resolve();
    });
}

async function setDataPoint(dataPoint, data) {
    const dataPointPath = dataPoint.name;

    // @ts-ignore
    if (!stateCache.includes(dataPoint.name)) {
        await adapter.setObjectNotExistsAsync(dataPointPath, {
            'type': 'state',
            'common': {
                'role': dataPoint.role,
                'name': dataPoint.description,
                'type': dataPoint.type,
                'unit': dataPoint.unit,
                'read': true,
                'write': false
            },
            'native': {}
        });

        stateCache.push(dataPoint.name);
    }

    await adapter.setStateAsync(dataPointPath, data, true);
}

async function resetValues() {
    const valuesOfReset = {
        1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 43, 50, 68],
        2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 39, 48, 50, 52],
        3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 74, 76, 78, 80],
        4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 34, 39, 40, 41, 47, 90, 92, 103, 105]
    };

    for (const value of valuesOfReset[type]) {
        const dataPoint = data_dataPoints[type][value];

        if ((type == 1 && value == '68') || (type == 3 && value == '18') || (type == 4 && value == '19') || (type == 2 && value == '10')) {
            await setDataPoint(dataPoint, 'Offline');
        } else if (value != 8) {
            await setDataPoint(dataPoint, 0);
        }
    }
}

/*************************** End Expert Local Mode **********************/

async function main() {
    let adapterMode = 'cloud';

    if (adapter.config.expertSettings === true && adapter.config.localConnection === true) {
        adapterMode = 'local';
    }

    const _connectType = await adapter.getStateAsync('info.connectType');

    if (_connectType && _connectType.val !== adapterMode) {
        adapter.log.debug(`Delete old "${_connectType.val}" Data Objects`);
        await adapter.delObjectAsync('data', { recursive: true });

        adapter.log.debug(`Delete old "${_connectType.val}" Info Objects`);
        await adapter.delObjectAsync('info', { recursive: true });
    }
    await createStates.createdSpecialStates(adapter);
    await createStates.createdInfoStates(adapter, adapterMode);
    await createStates.createdHistoryStates(adapter, adapter.config.historyDays);

    await adapter.setStateAsync('info.connectType', adapterMode, true);

    await delHistoryStates(adapter.config.historyDays);

    let _isNight = false;
    let configCheck = false;

    adapter.log.debug(`Solax is started in ${adapterMode}-mode`);

    await getSystemData();
    _isNight = await nightCalc(_isNight);
    await sunPos();

    astroTimer = setInterval(async () => {
        _isNight = await nightCalc(_isNight);
        await sunPos();
        adapter.log.debug('is Night: ' + _isNight);
    }, 5 * 60 * 1000);

    schedule.cancelJob('dayHistory');

    switch (adapterMode) {
        case 'cloud':
            if (adapter.config.apiToken && adapter.config.serialNumber) {
                fillData();
                configCheck = true;
                const requestInterval = adapter.config.requestInterval || 5;

                adapter.log.debug(`Request Interval: ${requestInterval} minute(s)`);

                requestTimer = setInterval(async () => {
                    if (!_isNight) {
                        adapter.log.debug('API Request started ...');
                        fillData();
                    }
                }, requestInterval * 60000);
            } else {
                adapter.log.warn('system settings cannot be called up. Please check configuration!');
            }
            break;
        case 'local':
            if (adapter.config.hostIP && adapter.config.passwordWifi) {
                await requestLocalAPI();
                configCheck = true;
                const requestIntervalLocal = adapter.config.requestIntervalLocal || 10;

                adapter.log.debug(`Request Interval: ${requestIntervalLocal} seconds`);
                adapter.log.debug('Local Request Interval started ...');

                requestTimer = setInterval(async () => {
                    if (!_isNight) {
                        adapter.log.debug('Start Local Request');
                        await requestLocalAPI();
                        adapter.log.debug('End Local Request');
                    }
                }, requestIntervalLocal * 1000);
            } else {
                adapter.log.warn('system settings cannot be called up. Please check configuration!');
            }
            break;
    }

    if (configCheck) {
        schedule.scheduleJob('dayHistory', '50 59 23 * * *', async () => await setDayHistory(adapter.config.historyDays));
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    module.exports = startAdapter;
} else {
    startAdapter();
}
