/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Fleet Intelligence & Predictive Maintenance Type Definitions
 */

export type MaintenanceSeverity = 'CRITICAL_SAFETY' | 'HIGH_DEGRADATION' | 'MEDIUM_OPERATIONAL' | 'LOW_ADVISORY';

export type MaintenanceStatus = 'QUEUED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'VERIFIED';

export type MaintenanceCategory = 
  | 'BATTERY_THERMAL'
  | 'ELECTROCHEMISTRY_DEGRADATION'
  | 'CELL_IMBALANCE'
  | 'COOLING_LOOP'
  | 'ELECTRICAL_HARDWARE'
  | 'BMS_CALIBRATION';

export type OperationalImpact = 
  | 'GROUNDED_SAFETY'
  | 'PEAK_HOURS_RESTRICTION'
  | 'SPEED_DERATED'
  | 'NO_IMPACT_SCHEDULED';

export type CalculationMethodology = 
  | 'PHYSICS_FIRST_PRINCIPLES'
  | 'EMPIRICAL_RULE_ENGINE'
  | 'HYBRID_DIGITAL_TWIN';

export interface TelemetryEvidence {
  parameter: string;
  observed: string;
  baseline: string;
  delta: string;
  unit: string;
  physicalSignificance: string;
  sourceSensor: string;
  isVerified: boolean;
}

export interface MaintenanceActualOutcome {
  actualDurationHours: number;
  actualCostUsd: number;
  rootCauseConfirmed: boolean;
  sohRecoveryOrStabilizationPct: number;
  postServiceDeltaV: number;
  serviceNotes: string;
  completedAt: string;
  verifiedAt?: string;
  technicianName: string;
  authorizedEngineerId: string;
}

export interface FleetMaintenanceItem {
  id: string;
  vehicleId: string;
  vin: string;
  vehicleName: string;
  modelVariant: string;
  batteryPackId: string;
  chemistry: string;
  detectedIssue: string;
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  evidence: TelemetryEvidence[];
  calculationMethod: CalculationMethodology;
  confidencePct: number;
  uncertaintyPct: number;
  uncertaintyReason: string;
  dataFreshness: string;
  missingInputs?: string[];
  
  // Downtime Planning & Windows
  estimatedMaintenanceWindow: {
    recommendedStart: string;
    deadline: string;
    isSafetyForced: boolean;
    urgencyReason: string;
  };
  expectedServiceDurationHours: number;
  operationalImpact: OperationalImpact;
  recommendedNextAction: string;
  safetyOverride: boolean; // ASIL-D lock: true forces safety scheduling regardless of fleet demand
  
  // Execution tracking
  status: MaintenanceStatus;
  scheduledBayId?: string;
  scheduledShift?: 'MORNING' | 'AFTERNOON' | 'NIGHT_DEPOT' | 'WEEKEND_OVERHAUL';
  scheduledTime?: string;
  assignedTechnician?: string;
  serviceWorkOrderNumber?: string;
  
  // Verification & Feedback Loop
  actualOutcome?: MaintenanceActualOutcome;
  interventionInvestigationId?: string; // Links directly to Intervention Intelligence SLM
  createdAt: string;
  updatedAt: string;
}

export interface FleetVehicle {
  id: string;
  vin: string;
  vehicleName: string;
  modelVariant: string;
  manufacturer: string;
  category: 'electric-car' | 'commercial-vehicle' | 'two-wheeler' | 'three-wheeler';
  batteryPackId: string;
  chemistry: string;
  packVoltage: number;
  avgSoc: number;
  avgSoh: number;
  maxCellTemp: number;
  cellImbalanceMv: number;
  internalResistanceAvgMOhms: number;
  cycleCount: number;
  predictedRulCycles: number;
  dailyMileageKm: number;
  operatingHours: number;
  currentShift: 'MORNING_PEAK' | 'AFTERNOON_SERVICE' | 'EVENING_PEAK' | 'DEPOT_OVERNIGHT' | 'CHARGING';
  utilizationPct: number;
  telemetryFreshnessSeconds: number;
  telemetryQuality: 'HIGH' | 'DEGRADED_SENSORS' | 'OFFLINE_CACHE';
  routeStatus: 'DEPOT_IDLE' | 'ACTIVE_ROUTE' | 'FAST_CHARGING' | 'MAINTENANCE_BAY' | 'DERATED';
  activeMaintenanceId?: string;
  unresolvedSeverity?: MaintenanceSeverity;
}

export interface ServiceBay {
  id: string;
  name: string;
  bayType: 'HIGH_VOLTAGE' | 'THERMAL_COOLING' | 'MODULE_BALANCING' | 'GENERAL_DIAGNOSTICS';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  currentVehicleId?: string;
  currentMaintenanceId?: string;
  allocatedUntil?: string;
  techniciansOnDuty: string[];
  supportedCategories: MaintenanceCategory[];
}

export interface FleetDowntimePlanSummary {
  totalFleetSize: number;
  activeOnRouteCount: number;
  chargingCount: number;
  scheduledMaintenanceCount: number;
  safetyGroundedCount: number;
  fleetAvailabilityPct: number;
  peakDemandCoveredPct: number;
  averageDowntimeVarianceHours: number;
  criticalSafetyQueueCount: number;
  preventedUnplannedBreakdowns: number;
  estimatedCostAvoidedUsd: number;
}
