'use strict';

// @ts-ignore
const utils = require('@iobroker/adapter-core');
// @ts-ignore
const axios = require('axios').default;
// @ts-ignore
const schedule = require('node-schedule');

let replayTime;

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
                callback();
            } catch (e) {
                callback();
            }
        },
    }));
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

let num = 0;

async function requestAPI() {
    return new Promise(async (resolve, reject) => {
        adapter.log.debug('API Request started ...');

        //const solaxURL = (`https://www.eu.solaxcloud.com:9443/proxy/api/getRealtimeInfo.do?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);
        const solaxURL = (`https://www.solaxcloud.com:9443/proxy/api/getRealtimeInfo.do?tokenId=${adapter.config.apiToken}&sn=${adapter.config.serialNumber}`);
        try {
            const solaxRequest = await axios({
                method: 'get',
                baseURL: solaxURL,
                timeout: 1500,
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
                adapter.log.debug(`${num}. request attempt: ${solaxRequest.data.result ? solaxRequest.data.result : ''}`)
                replayTime = setTimeout(async () => {
                    return await fillData();
                }, 5000);
            } else if (num > 5) {
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
    return new Promise(async (resolve, reject) => {
        try {
            const solaxRequest = await requestAPI();

            if (solaxRequest.data && solaxRequest.data.result && solaxRequest.data.success === true) {
                adapter.log.info('API Request successfully completed');

                adapter.log.debug('solaxRequest.data: ' + JSON.stringify(solaxRequest.data));

                const inverterState = await setInverterstate(solaxRequest.data.result.inverterStatus);
                const inverterType = await setInverterType(solaxRequest.data.result.inverterType);

                // set State for inverter informations
                await adapter.setStateAsync('info.exception', solaxRequest.data.exception, true);
                await adapter.setStateAsync('info.inverterSN', solaxRequest.data.result.inverterSN ? solaxRequest.data.result.inverterSN : 'unknown', true);
                await adapter.setStateAsync('info.sn', solaxRequest.data.result.sn ? solaxRequest.data.result.sn : 'unknown', true);

                await adapter.setStateAsync('info.inverterType', inverterType, true);
                await adapter.setStateAsync('info.inverterStatus', inverterState, true);
                await adapter.setStateAsync('info.uploadTime', solaxRequest.data.result.uploadTime ? solaxRequest.data.result.uploadTime : 'unknown', true);

                await adapter.setStateAsync('info.success', solaxRequest.data.success, true);

                // set State for inverter data
                await adapter.setStateAsync('data.acpower', solaxRequest.data.result.acpower ? solaxRequest.data.result.acpower : 0, true);
                await adapter.setStateAsync('data.yieldtoday', solaxRequest.data.result.yieldtoday ? solaxRequest.data.result.yieldtoday : 0, true);
                await adapter.setStateAsync('data.yieldtotal', solaxRequest.data.result.yieldtotal ? solaxRequest.data.result.yieldtotal : 0, true);

                await adapter.setStateAsync('data.feedinpower', solaxRequest.data.result.feedinpower ? solaxRequest.data.result.feedinpower : 0, true);
                await adapter.setStateAsync('data.feedinenergy', solaxRequest.data.result.feedinenergy ? solaxRequest.data.result.feedinenergy : 0, true);
                await adapter.setStateAsync('data.consumeenergy', solaxRequest.data.result.consumeenergy ? solaxRequest.data.result.consumeenergy : 0, true);

                await adapter.setStateAsync('data.feedinpowerM2', solaxRequest.data.result.feedinpowerM2 ? solaxRequest.data.result.feedinpowerM2 : 0, true);
                await adapter.setStateAsync('data.soc', solaxRequest.data.result.soc ? solaxRequest.data.result.soc : 0, true);
                await adapter.setStateAsync('data.peps1', solaxRequest.data.result.peps1 ? solaxRequest.data.result.peps1 : 0, true);

                await adapter.setStateAsync('data.peps2', solaxRequest.data.result.peps2 ? solaxRequest.data.result.peps2 : 0, true);
                await adapter.setStateAsync('data.peps3', solaxRequest.data.result.peps3 ? solaxRequest.data.result.peps3 : 0, true);
                await adapter.setStateAsync('data.batPower', solaxRequest.data.result.batPower ? solaxRequest.data.result.batPower : 0, true);

                await adapter.setStateAsync('data.powerdc1', solaxRequest.data.result.powerdc1 ? solaxRequest.data.result.powerdc1 : 0, true);
                await adapter.setStateAsync('data.powerdc2', solaxRequest.data.result.powerdc2 ? solaxRequest.data.result.powerdc2 : 0, true);
                await adapter.setStateAsync('data.powerdc3', solaxRequest.data.result.powerdc3 ? solaxRequest.data.result.powerdc3 : 0, true);
                await adapter.setStateAsync('data.powerdc4', solaxRequest.data.result.powerdc4 ? solaxRequest.data.result.powerdc4 : 0, true);

                // created json
                let json = ({
                    "inverterStatus": inverterState,
                    "uploadTime": solaxRequest.data.result.uploadTime,
                    "acpower": solaxRequest.data.result.acpower,
                    "yieldtoday": solaxRequest.data.result.yieldtoday,
                    "yieldtotal": solaxRequest.data.result.yieldtotal,
                    "feedinpower": solaxRequest.data.result.feedinpower,
                    "feedinenergy": solaxRequest.data.result.feedinenergy,
                    "consumeenergy": solaxRequest.data.result.consumeenergy,
                    "feedinpowerM2": solaxRequest.data.result.feedinpowerM2,
                    "soc": solaxRequest.data.result.soc,
                    "peps1": solaxRequest.data.result.peps1,
                    "peps2": solaxRequest.data.result.peps2,
                    "peps3": solaxRequest.data.result.peps3,
                    "powerdc1": solaxRequest.data.result.powerdc1,
                    "powerdc2": solaxRequest.data.result.powerdc2,
                    "powerdc3": solaxRequest.data.result.powerdc3,
                    "powerdc4": solaxRequest.data.result.powerdc4,
                    "batPower": solaxRequest.data.result.batPower
                });

                await adapter.setStateAsync('data.json', JSON.stringify(json), true);
            } else {
                await adapter.setStateAsync('info.success', false, true);
                adapter.log.debug(`SolaX API is currently unavailable: ${solaxRequest.data.result ? solaxRequest.data.result : ''}`);
            }
        } catch (err) {
            adapter.log.warn('request error: ' + err);
        }
        // @ts-ignore
        resolve();
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
    adapter.log.debug('Solax is started');

    schedule.cancelJob('requestInterval');
    schedule.cancelJob('dayHistory');

    if (adapter.config.apiToken && adapter.config.serialNumber) {
        fillData();

        const requestInterval = adapter.config.requestInterval || 5;
        adapter.log.debug(`Request Interval: ${requestInterval} minute(s)`);

        schedule.scheduleJob('requestInterval', `20 */${requestInterval} * * * *`, async () => fillData());
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