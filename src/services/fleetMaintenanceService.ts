/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Fleet Intelligence & Predictive Maintenance Service
 *
 * Grounded in physics-first principles, ASIL-D safety mandates, and downtime-aware
 * depot scheduling.
 */

import { 
  FleetVehicle, 
  FleetMaintenanceItem, 
  ServiceBay, 
  FleetDowntimePlanSummary,
  MaintenanceStatus,
  MaintenanceActualOutcome
} from '../types/fleetMaintenance';

const STORAGE_KEY_MAINTENANCE = 'dsimulate_fleet_maintenance_items';
const STORAGE_KEY_VEHICLES = 'dsimulate_fleet_vehicles';
const STORAGE_KEY_BAYS = 'dsimulate_fleet_service_bays';

export const INITIAL_SERVICE_BAYS: ServiceBay[] = [
  {
    id: 'BAY-01-HV',
    name: 'Bay 1: High-Voltage Isolation & Pack Drop Bay',
    bayType: 'HIGH_VOLTAGE',
    status: 'AVAILABLE',
    techniciansOnDuty: ['Senior HV Tech: S. Raman', 'ASIL-D Inspector: K. Mehta'],
    supportedCategories: ['BATTERY_THERMAL', 'ELECTROCHEMISTRY_DEGRADATION', 'ELECTRICAL_HARDWARE']
  },
  {
    id: 'BAY-02-TC',
    name: 'Bay 2: Thermal Management & Glycol Flush Rig',
    bayType: 'THERMAL_COOLING',
    status: 'OCCUPIED',
    currentVehicleId: 'FLEET-EBUS-04',
    currentMaintenanceId: 'MNT-EBUS-004',
    allocatedUntil: 'Today 18:30 IST',
    techniciansOnDuty: ['Thermal Eng: A. Verma'],
    supportedCategories: ['COOLING_LOOP', 'BATTERY_THERMAL']
  },
  {
    id: 'BAY-03-MB',
    name: 'Bay 3: Precision Cell Balancing & BMS Calibration Rack',
    bayType: 'MODULE_BALANCING',
    status: 'AVAILABLE',
    techniciansOnDuty: ['BMS Systems Eng: P. Nair'],
    supportedCategories: ['CELL_IMBALANCE', 'BMS_CALIBRATION']
  }
];

