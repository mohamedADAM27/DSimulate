/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Central Battery Digital Twin State Store
 */

import { useState, useEffect } from 'react';
import { 
  BatteryPack, 
  BatteryModule, 
  BatteryCell, 
  DiagnosticEvent, 
  VisualizationMode, 
  WorkspaceTab, 
  SimulationParams, 
  SimulationStepPoint, 
  WhatIfScenarioConfig, 
  ScenarioResult 
} from '../types/battery';
import { createInitialBatteryPack, INITIAL_DIAGNOSTIC_EVENTS, injectFaultsIntoPack, clearFaultsFromPack } from '../services/batteryData';
import { 
  runTimeDomainSimulation, 
  evaluateWhatIfScenario, 
  PRESET_SCENARIOS 
} from '../services/physicsEngine';

export interface BatteryStoreState {
  currentWorkspace: WorkspaceTab;
  batteryPack: BatteryPack;
  selectedObjectType: 'PACK' | 'MODULE' | 'CELL';
  selectedModuleId: string | null;
  selectedCellId: string | null;
  visualizationMode: VisualizationMode;
  explodeProgress: number; // 0.0 to 1.0
  sectionCutActive: boolean;
  wireframeActive: boolean;
  isolatedObjectId: string | null;
  cameraPreset: 'ISO' | 'TOP' | 'FRONT' | 'SIDE' | null;
  
  // Simulation Lifecycle & Diagnostics Sequencer
  simulationParams: SimulationParams;
  simulationHistory: SimulationStepPoint[];
  simulationRunning: boolean;
  simulationLifecycle: 'READY' | 'RUNNING' | 'COMPLETED';
  faultCellsIdentified: boolean;
  activeAlertsShown: boolean;
  simulationCurrentStep: number;
  timelineCycle: number; // e.g. 716
  
  // Diagnostics
  diagnosticEvents: DiagnosticEvent[];
  selectedDiagnosticId: string | null;
  
  // Fluid Flow & Thermal Simulation coupling
  coolantFlowVelocity: number;
  coolantFluidType: 'GLYCOL_WATER' | 'DIELECTRIC' | 'FORCED_AIR';
  coolantInletTemp: number;
  channelHydraulicDiamMm: number;
  channelGapMm: number;
  volumetricFlowRateLpm: number;
  pressureDropKpa: number;
  reynoldsNumber: number;
  calculatedHeatTransferCoeff: number;
  
  // What-If Lab
  whatIfConfig: WhatIfScenarioConfig;
  whatIfResult: ScenarioResult;
  comparisonResults: ScenarioResult[];

  // Battery Connection & Initialization Workflow
  isInitializingBattery: boolean;
  activeDataSource: 'CAN' | 'OBD' | 'OEM_API' | 'SYNTHETIC';
  activeVehicleInfo: {
    manufacturer: string;
    model: string;
    category: string;
    chemistry: string;
    packId: string;
    verified: boolean;
  } | null;

  // Battery Ledger & Historical Runs
  batteryLedger: BatteryLedgerEntry[];
}

export interface BatteryLedgerEntry {
  id: string;
  runId: string;
  timestamp: string;
  packId: string;
  vehicleName: string;
  driveCycle: string;
  durationSeconds: number;
  initialSoc: number;
  finalSoc: number;
  maxTemp: number;
  avgSoh: number;
  alertCount: number;
  status: 'COMPLETED' | 'CONVERGED' | 'WARNING';
}

const initialPack = createInitialBatteryPack(false);
const initialSimParams: SimulationParams = {
  initialSoc: 82.5,
  ambientTemp: 22.0,
  driveCycle: 'WLTP',
  fastChargeRatio: 20,
  coolingFlowRate: 10.0,
  dischargeDepth: 80,
  regenBraking: true,
  simulationDuration: 1800,
  currentCycle: 716,
};
const initialSimHistory = runTimeDomainSimulation(initialSimParams, 60);
const initialWhatIf = PRESET_SCENARIOS[0];
const initialWhatIfResult = evaluateWhatIfScenario(initialWhatIf);
const initialComparison = PRESET_SCENARIOS.map(evaluateWhatIfScenario);

