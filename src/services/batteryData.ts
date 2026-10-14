/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Deterministic Seeded Prototype Battery Dataset
 * Engineering parameters calibrated to realistic 800V EV traction battery.
 */

import { BatteryPack, BatteryModule, BatteryCell, DiagnosticEvent } from '../types/battery';

export function createInitialBatteryPack(withFaults: boolean = false): BatteryPack {
  const modules: BatteryModule[] = [];
  let globalCellCounter = 1;

  for (let m = 1; m <= 8; m++) {
    const moduleId = `MOD-0${m}`;
    const cells: BatteryCell[] = [];
    const isModule3 = m === 3;
    const isModule7 = m === 7;

    for (let c = 1; c <= 12; c++) {
      const cellNum = globalCellCounter++;
      const cellId = `C-${String(cellNum).padStart(3, '0')}`;
      
      // Determine if this is the benchmark anomaly cell C-017
      const isC017 = cellId === 'C-017';
      const isC042 = cellId === 'C-042';

      // Physical placement in 3D grid
      const gridX = ((m - 1) % 4) * 3 + ((c - 1) % 3);
      const gridZ = Math.floor((m - 1) / 4) * 4 + Math.floor((c - 1) / 3);
      const gridY = 0;

      // Realistic cell electro-thermal values with slight physical distribution
      const baseVariation = Math.sin(cellNum * 1.7) * 0.006;
      let voltage = 3.824 + baseVariation;
      let temperature = 34.6 + Math.cos(cellNum * 0.9) * 0.8;
      let soc = 74.2 + Math.sin(cellNum * 0.5) * 0.7;
      let soh = 91.4 - (cellNum % 5) * 0.2;
      let internalResistance = 2.14 + (cellNum % 7) * 0.03;
      let diagnosticState: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
      let predictedRul = 1284 - Math.floor((cellNum % 6) * 12);

      // Only inject fault states if withFaults is explicitly true
      if (withFaults) {
        if (isC017) {
          // Benchmark Cell C-017: localized thermal excursion and contact resistance growth
          voltage = 3.778;
          temperature = 41.7; // Exceeds threshold (+6.5°C)
          soc = 71.8;
          soh = 84.1;
          internalResistance = 3.42; // High resistance (+1.28 mΩ)
          diagnosticState = 'WARNING';
          predictedRul = 940;
        } else if (isC042) {
          voltage = 3.791;
          temperature = 36.8;
          soc = 72.1;
          soh = 87.2;
          internalResistance = 2.85;
          diagnosticState = 'WARNING';
          predictedRul = 1080;
        } else if (isModule3) {
          temperature += 1.8;
        } else if (isModule7) {
          soh -= 1.6;
        }
      } cells.push({
        id: cellId,
        moduleId,
        moduleIndex: m,
        cellIndex: c,
        position: { gridX, gridY, gridZ },
        voltage: Number(voltage.toFixed(3)),
        current: -42.5, // 42.5A discharge rate
        temperature: Number(temperature.toFixed(1)),
        soc: Number(soc.toFixed(1)),
        soh: Number(soh.toFixed(1)),
        internalResistance: Number(internalResistance.toFixed(2)),
        cycleCount: 716,
        capacityAh: Number((65.0 * (soh / 100)).toFixed(2)),
        nominalCapacityAh: 65.0,
        degradationIndex: Number(((100 - soh) / 100).toFixed(3)),
        predictedRul,
        diagnosticState,
        measuredVoltage: Number(voltage.toFixed(3)),
        estimatedVoltage: Number((voltage - 0.002).toFixed(3)),
      });
    }

    // Module aggregations
    const voltages = cells.map(c => c.voltage);
    const temps = cells.map(c => c.temperature);
    const sohs = cells.map(c => c.soh);
    const socs = cells.map(c => c.soc);

    const avgVoltage = Number((voltages.reduce((a, b) => a + b, 0) / cells.length).toFixed(3));
    const minVoltage = Math.min(...voltages);
    const maxVoltage = Math.max(...voltages);
    const voltageSpread = Number(((maxVoltage - minVoltage) * 1000).toFixed(1)); // mV

    const avgTemperature = Number((temps.reduce((a, b) => a + b, 0) / cells.length).toFixed(1));
    const maxTemperature = Math.max(...temps);
    const temperatureSpread = Number((maxTemperature - Math.min(...temps)).toFixed(1));

    const avgSoh = Number((sohs.reduce((a, b) => a + b, 0) / cells.length).toFixed(1));
    const avgSoc = Number((socs.reduce((a, b) => a + b, 0) / cells.length).toFixed(1));

    const hasWarning = cells.some(c => c.diagnosticState === 'WARNING');
    const diagnosticState = hasWarning ? 'WARNING' : 'NORMAL';

    modules.push({
      id: moduleId,
      name: `Module 0${m}`,
      moduleIndex: m,
      cellCount: cells.length,
      cells,
      avgVoltage,
      minVoltage,
      maxVoltage,
      voltageSpread,
      avgTemperature,
      maxTemperature,
      temperatureSpread,
      avgSoc,
      avgSoh,
      diagnosticState,
    });
  }

  // Pack aggregations
  const allCells = modules.flatMap(m => m.cells);
  const allTemps = allCells.map(c => c.temperature);
  const allVolts = allCells.map(c => c.voltage);

  const packVoltage = Number((modules.reduce((sum, m) => sum + m.avgVoltage * 12, 0)).toFixed(1)); // ~367V - 768V nominal
  const avgSoc = Number((allCells.reduce((a, b) => a + b.soc, 0) / allCells.length).toFixed(1));
  const avgSoh = Number((allCells.reduce((a, b) => a + b.soh, 0) / allCells.length).toFixed(1));
  const maxCellTemp = Math.max(...allTemps);
  const minCellTemp = Math.min(...allTemps);
  const maxCellVolt = Math.max(...allVolts);
  const minCellVolt = Math.min(...allVolts);
  const voltageSpread = Number(((maxCellVolt - minCellVolt) * 1000).toFixed(1)); // mV
  const hasPackWarning = allCells.some(c => c.diagnosticState === 'WARNING');

  return {
    id: 'DS-EVBAT-001',
    name: 'DSimulate EV Traction Pack 800V',
    architecture: '800V High-Voltage · 96S Prismatic Array · 8 Modules',
    nominalVoltage: 768,
    packVoltage,
    packCurrent: -128.4,
    nominalCapacityKWh: 82.5,
    measuredCapacityKWh: 75.24,
    avgSoc,
    avgSoh,
    temperature: Number((allTemps.reduce((a, b) => a + b, 0) / allTemps.length).toFixed(1)),
    maxCellTemp,
    minCellTemp,
    maxCellVolt,
    minCellVolt,
    voltageSpread,
    cycleCount: 716,
    predictedRul: 1284,
    operatingHours: 2418,
    diagnosticState: hasPackWarning ? 'WARNING' : 'NORMAL',
    modules,
  };
}

