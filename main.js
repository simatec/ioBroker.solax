'use strict';

// @ts-ignore
const utils = require('@iobroker/adapter-core');
// @ts-ignore
const schedule = require('node-schedule');
// @ts-ignore
const SunCalc = require('suncalc2');
// @ts-ignore
const axios = require('axios').default;

const createStates = require('./lib/createObjects.js');

let requestTimer;
let astroTimer;
let longitude;
let latitude;
let timerSleep = 0;

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
    return new Promise(async(resolve) => {
        // @ts-ignore
        timerSleep = setTimeout(async() => resolve(), ms);
    });
}

async function getSystemData() {
    return new Promise(async(resolve) => {
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
    return new Promise(async(resolve) => {
        adapter.log.debug('nightCalc started ...');

        try {
            const times = SunCalc.getTimes(new Date(), latitude, longitude);

            const nauticalDusk = ('0' + times.nauticalDusk.getHours()).slice(-2) + ':' + ('0' + times.nauticalDusk.getMinutes()).slice(-2);
            const nauticalDawn = ('0' + times.nauticalDawn.getHours()).slice(-2) + ':' + ('0' + times.nauticalDawn.getMinutes()).slice(-2);

            adapter.log.debug(`nauticalDusk: ${nauticalDusk}`);
            adapter.log.debug(`nauticalDawn: ${nauticalDawn}`);

            const currentTime = getDate();
            adapter.log.debug(`current local Time: ${currentTime}`);

            if (currentTime > nauticalDusk || currentTime < nauticalDawn) {
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
    return new Promise(async(resolve) => {
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

async function setInverterType(type) {
    let inverterType = '';
    switch (type) {
        case '1':
            inverterType = 'X1-LX';
            break;
        case '2':
            inverterType = 'X-Hybrid';
            break;
        case '3':
            inverterType = 'X1-Hybiyd/Fit';
            break;
        case '4':
            inverterType = 'X1-Boost/Air/Mini';
            break;
        case '5':
            inverterType = 'X3-Hybiyd/Fit';
            break;
        case '6':
            inverterType = 'X3-20K/30K';
            break;
        case '7':
            inverterType = 'X3-MIC/PRO';
            break;
        case '8':
            inverterType = 'X1-Smart';
            break;
        case '9':
            inverterType = 'X1-AC';
            break;
        case '10':
            inverterType = 'A1-Hybrid';
            break;
        case '11':
            inverterType = 'A1-Fit';
            break;
        case '12':
            inverterType = 'A1-Grid';
            break;
        case '13':
            inverterType = 'J1-ESS';
            break;
        default:
            inverterType = 'unknown';
    }
    return (inverterType);
}

async function setInverterstate(solaxState) {
    let inverterState = '';
    switch (solaxState) {
        case 0:
        case '100':
            inverterState = 'Wait Mode';
            break;
        case 1:
        case '101':
            inverterState = 'Check Mode';
            break;
        case 2:
        case '102':
            inverterState = 'Normal Mode';
            break;
        case 3:
        case '103':
            inverterState = 'Fault Mode';
            break;
        case 4:
        case '104':
            inverterState = 'Permanent Fault Mode';
            break;
        case 5:
        case '105':
            inverterState = 'Update Mode';
            break;
        case 6:
        case '106':
            inverterState = 'EPS Check Mode';
            break;
        case 7:
        case '107':
            inverterState = 'EPS Mode';
            break;
        case 8:
        case '108':
            inverterState = 'Self-Test Mode';
            break;
        case 9:
        case '109':
            inverterState = 'Idle Mode';
            break;
        case 10:
        case '110':
            inverterState = 'Standby Mode';
            break;
        case 11:
        case '111':
            inverterState = 'Pv Wake Up Bat Mode';
            break;
        case 12:
        case '112':
            inverterState = 'Gen Check Mode';
            break;
        case 13:
        case '113':
            inverterState = 'Gen Run Mode';
            break;
        default:
            inverterState = 'unknown';
    }
    return (inverterState);
}

/*************************** Cloud Mode **********************/

let num = 0;

async function requestAPI() {
    return new Promise(async(resolve) => {
        const solaxURL = (`https://www.eu.solaxcloud.com:9443/proxy/api/getRealtimeInfo.do?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);

        try {
            const solaxRequest = await axios({
                method: 'get',
                baseURL: solaxURL,
                timeout: 2000,
                headers: {
                    'User-Agent': 'axios/0.21.1'
                },
                responseType: 'json'
            });

            if (solaxRequest.data && solaxRequest.data.result && solaxRequest.data.success === true) {
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
    return new Promise(async(resolve) => {
        try {
            const solaxRequest = await requestAPI();

            if (solaxRequest.data && solaxRequest.data.result) {
                adapter.log.debug('API Request successfully completed');

                await createStates.createdDataStates(solaxRequest.data, adapter);

                adapter.log.debug(`solaxRequest: ${JSON.stringify(solaxRequest.data)}`);

                const inverterState = await setInverterstate(solaxRequest.data.result.inverterStatus);
                const inverterType = await setInverterType(solaxRequest.data.result.inverterType);

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
                await setData(solaxRequest)

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
    return new Promise(async(resolve) => {

        const list = await adapter.getForeignObjectsAsync(adapter.namespace + '.data.*', 'state');

        if (list) {
            let num = 0;
            for (const i in list) {
                num++;
                const resID = list[i]._id;
                const objectID = resID.split('.');
                const resultID = objectID[3];

                if (resultID !== 'yieldtoday' && resultID !== 'yieldtotal' && resultID !== 'batPower') {
                    const state = await adapter.getStateAsync(`data.${resultID}`);

                    if (state && state.val >= 0) {
                        await adapter.setStateAsync(`data.${resultID}`, solaxRequest.data.result[resultID] ? solaxRequest.data.result[resultID] : 0, true);
                    }
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
    return new Promise(async(resolve) => {
        let json = {};
        const infoList = await adapter.getForeignObjectsAsync(adapter.namespace + '.info.*', 'state');

        if (infoList) {
            for (const i in infoList) {
                const resID = infoList[i]._id;
                const objectID = resID.split('.');
                const resultID = objectID[3];

                const state = await adapter.getStateAsync(`info.${resultID}`);

                if (state && state.val !== null) {
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

                if (state && state.val && resultID != 'json') {
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

            if (state && state.val !== null) {
                const _c = c + 1;
                await adapter.setStateAsync(`history.yield_${_c}_days_ago`, state.val, true);
                adapter.log.debug(`history yield ${_c} days ago: ${state.val} KW/h`);
            }
        } catch (err) {
            adapter.log.warn(err)
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
const stateCache = [];

//{"type":"X1-Boost-Air-Mini","SN":"XXXXXXXXXX","ver":"2.033.20","Data":[0.3,0,67.1,0,0.3,227.5,11,21,0,0.2,0,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,49.99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"Information":[0.6,4,"X1-Boost-Air-Mini","XXXXXXXXXX",1,2.15,0,1.35,0]}

const root_dataPoints = {
    type: { name: 'info.inverterType', description: 'Inverter Type', type: 'string', role: 'text' },
    SN: { name: 'info.sn', description: 'Unique identifier of communication module (Registration No.)', type: 'string', role: 'text' },
    ver: { name: 'info.firmwareVersion', description: 'Firmware of communication module', type: 'string', role: 'text' },
};

const information_dataPoints = {
    0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
    3: { name: 'info.inverterSN', description: 'Unique identifier of inverter (Serial No.)', type: 'string', role: 'text' },
};

const data_dataPoints = {
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
    41: { name: 'data.totalFeed', description: 'Total Feed-in Energy', type: 'number', unit: 'kWh', role: 'value.power.consumption' }, // 'Total Feed-in Energy': (41, 'kWh'),
    42: { name: 'data.totalconsumption', description: 'Total Consumption', type: 'number', unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
    43: { name: 'data.powernow', description: 'Power Now', type: 'number', unit: 'W', role: 'value.power' }, // 'Power Now': (43, 'W'),
    50: { name: 'data.gridfrequency', description: 'Grid Frequency', type: 'number', unit: 'Hz', role: 'value.power' }, // 'Grid Frequency': (50, 'Hz'),
    68: { name: 'info.inverterStatus', description: 'Inverter Mode', type: 'string', role: 'text' }, // 'Inverter Mode': (68, '')

    // ssdsd.INV1BATTERYVOLTAGE = apiData.Data[13];
    // ssdsd.INV1BATTERYCURRENT = apiData.Data[14];
    // ssdsd.INV1BATTERYPOWER = apiData.Data[15];
    // ssdsd.INV1BATTERYTEMPERATURE = apiData.Data[16];
    // ssdsd.INV1BATTERYCAPACITYREMAINING = apiData.Data[21];

};

async function requestLocalAPI() {
    try {
        const source = axios.CancelToken.source();
        requestTimeOut = setTimeout(async() => source.cancel(), 3000);

        const url = `http://${adapter.config.hostIP}:80/?optType=ReadRealTimeData&pwd=${adapter.config.passwordWifi}`;
        const apiData = (await axios.post(url, null, { cancelToken: source.token, headers: { 'X-Forwarded-For': '5.8.8.8' } })).data;

        clearTimeout(requestTimeOut);
        offlineCounter = 0;
        isOnline = true;

        for (const key in apiData) {
            const dataPoint = root_dataPoints[key];
            if (!dataPoint) continue;
            await setDataPoint(dataPoint, apiData[key])
        }

        for (const key in apiData.Data) {
            const dataPoint = data_dataPoints[key];
            if (!dataPoint) continue;
            let data = apiData.Data[key]

            if (key == '68') {
                data = await setInverterstate(data)
            }
            await setDataPoint(dataPoint, data)
        }

        for (const key in apiData.Information) {
            const dataPoint = information_dataPoints[key];
            if (!dataPoint) continue;
            await setDataPoint(dataPoint, apiData.Information[key])
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

    await adapter.setStateAsync(`${data_dataPoints['isOnline'].name}`, isOnline, true);

    await createdJSON();
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
    const valuesOfReset = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 43, 50, 68]

    for (const value of valuesOfReset) {
        const dataPoint = data_dataPoints[value];

        if (value == 68) {
            await setDataPoint(dataPoint, await setInverterstate(-1))
        } else if (value != 8) {
            await setDataPoint(dataPoint, 0)
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

        await adapter.setStateAsync('info.connectType', adapterMode, true);
    }
    await createStates.createdSpecialStates(adapter);
    await createStates.createdInfoStates(adapter, adapterMode);
    await createStates.createdHistoryStates(adapter, adapter.config.historyDays);

    await delHistoryStates(adapter.config.historyDays);

    let _isNight = false;
    let configCheck = false;

    adapter.log.debug(`Solax is started in ${adapterMode}-mode`);

    await getSystemData();
    _isNight = await nightCalc(_isNight);
    await sunPos();

    astroTimer = setInterval(async() => {
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

                requestTimer = setInterval(async() => {
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
                requestLocalAPI();
                configCheck = true;
                const requestIntervalLocal = adapter.config.requestIntervalLocal || 10;

                adapter.log.debug(`Request Interval: ${requestIntervalLocal} seconds`);
                adapter.log.debug('Local Request Interval started ...');

                requestTimer = setInterval(async() => {
                    if (!_isNight) {
                        requestLocalAPI();
                    }
                }, requestIntervalLocal * 1000);
            } else {
                adapter.log.warn('system settings cannot be called up. Please check configuration!');
            }
            break;
    }
    if (configCheck) {
        schedule.scheduleJob('dayHistory', '50 59 23 * * *', async() => await setDayHistory(adapter.config.historyDays));
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    module.exports = startAdapter;
} else {
    startAdapter();
}