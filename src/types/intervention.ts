/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Intervention Intelligence Type Definitions
 * Mission-critical battery engineering intervention, physics-informed reasoning,
 * Second-Life Reusability Assessment, and QR-Based Digital Battery Passport data structures.
 */

import { DiagnosticEvent, DiagnosticSeverity } from './battery';

export type InvestigationStatus = 
  | 'OPEN'
  | 'INVESTIGATING'
  | 'SIMULATING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'VERIFIED'
  | 'INCONCLUSIVE';

export interface RootCauseHypothesis {
  id: string;
  title: string;
  probability: number;            // 0 to 100 %
  physicalMechanism: string;      // e.g. "Localized coolant channel partial stagnation causing Arrhenius SEI acceleration"
  supportingEvidence: string[];
  contradictingEvidence: string[];
  confidenceScore: number;        // 0.0 to 1.0
  severityRating: DiagnosticSeverity;
}

export type InterventionType = 
  | 'THERMAL_OPTIMIZATION'
  | 'CHARGE_DERATING'
  | 'CELL_BYPASS'
  | 'ELECTROLYTE_RECONDITIONING'
  | 'COOLANT_FLUSH';

export interface CandidateIntervention {
  id: string;
  title: string;
  type: InterventionType;
  description: string;
  physicalRationale: string;
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCostUsd: number;
  downtimeMinutes: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  safetyConstraints: string[];
  unsupportedActions: string[];
  expectedBenefit: {
    deltaSohPct: number;          // e.g. +2.4 %
    deltaRulCycles: number;       // e.g. +340 cycles
    deltaPeakTempC: number;       // e.g. -7.5 °C
    deltaVoltageSpreadMv: number; // e.g. -18 mV
  };
  simParameters: {
    coolantFlowBoostPct: number;  // e.g. 35
    chargingCurrentDeRatePct: number; // e.g. 25
    maxSocCeiling: number;        // e.g. 85
    activeCellBypassEnabled: boolean;
    preConditioningTempC: number; // e.g. 22
  };
  status: 'CANDIDATE' | 'SIMULATED' | 'RECOMMENDED' | 'REJECTED';
}

export interface ScenarioComparisonData {
  simulated: boolean;
  baselineTelemetry: {
    maxTemp: number;
    minVoltage: number;
    sohAt1000Cycles: number;
    predictedRul: number;
    timeToThermalLimitSec: number;
  };
  interventionTelemetry: {
    maxTemp: number;
    minVoltage: number;
    sohAt1000Cycles: number;
    predictedRul: number;
    timeToThermalLimitSec: number;
  };
  timeSeriesDelta: Array<{
    time: number;
    baselineTemp: number;
    interventionTemp: number;
    baselineVolt: number;
    interventionVolt: number;
  }>;
  assumptions: string[];
  uncertaintyBounds: string;
  limitations: string[];
}

export interface ApprovalRecord {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  engineerName?: string;
  engineerRole?: string;
  engineerLicense?: string;
  decisionTimestamp?: string;
  justificationNotes?: string;
  safetyChecklist: {
    asilDChecked: boolean;
    thermalRunawayMitigated: boolean;
    highVoltageInterlockVerified: boolean;
    warrantyTermsCompliant: boolean;
  };
  rejectionReason?: string;
}

export interface VerificationRecord {
  status: 'PENDING_INPUT' | 'VERIFIED' | 'UNSUCCESSFUL' | 'INCONCLUSIVE';
  recordedAt?: string;
  technicianId?: string;
  postInterventionTemp?: number;
  postInterventionSoh?: number;
  postInterventionVoltageDelta?: number;
  notes?: string;
  predictedVsActualDeltaTemp?: number;
  outcomeAssessment?: string;
}

export interface EngineeringChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isPhysicsReasoning?: boolean;
  sourceContext?: string;
}

export interface BatterySnapshot {
  packId: string;
  packName: string;
  architecture: string;
  avgSoc: number;
  avgSoh: number;
  packVoltage: number;
  packCurrent: number;
  maxCellTemp: number;
  minCellTemp: number;
  voltageSpreadMv: number;
  predictedRulCycles: number;
  nominalCapacityKWh: number;
  measuredCapacityKWh: number;
}

// --- Second-Life Battery Assessment & Digital Battery Passport Types ---

export type SecondLifeCategory = 
  | 'DIRECT_REUSE'
  | 'REFURBISHMENT'
  | 'REPURPOSING'
  | 'RECYCLING';

