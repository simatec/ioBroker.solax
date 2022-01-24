'use strict';

const cloudDataObjects = {
    'acpower': {
        'type': 'state',
        'common': {
            'role': 'value.power',
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
            'role': 'value.power.consumption',
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
            'role': 'value.power.consumption',
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
            'role': 'value.power',
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
            'role': 'value.power.consumption',
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
            'role': 'value.power.consumption',
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
            'role': 'value.power',
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
            'role': 'value',
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
            'role': 'value.power',
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
            'role': 'value.power',
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
            'role': 'value.power',
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
            'role': 'value.power',
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
            'role': 'value.power',
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
            'role': 'value.power',
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
            'role': 'value.power',
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
            'role': 'value.power',
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

const infoObjects = {
    'success': {
        'type': 'state',
        'common': {
            'role': 'indicator.state',
            'name': 'API success',
            'type': 'boolean',
            'read': true,
            'write': false,
            'def': false
        },
        'native': {}
    },
    'exception': {
        'type': 'state',
        'common': {
            'role': 'text',
            'name': 'API connection',
            'type': 'string',
            'read': true,
            'write': false,
            'def': ''
        },
        'native': {}
    },
    'inverterSN': {
        'type': 'state',
        'common': {
            'role': 'text',
            'name': 'Unique identifier of inverter (Serial No.)',
            'type': 'string',
            'read': true,
            'write': false,
            'def': ''
        },
        'native': {}
    },
    'sn': {
        'type': 'state',
        'common': {
            'role': 'text',
            'name': 'Unique identifier of communication module (Registration No.)',
            'type': 'string',
            'read': true,
            'write': false,
            'def': ''
        },
        'native': {}
    },
    'inverterType': {
        'type': 'state',
        'common': {
            'role': 'text',
            'name': 'Inverter type',
            'type': 'string',
            'read': true,
            'write': false,
            'def': ''
        },
        'native': {}
    },
    'inverterStatus': {
        'type': 'state',
        'common': {
            'role': 'text',
            'name': 'Inverter status',
            'type': 'string',
            'read': true,
            'write': false,
            'def': ''
        },
        'native': {}
    },
    'uploadTime': {
        'type': 'state',
        'common': {
            'role': 'value.time',
            'name': 'Update time',
            'type': 'string',
            'read': true,
            'write': false,
            'def': ''
        },
        'native': {}
    },
    'connectType': {
        'type': 'state',
        'common': {
            'role': 'text',
            'name': 'Connect Type for Request',
            'type': 'string',
            'read': true,
            'write': false,
            'def': ''
        },
        'native': {}
    },
    'online': {
        'type': 'state',
        'common': {
            'role': 'switch',
            'name': 'Inverter Online',
            'type': 'boolean',
            'read': true,
            'write': false
        },
        'native': {}
    }
}

const specialObjects = {
    'json': {
        'type': 'state',
        'common': {
            'name': 'json data',
            'type': 'string',
            'role': 'json',
            'read': true,
            'write': false
        },
        'native': {}
    }
}

/********************** Create Objects before Cloud Request *********************/

async function createdDataStates(api, adapter) {
    return new Promise(async (resolve) => {
        for (const obj in cloudDataObjects) {
            if (api.result[`${obj}`] || obj == 'yieldtoday') {
                await adapter.setObjectNotExistsAsync('data.' + obj, cloudDataObjects[obj]);
            } else if (!api.result[`${obj}`]) {
                delete api.result[`${obj}`];
            }
        }
        await sleep(2000);
        resolve(api);
    });
}

/********************** Create Info Objects *********************/

async function createdInfoStates(adapter, connectType) {
    return new Promise(async (resolve) => {
        for (const obj in infoObjects) {
            if ((obj != 'online' && connectType == 'cloud') || (obj != 'success' && obj != 'exception' && connectType == 'local')) {
                await adapter.setObjectNotExistsAsync('info.' + obj, infoObjects[obj]);
            }
        }
        await sleep(2000);
        // @ts-ignore
        resolve();
    });
}

/********************** Create Info Objects *********************/

async function createdSpecialStates(adapter) {
    return new Promise(async (resolve) => {
        for (const obj in specialObjects) {
            await adapter.setObjectNotExistsAsync('data.' + obj, specialObjects[obj]);
        }
        await sleep(2000);
        // @ts-ignore
        resolve();
    });
}

/********************** Create History Objects *********************/

async function createdHistoryStates(adapter, historyDays) {
    historyDays;
    for (let c = 0; c < historyDays; c++) {
        const _historyDays = c + 1;

        await adapter.setObjectNotExistsAsync(`history.yield_${_historyDays}_days_ago`, {
            'type': 'state',
            'common': {
                'role': 'value.power.consumption',
                'name': `Inverter AC-Energy ${_historyDays} days ago`,
                'type': 'number',
                'read': true,
                'write': false,
                'unit': 'KWh',
                'def': 0
            },
            'native': {}
        });
    }
}

let timerSleep;

async function sleep(ms) {
    return new Promise(async (resolve) => {
        // @ts-ignore
        timerSleep = setTimeout(async () => resolve(), ms);
    });
}

module.exports = {
    createdDataStates,
    createdInfoStates,
    createdSpecialStates,
    createdHistoryStates
};