export function injectFaultsIntoPack(pack: BatteryPack): BatteryPack {
  const updatedModules = pack.modules.map(m => {
    const isMod3 = m.id === 'MOD-03';
    const updatedCells = m.cells.map(c => {
      if (c.id === 'C-017') {
        return {
          ...c,
          temperature: 41.7,
          voltage: 3.778,
          internalResistance: 3.42,
          soc: 71.8,
          soh: 84.1,
          diagnosticState: 'WARNING' as const,
        };
      }
      if (c.id === 'C-042') {
        return {
          ...c,
          temperature: 36.8,
          voltage: 3.791,
          internalResistance: 2.85,
          diagnosticState: 'WARNING' as const,
        };
      }
      return c;
    });

    const hasWarning = updatedCells.some(c => c.diagnosticState === 'WARNING') || isMod3;
    return {
      ...m,
      cells: updatedCells,
      diagnosticState: hasWarning ? ('WARNING' as const) : ('NORMAL' as const),
      maxTemperature: Math.max(...updatedCells.map(c => c.temperature)),
    };
  });

  return {
    ...pack,
    diagnosticState: 'WARNING',
    maxCellTemp: 41.7,
    modules: updatedModules,
  };
}

export function clearFaultsFromPack(pack: BatteryPack): BatteryPack {
  const updatedModules = pack.modules.map(m => {
    const updatedCells = m.cells.map(c => {
      if (c.id === 'C-017' || c.id === 'C-042') {
        return {
          ...c,
          temperature: 34.6,
          voltage: 3.824,
          internalResistance: 2.14,
          soc: 74.2,
          soh: 91.4,
          diagnosticState: 'NORMAL' as const,
        };
      }
      return {
        ...c,
        diagnosticState: 'NORMAL' as const,
      };
    });

    return {
      ...m,
      cells: updatedCells,
      diagnosticState: 'NORMAL' as const,
      maxTemperature: Math.max(...updatedCells.map(c => c.temperature)),
    };
  });

  return {
    ...pack,
    diagnosticState: 'NORMAL',
    maxCellTemp: 35.4,
    modules: updatedModules,
  };
}