let state: BatteryStoreState = {
  currentWorkspace: 'digital-twin',
  batteryPack: initialPack,
  selectedObjectType: 'PACK',
  selectedModuleId: null,
  selectedCellId: null,
  visualizationMode: 'NORMAL',
  explodeProgress: 0.0,
  sectionCutActive: false,
  wireframeActive: false,
  isolatedObjectId: null,
  cameraPreset: null,
  
  simulationParams: initialSimParams,
  simulationHistory: initialSimHistory,
  simulationRunning: false,
  simulationLifecycle: 'READY',
  faultCellsIdentified: false,
  activeAlertsShown: false,
  simulationCurrentStep: 0,
  timelineCycle: 716,
  
  diagnosticEvents: [],
  selectedDiagnosticId: null,
  
  coolantFlowVelocity: 2.15,
  coolantFluidType: 'GLYCOL_WATER',
  coolantInletTemp: 20.0,
  channelHydraulicDiamMm: 18.0,
  channelGapMm: 3.5,
  volumetricFlowRateLpm: 10.3,
  pressureDropKpa: 3.2,
  reynoldsNumber: 6420,
  calculatedHeatTransferCoeff: 850,
  
  whatIfConfig: initialWhatIf,
  whatIfResult: initialWhatIfResult,
  comparisonResults: initialComparison,

  isInitializingBattery: true,
  activeDataSource: 'SYNTHETIC',
  activeVehicleInfo: {
    manufacturer: 'Other / Custom Pack',
    model: 'DSimulate 800V Baseline',
    category: 'custom-pack',
    chemistry: 'NMC',
    packId: 'PACK-800V-BASE',
    verified: true,
  },
  batteryLedger: [
    {
      id: 'LEDGER-001',
      runId: 'RUN-WLTP-BASE',
      timestamp: '2026-10-14 09:30:15',
      packId: 'PACK-800V-BASE',
      vehicleName: 'DSimulate 800V Baseline',
      driveCycle: 'WLTP Standard Dynamic',
      durationSeconds: 1800,
      initialSoc: 82.5,
      finalSoc: 74.2,
      maxTemp: 41.7,
      avgSoh: 94.6,
      alertCount: 2,
      status: 'CONVERGED',
    },
    {
      id: 'LEDGER-002',
      runId: 'RUN-US06-STRESS',
      timestamp: '2026-10-14 08:15:42',
      packId: 'PACK-800V-BASE',
      vehicleName: 'DSimulate 800V Baseline',
      driveCycle: 'US06 Aggressive Highway',
      durationSeconds: 600,
      initialSoc: 90.0,
      finalSoc: 68.4,
      maxTemp: 47.3,
      avgSoh: 94.6,
      alertCount: 4,
      status: 'WARNING',
    },
    {
      id: 'LEDGER-003',
      runId: 'RUN-CHARGING-PULSE',
      timestamp: '2026-10-13 16:45:10',
      packId: 'PACK-800V-BASE',
      vehicleName: 'DSimulate 800V Baseline',
      driveCycle: 'High-C Fast Charge Pulse',
      durationSeconds: 1200,
      initialSoc: 20.0,
      finalSoc: 78.5,
      maxTemp: 43.1,
      avgSoh: 94.8,
      alertCount: 1,
      status: 'COMPLETED',
    },
  ],
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export const batteryStore = {
  getState: () => state,

  setIsInitializingBattery: (open: boolean) => {
    state = { ...state, isInitializingBattery: open };
    notify();
  },

  setInitializedBatteryPack: (
    pack: BatteryPack,
    diagnostics: DiagnosticEvent[],
    vehicleInfo: {
      manufacturer: string;
      model: string;
      category: string;
      chemistry: string;
      packId: string;
      verified: boolean;
    },
    source: 'CAN' | 'OBD' | 'OEM_API' | 'SYNTHETIC'
  ) => {
    const newLedgerEntry: BatteryLedgerEntry = {
      id: `LEDGER-${(state.batteryLedger.length + 1).toString().padStart(3, '0')}`,
      runId: `RUN-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      packId: pack.id,
      vehicleName: `${vehicleInfo.manufacturer} ${vehicleInfo.model}`,
      driveCycle: `${state.simulationParams.driveCycle} Dynamic Initialized`,
      durationSeconds: state.simulationParams.simulationDuration,
      initialSoc: pack.avgSoc,
      finalSoc: Number((pack.avgSoc * 0.92).toFixed(1)),
      maxTemp: pack.maxCellTemp,
      avgSoh: pack.avgSoh,
      alertCount: diagnostics.filter(d => d.severity === 'WARNING' || d.severity === 'CRITICAL').length,
      status: diagnostics.length > 0 ? 'WARNING' : 'CONVERGED',
    };

    state = {
      ...state,
      batteryPack: pack,
      diagnosticEvents: [],
      faultCellsIdentified: false,
      activeAlertsShown: false,
      simulationLifecycle: 'READY',
      simulationCurrentStep: 0,
      activeVehicleInfo: vehicleInfo,
      activeDataSource: source,
      isInitializingBattery: false,
      selectedObjectType: 'PACK',
      selectedModuleId: null,
      selectedCellId: null,
      batteryLedger: [newLedgerEntry, ...state.batteryLedger],
    };
    notify();
  },

  setWorkspace: (tab: WorkspaceTab) => {
    state = { ...state, currentWorkspace: tab };
    notify();
  },

  setVisualizationMode: (mode: VisualizationMode) => {
    state = { ...state, visualizationMode: mode };
    notify();
  },

  setExplodeProgress: (progress: number) => {
    state = { ...state, explodeProgress: Math.max(0, Math.min(1, progress)) };
    notify();
  },

  toggleSectionCut: () => {
    state = { ...state, sectionCutActive: !state.sectionCutActive };
    notify();
  },

  toggleWireframe: () => {
    state = { ...state, wireframeActive: !state.wireframeActive };
    notify();
  },

  setIsolate: (id: string | null) => {
    state = { ...state, isolatedObjectId: id };
    notify();
  },

  setCameraPreset: (preset: 'ISO' | 'TOP' | 'FRONT' | 'SIDE' | null) => {
    state = { ...state, cameraPreset: preset };
    notify();
  },

  selectObject: (type: 'PACK' | 'MODULE' | 'CELL', id?: string) => {
    let modId: string | null = null;
    let cellId: string | null = null;

    if (type === 'PACK') {
      modId = null;
      cellId = null;
    } else if (type === 'MODULE') {
      modId = id || 'MOD-01';
      cellId = null;
    } else if (type === 'CELL') {
      cellId = id || 'C-001';
      // Find parent module of this cell
      for (const m of state.batteryPack.modules) {
        if (m.cells.some(c => c.id === cellId)) {
          modId = m.id;
          break;
        }
      }
    }

    state = {
      ...state,
      selectedObjectType: type,
      selectedModuleId: modId,
      selectedCellId: cellId,
    };
    notify();
  },

  selectDiagnostic: (id: string) => {
    const event = state.diagnosticEvents.find(e => e.id === id);
    if (!event) return;

    let modId: string | null = null;
    let cellId: string | null = null;

    if (event.objectType === 'CELL') {
      cellId = event.objectId;
      for (const m of state.batteryPack.modules) {
        if (m.cells.some(c => c.id === cellId)) {
          modId = m.id;
          break;
        }
      }
    } else if (event.objectType === 'MODULE') {
      modId = event.objectId;
      cellId = null;
    }

    // Auto-switch to thermal mode if thermal event for clarity
    const newVisMode = event.parameter.toLowerCase().includes('thermal') || event.parameter.toLowerCase().includes('temperature')
      ? 'THERMAL' 
      : (event.parameter.toLowerCase().includes('voltage') ? 'VOLTAGE' : state.visualizationMode);

    state = {
      ...state,
      selectedDiagnosticId: id,
      selectedObjectType: event.objectType,
      selectedModuleId: modId,
      selectedCellId: cellId,
      visualizationMode: newVisMode,
    };
    notify();
  },

  setTimelineCycle: (cycle: number) => {
    // Dynamically adjust degradation & SOH state based on timeline cycle
    const cycleClamped = Math.max(0, Math.min(2200, cycle));
    const factor = Math.sqrt(cycleClamped / 716);

    const updatedModules = state.batteryPack.modules.map(mod => {
      const updatedCells = mod.cells.map(cell => {
        const isC017 = cell.id === 'C-017';
        const baseFade = (100 - (isC017 ? 84.1 : 91.4)) * factor;
        const newSoh = Number(Math.max(62.0, 100 - baseFade).toFixed(1));
        const resMultiplier = 1.0 + (factor - 1.0) * 0.45;
        const newRes = Number((cell.internalResistance * resMultiplier).toFixed(2));
        const rul = Math.max(0, Math.round(2000 - cycleClamped - (isC017 ? 350 : 0)));

        return {
          ...cell,
          cycleCount: cycleClamped,
          soh: newSoh,
          internalResistance: newRes,
          predictedRul: rul,
        };
      });

      const sohs = updatedCells.map(c => c.soh);
      const avgSoh = Number((sohs.reduce((a, b) => a + b, 0) / sohs.length).toFixed(1));
      return {
        ...mod,
        cells: updatedCells,
        avgSoh,
      };
    });

    const allCells = updatedModules.flatMap(m => m.cells);
    const avgSoh = Number((allCells.reduce((a, b) => a + b.soh, 0) / allCells.length).toFixed(1));
    const rul = Math.max(0, Math.round(2000 - cycleClamped));

    state = {
      ...state,
      timelineCycle: cycleClamped,
      batteryPack: {
        ...state.batteryPack,
        cycleCount: cycleClamped,
        avgSoh,
        predictedRul: rul,
        modules: updatedModules,
      },
    };
    notify();
  },

  updateSimulationParams: (partial: Partial<SimulationParams>) => {
    const newParams = { ...state.simulationParams, ...partial };
    const newHistory = runTimeDomainSimulation(newParams, 60);
    state = {
      ...state,
      simulationParams: newParams,
      simulationHistory: newHistory,
      simulationCurrentStep: 0,
    };
    notify();
  },

  setSimulationStep: (step: number) => {
    const clampedStep = Math.max(0, Math.min(state.simulationHistory.length - 1, step));
    const point = state.simulationHistory[clampedStep];

    if (point) {
      // Propagate live simulated voltage, SOC, and temp into battery pack cells
      const updatedModules = state.batteryPack.modules.map(mod => {
        const updatedCells = mod.cells.map(cell => {
          const isC017 = cell.id === 'C-017';
          const tempOffset = isC017 ? 6.5 : (mod.id === 'MOD-03' ? 1.8 : 0);
          const cellTemp = Number((point.packTemp + tempOffset + (cell.cellIndex % 3) * 0.4).toFixed(1));
          const cellVolt = Number((point.packVoltage / 96 + (isC017 ? -0.046 : (cell.cellIndex % 4 - 2) * 0.003)).toFixed(3));
          const cellSoc = Number(Math.max(5, Math.min(100, point.packSoc + (isC017 ? -2.4 : 0))).toFixed(1));

          return {
            ...cell,
            temperature: cellTemp,
            voltage: cellVolt,
            soc: cellSoc,
            current: point.current,
          };
        });

        const temps = updatedCells.map(c => c.temperature);
        const volts = updatedCells.map(c => c.voltage);
        const socs = updatedCells.map(c => c.soc);

        return {
          ...mod,
          cells: updatedCells,
          avgTemperature: Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)),
          maxTemperature: Math.max(...temps),
          avgVoltage: Number((volts.reduce((a, b) => a + b, 0) / volts.length).toFixed(3)),
          avgSoc: Number((socs.reduce((a, b) => a + b, 0) / socs.length).toFixed(1)),
        };
      });

      state = {
        ...state,
        simulationCurrentStep: clampedStep,
        batteryPack: {
          ...state.batteryPack,
          packVoltage: point.packVoltage,
          packCurrent: point.current,
          avgSoc: point.packSoc,
          temperature: point.packTemp,
          maxCellTemp: point.maxCellTemp,
          modules: updatedModules,
        },
      };
      notify();
    }
  },

  startSimulationRun: () => {
    state = {
      ...state,
      simulationRunning: true,
      simulationLifecycle: 'RUNNING',
    };
    notify();

    // Stage 1: As simulation executes, the localized fault is identified in the module
    // and the fault cells in the module indicate the caution symbol
    setTimeout(() => {
      const updatedPack = injectFaultsIntoPack(state.batteryPack);
      state = {
        ...state,
        faultCellsIdentified: true,
        batteryPack: updatedPack,
      };
      notify();

      // Stage 2: "only after that active alerts should be shown"
      setTimeout(() => {
        state = {
          ...state,
          activeAlertsShown: true,
          diagnosticEvents: INITIAL_DIAGNOSTIC_EVENTS,
        };
        notify();
      }, 1000);
    }, 350);
  },

  resetSimulationRun: () => {
    const cleanPack = clearFaultsFromPack(state.batteryPack);
    state = {
      ...state,
      simulationRunning: false,
      simulationCurrentStep: 0,
      simulationLifecycle: 'READY',
      faultCellsIdentified: false,
      activeAlertsShown: false,
      diagnosticEvents: [],
      batteryPack: cleanPack,
      selectedDiagnosticId: null,
    };
    notify();
  },

  setFaultCellsIdentified: (identified: boolean) => {
    state = { ...state, faultCellsIdentified: identified };
    notify();
  },

  setActiveAlertsShown: (shown: boolean) => {
    state = { ...state, activeAlertsShown: shown };
    notify();
  },

  setSimulationLifecycle: (lifecycle: 'READY' | 'RUNNING' | 'COMPLETED') => {
    state = { ...state, simulationLifecycle: lifecycle };
    notify();
  },

  setSimulationRunning: (running: boolean) => {
    if (running && !state.faultCellsIdentified && state.simulationLifecycle === 'READY') {
      batteryStore.startSimulationRun();
      return;
    }
    state = { ...state, simulationRunning: running };
    notify();
  },

  updateWhatIfConfig: (partial: Partial<WhatIfScenarioConfig>) => {
    const newConfig = { ...state.whatIfConfig, ...partial };
    const newResult = evaluateWhatIfScenario(newConfig);
    state = {
      ...state,
      whatIfConfig: newConfig,
      whatIfResult: newResult,
    };
    notify();
  },

  applyPresetScenario: (scenarioId: string) => {
    const preset = PRESET_SCENARIOS.find(s => s.id === scenarioId);
    if (!preset) return;
    const result = evaluateWhatIfScenario(preset);
    state = {
      ...state,
      whatIfConfig: preset,
      whatIfResult: result,
    };
    notify();
  },

  setFluidFlowCoupling: (
    velocity: number, 
    fluidType: 'GLYCOL_WATER' | 'DIELECTRIC' | 'FORCED_AIR',
    inletTemp: number = 20.0,
    hydraulicDiamMm: number = 18.0,
    channelGapMm: number = 3.5
  ) => {
    const density = fluidType === 'GLYCOL_WATER' ? 1060 : (fluidType === 'DIELECTRIC' ? 820 : 1.18);
    const viscosity = fluidType === 'GLYCOL_WATER' ? 0.0032 : (fluidType === 'DIELECTRIC' ? 0.0065 : 0.0000185);
    const conductivity = fluidType === 'GLYCOL_WATER' ? 0.42 : (fluidType === 'DIELECTRIC' ? 0.14 : 0.026);
    const specificHeat = fluidType === 'GLYCOL_WATER' ? 3500 : (fluidType === 'DIELECTRIC' ? 1950 : 1005);
    const Dh = hydraulicDiamMm / 1000;

    const ductArea = 0.18 * (channelGapMm / 1000);
    const volumetricFlowRateLpm = Number((velocity * ductArea * 60000).toFixed(1));
    const Re = Math.round((density * velocity * Dh) / viscosity);
    const Pr = (viscosity * specificHeat) / conductivity;

    const cConstant = Re >= 1000 ? 0.35 : 0.51;
    const mExponent = Re >= 1000 ? 0.60 : 0.50;
    const Nu = cConstant * Math.pow(Math.max(80, Re), mExponent) * Math.pow(Math.max(0.7, Pr), 0.36);
    const h = Math.round((Nu * conductivity) / Dh);
    const hClamped = Math.max(50, Math.min(3200, h));

    const frictionFactor = 0.25 * Math.pow(Math.max(200, Re), -0.22);
    const dynamicPressure = 0.5 * density * Math.pow(velocity, 2);
    const pressureDropKpa = Number(((5 * frictionFactor * dynamicPressure) / 1000).toFixed(2));

    // Thermal simulation coupling: cell temperatures and hotspot severity respond to coolant flow
    const coolingFactor = Math.max(0.2, hClamped / 850);
    const packMeanTemp = Number((inletTemp + 11.5 / Math.pow(coolingFactor, 0.4)).toFixed(1));

    const updatedModules = state.batteryPack.modules.map(mod => {
      const isMod03 = mod.id === 'MOD-03';
      const updatedCells = mod.cells.map(cell => {
        const isC017 = cell.id === 'C-017';
        const deltaHotspot = isC017 
          ? (7.8 / Math.sqrt(coolingFactor))
          : (isMod03 ? 1.6 / Math.sqrt(coolingFactor) : (cell.cellIndex % 3) * 0.3);

        const newCellTemp = Number((packMeanTemp + deltaHotspot).toFixed(1));
        const newSeverity = isC017
          ? (newCellTemp > 50.0 ? 'CRITICAL' : (newCellTemp > 38.0 ? 'WARNING' : 'NORMAL'))
          : cell.diagnosticState;

        return {
          ...cell,
          temperature: newCellTemp,
          diagnosticState: newSeverity,
        };
      });

      const temps = updatedCells.map(c => c.temperature);
      return {
        ...mod,
        cells: updatedCells,
        avgTemperature: Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)),
        maxTemperature: Math.max(...temps),
      };
    });

    const allCellTemps = updatedModules.flatMap(m => m.cells.map(c => c.temperature));
    const newMaxTemp = Math.max(...allCellTemps);
    const newMinTemp = Math.min(...allCellTemps);

    state = {
      ...state,
      coolantFlowVelocity: velocity,
      coolantFluidType: fluidType,
      coolantInletTemp: inletTemp,
      channelHydraulicDiamMm: hydraulicDiamMm,
      channelGapMm: channelGapMm,
      volumetricFlowRateLpm,
      reynoldsNumber: Re,
      pressureDropKpa,
      calculatedHeatTransferCoeff: hClamped,
      batteryPack: {
        ...state.batteryPack,
        temperature: packMeanTemp,
        maxCellTemp: newMaxTemp,
        minCellTemp: newMinTemp,
        modules: updatedModules,
      },
    };
    notify();
  },
};

export function useBatteryStore(): BatteryStoreState & typeof batteryStore {
  const [, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick(t => t + 1);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    ...batteryStore.getState(),
    ...batteryStore,
  };
}