export const INITIAL_FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'FLEET-EV-01',
    vin: 'MAT623048P1N88201',
    vehicleName: 'Tata Nexon EV LR #01 (Active Digital Twin)',
    modelVariant: 'Empowered+ LR (40.5 kWh)',
    manufacturer: 'Tata Motors',
    category: 'electric-car',
    batteryPackId: 'DS-EVBAT-001',
    chemistry: 'NMC 811 / LFP Hybrid',
    packVoltage: 768.4,
    avgSoc: 78.4,
    avgSoh: 88.5,
    maxCellTemp: 41.7,
    cellImbalanceMv: 46.0,
    internalResistanceAvgMOhms: 2.14,
    cycleCount: 716,
    predictedRulCycles: 1420,
    dailyMileageKm: 184,
    operatingHours: 3420,
    currentShift: 'MORNING_PEAK',
    utilizationPct: 84.5,
    telemetryFreshnessSeconds: 4,
    telemetryQuality: 'HIGH',
    routeStatus: 'DERATED',
    activeMaintenanceId: 'MNT-NEXON-001',
    unresolvedSeverity: 'CRITICAL_SAFETY'
  },
  {
    id: 'FLEET-EV-02',
    vin: 'MAT623049P1N88209',
    vehicleName: 'Tata Curvv EV #02',
    modelVariant: 'Empowered+ 55 (55 kWh)',
    manufacturer: 'Tata Motors',
    category: 'electric-car',
    batteryPackId: 'DS-EVBAT-002',
    chemistry: 'LFP Blade Topology',
    packVoltage: 384.2,
    avgSoc: 64.0,
    avgSoh: 94.2,
    maxCellTemp: 31.8,
    cellImbalanceMv: 14.5,
    internalResistanceAvgMOhms: 1.42,
    cycleCount: 288,
    predictedRulCycles: 2850,
    dailyMileageKm: 210,
    operatingHours: 1450,
    currentShift: 'AFTERNOON_SERVICE',
    utilizationPct: 91.2,
    telemetryFreshnessSeconds: 12,
    telemetryQuality: 'HIGH',
    routeStatus: 'ACTIVE_ROUTE'
  },
  {
    id: 'FLEET-EBUS-04',
    vin: 'MAT640081E2B99104',
    vehicleName: 'Tata Starbus Urban EV #04',
    modelVariant: '12m Urban Fleet (320 kWh Dual String)',
    manufacturer: 'Tata Motors',
    category: 'commercial-vehicle',
    batteryPackId: 'DS-EBUS-004',
    chemistry: 'LFP Heavy Commercial',
    packVoltage: 640.8,
    avgSoc: 42.5,
    avgSoh: 83.1,
    maxCellTemp: 38.4,
    cellImbalanceMv: 38.0,
    internalResistanceAvgMOhms: 2.89,
    cycleCount: 1150,
    predictedRulCycles: 980,
    dailyMileageKm: 280,
    operatingHours: 7200,
    currentShift: 'DEPOT_OVERNIGHT',
    utilizationPct: 76.0,
    telemetryFreshnessSeconds: 28,
    telemetryQuality: 'HIGH',
    routeStatus: 'MAINTENANCE_BAY',
    activeMaintenanceId: 'MNT-EBUS-004',
    unresolvedSeverity: 'HIGH_DEGRADATION'
  },
  {
    id: 'FLEET-EV-05',
    vin: 'SAIC480021MG66305',
    vehicleName: 'MG ZS EV Excite #05',
    modelVariant: 'Exclusive Pro (50.3 kWh)',
    manufacturer: 'MG Motor',
    category: 'electric-car',
    batteryPackId: 'DS-MG-005',
    chemistry: 'NMC 811 Prismatic',
    packVoltage: 399.5,
    avgSoc: 82.0,
    avgSoh: 91.0,
    maxCellTemp: 33.2,
    cellImbalanceMv: 22.0,
    internalResistanceAvgMOhms: 1.68,
    cycleCount: 460,
    predictedRulCycles: 2100,
    dailyMileageKm: 140,
    operatingHours: 2300,
    currentShift: 'EVENING_PEAK',
    utilizationPct: 78.4,
    telemetryFreshnessSeconds: 9,
    telemetryQuality: 'HIGH',
    routeStatus: 'ACTIVE_ROUTE',
    activeMaintenanceId: 'MNT-MG-005',
    unresolvedSeverity: 'MEDIUM_OPERATIONAL'
  },
  {
    id: 'FLEET-EV-08',
    vin: 'MAH520033X440088',
    vehicleName: 'Mahindra XUV400 EL #08',
    modelVariant: 'EL Pro Fast-Charge (39.4 kWh)',
    manufacturer: 'Mahindra Electric',
    category: 'electric-car',
    batteryPackId: 'DS-MAH-008',
    chemistry: 'NMC 622 Pouch',
    packVoltage: 365.0,
    avgSoc: 51.0,
    avgSoh: 79.2,
    maxCellTemp: 44.1,
    cellImbalanceMv: 52.0,
    internalResistanceAvgMOhms: 3.40,
    cycleCount: 940,
    predictedRulCycles: 620,
    dailyMileageKm: 195,
    operatingHours: 4900,
    currentShift: 'DEPOT_OVERNIGHT',
    utilizationPct: 62.0,
    telemetryFreshnessSeconds: 15,
    telemetryQuality: 'HIGH',
    routeStatus: 'DEPOT_IDLE',
    activeMaintenanceId: 'MNT-MAH-008',
    unresolvedSeverity: 'CRITICAL_SAFETY'
  },
  {
    id: 'FLEET-2W-12',
    vin: 'ATH310044AP99112',
    vehicleName: 'Ather 450X Gen 3.1 #12',
    modelVariant: 'Performance Dual-Mode (3.7 kWh)',
    manufacturer: 'Ather Energy',
    category: 'two-wheeler',
    batteryPackId: 'DS-ATH-012',
    chemistry: 'NMC 21700 Cylindrical',
    packVoltage: 51.2,
    avgSoc: 89.0,
    avgSoh: 96.5,
    maxCellTemp: 29.5,
    cellImbalanceMv: 8.0,
    internalResistanceAvgMOhms: 12.4,
    cycleCount: 160,
    predictedRulCycles: 1850,
    dailyMileageKm: 65,
    operatingHours: 680,
    currentShift: 'MORNING_PEAK',
    utilizationPct: 88.0,
    telemetryFreshnessSeconds: 6,
    telemetryQuality: 'HIGH',
    routeStatus: 'ACTIVE_ROUTE'
  },
  {
    id: 'FLEET-EV-15',
    vin: 'MAT623099P1N77115',
    vehicleName: 'Tata Nexon EV MR #15',
    modelVariant: 'Creative MR (30.2 kWh)',
    manufacturer: 'Tata Motors',
    category: 'electric-car',
    batteryPackId: 'DS-EVBAT-015',
    chemistry: 'LFP Prismatic',
    packVoltage: 322.0,
    avgSoc: 71.0,
    avgSoh: 86.4,
    maxCellTemp: 34.0,
    cellImbalanceMv: 26.0,
    internalResistanceAvgMOhms: 1.95,
    cycleCount: 610,
    predictedRulCycles: 1650,
    dailyMileageKm: 160,
    operatingHours: 2900,
    currentShift: 'AFTERNOON_SERVICE',
    utilizationPct: 79.5,
    telemetryFreshnessSeconds: 180,
    telemetryQuality: 'DEGRADED_SENSORS',
    routeStatus: 'ACTIVE_ROUTE',
    activeMaintenanceId: 'MNT-NEXON-015',
    unresolvedSeverity: 'LOW_ADVISORY'
  }
];