export const INITIAL_DIAGNOSTIC_EVENTS: DiagnosticEvent[] = [
  {
    id: 'D-003',
    objectId: 'C-017',
    objectType: 'CELL',
    parameter: 'Cell Surface Temperature',
    observed: '41.7°C',
    expected: '35.2°C',
    unit: '°C',
    deviation: '+6.5°C',
    severity: 'WARNING',
    status: 'ACTIVE',
    cycle: 716,
    timestamp: '2026-10-08 08:04:12',
    description: 'Cell C-017 temperature exceeds module mean by >5.0°C under 1.5C continuous discharge.',
    rootCause: 'Elevated tab weld contact resistance causing localized Joule dissipation (I²R_contact).',
  },
  {
    id: 'D-004',
    objectId: 'C-017',
    objectType: 'CELL',
    parameter: 'Internal DC Resistance (R0)',
    observed: '3.42 mΩ',
    expected: '2.14 mΩ',
    unit: 'mΩ',
    deviation: '+1.28 mΩ',
    severity: 'WARNING',
    status: 'ACTIVE',
    cycle: 716,
    timestamp: '2026-10-08 08:04:12',
    description: 'Equivalent circuit ohmic resistance R0 exceeds upper 3-sigma tolerance limit (+59.8%).',
    rootCause: 'Accelerated Solid Electrolyte Interphase (SEI) growth and cathode particle micro-cracking.',
  },
  {
    id: 'D-002',
    objectId: 'MOD-03',
    objectType: 'MODULE',
    parameter: 'Thermal Gradient (ΔT)',
    observed: '6.9°C',
    expected: '≤ 3.0°C',
    unit: '°C',
    deviation: '+3.9°C',
    severity: 'WARNING',
    status: 'ACTIVE',
    cycle: 716,
    timestamp: '2026-10-08 07:51:00',
    description: 'Module 03 cross-plane thermal gradient exceeds allowable thermal management threshold.',
    rootCause: 'Cell C-017 heat dissipation coupled with localized coolant channel micro-restriction.',
  },
  {
    id: 'D-005',
    objectId: 'C-042',
    objectType: 'CELL',
    parameter: 'Cell Loaded Voltage',
    observed: '3.791 V',
    expected: '3.824 V',
    unit: 'V',
    deviation: '-33 mV',
    severity: 'WARNING',
    status: 'ACTIVE',
    cycle: 716,
    timestamp: '2026-10-08 07:44:30',
    description: 'Transient voltage sag exceeds module median by 33 mV during 200A peak draw.',
    rootCause: 'Charge transfer resistance R_ct elevation following rapid cold-weather charge cycle.',
  },
  {
    id: 'D-006',
    objectId: 'MOD-07',
    objectType: 'MODULE',
    parameter: 'SOH Dispersion Index',
    observed: '88.9%',
    expected: '91.5%',
    unit: '%',
    deviation: '-2.6%',
    severity: 'WARNING',
    status: 'ACTIVE',
    cycle: 716,
    timestamp: '2026-10-07 19:22:15',
    description: 'Module 07 state of health tracking deviates from fleet degradation regression curve.',
    rootCause: 'Historical exposure to higher ambient temperatures near rear axle inverter assembly.',
  },
  {
    id: 'D-001',
    objectId: 'DS-EVBAT-001',
    objectType: 'PACK',
    parameter: 'High-Voltage Bus Isolation',
    observed: '24.8 MΩ',
    expected: '≥ 10.0 MΩ',
    unit: 'MΩ',
    deviation: 'Nominal',
    severity: 'NORMAL',
    status: 'RESOLVED',
    cycle: 716,
    timestamp: '2026-10-07 12:00:00',
    description: 'Isolation resistance test between positive/negative DC busbars and chassis ground.',
    rootCause: 'Normal dielectric integrity verified across all contactors.',
  },
];
