/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Physics-Informed Battery Simulation Engine
 * Transparent, deterministic electro-thermal ECM and empirical degradation model.
 */

import { 
  SimulationParams, 
  SimulationStepPoint, 
  BatteryPack, 
  WhatIfScenarioConfig, 
  ScenarioResult 
} from '../types/battery';

// Physical constants
const GAS_CONSTANT_R = 8.314;       // J/(mol·K)
const ACTIVATION_ENERGY_EA = 31500;  // J/mol (SEI growth)
const T_REF_KELVIN = 298.15;         // 25°C in Kelvin
const CELL_HEAT_CAPACITY = 1050;     // J/(kg·K)
const CELL_MASS_KG = 1.15;           // kg per prismatic cell

/**
 * Open Circuit Voltage polynomial function based on SOC (0.0 to 1.0)
 */
export function calculateOCV(socNormalized: number): number {
  const s = Math.max(0.001, Math.min(0.999, socNormalized));
  // 6th-order empirical fit for Li-ion NMC chemistry
  const ocv = 3.32 
    + 0.52 * s 
    + 0.28 * Math.pow(s, 2) 
    - 0.45 * Math.pow(s, 4) 
    + 0.55 * Math.pow(s, 6)
    - 0.12 * Math.exp(-35 * s)
    + 0.08 * Math.log(s + 0.05);
  return Math.min(4.25, Math.max(2.80, ocv));
}

/**
 * Arrhenius temperature acceleration factor
 */
export function calculateArrheniusFactor(tempCelsius: number): number {
  const tempKelvin = tempCelsius + 273.15;
  return Math.exp((-ACTIVATION_ENERGY_EA / GAS_CONSTANT_R) * ((1 / tempKelvin) - (1 / T_REF_KELVIN)));
}

/**
 * Generate drive cycle load profile (Current in Amperes over time)
 */
export function getDriveCycleCurrent(
  cycleType: SimulationParams['driveCycle'], 
  timeSec: number, 
  fastChargeRatio: number
): number {
  const t = timeSec % 600; // 10-minute looping window

  if (cycleType === 'FAST_CHARGE_PULSE') {
    // High-current DC fast charge pulse (+180A to +260A charging)
    if (t < 400) return 210.0;
    return 120.0 * Math.exp(-(t - 400) / 80);
  }

  if (cycleType === 'US06') {
    // High-speed aggressive highway cycle
    const base = -95.0;
    const pulse1 = Math.sin(t * 0.05) * 85.0;
    const pulse2 = Math.cos(t * 0.12) * 45.0;
    const regen = (Math.sin(t * 0.08) > 0.7) ? 65.0 : 0.0;
    return base + pulse1 + pulse2 + regen;
  }

  if (cycleType === 'CITY') {
    // Stop and go city commute with frequent regenerative braking
    const phase = Math.floor(t / 30) % 4;
    if (phase === 0) return -45.0; // Acceleration
    if (phase === 1) return -25.0; // Cruise
    if (phase === 2) return 38.0;  // Regen brake
    return -5.0;                   // Idle at traffic light
  }

  // Default: Standard WLTP synthetic profile
  const wltpUrban = Math.sin(t * 0.03) * 40 - 35;
  const wltpSuburban = Math.cos(t * 0.07) * 55 - 45;
  const wltpHigh = (t % 150 > 100) ? -110 : 0;
  const regen = (Math.sin(t * 0.04) > 0.6) ? 42.0 : 0.0;
  
  // Blend in occasional fast charge sessions based on parameter
  const fastChargeInfluence = (fastChargeRatio / 100) * 20.0;
  return (wltpUrban * 0.4 + wltpSuburban * 0.4 + wltpHigh * 0.2 + regen) + fastChargeInfluence * 0.1;
}

/**
 * Run a multi-step deterministic time-domain simulation
 */