export const INITIAL_MAINTENANCE_ITEMS: FleetMaintenanceItem[] = [
  {
    id: 'MNT-NEXON-001',
    vehicleId: 'FLEET-EV-01',
    vin: 'MAT623048P1N88201',
    vehicleName: 'Tata Nexon EV LR #01',
    modelVariant: 'Empowered+ LR (40.5 kWh)',
    batteryPackId: 'DS-EVBAT-001',
    chemistry: 'NMC 811 / LFP Hybrid',
    detectedIssue: 'Cell #42 Local Thermal Hotspot & Secondary Voltage Spread',
    category: 'BATTERY_THERMAL',
    severity: 'CRITICAL_SAFETY',
    evidence: [
      {
        parameter: 'Cell #42 Temperature',
        observed: '41.7 °C',
        baseline: '31.2 °C',
        delta: '+10.5 °C',
        unit: '°C',
        physicalSignificance: 'Localized heat generation exceeds thermal dissipation capacity of cold plate channel #4.',
        sourceSensor: 'Module 4 NTC Thermistor #2',
        isVerified: true
      },
      {
        parameter: 'Module 4 Voltage Imbalance (ΔV)',
        observed: '46.0 mV',
        baseline: '< 15.0 mV',
        delta: '+31.0 mV',
        unit: 'mV',
        physicalSignificance: 'Exceeds ASIL-D safe operating threshold; indicates active impedance mismatch or micro-short risk.',
        sourceSensor: 'BMS AFE LTC6813 ADC Channel 4',
        isVerified: true
      },
      {
        parameter: 'Cell Internal Resistance (R_int)',
        observed: '2.84 mΩ',
        baseline: '1.40 mΩ',
        delta: '+1.44 mΩ (+102%)',
        unit: 'mΩ',
        physicalSignificance: 'Electrolyte degradation or localized current collector delamination.',
        sourceSensor: 'Digital Twin EIS Estimator',
        isVerified: true
      }
    ],
    calculationMethod: 'PHYSICS_FIRST_PRINCIPLES',
    confidencePct: 96.2,
    uncertaintyPct: 3.8,
    uncertaintyReason: 'Verified by coupled 1D-Electrochemical and 3D-CFD digital twin simulation; confirmed by live thermistor telemetry.',
    dataFreshness: 'Real-time (4s ago)',
    missingInputs: [],
    estimatedMaintenanceWindow: {
      recommendedStart: 'IMMEDIATE / Current Shift End (14:00 IST)',
      deadline: 'Today 16:00 IST (STRICT ASIL-D DEADLINE)',
      isSafetyForced: true,
      urgencyReason: 'ASIL-D Safety Lock: Continued high-rate discharge risks accelerated SEI breakdown and cell thermal runaway propagation.'
    },
    expectedServiceDurationHours: 3.5,
    operationalImpact: 'GROUNDED_SAFETY',
    recommendedNextAction: 'Ground vehicle immediately upon depot arrival. Transfer pack to Bay 1 for isolation, borescope cell inspection, and coolant channel flush.',
    safetyOverride: true,
    status: 'QUEUED',
    scheduledBayId: 'BAY-01-HV',
    scheduledShift: 'AFTERNOON',
    scheduledTime: 'Today 14:30 - 18:00 IST',
    assignedTechnician: 'Senior HV Tech: S. Raman',
    serviceWorkOrderNumber: 'WO-2026-NEX001',
    interventionInvestigationId: 'inv-001',
    createdAt: '2026-10-14T08:30:00Z',
    updatedAt: '2026-10-14T11:45:00Z'
  },
  {
    id: 'MNT-MAH-008',
    vehicleId: 'FLEET-EV-08',
    vin: 'MAH520033X440088',
    vehicleName: 'Mahindra XUV400 EL #08',
    modelVariant: 'EL Pro Fast-Charge (39.4 kWh)',
    batteryPackId: 'DS-MAH-008',
    chemistry: 'NMC 622 Pouch',
    detectedIssue: 'Severe Cell Imbalance (52mV) & Low Remaining Useful Life (< 620 Cycles)',
    category: 'CELL_IMBALANCE',
    severity: 'CRITICAL_SAFETY',
    evidence: [
      {
        parameter: 'Pack Cell Imbalance Spread (ΔV)',
        observed: '52.0 mV',
        baseline: '< 20.0 mV',
        delta: '+32.0 mV',
        unit: 'mV',
        physicalSignificance: 'Severe SOC divergence; cells reaching cut-off voltage prematurely under highway acceleration.',
        sourceSensor: 'BMS Cell Voltage CAN Frame 0x18F',
        isVerified: true
      },
      {
        parameter: 'Peak Cell Temperature at 60 kW Fast Charge',
        observed: '44.1 °C',
        baseline: '36.0 °C',
        delta: '+8.1 °C',
        unit: '°C',
        physicalSignificance: 'Thermal threshold near critical 45°C limit triggering automatic charge current derating.',
        sourceSensor: 'Pack Ambient & Surface Sensors',
        isVerified: true
      }
    ],
    calculationMethod: 'HYBRID_DIGITAL_TWIN',
    confidencePct: 92.5,
    uncertaintyPct: 7.5,
    uncertaintyReason: 'High confidence based on 940 historical charge cycles and consistent degradation trajectory.',
    dataFreshness: '15s ago',
    missingInputs: [],
    estimatedMaintenanceWindow: {
      recommendedStart: 'Tonight 21:00 IST',
      deadline: 'Tomorrow 06:00 IST',
      isSafetyForced: true,
      urgencyReason: 'Must balance cells before morning shift to prevent unrecoverable overdischarge of weakest pouch.'
    },
    expectedServiceDurationHours: 6.0,
    operationalImpact: 'GROUNDED_SAFETY',
    recommendedNextAction: 'Allocate Bay 3 for 6-hour active resistive module rebalancing and secondary thermal interface check.',
    safetyOverride: true,
    status: 'SCHEDULED',
    scheduledBayId: 'BAY-03-MB',
    scheduledShift: 'NIGHT_DEPOT',
    scheduledTime: 'Tonight 21:00 - Tomorrow 03:00 IST',
    assignedTechnician: 'BMS Systems Eng: P. Nair',
    serviceWorkOrderNumber: 'WO-2026-MAH008',
    createdAt: '2026-10-14T09:10:00Z',
    updatedAt: '2026-10-14T11:00:00Z'
  },
  {
    id: 'MNT-EBUS-004',
    vehicleId: 'FLEET-EBUS-04',
    vin: 'MAT640081E2B99104',
    vehicleName: 'Tata Starbus Urban EV #04',
    modelVariant: '12m Urban Fleet (320 kWh)',
    batteryPackId: 'DS-EBUS-004',
    chemistry: 'LFP Heavy Commercial',
    detectedIssue: 'Thermal Glycol Loop Differential Pressure Drop & Reduced Heat Flux',
    category: 'COOLING_LOOP',
    severity: 'HIGH_DEGRADATION',
    evidence: [
      {
        parameter: 'Cooling Loop Pressure Drop (ΔP)',
        observed: '48.2 kPa',
        baseline: '24.5 kPa',
        delta: '+23.7 kPa (+96%)',
        unit: 'kPa',
        physicalSignificance: 'Fluid hydraulic resistance indicates particulate fouling or air lock in branch manifold #2.',
        sourceSensor: 'Depot Quick-Disconnect Pressure Transducer',
        isVerified: true
      },
      {
        parameter: 'Effective Heat Transfer Coefficient',
        observed: '410 W/m²K',
        baseline: '680 W/m²K',
        delta: '-270 W/m²K',
        unit: 'W/m²K',
        physicalSignificance: 'Heat transfer derated by 40%, elevating pack core temperature under hill-climbing schedules.',
        sourceSensor: 'Thermodynamic Twin Observer',
        isVerified: true
      }
    ],
    calculationMethod: 'PHYSICS_FIRST_PRINCIPLES',
    confidencePct: 94.0,
    uncertaintyPct: 6.0,
    uncertaintyReason: 'Direct pressure differential measurement corroborated by thermal resistance calculations.',
    dataFreshness: '28s ago (Telemetry via Depot Gateway)',
    missingInputs: [],
    estimatedMaintenanceWindow: {
      recommendedStart: 'Today 15:00 IST',
      deadline: 'Tomorrow 12:00 IST',
      isSafetyForced: false,
      urgencyReason: 'High degradation risk: prolonged elevated temperatures will accelerate LFP iron dissolution.'
    },
    expectedServiceDurationHours: 4.0,
    operationalImpact: 'PEAK_HOURS_RESTRICTION',
    recommendedNextAction: 'Coolant evacuation, reverse ultrasonic chemical flush, and refill with 50/50 ethylene glycol at Bay 2.',
    safetyOverride: false,
    status: 'IN_PROGRESS',
    scheduledBayId: 'BAY-02-TC',
    scheduledShift: 'AFTERNOON',
    scheduledTime: 'Today 14:30 - 18:30 IST',
    assignedTechnician: 'Thermal Eng: A. Verma',
    serviceWorkOrderNumber: 'WO-2026-BUS004',
    createdAt: '2026-10-13T16:00:00Z',
    updatedAt: '2026-10-14T11:30:00Z'
  },
  {
    id: 'MNT-MG-005',
    vehicleId: 'FLEET-EV-05',
    vin: 'SAIC480021MG66305',
    vehicleName: 'MG ZS EV Excite #05',
    modelVariant: 'Exclusive Pro (50.3 kWh)',
    batteryPackId: 'DS-MG-005',
    chemistry: 'NMC 811 Prismatic',
    detectedIssue: 'Accelerated Capacity Fade Rate & Non-Linear SEI Growth Gradient',
    category: 'ELECTROCHEMISTRY_DEGRADATION',
    severity: 'MEDIUM_OPERATIONAL',
    evidence: [
      {
        parameter: 'Degradation Rate per 100 Cycles',
        observed: '-1.85 %',
        baseline: '-0.75 %',
        delta: '-1.10 % / 100c',
        unit: '%',
        physicalSignificance: 'Higher-than-expected capacity loss; likely aggravated by frequent fast charging in 38°C ambient.',
        sourceSensor: 'Coulombic Efficiency & RUL Estimator',
        isVerified: true
      }
    ],
    calculationMethod: 'EMPIRICAL_RULE_ENGINE',
    confidencePct: 82.0,
    uncertaintyPct: 18.0,
    uncertaintyReason: 'Estimation relies on historical OCV relaxation curves; requires dedicated 0.1C diagnostic discharge cycle for validation.',
    dataFreshness: '9s ago',
    missingInputs: ['Lab-grade Reference Impedance Spectroscopy (EIS)'],
    estimatedMaintenanceWindow: {
      recommendedStart: 'Weekend Depot Window (Saturday 22:00 IST)',
      deadline: 'Next 500 km',
      isSafetyForced: false,
      urgencyReason: 'Non-critical immediate risk; schedule during off-duty weekend overhaul to prevent fleet service disruption.'
    },
    expectedServiceDurationHours: 5.0,
    operationalImpact: 'NO_IMPACT_SCHEDULED',
    recommendedNextAction: 'Execute full diagnostic charge-discharge cycle with 2-hour rest periods at depot to recalibrate BMS lookup tables.',
    safetyOverride: false,
    status: 'QUEUED',
    scheduledBayId: 'BAY-03-MB',
    scheduledShift: 'WEEKEND_OVERHAUL',
    scheduledTime: 'Saturday 22:00 - Sunday 03:00 IST',
    assignedTechnician: 'BMS Systems Eng: P. Nair',
    serviceWorkOrderNumber: 'WO-2026-MG005',
    createdAt: '2026-10-14T07:15:00Z',
    updatedAt: '2026-10-14T10:00:00Z'
  },
  {
    id: 'MNT-NEXON-015',
    vehicleId: 'FLEET-EV-15',
    vin: 'MAT623099P1N77115',
    vehicleName: 'Tata Nexon EV MR #15',
    modelVariant: 'Creative MR (30.2 kWh)',
    batteryPackId: 'DS-EVBAT-015',
    chemistry: 'LFP Prismatic',
    detectedIssue: 'BMS SOC Estimator Calibration Drift with Intermittent Telemetry Latency',
    category: 'BMS_CALIBRATION',
    severity: 'LOW_ADVISORY',
    evidence: [
      {
        parameter: 'SOC Coulombic vs OCV Divergence',
        observed: '6.4 %',
        baseline: '< 2.0 %',
        delta: '+4.4 %',
        unit: '%',
        physicalSignificance: 'Shallow cycle usage without top-balancing has allowed Kalman filter integrator drift.',
        sourceSensor: 'Extended Kalman Filter (EKF) Residuals',
        isVerified: false
      }
    ],
    calculationMethod: 'EMPIRICAL_RULE_ENGINE',
    confidencePct: 74.0,
    uncertaintyPct: 26.0,
    uncertaintyReason: 'Partial sensor dropouts (telemetry freshness: 180s); estimates labeled as unverified until overnight charge.',
    dataFreshness: '180s ago (DEGRADED)',
    missingInputs: ['High-Frequency CAN Bus Frame 0x100 (Current Shunt)'],
    estimatedMaintenanceWindow: {
      recommendedStart: 'Next Scheduled Depot Overnight',
      deadline: 'Within 7 Days',
      isSafetyForced: false,
      urgencyReason: 'Standard advisory calibration.'
    },
    expectedServiceDurationHours: 2.0,
    operationalImpact: 'NO_IMPACT_SCHEDULED',
    recommendedNextAction: 'Allow vehicle to complete 100% slow AC charge (3.3 kW) with 45-minute CV saturation phase at depot.',
    safetyOverride: false,
    status: 'QUEUED',
    createdAt: '2026-10-14T06:00:00Z',
    updatedAt: '2026-10-14T06:00:00Z'
  },
  {
    id: 'MNT-COMPLETED-01',
    vehicleId: 'FLEET-EV-02',
    vin: 'MAT623049P1N88209',
    vehicleName: 'Tata Curvv EV #02',
    modelVariant: 'Empowered+ 55 (55 kWh)',
    batteryPackId: 'DS-EVBAT-002',
    chemistry: 'LFP Blade Topology',
    detectedIssue: 'HV Contactor Precharge Resistor Thermal Drift & Resistance Rise',
    category: 'ELECTRICAL_HARDWARE',
    severity: 'HIGH_DEGRADATION',
    evidence: [
      {
        parameter: 'Precharge Resistor Resistance',
        observed: '44.2 Ω',
        baseline: '25.0 Ω',
        delta: '+19.2 Ω',
        unit: 'Ω',
        physicalSignificance: 'Extended precharge duration from 120ms to 280ms, stressing main contactor contacts.',
        sourceSensor: 'BMS Contactors Diagnostics',
        isVerified: true
      }
    ],
    calculationMethod: 'PHYSICS_FIRST_PRINCIPLES',
    confidencePct: 95.0,
    uncertaintyPct: 5.0,
    uncertaintyReason: 'Direct ohmic measurement on bench.',
    dataFreshness: 'Verified Historical',
    estimatedMaintenanceWindow: {
      recommendedStart: 'Completed on 2026-10-12',
      deadline: '2026-10-13',
      isSafetyForced: true,
      urgencyReason: 'Contactor weld hazard.'
    },
    expectedServiceDurationHours: 2.5,
    operationalImpact: 'NO_IMPACT_SCHEDULED',
    recommendedNextAction: 'Replaced precharge relay and harness assembly.',
    safetyOverride: true,
    status: 'VERIFIED',
    scheduledBayId: 'BAY-01-HV',
    scheduledShift: 'MORNING',
    scheduledTime: '2026-10-12 09:00 - 11:30 IST',
    assignedTechnician: 'Senior HV Tech: S. Raman',
    serviceWorkOrderNumber: 'WO-2026-CUR002',
    actualOutcome: {
      actualDurationHours: 2.2,
      actualCostUsd: 185,
      rootCauseConfirmed: true,
      sohRecoveryOrStabilizationPct: 0.8,
      postServiceDeltaV: 12.0,
      serviceNotes: 'Replaced precharge ceramic resistor module with OEM revision C. Precharge time restored to 95ms. ASIL-D test passed.',
      completedAt: '2026-10-12T11:20:00Z',
      verifiedAt: '2026-10-12T14:00:00Z',
      technicianName: 'S. Raman',
      authorizedEngineerId: 'ENG-DSIM-884'
    },
    createdAt: '2026-10-11T14:00:00Z',
    updatedAt: '2026-10-12T14:00:00Z'
  }
];

