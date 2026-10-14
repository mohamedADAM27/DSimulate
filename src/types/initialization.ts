/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Multi-Brand Battery Connection & Initialization Types
 */

export type VehicleCategory = 
  | 'electric-car' 
  | 'two-wheeler' 
  | 'three-wheeler' 
  | 'commercial-vehicle' 
  | 'custom-pack';

export type BatteryChemistry = 'LFP' | 'NMC' | 'NCA' | 'OTHER';

export type DataSourceType = 'CAN' | 'OBD' | 'OEM_API' | 'SYNTHETIC';

export type ConnectionState = 
  | 'DISCONNECTED'
  | 'INTERFACE_DETECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'STREAMING'
  | 'FAILED';

export interface VehicleModelSpec {
  id: string;
  manufacturer: string;
  modelName: string;
  variant: string;
  category: VehicleCategory;
  chemistry: BatteryChemistry;
  nominalVoltageV: number;
  ratedCapacityKWh: number;
  ratedCapacityAh: number;
  cellConfiguration: string; // e.g. "100S1P", "96S3P", "14S8P"
  seriesCount: number;
  parallelCount: number;
  moduleCount: number;
  cellsPerModule: number;
  coolingType: 'Active Liquid Glycol' | 'Dielectric Immersion' | 'Forced Air' | 'Passive Phase Change';
  maxChargeRateC: number;
  maxContinuousDischargeC: number;
  verifiedSpecs: boolean;
  notes: string;
}

export interface CanConfiguration {
  interfaceName: string;
  bitrateKbps: number;
  canFdEnabled: boolean;
  fdDataBitrateKbps: number;
  terminatingResistor120Ohm: boolean;
  listenOnlyMode: boolean;
  dbcPreset: string;
  customDbcName?: string;
  replayerMode: boolean;
}

export interface ObdConfiguration {
  interfaceType: string;
  protocol: 'ISO_15765_4_CAN' | 'ISO_14229_UDS' | 'SAE_J1979_STD';
  baudRate: number;
  udsSecurityAccess: boolean;
  pollingFrequencyHz: number;
  readDtcs: boolean;
  readCellVoltages: boolean;
}

export interface OemApiConfiguration {
  provider: 'TATA_ZCONNECT' | 'MG_ISMART' | 'ATHER_CONNECT' | 'CUSTOM_TELEMATICS';
  endpointUrl: string;
  clientId: string;
  apiSecret: string;
  cloudRegion: string;
  pollIntervalSec: number;
  authenticated: boolean;
}

export type SyntheticAnomalyScenario = 
  | 'HEALTHY_PACK'
  | 'C017_THERMAL_EXCURSION'
  | 'MOD3_COOLING_GRADIENT'
  | 'CELL_IMBALANCE_RESISTANCE_DRIFT';

export interface SyntheticConfiguration {
  chemistry: BatteryChemistry;
  packVoltageV: number;
  ratedCapacityKWh: number;
  initialSocPct: number;
  ambientTempC: number;
  operatingLoad: 'WLTP_HIGHWAY' | 'FAST_CHARGE_150KW' | 'AGGRESSIVE_CLIMB' | 'URBAN_STOP_GO' | 'COLD_SOAK';
  scenario: SyntheticAnomalyScenario;
  sampleRateHz: number;
  seed: number;
}

export type PipelineStageId = 
  | 'acquisition'
  | 'decoding'
  | 'normalization'
  | 'validation'
  | 'quality'
  | 'mapping'
  | 'physics_init'
  | 'synchronization';

export interface PipelineStageState {
  id: PipelineStageId;
  name: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'WARNING' | 'FAILED';
  progress: number; // 0 - 100
  details: string;
  metrics: { [key: string]: string | number };
  logs: string[];
}

export interface UnifiedTelemetryFrame {
  timestampMs: number;
  sequenceId: number;
  source: DataSourceType;
  provenance: 'MEASURED' | 'MANUFACTURER_REPORTED' | 'IMPORTED' | 'ESTIMATED' | 'SYNTHETIC';
  dataQualityPct: number;
  
  // Electrical
  packVoltageV: number;
  packCurrentA: number;
  packPowerKw: number;
  packSocPct: number;
  packSohPct: number;
  nominalCapacityKWh: number;
  measuredCapacityKWh: number;
  
  // Thermal
  minTempC: number;
  maxTempC: number;
  avgTempC: number;
  coolantInletTempC: number;
  coolantOutletTempC: number;
  coolantFlowRateLpm: number;
  
  // Cell level (available if protocol supports)
  cellVoltagesV: number[] | null;
  cellTemperaturesC: number[] | null;
  minCellVoltageV: number;
  maxCellVoltageV: number;
  cellVoltageDeltaMv: number;
  
  // Diagnostic
  dtcList: string[];
  bmsState: 'INIT' | 'READY' | 'DRIVE' | 'CHARGE' | 'DERATED' | 'FAULT';
}

export interface BatterySystemConfig {
  vehicleCategory: VehicleCategory;
  manufacturer: string;
  model: string;
  variant: string;
  vinOrChassisId: string;
  packIdentifier: string;
  chemistry: BatteryChemistry;
  packNominalVoltageV: number;
  ratedCapacityKWh: number;
  seriesCount: number;
  parallelCount: number;
  cellConfiguration?: string;
  moduleCount: number;
  cellsPerModule: number;
  coolingType: string;
  isCustomManualConfig: boolean;
}