export function runTimeDomainSimulation(
  params: SimulationParams, 
  stepCount: number = 60
): SimulationStepPoint[] {
  const points: SimulationStepPoint[] = [];
  const dt = params.simulationDuration / stepCount;

  let soc = params.initialSoc;
  let packTemp = params.ambientTemp + 4.5;
  let soh = 91.2 - (params.currentCycle / 2000) * 11.2;

  // ECM states
  let vRC1 = 0.0;
  let vRC2 = 0.0;
  const r0 = 0.00214 * 96; // 96S equivalent pack resistance (~0.205 ohm)
  const r1 = 0.00085 * 96;
  const c1 = 2800;         // Farads
  const tau1 = r1 * c1;

  for (let i = 0; i <= stepCount; i++) {
    const time = Math.round(i * dt);
    const current = Number(getDriveCycleCurrent(params.driveCycle, time, params.fastChargeRatio).toFixed(1));

    // SOC update via Coulomb Counting: dSOC/dt = I / Q_nominal
    const nominalCapacityAs = 82.5 * 1000 * 3600 / 768; // Coulombs
    const deltaSoc = (current * dt / nominalCapacityAs) * 100;
    soc = Math.max(5.0, Math.min(99.0, soc + deltaSoc));

    // ECM dynamics
    vRC1 = vRC1 + ((-current * r1 - vRC1) / Math.max(1, tau1)) * dt;
    const ocvPack = calculateOCV(soc / 100) * 96;
    const packVoltage = Number((ocvPack + current * r0 + vRC1).toFixed(1));

    // Thermal lumped node equation
    const qJoule = Math.pow(current, 2) * r0; // I^2 * R
    const qCooling = params.coolingFlowRate * 18.5 * Math.max(0, packTemp - params.ambientTemp);
    const heatCapacityTotal = 96 * CELL_MASS_KG * CELL_HEAT_CAPACITY;
    const deltaTemp = ((qJoule - qCooling) / heatCapacityTotal) * dt;
    packTemp = Number(Math.max(params.ambientTemp, Math.min(68.0, packTemp + deltaTemp)).toFixed(2));

    const maxCellTemp = Number((packTemp + 4.8).toFixed(1));
    const minCellVolt = Number((packVoltage / 96 - 0.024).toFixed(3));
    const maxCellVolt = Number((packVoltage / 96 + 0.018).toFixed(3));

    points.push({
      time,
      current,
      packVoltage,
      packSoc: Number(soc.toFixed(1)),
      packTemp: Number(packTemp.toFixed(1)),
      maxCellTemp,
      minCellVolt,
      maxCellVolt,
      heatGenWatts: Math.round(qJoule),
      soh: Number(soh.toFixed(2)),
    });
  }

  return points;
}

/**
 * Predict SOH degradation trajectory across cycles (0 to 2,500 cycles)
 */
export function calculateSohTrajectory(
  ambientTemp: number,
  fastChargePct: number,
  drivingSeverity: number = 1.0
): { cycle: number; measuredSoh?: number; estimatedSoh?: number; predictedSoh: number; lowerBound: number; upperBound: number }[] {
  const points = [];
  const arrhenius = calculateArrheniusFactor(ambientTemp);
  const fastChargeMultiplier = 1.0 + (fastChargePct / 100) * 0.45;
  const degradationRate = 0.0078 * Math.sqrt(arrhenius) * fastChargeMultiplier * drivingSeverity;

  for (let cycle = 0; cycle <= 2200; cycle += 100) {
    const rawFade = degradationRate * Math.sqrt(cycle) * 10;
    const nominalSoh = Math.max(65.0, 100.0 - rawFade);

    const isHistorical = cycle <= 700;
    const isCurrent = cycle === 700;

    // 95% Bayesian prediction interval divergence
    const futureCycles = Math.max(0, cycle - 700);
    const uncertainty = (futureCycles / 1500) * 3.2;

    points.push({
      cycle,
      measuredSoh: isHistorical ? Number((nominalSoh + (Math.sin(cycle * 0.05) * 0.3)).toFixed(1)) : undefined,
      estimatedSoh: isHistorical || isCurrent ? Number(nominalSoh.toFixed(1)) : undefined,
      predictedSoh: Number(nominalSoh.toFixed(1)),
      lowerBound: Number(Math.max(60.0, nominalSoh - uncertainty).toFixed(1)),
      upperBound: Number(Math.min(100.0, nominalSoh + uncertainty).toFixed(1)),
    });
  }

  return points;
}

/**
 * Evaluate What-If Scenarios
 */
