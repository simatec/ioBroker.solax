'use strict';

// @ts-ignore
const utils = require('@iobroker/adapter-core');
// @ts-ignore
const axios = require('axios').default;
// @ts-ignore
const schedule = require('node-schedule');
// @ts-ignore
const SunCalc = require('suncalc2');

let replayTime;
let jsonTimer;
let createTimer;
let setDataTimer;
let longitude;
let latitude;

const deviceObjects = {
    'acpower': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter AC-Power total',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'yieldtoday': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter AC-Energy out Daily',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'KWh',
            'def': 0
        },
        'native': {}
    },
    'yieldtotal': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter AC-Energy out total',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'KWh',
            'def': 0
        },
        'native': {}
    },
    'feedinpower': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'GCP-Power total',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'feedinenergy': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'GCP-Energy to Grid total',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'KWh',
            'def': 0
        },
        'native': {}
    },
    'consumeenergy': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'GCP-Energy from Grid total',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'KWh',
            'def': 0
        },
        'native': {}
    },
    'feedinpowerM2': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'address to meter AC-Power total',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'soc': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter DC-Battery Energy SOC',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': '%',
            'def': 0
        },
        'native': {}
    },
    'peps1': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter AC EPS-Power L1',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'peps2': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter AC EPS-Power L2',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'peps3': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter AC EPS-Power L3',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'batPower': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter DC-Battery power total',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'powerdc1': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter DC PV power MPPT1',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'powerdc2': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter DC PV power MPPT2',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'powerdc3': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter DC PV power MPPT3',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    },
    'powerdc4': {
        'type': 'state',
        'common': {
            'role': 'indicator',
            'name': 'Inverter DC PV power MPPT4',
            'type': 'number',
            'read': true,
            'write': false,
            'unit': 'W',
            'def': 0
        },
        'native': {}
    }
}

/**
 * The adapter instance
 * @type {ioBroker.Adapter}
 */
let adapter;
const adapterName = require('./package.json').name.split('.').pop();

/**
 * Starts the adapter instance
 * @param {Partial<utils.AdapterOptions>} [options]
 */
function startAdapter(options) {
    return adapter = utils.adapter(Object.assign({}, options, {
        name: adapterName,

        ready: main,

        unload: (callback) => {
            try {
                schedule.cancelJob('requestInterval');
                schedule.cancelJob('dayHistory');
                clearTimeout(replayTime);
                clearTimeout(jsonTimer);
                clearTimeout(createTimer);
                clearTimeout(setDataTimer);
                callback();
            } catch (e) {
                callback();
            }
        },
    }));
}

async function getSystemData() {
    // @ts-ignore
    return new Promise(async (resolve) => {
        if (adapter.config.systemGeoData) {
            try {
                await adapter.getForeignObjectAsync('system.config', async (err, state) => {

                    if (err) {
                        adapter.log.error(err);
                        // @ts-ignore
                        resolve();
                    } else {
                        longitude = state.common.longitude;
                        latitude = state.common.latitude;
                        adapter.log.debug('System longitude: ' + state.common.longitude + ' System latitude: ' + state.common.latitude);
                        // @ts-ignore
                        resolve();
                    }
                });
            } catch (err) {
                adapter.log.warn('Astro data from the system settings cannot be called up. Please check configuration!')
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
                adapter.log.warn('Astro data from the system settings cannot be called up. Please check configuration!')
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
    // @ts-ignore
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

            if (currentTime > nauticalDusk || currentTime < nauticalDawn) {
                _isNight = true;
            } else {
                _isNight = false;
            }
        } catch (e) {
            adapter.log.warn('cannot calculate astrodata ... please check your config for latitude und longitude!!');
        }
        // @ts-ignore
        resolve(_isNight);
    });
}

async function sunPos() {
    // @ts-ignore
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
        case '100':
            inverterState = 'Wait Mode';
            break;
        case '101':
            inverterState = 'Check Mode';
            break;
        case '102':
            inverterState = 'Normal Mode';
            break;
        case '103':
            inverterState = 'Fault Mode';
            break;
        case '104':
            inverterState = 'Permanent Fault Mode';
            break;
        case '105':
            inverterState = 'Update Mode';
            break;
        case '106':
            inverterState = 'EPS Check Mode';
            break;
        case '107':
            inverterState = 'EPS Mode';
            break;
        case '108':
            inverterState = 'Self-Test Mode';
            break;
        case '109':
            inverterState = 'Idle Mode';
            break;
        case '110':
            inverterState = 'Standby Mode';
            break;
        case '111':
            inverterState = 'Pv Wake Up Bat Mode';
            break;
        case '112':
            inverterState = 'Gen Check Mode';
            break;
        case '113':
            inverterState = 'Gen Run Mode';
            break;
        default:
            inverterState = 'unknown';
    }
    return (inverterState);
}

async function createdStates(api) {
    return new Promise(async (resolve) => {
        for (const obj in deviceObjects) {
            if (api.result[`${obj}`]) {
                await adapter.setObjectNotExistsAsync('data.' + obj, deviceObjects[obj]);
            } else if (!api.result[`${obj}`]) {
                delete api.result[`${obj}`];
            }

        }
        // @ts-ignore
        createTimer = setTimeout(async () => resolve(api), 2000);
    });
}

let num = 0;