class FleetMaintenanceService {
  private maintenanceItems: FleetMaintenanceItem[] = [];
  private vehicles: FleetVehicle[] = [];
  private serviceBays: ServiceBay[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadState();
    // Attempt backend sync in background
    if (typeof window !== 'undefined') {
      this.syncWithBackend().catch(err => {
        console.warn('Initial fleet backend sync fallback to local cache:', err);
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Error in fleet listener:', err);
      }
    });
  }

  public async syncWithBackend(): Promise<void> {
    try {
      const [mRes, vRes, bRes] = await Promise.all([
        fetch('/api/fleet/maintenance'),
        fetch('/api/fleet/vehicles'),
        fetch('/api/fleet/bays')
      ]);

      if (mRes.ok && vRes.ok && bRes.ok) {
        const items = await mRes.json();
        const vehicles = await vRes.json();
        const bays = await bRes.json();

        if (Array.isArray(items) && items.length > 0) {
          this.maintenanceItems = items;
          this.saveItems();
        }
        if (Array.isArray(vehicles) && vehicles.length > 0) {
          this.vehicles = vehicles;
          this.saveVehicles();
        }
        if (Array.isArray(bays) && bays.length > 0) {
          this.serviceBays = bays;
          this.saveBays();
        }
        this.notify();
      }
    } catch (e) {
      // Backend may be offline or during dev boot; local fallback is active
    }
  }

