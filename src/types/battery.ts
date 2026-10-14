/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Battery Digital Twin Type Definitions
 */

export type DiagnosticSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type DiagnosticStatus = 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';

export interface DiagnosticEvent {
  id: string;
  objectId: string;
  objectType: 'PACK' | 'MODULE' | 'CELL';
  parameter: string;
  observed: string;
  expected: string;
  unit: string;
  deviation: string;
  severity: DiagnosticSeverity;
  status: DiagnosticStatus;
  cycle: number;
  timestamp: string;
  description: string;
  rootCause: string;
}

export interface BatteryCell {
  id: string;
  moduleId: string;
  moduleIndex: number;
  cellIndex: number;
  position: {
    gridX: number;
    gridY: number;
    gridZ: number;
  };
  voltage: number;             // Volts (V)
  current: number;             // Amperes (A)
  temperature: number;         // Celsius (°C)
  soc: number;                 // 0.0 - 100.0 %
  soh: number;                 // 0.0 - 100.0 %
  internalResistance: number;  // milliohms (mΩ)
  cycleCount: number;
  capacityAh: number;          // Ampere-hours
  nominalCapacityAh: number;   // 65.0 Ah default
  degradationIndex: number;    // 0.0 - 1.0 (SEI + lithium loss)
  predictedRul: number;        // cycles until SOH <= 80%
  diagnosticState: DiagnosticSeverity;
  measuredVoltage: number;
  estimatedVoltage: number;
}

export interface BatteryModule {
  id: string;
  name: string;
  moduleIndex: number;
  cellCount: number;
  cells: BatteryCell[];
  avgVoltage: number;
  minVoltage: number;
  maxVoltage: number;
  voltageSpread: number;       // mV
  avgTemperature: number;
  maxTemperature: number;
  temperatureSpread: number;   // °C
  avgSoc: number;
  avgSoh: number;
  diagnosticState: DiagnosticSeverity;
}

export interface BatteryPack {
  id: string;
  name: string;
  architecture: string;        // e.g. "800V Architecture · 96S3P"
  nominalVoltage: number;      // 768 V
  packVoltage: number;         // Live V
  packCurrent: number;         // Live A
  nominalCapacityKWh: number;  // 82.5 kWh
  measuredCapacityKWh: number; // 75.2 kWh
  avgSoc: number;
  avgSoh: number;
  temperature: number;
  maxCellTemp: number;
  minCellTemp: number;
  maxCellVolt: number;
  minCellVolt: number;
  voltageSpread: number;       // mV
  cycleCount: number;
  predictedRul: number;        // cycles
  operatingHours: number;
  diagnosticState: DiagnosticSeverity;
  modules: BatteryModule[];
}

export type VisualizationMode = 
  | 'NORMAL' 
  | 'THERMAL' 
  | 'SOC' 
  | 'SOH' 
  | 'VOLTAGE' 
  | 'DEGRADATION' 
  | 'RUL';

export type WorkspaceTab =
  | 'digital-twin'
  | 'explorer-3d'
  | 'state-estimation'
  | 'simulation-studio'
  | 'thermal'
  | 'degradation'
  | 'rul'
  | 'diagnostics'
  | 'fleet-intelligence'
  | 'what-if'
  | 'comparison'
  | 'results'
  | 'overview'
  | 'intervention-intelligence';

export interface SimulationParams {
  initialSoc: number;          // % (0 - 100)
  ambientTemp: number;         // °C (-10 to 45)
  driveCycle: 'WLTP' | 'US06' | 'CITY' | 'FAST_CHARGE_PULSE';
  fastChargeRatio: number;     // % (0 - 100)
  coolingFlowRate: number;     // L/min (2 - 20)
  dischargeDepth: number;      // % (40 - 100)
  regenBraking: boolean;
  simulationDuration: number;  // seconds (e.g. 1800s)
  currentCycle: number;
}

export interface SimulationStepPoint {
  time: number;                // s
  current: number;             // A
  packVoltage: number;         // V
  packSoc: number;             // %
  packTemp: number;            // °C
  maxCellTemp: number;         // °C
  minCellVolt: number;         // V
  maxCellVolt: number;         // V
  heatGenWatts: number;        // W
  soh: number;                 // %
}

export interface WhatIfScenarioConfig {
  id: string;
  name: string;
  climate: 'Temperate (20°C)' | 'Extreme Cold (-10°C)' | 'Desert Heat (42°C)' | 'Subtropical (32°C)';
  ambientTemp: number;
  drivingProfile: 'City Commute' | 'Highway High-Speed' | 'Delivery Fleet' | 'Performance Track';
  dailyKm: number;
  chargingRateC: number;       // 0.5C to 3.0C
  fastChargingPct: number;     // % of total sessions
  coolingCondition: 'Standard Active Liquid' | 'Reduced Flow' | 'Maximum Chiller';
  initialSoc: number;
}

export interface ScenarioResult {
  config: WhatIfScenarioConfig;
  sohAtCycle1000: number;
  sohAtCycle2000: number;
  predictedRulCycles: number;
  eolCycle: number;
  peakOperatingTemp: number;
  capacityRetentionKWh: number;
  batteryLifeYears: number;
  degradationRatePer1000: number; // %
}