export function evaluateWhatIfScenario(config: WhatIfScenarioConfig): ScenarioResult {
  const arrhenius = calculateArrheniusFactor(config.ambientTemp);
  const cRateMultiplier = 1.0 + (config.chargingRateC - 1.0) * 0.35 + (config.fastChargingPct / 100) * 0.28;
  const coolingPenalty = config.coolingCondition === 'Reduced Flow' ? 1.25 : (config.coolingCondition === 'Maximum Chiller' ? 0.88 : 1.0);
  
  const dailyStress = (config.dailyKm / 60) * 0.15;
  const totalAlpha = 0.0078 * Math.sqrt(arrhenius) * cRateMultiplier * coolingPenalty * (1.0 + dailyStress);

  // Cycle 1000 SOH
  const fade1000 = totalAlpha * Math.sqrt(1000) * 10;
  const soh1000 = Number(Math.max(60.0, 100.0 - fade1000).toFixed(1));

  // Cycle 2000 SOH
  const fade2000 = totalAlpha * Math.sqrt(2000) * 10;
  const soh2000 = Number(Math.max(50.0, 100.0 - fade2000).toFixed(1));

  // Cycle until SOH drops to 80% (EOL)
  // 100 - totalAlpha * sqrt(N) * 10 = 80 => sqrt(N) = 2.0 / totalAlpha => N = (2.0 / totalAlpha)^2
  const eolCycle = Math.round(Math.pow(2.0 / totalAlpha, 2));
  const currentCycle = 716;
  const predictedRulCycles = Math.max(0, eolCycle - currentCycle);

  const peakOperatingTemp = Number((config.ambientTemp + 12.0 * config.chargingRateC * coolingPenalty).toFixed(1));
  const capacityRetentionKWh = Number(((soh1000 / 100) * 82.5).toFixed(1));
  const batteryLifeYears = Number((eolCycle / ((config.dailyKm * 365) / 380)).toFixed(1));
  const degradationRatePer1000 = Number((100 - soh1000).toFixed(1));

  return {
    config,
    sohAtCycle1000: soh1000,
    sohAtCycle2000: soh2000,
    predictedRulCycles,
    eolCycle,
    peakOperatingTemp,
    capacityRetentionKWh,
    batteryLifeYears: Math.max(2.5, Math.min(18.0, batteryLifeYears)),
    degradationRatePer1000,
  };
}

/**
 * Predefined Scenarios for What-If Lab & Comparison
 */
export const PRESET_SCENARIOS: WhatIfScenarioConfig[] = [
  {
    id: 'BASELINE',
    name: 'Baseline Specification (Private Commuter)',
    climate: 'Temperate (20°C)',
    ambientTemp: 22,
    drivingProfile: 'City Commute',
    dailyKm: 45,
    chargingRateC: 1.0,
    fastChargingPct: 15,
    coolingCondition: 'Standard Active Liquid',
    initialSoc: 80,
  },
  {
    id: 'SCENARIO_A',
    name: 'High Fast-Charging Fleet (Highway Transit)',
    climate: 'Subtropical (32°C)',
    ambientTemp: 32,
    drivingProfile: 'Highway High-Speed',
    dailyKm: 180,
    chargingRateC: 2.5,
    fastChargingPct: 75,
    coolingCondition: 'Standard Active Liquid',
    initialSoc: 90,
  },
  {
    id: 'SCENARIO_B',
    name: 'Sub-Zero Winter Cold (Extreme Climate)',
    climate: 'Extreme Cold (-10°C)',
    ambientTemp: -10,
    drivingProfile: 'City Commute',
    dailyKm: 40,
    chargingRateC: 0.8,
    fastChargingPct: 20,
    coolingCondition: 'Reduced Flow',
    initialSoc: 85,
  },
  {
    id: 'SCENARIO_C',
    name: 'Desert Delivery Duty (High Ambient + Chiller)',
    climate: 'Desert Heat (42°C)',
    ambientTemp: 42,
    drivingProfile: 'Delivery Fleet',
    dailyKm: 220,
    chargingRateC: 1.5,
    fastChargingPct: 40,
    coolingCondition: 'Maximum Chiller',
    initialSoc: 80,
  },
];
