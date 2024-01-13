'use strict';

// @ts-ignore
const utils = require('@iobroker/adapter-core');
// @ts-ignore
const schedule = require('node-schedule');
// @ts-ignore
const SunCalc = require('suncalc');
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

const _wallboxStateLocal = {
    0: 'Unplugged',
    1: 'Plugged',
    2: 'Charging'
};

const _wallboxChargemodeLocal = {
    0: 'Stop',
    1: 'Fast',
    2: 'Eco',
    3: 'Green'
};



let adapter;
const adapterName = require('./package.json').name.split('.').pop();

function startAdapter(options) {
    return adapter = utils.adapter(Object.assign({}, options, {
        name: adapterName,

        ready: main,

        unload: (callback) => {
            adapter.setState('info.connection', false, true);

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
                const state = await adapter.getForeignObjectAsync('system.config');

                if (state) {
                    longitude = state.common.longitude;
                    latitude = state.common.latitude;
                    adapter.log.debug(`System longitude: ${longitude} | System latitude: ${latitude}`);
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
                adapter.log.debug(`longitude: ${longitude} | latitude: ${latitude}`);
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

            const dusk = ('0' + times.dusk.getHours()).slice(-2) + ':' + ('0' + times.dusk.getMinutes()).slice(-2);
            const dawn = ('0' + times.dawn.getHours()).slice(-2) + ':' + ('0' + times.dawn.getMinutes()).slice(-2);

            adapter.log.debug(`dusk: ${dusk}`);
            adapter.log.debug(`dawn: ${dawn}`);

            const currentTime = getDate();
            adapter.log.debug(`current local Time: ${currentTime}`);

            if ((currentTime > dusk || currentTime < dawn) && !adapter.config.nightMode) {
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
async function validateURL() {
    return new Promise(async (resolve, reject) => {

        const cloudURL = {
            0: 'https://www.eu.solaxcloud.com:9443/proxy/api/getRealtimeInfo.do',
            1: 'https://www.eu.solaxcloud.com/proxyApp/proxy/api/getRealtimeInfo.do'
        }

        for (const url in cloudURL) {
            let available;

            try {
                // @ts-ignore
                available = await axios({
                    method: 'get',
                    url: cloudURL[url],
                    validateStatus: () => true
                });
            } catch (err) {
                adapter.log.warn('Solax Cloud is not available: ' + err);
                reject(err);
            }
            if (available && available.status) {
                adapter.log.debug('Solax Cloud is available ... Status: ' + available.status);
                resolve(cloudURL[url]);
                break;
            }
        }
    });
}

let num = 0;

async function requestAPI() {
    return new Promise(async (resolve) => {
        const url = await validateURL();
        const solaxURL = (`${url}?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);

        try {
            // @ts-ignore
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
                await adapter.setStateAsync('info.connection', true, true);

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
                await adapter.setStateAsync('info.connection', false, true);
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

        const list = await adapter.getForeignObjectsAsync(adapter.namespace + '.data.*');

        if (list) {
            let num = 0;
            for (const i in list) {
                num++;
                const resID = list[i]._id;
                const objectID = resID.split('.');
                const resultID = objectID[3];

                if (resultID !== 'yieldtoday' && resultID !== 'yieldtotal' && resultID !== 'feedinpower') {
                    const dataState = await adapter.getStateAsync(`data.${resultID}`);

                    if (dataState || dataState === null) {
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
        const infoList = await adapter.getForeignObjectsAsync(adapter.namespace + '.info.*');

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

        const dataList = await adapter.getForeignObjectsAsync(adapter.namespace + '.data.*');

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
    const _historyStates = await adapter.getForeignObjectsAsync(`${adapter.namespace}.history.*`);

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

async function requestLocalAPI(root_dataPoints, information_dataPoints, data_dataPoints) {
    return new Promise(async (resolve) => {
        try {
            // @ts-ignore
            const cancelToken = axios.CancelToken;
            const source = cancelToken.source();
            const _ver = adapter.config.firmwareVersion;
            const _headers = { 'X-Forwarded-For': '5.8.8.8' };

            let _options = { cancelToken: source.token };

            if (_ver === 2) {
                _options["headers"] = _headers;
            }

            requestTimeOut = setTimeout(async () => source.cancel(), 3000);

            const data = `optType=ReadRealTimeData&pwd=${adapter.config.passwordWifi}`;
            const url = `http://${adapter.config.hostIP}`;

            // @ts-ignore
            const apiData = (await axios.post(_ver === 3 ? url : `${url}:80/?${data}`, _ver === 3 ? data : null, _options)).data;

            adapter.log.debug(`local request: ${JSON.stringify(apiData)}`);

            clearTimeout(requestTimeOut);
            offlineCounter = 0;
            isOnline = true;
            await adapter.setStateAsync('info.connection', true, true);

            switch (apiData.type) {
                case 1:
                    type = 7;
                    break;
                case 4:
                    type = 2;
                    break;
                case 5:
                case 6:
                case 7:
                    type = 3;
                    break;
                case 16:
                    type = 5;
                    break;
                case 14:
                    type = 4;
                    break;
                case 15:
                    type = 6;
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

                if ((type == 1 && key == '68') || (type == 3 && key == '18') || (type == 4 && key == '19') || (type == 2 && key == '10') || (type == 5 && key == '21') || (type == 6 && key == '10') || (type == 7 && key == '10')) {
                    data = data !== undefined ? _inverterStateLocal[data] : 'Offline';
                }

                // State for Wallbox Type 7
                if (type == 7 && key == '0') {
                    data = data !== undefined ? _wallboxStateLocal[data] : 'Offline';
                }

                // State for chargemode Wallbox Type 7
                if (type == 7 && key == '1') {
                    data = data !== undefined ? _wallboxChargemodeLocal[data] : 'Undefined';
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
                await adapter.setStateAsync('info.connection', false, true);
                resetValues(data_dataPoints);
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

async function resetValues(data_dataPoints) {
    const valuesOfReset = {
        1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 43, 50, 68],
        2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 39, 48, 50, 52],
        3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 74, 76, 78, 80],
        4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 34, 39, 40, 41, 47, 90, 92, 103, 105],
        5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 72, 74, 76, 78,],
        6: [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 32, 34, 36],
        7: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 26, 80],
    };

    for (const value of valuesOfReset[type]) {
        const dataPoint = data_dataPoints[type][value];

        if ((type == 1 && value == '68') || (type == 3 && value == '18') || (type == 4 && value == '19') || (type == 2 && value == '10') || (type == 5 && value == '21') || (type == 6 && value == '10') || (type == 7 && value == '0')) {
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
                const inverterData = require('./lib/inverterData');
                const data = new inverterData();

                const root_dataPoints = await data.getRootData();
                const information_dataPoints = await data.getInformationData();
                const data_dataPoints = await data.getInverterData();

                await requestLocalAPI(root_dataPoints, information_dataPoints, data_dataPoints);
                configCheck = true;
                const requestIntervalLocal = adapter.config.requestIntervalLocal || 10;

                adapter.log.debug(`Request Interval: ${requestIntervalLocal} seconds`);
                adapter.log.debug('Local Request Interval started ...');

                requestTimer = setInterval(async () => {
                    if (!_isNight) {
                        adapter.log.debug('Start Local Request');
                        await requestLocalAPI(root_dataPoints, information_dataPoints, data_dataPoints);
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