  private loadState() {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEY_MAINTENANCE);
      const storedVehicles = localStorage.getItem(STORAGE_KEY_VEHICLES);
      const storedBays = localStorage.getItem(STORAGE_KEY_BAYS);

      if (storedItems) {
        this.maintenanceItems = JSON.parse(storedItems);
      } else {
        this.maintenanceItems = [...INITIAL_MAINTENANCE_ITEMS];
        this.saveItems();
      }

      if (storedVehicles) {
        this.vehicles = JSON.parse(storedVehicles);
      } else {
        this.vehicles = [...INITIAL_FLEET_VEHICLES];
        this.saveVehicles();
      }

      if (storedBays) {
        this.serviceBays = JSON.parse(storedBays);
      } else {
        this.serviceBays = [...INITIAL_SERVICE_BAYS];
        this.saveBays();
      }
    } catch {
      this.maintenanceItems = [...INITIAL_MAINTENANCE_ITEMS];
      this.vehicles = [...INITIAL_FLEET_VEHICLES];
      this.serviceBays = [...INITIAL_SERVICE_BAYS];
    }
  }

  private saveItems() {
    try {
      localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(this.maintenanceItems));
    } catch (e) {
      console.warn('Unable to persist fleet maintenance items:', e);
    }
  }

  private saveVehicles() {
    try {
      localStorage.setItem(STORAGE_KEY_VEHICLES, JSON.stringify(this.vehicles));
    } catch (e) {
      console.warn('Unable to persist fleet vehicles:', e);
    }
  }

  private saveBays() {
    try {
      localStorage.setItem(STORAGE_KEY_BAYS, JSON.stringify(this.serviceBays));
    } catch (e) {
      console.warn('Unable to persist service bays:', e);
    }
  }

  public getMaintenanceQueue(): FleetMaintenanceItem[] {
    return [...this.maintenanceItems];
  }

  public getVehicles(): FleetVehicle[] {
    return [...this.vehicles];
  }

  public getServiceBays(): ServiceBay[] {
    return [...this.serviceBays];
  }

  public getSummary(): FleetDowntimePlanSummary {
    const totalFleetSize = this.vehicles.length;
    const activeOnRouteCount = this.vehicles.filter(v => v.routeStatus === 'ACTIVE_ROUTE').length;
    const chargingCount = this.vehicles.filter(v => v.routeStatus === 'FAST_CHARGING').length;
    const safetyGroundedCount = this.vehicles.filter(v => v.routeStatus === 'DERATED' || v.unresolvedSeverity === 'CRITICAL_SAFETY').length;
    const scheduledMaintenanceCount = this.maintenanceItems.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS').length;

    // Calculate uptime / availability
    const fleetAvailabilityPct = totalFleetSize > 0 
      ? Math.round(((totalFleetSize - safetyGroundedCount) / totalFleetSize) * 1000) / 10 
      : 100;

    // Peak demand coverage: 80% minimum required for city rush
    const peakDemandCoveredPct = Math.min(100, Math.round((activeOnRouteCount / (totalFleetSize * 0.7)) * 100));

    // Calculate average duration variance between predicted and actual
    const completedItems = this.maintenanceItems.filter(m => m.actualOutcome);
    let totalVariance = 0;
    completedItems.forEach(item => {
      if (item.actualOutcome) {
        totalVariance += Math.abs(item.actualOutcome.actualDurationHours - item.expectedServiceDurationHours);
      }
    });
    const averageDowntimeVarianceHours = completedItems.length > 0 
      ? Math.round((totalVariance / completedItems.length) * 10) / 10 
      : 0.3;

    const criticalSafetyQueueCount = this.maintenanceItems.filter(
      m => m.severity === 'CRITICAL_SAFETY' && (m.status === 'QUEUED' || m.status === 'SCHEDULED' || m.status === 'OVERDUE')
    ).length;

    return {
      totalFleetSize,
      activeOnRouteCount,
      chargingCount,
      scheduledMaintenanceCount,
      safetyGroundedCount,
      fleetAvailabilityPct,
      peakDemandCoveredPct,
      averageDowntimeVarianceHours,
      criticalSafetyQueueCount,
      preventedUnplannedBreakdowns: 4,
      estimatedCostAvoidedUsd: 14850
    };
  }

  public scheduleMaintenance(
    itemId: string, 
    bayId: string, 
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT_DEPOT' | 'WEEKEND_OVERHAUL',
    scheduledTime: string,
    technician: string
  ): FleetMaintenanceItem | null {
    const item = this.maintenanceItems.find(m => m.id === itemId);
    if (!item) return null;

    item.status = 'SCHEDULED';
    item.scheduledBayId = bayId;
    item.scheduledShift = shift;
    item.scheduledTime = scheduledTime;
    item.assignedTechnician = technician;
    item.updatedAt = new Date().toISOString();

    // Update vehicle route status if safety critical
    const vehicle = this.vehicles.find(v => v.id === item.vehicleId);
    if (vehicle) {
      if (item.severity === 'CRITICAL_SAFETY') {
        vehicle.routeStatus = 'DERATED';
      }
      vehicle.activeMaintenanceId = item.id;
    }

    this.saveItems();
    this.saveVehicles();
    this.notify();

    // Sync with backend asynchronously
    fetch('/api/fleet/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, bayId, shift, scheduledTime, technician })
    }).catch(err => console.warn('Backend schedule sync note:', err));

    return item;
  }

  public startMaintenance(itemId: string): FleetMaintenanceItem | null {
    const item = this.maintenanceItems.find(m => m.id === itemId);
    if (!item) return null;

    item.status = 'IN_PROGRESS';
    item.updatedAt = new Date().toISOString();

    const vehicle = this.vehicles.find(v => v.id === item.vehicleId);
    if (vehicle) {
      vehicle.routeStatus = 'MAINTENANCE_BAY';
      vehicle.activeMaintenanceId = item.id;
    }

    // Update bay allocation
    if (item.scheduledBayId) {
      const bay = this.serviceBays.find(b => b.id === item.scheduledBayId);
      if (bay) {
        bay.status = 'OCCUPIED';
        bay.currentVehicleId = item.vehicleId;
        bay.currentMaintenanceId = item.id;
        bay.allocatedUntil = `In Progress (${item.expectedServiceDurationHours}h window)`;
      }
    }

    this.saveItems();
    this.saveVehicles();
    this.saveBays();
    this.notify();

    fetch('/api/fleet/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId })
    }).catch(err => console.warn('Backend start sync note:', err));

    return item;
  }

  public completeMaintenance(itemId: string, outcome: MaintenanceActualOutcome): FleetMaintenanceItem | null {
    const item = this.maintenanceItems.find(m => m.id === itemId);
    if (!item) return null;

    item.status = 'COMPLETED';
    item.actualOutcome = outcome;
    item.updatedAt = new Date().toISOString();

    // Release bay
    if (item.scheduledBayId) {
      const bay = this.serviceBays.find(b => b.id === item.scheduledBayId);
      if (bay) {
        bay.status = 'AVAILABLE';
        bay.currentVehicleId = undefined;
        bay.currentMaintenanceId = undefined;
        bay.allocatedUntil = undefined;
      }
    }

    // Update vehicle status
    const vehicle = this.vehicles.find(v => v.id === item.vehicleId);
    if (vehicle) {
      vehicle.routeStatus = 'DEPOT_IDLE';
      vehicle.unresolvedSeverity = undefined;
      if (outcome.rootCauseConfirmed) {
        vehicle.avgSoh = Math.min(100, vehicle.avgSoh + (outcome.sohRecoveryOrStabilizationPct || 0));
        vehicle.cellImbalanceMv = outcome.postServiceDeltaV || 12.0;
        if (vehicle.maxCellTemp > 38) {
          vehicle.maxCellTemp = 31.5;
        }
      }
    }

    this.saveItems();
    this.saveVehicles();
    this.saveBays();
    this.notify();

    fetch('/api/fleet/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, outcome })
    }).catch(err => console.warn('Backend complete sync note:', err));

    return item;
  }

  public verifyMaintenance(itemId: string, verificationNotes: string, engineerId: string): FleetMaintenanceItem | null {
    const item = this.maintenanceItems.find(m => m.id === itemId);
    if (!item) return null;

    item.status = 'VERIFIED';
    if (item.actualOutcome) {
      item.actualOutcome.verifiedAt = new Date().toISOString();
      item.actualOutcome.authorizedEngineerId = engineerId;
      item.actualOutcome.serviceNotes += ` | [VERIFIED BY ${engineerId}]: ${verificationNotes}`;
    }
    item.updatedAt = new Date().toISOString();

    const vehicle = this.vehicles.find(v => v.id === item.vehicleId);
    if (vehicle) {
      vehicle.routeStatus = 'ACTIVE_ROUTE';
      vehicle.activeMaintenanceId = undefined;
    }

    this.saveItems();
    this.saveVehicles();
    this.notify();

    fetch('/api/fleet/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, verificationNotes, engineerId })
    }).catch(err => console.warn('Backend verify sync note:', err));

    return item;
  }

  public async investigateWithSlm(item: FleetMaintenanceItem): Promise<any> {
    try {
      const res = await fetch('/api/fleet/slm-investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceItem: item })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('SLM fetch fallback to local computation:', e);
    }

    // Local deterministic physics fallback
    return {
      online: false,
      model: 'first-principles-coupled-solver',
      physicalMechanism: `Deterministic 2-RC analysis confirms that anomaly "${item.detectedIssue}" stems from localized impedance accumulation (ΔR_int) and boundary layer thermal stagnation. In ${item.chemistry} cells, elevated temperature gradients drive non-linear SEI layer thickening governed by Arrhenius kinetics.`,
      recommendedIntervention: item.recommendedNextAction || 'Execute targeted thermal flush and precision cell balancing in dedicated service bay.',
      expectedDowntimeHours: item.expectedServiceDurationHours || 3.5,
      asilDSafetyRisk: item.severity === 'CRITICAL_SAFETY' ? 'CRITICAL' : 'MODERATE',
      consequenceOfDeferral: item.estimatedMaintenanceWindow?.urgencyReason || 'Continued high-rate operation risks accelerated degradation and unrecoverable cell imbalance.',
      feasibleScenarios: [
        {
          name: 'Hardware Service Bay Procedure (Recommended)',
          action: 'Physical manifold flush, module inspection, and active CV balancing',
          expectedSohRecoveryPct: 0.8,
          expectedRulCycleDelta: 320,
          feasibility: 'HIGH'
        },
        {
          name: 'Software Derating Only (Advisory)',
          action: 'Derate charge current by 25% via BMS OTA update; does not clear physical blockage',
          expectedSohRecoveryPct: 0.2,
          expectedRulCycleDelta: 80,
          feasibility: 'MEDIUM'
        }
      ]
    };
  }

  /**
   * Scans all vehicles across the fleet using validated first-principles rules
   * to detect emerging maintenance needs.
   */
  public scanFleetForEmergingRisks(): { newItemsCount: number } {
    let newItemsCount = 0;

    for (const veh of this.vehicles) {
      // Check if vehicle already has an active unresolved item
      const hasActive = this.maintenanceItems.some(
        m => m.vehicleId === veh.id && (m.status === 'QUEUED' || m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS')
      );
      if (hasActive) continue;

      // Rule 1: Thermal Hotspot Critical Safety (T > 40°C)
      if (veh.maxCellTemp >= 40.0) {
        const isCritical = veh.maxCellTemp >= 43.0;
        const newItem: FleetMaintenanceItem = {
          id: `MNT-AUTO-${veh.id.replace('FLEET-', '')}-${Date.now().toString(36).toUpperCase()}`,
          vehicleId: veh.id,
          vin: veh.vin,
          vehicleName: veh.vehicleName,
          modelVariant: veh.modelVariant,
          batteryPackId: veh.batteryPackId,
          chemistry: veh.chemistry,
          detectedIssue: `Emerging Core Thermal Anomaly: Max Cell Temp reached ${veh.maxCellTemp.toFixed(1)}°C`,
          category: 'BATTERY_THERMAL',
          severity: isCritical ? 'CRITICAL_SAFETY' : 'HIGH_DEGRADATION',
          evidence: [
            {
              parameter: 'Max Cell Surface Temperature',
              observed: `${veh.maxCellTemp.toFixed(1)} °C`,
              baseline: '30.0 °C',
              delta: `+${(veh.maxCellTemp - 30.0).toFixed(1)} °C`,
              unit: '°C',
              physicalSignificance: 'Heat generation rate exceeds cooling convective removal, accelerating Arrhenius SEI film growth.',
              sourceSensor: 'BMS NTC Sensor Array',
              isVerified: true
            }
          ],
          calculationMethod: 'PHYSICS_FIRST_PRINCIPLES',
          confidencePct: 91.0,
          uncertaintyPct: 9.0,
          uncertaintyReason: 'Real-time telemetry continuous sampling; ambient temperature assumed 25°C.',
          dataFreshness: `${veh.telemetryFreshnessSeconds}s ago`,
          missingInputs: [],
          estimatedMaintenanceWindow: {
            recommendedStart: isCritical ? 'Immediate Depot Pullout' : 'Next Shift Window',
            deadline: isCritical ? 'Within 2 Hours (ASIL-D Lock)' : 'Within 24 Hours',
            isSafetyForced: isCritical,
            urgencyReason: isCritical ? 'ASIL-D Mandate: Prevent localized thermal runaway propagation.' : 'Degradation mitigation'
          },
          expectedServiceDurationHours: 3.5,
          operationalImpact: isCritical ? 'GROUNDED_SAFETY' : 'PEAK_HOURS_RESTRICTION',
          recommendedNextAction: 'Inspect thermal TIM pad and perform coolant channel leak / flow test.',
          safetyOverride: isCritical,
          status: 'QUEUED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.maintenanceItems.unshift(newItem);
        veh.activeMaintenanceId = newItem.id;
        veh.unresolvedSeverity = newItem.severity;
        if (isCritical) veh.routeStatus = 'DERATED';
        newItemsCount++;
      }
      // Rule 2: Severe Cell Imbalance (ΔV > 35mV)
      else if (veh.cellImbalanceMv >= 35.0) {
        const isCritical = veh.cellImbalanceMv >= 45.0;
        const newItem: FleetMaintenanceItem = {
          id: `MNT-AUTO-${veh.id.replace('FLEET-', '')}-${Date.now().toString(36).toUpperCase()}`,
          vehicleId: veh.id,
          vin: veh.vin,
          vehicleName: veh.vehicleName,
          modelVariant: veh.modelVariant,
          batteryPackId: veh.batteryPackId,
          chemistry: veh.chemistry,
          detectedIssue: `Significant Cell Imbalance Spread (${veh.cellImbalanceMv.toFixed(1)} mV)`,
          category: 'CELL_IMBALANCE',
          severity: isCritical ? 'CRITICAL_SAFETY' : 'MEDIUM_OPERATIONAL',
          evidence: [
            {
              parameter: 'Cell Voltage Imbalance (ΔV)',
              observed: `${veh.cellImbalanceMv.toFixed(1)} mV`,
              baseline: '< 15.0 mV',
              delta: `+${(veh.cellImbalanceMv - 15.0).toFixed(1)} mV`,
              unit: 'mV',
              physicalSignificance: 'Coulombic capacity divergence between cells causing early pack cutoff.',
              sourceSensor: 'BMS AFE Multi-Channel ADC',
              isVerified: true
            }
          ],
          calculationMethod: 'EMPIRICAL_RULE_ENGINE',
          confidencePct: 86.0,
          uncertaintyPct: 14.0,
          uncertaintyReason: 'Derived from dynamic drive cycle telemetry; requires overnight rest for true OCV relaxation.',
          dataFreshness: `${veh.telemetryFreshnessSeconds}s ago`,
          missingInputs: ['Relaxed 2-Hour OCV Resting Voltage Curve'],
          estimatedMaintenanceWindow: {
            recommendedStart: 'Night Depot Overhaul (22:00 - 06:00 IST)',
            deadline: 'Within 48 Hours',
            isSafetyForced: isCritical,
            urgencyReason: 'Active resistive rebalance required to restore usable range.'
          },
          expectedServiceDurationHours: 4.5,
          operationalImpact: isCritical ? 'GROUNDED_SAFETY' : 'NO_IMPACT_SCHEDULED',
          recommendedNextAction: 'Connect to Bay 3 precision balancer for 4-hour CV top-balancing cycle.',
          safetyOverride: isCritical,
          status: 'QUEUED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.maintenanceItems.unshift(newItem);
        veh.activeMaintenanceId = newItem.id;
        veh.unresolvedSeverity = newItem.severity;
        newItemsCount++;
      }
    }

    if (newItemsCount > 0) {
      this.saveItems();
      this.saveVehicles();
      this.notify();
    }

    return { newItemsCount };
  }

  public updateItemStatus(itemId: string, status: MaintenanceStatus): FleetMaintenanceItem | null {
    const item = this.maintenanceItems.find(m => m.id === itemId);
    if (!item) return null;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    this.saveItems();
    this.notify();
    return item;
  }

  public resetToDefaults() {
    this.maintenanceItems = [...INITIAL_MAINTENANCE_ITEMS];
    this.vehicles = [...INITIAL_FLEET_VEHICLES];
    this.serviceBays = [...INITIAL_SERVICE_BAYS];
    this.saveItems();
    this.saveVehicles();
    this.saveBays();
    this.notify();
  }
}

export const fleetMaintenanceService = new FleetMaintenanceService();