async function requestAPI() {
    return new Promise(async (resolve) => {
        const solaxURL = (`https://www.eu.solaxcloud.com:9443/proxy/api/getRealtimeInfo.do?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);
        //const solaxURL = (`https://www.solaxcloud.com:9443/proxy/api/getRealtimeInfo.do?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);

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
                replayTime = setTimeout(async () => {
                    return await fillData();
                }, 5000);
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
    // @ts-ignore
    return new Promise(async (resolve) => {
        try {
            const solaxRequest = await requestAPI();

            if (solaxRequest.data && solaxRequest.data.result) {
                adapter.log.debug('API Request successfully completed');

                await createdStates(solaxRequest.data);

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

                // created json
                jsonTimer = setTimeout(async () => {
                    let json = {}
                    await createdJSON(json);
                    await adapter.setStateAsync('data.json', JSON.stringify(json), true);
                }, 1000);

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
        await adapter.getForeignObjects(adapter.namespace + '.data.*', 'state', async (err, list) => {

            if (err) {
                adapter.log.error(err);
            } else {
                let num = 0;
                for (const i in list) {
                    num++;
                    const resID = list[i]._id;
                    const objectID = resID.split('.');
                    const resultID = objectID[3];

                    if (resultID !== 'yieldtoday' && resultID !== 'yieldtotal' && resultID !== 'batPower') {
                        await adapter.getState(`data.${resultID}`, async (err, state) => {
                            if (state && state.val >= 0) {
                                await adapter.setStateAsync(`data.${resultID}`, solaxRequest.data.result[resultID] ? solaxRequest.data.result[resultID] : 0, true);
                            }
                        });
                    }
                    if (num == Object.keys(list).length) {
                        // @ts-ignore
                        setDataTimer = setTimeout(async () => resolve(), 1000);
                    }
                }
            }
        });
    });
}

async function createdJSON(json) {
    return new Promise(async (resolve) => {

        await adapter.getForeignObjects(adapter.namespace + '.info.*', 'state', async (err, list) => {
            if (err) {
                adapter.log.error(err);
            } else {
                for (const i in list) {
                    const resID = list[i]._id;
                    const objectID = resID.split('.');
                    const resultID = objectID[3];

                    await adapter.getState(`info.${resultID}`, async (err, state) => {
                        if (state && state.val) {
                            json[`${resultID}`] = state.val;
                        }
                    });
                }
            }
            await adapter.getForeignObjects(adapter.namespace + '.data.*', 'state', async (err, list) => {
                if (err) {
                    adapter.log.error(err);
                } else {
                    let num = 0;
                    for (const i in list) {
                        num++;
                        const resID = list[i]._id;
                        const objectID = resID.split('.');
                        const resultID = objectID[3];

                        await adapter.getState(`data.${resultID}`, async (err, state) => {
                            if (state && state.val >= 0) {
                                json[`${resultID}`] = state.val;
                            }
                        });
                        if (num == Object.keys(list).length) {
                            // @ts-ignore
                            createTimer = setTimeout(async () => resolve(json), 2000);
                        }
                    }
                }
            });
        });
    });
}

async function setDayHistory() {
    try {
        await adapter.getStateAsync('history.yield_6_days_ago', async (err, state) => {
            if (state && state.val >= 0) {
                await adapter.setStateAsync('history.yield_7_days_ago', state.val, true);
            }
            await adapter.getStateAsync('history.yield_5_days_ago', async (err, state) => {
                if (state && state.val >= 0) {
                    await adapter.setStateAsync('history.yield_6_days_ago', state.val, true);
                }
                await adapter.getStateAsync('history.yield_4_days_ago', async (err, state) => {
                    if (state && state.val >= 0) {
                        await adapter.setStateAsync('history.yield_5_days_ago', state.val, true);
                    }
                    await adapter.getStateAsync('history.yield_3_days_ago', async (err, state) => {
                        if (state && state.val >= 0) {
                            await adapter.setStateAsync('history.yield_4_days_ago', state.val, true);
                        }
                        await adapter.getStateAsync('history.yield_2_days_ago', async (err, state) => {
                            if (state && state.val >= 0) {
                                await adapter.setStateAsync('history.yield_3_days_ago', state.val, true);
                            }
                            await adapter.getStateAsync('history.yield_1_days_ago', async (err, state) => {
                                if (state && state.val >= 0) {
                                    await adapter.setStateAsync('history.yield_2_days_ago', state.val, true);
                                }
                                await adapter.getStateAsync('data.yieldtoday', async (err, state) => {
                                    if (state && state.val >= 0) {
                                        await adapter.setStateAsync('history.yield_1_days_ago', state.val, true);
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    } catch (err) {
        adapter.log.warn(err)
    }
}

async function main() {

    let _isNight = false;

    adapter.log.debug('Solax is started');

    await getSystemData();
    _isNight = await nightCalc(_isNight);
    await sunPos();

    schedule.cancelJob('requestInterval');
    schedule.cancelJob('dayHistory');

    if (adapter.config.apiToken && adapter.config.serialNumber) {
        fillData();

        const requestInterval = adapter.config.requestInterval || 5;
        adapter.log.debug(`Request Interval: ${requestInterval} minute(s)`);

        schedule.scheduleJob('requestInterval', `20 */${requestInterval} * * * *`, async () => {

            _isNight = await nightCalc(_isNight);
            await sunPos();
            adapter.log.debug('is Night: ' + _isNight)

            if (!_isNight) {
                adapter.log.debug('API Request started ...');
                fillData();
            }
        });

        schedule.scheduleJob('dayHistory', '40 59 23 * * *', async () => await setDayHistory());
    } else {
        adapter.log.warn('system settings cannot be called up. Please check configuration!');
    }
}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    module.exports = startAdapter;
} else {
    startAdapter();
}