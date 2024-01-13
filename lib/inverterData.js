'use strict';

/**************************** Inverter Types ***************************/
// 1: X1 mini
// 2: X1 boost
// 3: X3-Hybiyd/Fit / X3-20K/30K / X3-MIC/PRO
// 4: X3-Hybrid-G4
// 5: X3-MIC/PRO-G2
// 6: X1-Hybrid-G4
// 7: X1/X3-EVC Wallbox
/***********************************************************************/

class inverterData {
    getRootData() {
        return new Promise(async (resolve) => {
            const root_dataPoints = {
                type: { name: 'info.inverterType', description: 'Inverter Type', type: 'string', role: 'text' },
                sn: { name: 'info.sn', description: 'Unique identifier of communication module (Registration No.)', type: 'string', role: 'text' },
                ver: { name: 'info.firmwareVersion', description: 'Firmware of communication module', type: 'string', role: 'text' },
            };
            resolve(root_dataPoints);
        });
    }

    getInformationData() {
        return new Promise(async (resolve) => {
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
                },
                5: { /***************************************** X3-MIC/PRO-G2 ***************************************/
                    0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
                    2: { name: 'info.inverterSN', description: 'Unique identifier of inverter (Serial No.)', type: 'string', role: 'text' },
                },
                6: { /***************************************** X1-Hybrid-G4 ***************************************/
                    0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
                    2: { name: 'info.inverterSN', description: 'Unique identifier of inverter (Serial No.)', type: 'string', role: 'text' },
                },
                7: { /***************************************** X1/X3-EVC ***************************************/
                    0: { name: 'info.totalSize', description: 'Total Size of Power', type: 'number', unit: 'kW', role: 'value.power' },
                    2: { name: 'info.chargerSN', description: 'Unique identifier of charger (Serial No.)', type: 'string', role: 'text' },
                    4: { name: 'info.version', description: 'Version', type: 'string', role: 'text' },
                }
            };
            resolve(information_dataPoints);
        });
    }

    getInverterData() {
        return new Promise(async (resolve) => {
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
                    108: { name: 'data.feedinpowerM2', description: 'Feed in Power M2', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // Feed in Power: (561,'W')

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
                    23: { name: 'data.voltageeps1', description: 'EPS 1 Voltage', type: 'number', multiplier: 0.1, unit: 'W', role: 'value.power' }, // EPS 1 Voltage
                    24: { name: 'data.voltageeps2', description: 'EPS 2 Voltage', type: 'number', multiplier: 0.1, unit: 'W', role: 'value.power' }, // EPS 2 Voltage
                    25: { name: 'data.voltageeps3', description: 'EPS 3 Voltage', type: 'number', multiplier: 0.1, unit: 'W', role: 'value.power' }, // EPS 3 Voltage
                    26: { name: 'data.currenteps1', description: 'EPS 1 Current', type: 'number', maxValue: 32768, multiplier: 0.1, unit: 'W', role: 'value.power' }, // EPS 1 Current
                    27: { name: 'data.currenteps2', description: 'EPS 2 Current', type: 'number', maxValue: 32768, multiplier: 0.1, unit: 'W', role: 'value.power' }, // EPS 2 Current
                    28: { name: 'data.currenteps3', description: 'EPS 3 Current', type: 'number', maxValue: 32768, multiplier: 0.1, unit: 'W', role: 'value.power' }, // EPS 3 Current
                    29: { name: 'data.powereps1', description: 'EPS 1 Power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // EPS 1 Power
                    30: { name: 'data.powereps2', description: 'EPS 2 Power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // EPS 2 Power
                    31: { name: 'data.powereps3', description: 'EPS 3 Power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // EPS 3 Power
                    34: { name: 'data.feedinpower', description: 'Feed in Power M1', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // Feed in Power: (561,'W'),
                    39: { name: 'data.batteryVoltage', description: 'battery voltage', type: 'number', multiplier: 0.01, unit: 'V', role: 'value.power' }, // 'Battery DC Voltage',
                    40: { name: 'data.batteryCurrent', description: 'battery current', type: 'number', maxValue: 32768, multiplier: 0.01, unit: 'A', role: 'value.power' }, // 'Battery Current,
                    41: { name: 'data.batteryPower', description: 'battery power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'Battery Power,
                    46: { name: 'data.cpuTemperature', description: 'CPU temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // 'CPU Temperature,
                    47: { name: 'data.powerConsumer', description: 'Consumer power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'Consumer Power  ,   
                    54: { name: 'data.inverterTemperature', description: 'Inverter temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Inverter Temperature,
                    68: { name: 'data.yieldtotal', description: 'Inverter AC-Energy out total', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Energy': (19, 'kWh'),
                    69: { name: 'data.yieldtotalOverflow', description: 'Inverter AC-Energy out total Overflow', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Energy': (19, 'kWh'),
                    70: { name: 'data.yieldtoday', description: 'Inverter AC-Energy out Daily', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Today's Energy': (21, 'kWh'),
                    71: { name: 'data.totalBatteryInputFromGrid', description: 'Total Battery Input from Grid', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Total Battery Input from Grid,
                    74: { name: 'data.totalBatteryDischargeEnergy', description: 'Total Battery Discharge Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Total Battery Discharge Energy
                    75: { name: 'data.totalBatteryDischargeEnergyOverflow', description: 'Total Battery Discharge Energy Overflow', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Total Battery Discharge Energy
                    76: { name: 'data.totalBatteryChargeEnergy', description: 'Total Battery Charge Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Total Battery Charge Energy
                    77: { name: 'data.totalBatteryChargeEnergyOverfow', description: 'Total Battery Charge Energy Overflow', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Total Battery Charge Energy
                    78: { name: 'data.todaysBatteryDischargeEnergy', description: 'Todays Battery Discharge Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Todays Battery Discharge Energy
                    79: { name: 'data.todaysBatteryChargeEnergy', description: 'Todays Battery Charge Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Todays Battery Charge Energy
                    80: { name: 'data.totalpvenergy', description: 'Total PV Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
                    81: { name: 'data.totalpvenergyOverflow', description: 'Total PV Energy Overflow', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
                    82: { name: 'data.pvenergy', description: 'PV Energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
                    86: { name: 'data.totalFeed', description: 'Total Feed-in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Feed-in Energy': (41, 'kWh'),
                    87: { name: 'data.totalFeedOverfow', description: 'Total Feed-in Energy Overfow', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Feed-in Energy': (41, 'kWh'),
                    88: { name: 'data.totalconsumption', description: 'Total Consumption', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
                    89: { name: 'data.totalconsumption', description: 'Total Consumption', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Consumption': (42, 'kWh'),
                    90: { name: 'data.feedinenergy', description: 'Feed in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Feed in Energy: (12.2,'kWh'),
                    91: { name: 'data.feedinenergyOverflow', description: 'Feed in Energy Overflow', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Feed in Energy: (12.2,'kWh'),
                    92: { name: 'data.consumeenergy', description: 'Consume Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Consume Energy: (7.8,'kWh'),
                    93: { name: 'data.consumeenergyOverfow', description: 'Consume Energy Overfow', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Consume Energy: (7.8,'kWh'),
                    103: { name: 'data.batteryCapacityRemainig', description: 'battery capacity remainig', type: 'number', unit: '%', role: 'value.power' }, // 'Battery Capacity Remainig,
                    105: { name: 'data.batteryTemperature', description: 'battery temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // 'Battery Temperature,
                    106: { name: 'data.batteryRemainingEnergy', description: 'Battery remaining energy', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Battery remaining energy
                    112: { name: 'data.batteryCellTemperatureMax', description: 'Battery Cell Temperature Max', type: 'number', multiplier: 0.1, unit: '°C', role: 'value.temperature' }, // Battery Cell Temperature Max,
                    113: { name: 'data.batteryCellTemperatureMin', description: 'Battery Cell Temperature Min', type: 'number', multiplier: 0.1, unit: '°C', role: 'value.temperature' }, // Battery Cell Temperature Min,
                    116: { name: 'data.batteryChargingCycles', description: 'battery charging cycles', type: 'number', role: 'indicator.state' }, // 'battery charging cycles,
                    125: { name: 'data.batteryCellVoltageMax', description: 'Battery Cell Voltage Max', type: 'number', multiplier: 0.001, unit: 'V', role: 'value.power' }, // Battery Cell Voltage Max,
                    126: { name: 'data.batteryCellVoltageMin', description: 'Battery Cell Voltage Min', type: 'number', multiplier: 0.001, unit: 'V', role: 'value.power' }, // Battery Cell Voltage Min,

                },
                5: { /****************************************** X3-MIC/PRO-G2 *****************************************/
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
                    9: { name: 'data.dcvoltage1', description: 'PV1 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV1 Voltage': (9, 'V'),
                    10: { name: 'data.dcvoltage2', description: 'PV2 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV2 Voltage': (9, 'V'),
                    11: { name: 'data.dcvoltage3', description: 'PV3 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // 'PV3 Voltage': (10, 'V'),
                    12: { name: 'data.dccurrent1', description: 'PV1 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV1 Current': (11, 'A'),
                    13: { name: 'data.dccurrent2', description: 'PV2 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV2 Current': (12, 'A'),
                    14: { name: 'data.dccurrent3', description: 'PV3 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // 'PV3 Current': (12, 'A'),
                    15: { name: 'data.dcpower1', description: 'PV1 Power', type: 'number', unit: 'W', role: 'value.power' }, // 'PV1 Power': (13, 'W'),
                    16: { name: 'data.dcpower2', description: 'PV2 Power', type: 'number', unit: 'W', role: 'value.power' }, // 'PV2 Power': (14, 'W'),
                    17: { name: 'data.dcpower3', description: 'PV3 Power', type: 'number', unit: 'W', role: 'value.power' }, // 'PV3 Power': (14, 'W'),
                    18: { name: 'data.acfrequency1', description: 'Grid Frequency 1', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 1': (15, 'Hz'),
                    19: { name: 'data.acfrequency2', description: 'Grid Frequency 2', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 2': (16, 'Hz'),
                    20: { name: 'data.acfrequency3', description: 'Grid Frequency 3', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // 'Grid Frequency 3': (17, 'Hz'),
                    21: { name: 'info.inverterStatus', description: 'Inverter Mode', type: 'string', role: 'text' }, // 'Inverter Mode': (18, ''),
                    22: { name: 'data.yieldtotal', description: 'Inverter AC-Energy out total', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Total Energy': (19, 'kWh'),
                    24: { name: 'data.yieldtoday', description: 'Inverter AC-Energy out Daily', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // 'Today's Energy': (21, 'kWh'),
                    72: { name: 'data.feedinpower', description: 'Feed in Power M1', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // Feed in Power: (561,'W'),
                    74: { name: 'data.feedinenergy', description: 'Feed in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Feed in Energy: (12.2,'kWh'),
                    76: { name: 'data.consumeenergy', description: 'Consume Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power' }, // Consume Energy: (7.8,'kWh'),
                    78: { name: 'data.acpower', description: 'Inverter AC-Power now', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // 'AC Power': (80, 'W'),
                },
                6: { /****************************************** X1-Hybrid-G4 *****************************************/
                    isOnline: { name: 'info.online', description: 'Inverter Online', type: 'boolean', role: 'switch' },
                    0: { name: 'data.acvoltage', description: 'AC Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // AC Voltage
                    1: { name: 'data.outputcurrent', description: 'Output Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // Output Current
                    2: { name: 'data.acpower', description: 'Inverter AC-Power total', type: 'number', unit: 'W', role: 'value.power' }, // AC Power
                    3: { name: 'data.gridfrequency', description: 'Grid Frequency', type: 'number', multiplier: 0.01, unit: 'Hz', role: 'value.power' }, // Grid Frequency
                    4: { name: 'data.voltagedc1', description: 'PV1 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // PV1 Voltage
                    5: { name: 'data.voltagedc2', description: 'PV2 Voltage', type: 'number', multiplier: 0.1, unit: 'V', role: 'value.power' }, // PV2 Voltage
                    6: { name: 'data.currentdc1', description: 'PV1 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // PV1 Current
                    7: { name: 'data.currentdc2', description: 'PV2 Current', type: 'number', multiplier: 0.1, unit: 'A', role: 'value.power' }, // PV2 Current
                    8: { name: 'data.powerdc1', description: 'Inverter DC PV power MPPT1', type: 'number', unit: 'W', role: 'value.power' }, // PV1 Power
                    9: { name: 'data.powerdc2', description: 'Inverter DC PV power MPPT2', type: 'number', unit: 'W', role: 'value.power' }, // PV2 Power
                    10: { name: 'info.inverterStatus', description: 'Inverter Mode', type: 'string', role: 'text' }, // Inverter Mode
                    11: { name: 'data.yieldtotal', description: 'Inverter AC-Energy out total', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Total Energy
                    13: { name: 'data.yieldtoday', description: 'Inverter AC-Energy out Daily', type: 'number', multiplier: 0.1, unit: 'kWh', role: 'value.power.consumption' }, // Today's Energy
                    14: { name: 'data.batteryVoltage', description: 'Battery Voltage', type: 'number', multiplier: 0.01, unit: 'V', role: 'value.power' }, // Battery Voltage
                    15: { name: 'data.batteryCurrent', description: 'Battery Current', type: 'number', multiplier: 0.01, unit: 'A', role: 'value.power' }, // Battery Current
                    16: { name: 'data.batteryPower', description: 'Battery Power', type: 'number', unit: 'W', role: 'value.power' }, // Battery Power
                    17: { name: 'data.batteryTemperature', description: 'Battery Temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // Battery temperature
                    18: { name: 'data.batterySoC', description: 'Battery SoC', type: 'number', unit: '%', role: 'value.power' }, // Battery Soc
                    32: { name: 'data.GridPower', description: 'Grid Power', type: 'number', maxValue: 32768, unit: 'W', role: 'value.power' }, // Grid Power
                    34: { name: 'data.feedinenergy', description: 'Feed in Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // Feed in Energy
                    36: { name: 'data.consumeenergy', description: 'Consume Energy', type: 'number', multiplier: 0.01, unit: 'kWh', role: 'value.power.consumption' }, // Consume Energy
                },
                7: {
                    isOnline: { name: 'info.online', description: 'Wallbox Online', type: 'boolean', role: 'switch' },
                    0: { name: 'data.plugstatus', description: 'Plug Status', type: 'string', role: 'text' }, // '0=Unplugged 1=Plugged 2=Charging': (0, ''), 
                    1: { name: 'data.chargemode', description: 'Charge Mode', type: 'string', role: 'text' }, // '0= Stop 1= Fast 2=Green 3=Eco': (1, ''), 
                    2: { name: 'data.acvoltage1', description: 'Grid Voltage 1', type: 'number', multiplier: 0.01, unit: 'V', role: 'value.power' }, // '': (2, 'V'), 
                    3: { name: 'data.acvoltage2', description: 'Grid Voltage 2', type: 'number', multiplier: 0.01, unit: 'V', role: 'value.power' }, // '': (3, 'V'), 
                    4: { name: 'data.acvoltage3', description: 'Grid Voltage 3', type: 'number', multiplier: 0.01, unit: 'V', role: 'value.power' }, // '': (4, 'V'), 
                    5: { name: 'data.accurrent1', description: 'AC Current 1', type: 'number', multiplier: 0.01, unit: 'A', role: 'value.power' }, // '': (5, 'A'), 
                    6: { name: 'data.accurrent2', description: 'AC Current 2', type: 'number', multiplier: 0.01, unit: 'A', role: 'value.power' }, // '': (6, 'A'), 
                    7: { name: 'data.accurrent3', description: 'AC Current 3', type: 'number', multiplier: 0.01, unit: 'A', role: 'value.power' }, // '': (7, 'A'), 
                    8: { name: 'data.acpower1', description: 'AC Power 1', type: 'number', unit: 'W', role: 'value.power' }, // '': (8, 'W'), 
                    9: { name: 'data.acpower2', description: 'AC Power 2', type: 'number', unit: 'W', role: 'value.power' }, // '': (9, 'W'), 
                    10: { name: 'data.acpower3', description: 'AC Power 3', type: 'number', unit: 'W', role: 'value.power' }, // '': (10, 'W'), 
                    11: { name: 'data.acpower', description: 'AC Power', type: 'number', unit: 'W', role: 'value.power' }, // '': (11, 'W'), 
                    12: { name: 'data.capacity', description: 'Carged Capacity', type: 'number', multiplier: 0.1, unit: 'KW/h', role: 'value.power.consumption' }, // '': (12, 'KW/h'), 
                    14: { name: 'data.totalcharged', description: 'Total Charged', type: 'number', multiplier: 0.1, unit: 'KW/h', role: 'value.power.consumption' }, // '': (14, 'KW/h'), 
                    23: { name: 'data.plugTemperature', description: 'Plug Temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // '': (23, ''), 
                    24: { name: 'data.boardTemperature', description: 'Board Temperature', type: 'number', unit: '°C', role: 'value.temperature' }, // '': (24, ''), 
                    26: { name: 'data.plugged', description: 'Car Plugged', type: 'number', role: 'indicator.state' }, // '': (26, ''), 
                    80: { name: 'data.chargeduration', description: 'Charge Duration', type: 'number', unit: 's', role: 'value.time' }, // '': (80, 's')
                }
            };
            resolve(data_dataPoints);
        });
    }

}

module.exports = inverterData;