export type SecondLifeSuitability = 
  | 'ELIGIBLE' 
  | 'CONDITIONAL' 
  | 'INELIGIBLE';

export interface RepurposingApplication {
  id: string;
  name: string;
  category: 'STATIONARY_STORAGE' | 'MICROGRID' | 'BACKUP_POWER' | 'INDUSTRIAL';
  suitabilityScore: number;       // 0 to 100 %
  cRateRequirement: string;       // e.g. "≤ 0.5C Continuous / 1.0C Pulse"
  economicResidualValueUsd: number;
  projectedLifespanYears: number;
  safetyCertifications: string[]; // e.g. "IEC 62619", "UL 1973", "NFPA 855"
  prerequisites: string[];        // e.g. "Module Re-balancing", "Insulation Check ≥ 500 Ω/V"
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'RESTRICTED';
}

export interface SecondLifeAssessment {
  assessedAt: string;
  category: SecondLifeCategory;
  suitability: SecondLifeSuitability;
  overallScore: number;           // 0 to 100
  sohThresholdPassed: boolean;    // SOH ≥ 70%
  irThresholdPassed: boolean;     // Internal Resistance Increase < 100%
  thermalIntegrityPassed: boolean;// No thermal runaway or irreversible cell damage
  cellSpreadPassed: boolean;      // Voltage Spread < 50 mV
  applications: RepurposingApplication[];
  slmRationale: string;
  missingEvidence: string[];
  nextAssessmentSteps: string[];
  safetyCertificationStandard: string; // e.g. "EU 2023/1542 & IEC 62619"
  humanAssessorName?: string;
  humanAssessorCredential?: string;
  approvalDate?: string;
}

export interface PassportLifecycleEvent {
  id: string;
  date: string;
  event: string;
  category: 'MANUFACTURE' | 'DEPLOYMENT' | 'TELEMETRY' | 'DIAGNOSIS' | 'INTERVENTION' | 'SECOND_LIFE' | 'RECYCLE';
  description: string;
  actor: string;
  verified: boolean;
}

export interface DigitalBatteryPassport {
  passportId: string;             // e.g. "DPP-EU-800V-2026-94821X"
  packId: string;
  vin: string;
  qrDataUrl: string;
  publicAccessUrl: string;
  manufacturer: string;
  manufacturingDate: string;
  manufacturingLocation: string;
  chemistry: string;              // "NMC 811 / Graphite"
  nominalCapacityKWh: number;
  originalVoltage: number;
  totalCycles: number;
  carbonFootprintKgCo2PerKWh: number;
  criticalRawMaterials: {
    cobaltPct: number;
    lithiumPct: number;
    nickelPct: number;
    manganesePct: number;
    recycledContentPct: number;
  };
  healthSnapshot: {
    currentSoh: number;
    currentCapacityKWh: number;
    internalResistanceMohm: number;
    roundTripEfficiencyPct: number;
    cumulativeEnergyThroughputMWh: number;
    diagnosticAnomaliesCount: number;
  };
  secondLifeAssessment: SecondLifeAssessment;
  lifecycleTimeline: PassportLifecycleEvent[];
  authorizedServiceLog: Array<{
    date: string;
    serviceType: string;
    engineer: string;
    notes: string;
  }>;
}

export interface InterventionInvestigation {
  id: string;
  title: string;
  packId: string;
  packName: string;
  createdAt: string;
  updatedAt: string;
  status: InvestigationStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  sourceDiagnosis: DiagnosticEvent;
  batterySnapshot: BatterySnapshot;
  aiInvestigation: {
    slmInterpretation: string;
    rootCauses: RootCauseHypothesis[];
    missingMeasurements: string[];
    recommendedDiagnosticTests: string[];
    engineeringChat: EngineeringChatMessage[];
  };
  candidateInterventions: CandidateIntervention[];
  selectedInterventionId: string | null;
  simulationComparison: ScenarioComparisonData | null;
  approvalRecord: ApprovalRecord | null;
  verificationRecord: VerificationRecord | null;
  batteryPassport?: DigitalBatteryPassport;
}

export type InterventionExplorerSection =
  | 'investigations'
  | 'active-diagnoses'
  | 'intervention-plans'
  | 'scenario-comparisons'
  | 'pending-approvals'
  | 'verification-records'
  | 'intervention-history'
  | 'battery-passport';

export type InterventionWorkspaceTab =
  | 'diagnosis-overview'
  | 'ai-investigation'
  | 'intervention-planner'
  | 'scenario-lab'
  | 'decision-report'
  | 'verification-ledger'
  | 'second-life-passport';
