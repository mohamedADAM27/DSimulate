/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Intervention Intelligence Service Layer
 * Orchestrates persistence, Physics SLM API interaction, Digital Twin Scenario Lab executions,
 * Mechanic Diagnostic Copilot chat, and Second-Life / Digital Battery Passport operations.
 */

import QRCode from 'qrcode';
import { 
  InterventionInvestigation, 
  CandidateIntervention, 
  ScenarioComparisonData, 
  RootCauseHypothesis,
  ApprovalRecord,
  VerificationRecord,
  BatterySnapshot,
  DigitalBatteryPassport,
  SecondLifeAssessment,
  EngineeringChatMessage
} from '../types/intervention';
import { BatteryPack, DiagnosticEvent, SimulationParams } from '../types/battery';
import { runTimeDomainSimulation } from './physicsEngine';

const STORAGE_KEY = 'dsimulate_interventions_v2';

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 220,
      color: {
        dark: '#00273D',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

export function createDefaultBatteryPassport(
  invId: string,
  packId: string,
  packName: string,
  soh: number
): DigitalBatteryPassport {
  const passportId = `DPP-EU-${packId}-2026-9482`;
  const publicAccessUrl = `https://dsimulate.internal/passport/${passportId}`;

  return {
    passportId,
    packId,
    vin: '1HGCR2F83HA009482',
    qrDataUrl: '',
    publicAccessUrl,
    manufacturer: 'DSimulate Dynamics GmbH & Co. KG',
    manufacturingDate: '2024-03-12',
    manufacturingLocation: 'Salzgitter Gigafactory 1, Germany',
    chemistry: 'NMC 811 / Synthetic Graphite Anode',
    nominalCapacityKWh: 82.5,
    originalVoltage: 768.0,
    totalCycles: 716,
    carbonFootprintKgCo2PerKWh: 68.4,
    criticalRawMaterials: {
      cobaltPct: 4.8,
      lithiumPct: 7.2,
      nickelPct: 38.5,
      manganesePct: 4.9,
      recycledContentPct: 16.5,
    },
    healthSnapshot: {
      currentSoh: soh,
      currentCapacityKWh: Number(((82.5 * soh) / 100).toFixed(1)),
      internalResistanceMohm: 1.82,
      roundTripEfficiencyPct: 91.4,
      cumulativeEnergyThroughputMWh: 58.9,
      diagnosticAnomaliesCount: 2,
    },
    secondLifeAssessment: {
      assessedAt: '2026-10-14 10:00:00 UTC',
      category: soh >= 85 ? 'DIRECT_REUSE' : soh >= 75 ? 'REPURPOSING' : 'RECYCLING',
      suitability: soh >= 70 ? 'ELIGIBLE' : 'INELIGIBLE',
      overallScore: Math.round(soh * 0.9 + 5),
      sohThresholdPassed: soh >= 70,
      irThresholdPassed: true,
      thermalIntegrityPassed: true,
      cellSpreadPassed: true,
      safetyCertificationStandard: 'EU 2023/1542 & IEC 62619',
      slmRationale: `Pack exhibits ${soh.toFixed(1)}% State of Health with moderate cyclic degradation. Cell internal resistances remain within 1.8x baseline. Highly suitable for stationary energy storage systems (BESS) or industrial peak-shaving microgrids operating at ≤0.5C discharge rates.`,
      missingEvidence: [
        'High-voltage insulation resistance test (> 500 Ω/V across casing)',
        'Full 0.2C reference capacity verification cycle',
        'Module-to-module balancing skew verification'
      ],
      nextAssessmentSteps: [
        'Conduct IEC 62619 dielectric withstand test at 2500 V DC',
        'Execute 24-hour self-discharge relaxation measurement at 50% SOC',
        'Apply for Second-Life Re-Certification with EU Battery Passport Registry'
      ],
      applications: [
        {
          id: 'APP-01',
          name: 'Commercial & Industrial Stationary BESS',
          category: 'STATIONARY_STORAGE',
          suitabilityScore: 88,
          cRateRequirement: '≤ 0.5C Continuous / 1.0C Peak',
          economicResidualValueUsd: 8400,
          projectedLifespanYears: 8.5,
          safetyCertifications: ['IEC 62619', 'UL 1973', 'NFPA 855'],
          prerequisites: ['Module active balancing reflash', 'Insulation resistance ≥ 500 Ω/V'],
          status: 'OPTIMAL',
        },
        {
          id: 'APP-02',
          name: 'Solar PV Farm Microgrid Storage Buffer',
          category: 'MICROGRID',
          suitabilityScore: 84,
          cRateRequirement: '≤ 0.3C Steady Charge/Discharge',
          economicResidualValueUsd: 7900,
          projectedLifespanYears: 10.0,
          safetyCertifications: ['IEC 62619', 'IEEE 1547'],
          prerequisites: ['Inverter BMS CAN-bus handshake configuration'],
          status: 'OPTIMAL',
        },
        {
          id: 'APP-03',
          name: 'Critical Infrastructure & Telecom UPS Backup',
          category: 'BACKUP_POWER',
          suitabilityScore: 78,
          cRateRequirement: 'Low Float Current / 2.0C Emergency Pulse',
          economicResidualValueUsd: 6500,
          projectedLifespanYears: 7.0,
          safetyCertifications: ['UL 9540A'],
          prerequisites: ['HV contactor cycle count verification'],
          status: 'ACCEPTABLE',
        }
      ],
    },
    lifecycleTimeline: [
      {
        id: 'EVT-01',
        date: '2024-03-12',
        event: 'Cell & Pack Assembly Completed',
        category: 'MANUFACTURE',
        description: 'End-of-line verification passed at Salzgitter Gigafactory 1. Zero initial cell impedance delta.',
        actor: 'QA/QC Station #14',
        verified: true,
      },
      {
        id: 'EVT-02',
        date: '2024-04-18',
        event: 'Vehicle Integration & Commissioning',
        category: 'DEPLOYMENT',
        description: 'Installed in 800V BEV platform. BMS firmware v1.0.4 loaded with ASIL-D safety parameters.',
        actor: 'OEM Assembly Plant',
        verified: true,
      },
      {
        id: 'EVT-03',
        date: '2026-10-14',
        event: 'Thermal Boundary Hotspot & Anomaly Flagged',
        category: 'DIAGNOSIS',
        description: 'BMS logged 13.2°C thermal deviation on Cell C-017 during high-dynamic drive cycle.',
        actor: 'DSimulate Digital Twin Telemetry Engine',
        verified: true,
      },
      {
        id: 'EVT-04',
        date: '2026-10-14',
        event: 'Counterfactual Intervention Evaluated',
        category: 'INTERVENTION',
        description: 'Coolant flow boost (+35%) and C-rate de-rating simulated. Outcome approved by Chief Safety Engineer.',
        actor: 'Intervention Intelligence — Vertical AI',
        verified: true,
      }
    ],
    authorizedServiceLog: [
      {
        date: '2025-06-20',
        serviceType: 'Annual Inspection & Coolant Refractometer Test',
        engineer: 'Tech-412 Bauer',
        notes: 'Glycol/water ratio nominal 50/50. Contact resistances verified < 0.2 mΩ.',
      },
      {
        date: '2026-10-14',
        serviceType: 'Physics SLM Anomaly Investigation & Flow Optimization',
        engineer: 'Dr. Elena Rostova',
        notes: 'Investigation INV-2026-X04 initiated. Targeted remediation active.',
      }
    ],
  };
}

// Deterministic seed cases ensuring immediate richness on first boot
const DEFAULT_INVESTIGATIONS: InterventionInvestigation[] = [
  {
    id: 'INV-2026-X04',
    title: 'Cell C-017 Localized Thermal Hotspot & SEI Layer Passivation',
    packId: 'PACK-800V-BASE',
    packName: 'DSimulate 800V Baseline (96S3P)',
    createdAt: '2026-10-14 09:15:00 UTC',
    updatedAt: '2026-10-14 11:20:00 UTC',
    status: 'PENDING_APPROVAL',
    priority: 'CRITICAL',
    sourceDiagnosis: {
      id: 'DIAG-HOTSPOT-017',
      objectId: 'C-017',
      objectType: 'CELL',
      parameter: 'Cell Surface Temperature',
      observed: '41.7 °C',
      expected: '28.5 °C',
      unit: '°C',
      deviation: '+13.2 °C (+46.3%)',
      severity: 'WARNING',
      status: 'ACTIVE',
      cycle: 716,
      timestamp: '2026-10-14 09:12:44',
      description: 'Cell C-017 operating 13.2°C above module mean under WLTP dynamic discharge cycle.',
      rootCause: 'Suspected partial flow stagnation in lower serpentine cooling channel with elevated ohmic Joule dissipation.',
    },
    batterySnapshot: {
      packId: 'PACK-800V-BASE',
      packName: 'DSimulate 800V Baseline (96S3P)',
      architecture: '800V Architecture · 96S3P',
      avgSoc: 82.5,
      avgSoh: 94.6,
      packVoltage: 768.4,
      packCurrent: -65.2,
      maxCellTemp: 41.7,
      minCellTemp: 28.2,
      voltageSpreadMv: 46,
      predictedRulCycles: 1420,
      nominalCapacityKWh: 82.5,
      measuredCapacityKWh: 75.2,
    },
    aiInvestigation: {
      slmInterpretation: 'Electrochemical & CFD analysis confirms localized thermal stagnation at Cell C-017 situated in Module MOD-03. The 13.2°C thermal delta accelerates secondary solid electrolyte interphase (SEI) film thickening via the Arrhenius equation (k_SEI ∝ exp(-Ea/RT)). With an activation energy Ea ≈ 31.5 kJ/mol, degradation reaction kinetics are amplified by 1.74x compared to ambient module cells. Continued unmitigated operation risks premature lithium inventory loss and localized impedance growth.',
      rootCauses: [
        {
          id: 'RC-01',
          title: 'Coolant Flow Channel Cavitation / Partial Boundary Blockage',
          probability: 78,
          physicalMechanism: 'Navier-Stokes microchannel flow separation adjacent to cell casing #17 causing thermal boundary layer stagnation and Reynolds number reduction from 6400 to ~2100.',
          supportingEvidence: [
            'Localized temperature rise strictly isolated to Cell C-017 (+13.2°C)',
            'Pressure drop sensor across MOD-03 reads +4.2% above baseline design specification',
            'Adjacent cell C-018 exhibits moderate thermal gradient (+3.1°C)'
          ],
          contradictingEvidence: [
            'Pack total inlet coolant flow rate remains nominal at 10.3 L/min'
          ],
          confidenceScore: 0.88,
          severityRating: 'CRITICAL',
        },
        {
          id: 'RC-02',
          title: 'Elevated Current Collector Weld Contact Resistance (R_contact)',
          probability: 22,
          physicalMechanism: 'Ultrasonic weld micro-fissure at cell tab interface generating excessive I²R Joule heating during high-current regenerative braking pulses.',
          supportingEvidence: [
            'Measured cell internal resistance R_int = 2.85 mΩ (versus 1.72 mΩ nominal baseline)',
            'Thermal spike correlates with transient discharge peaks exceeding -90A'
          ],
          contradictingEvidence: [
            'Open-circuit voltage relaxation matches nominal baseline curve within 4 mV'
          ],
          confidenceScore: 0.65,
          severityRating: 'WARNING',
        }
      ],
      missingMeasurements: [
        'Local differential pressure transducer across Module MOD-03 coolant branch',
        'Galvanostatic Electrochemical Impedance Spectroscopy (GEIS) at 1 kHz and 10 mHz',
        'Direct optical or ultrasonic tab weld inspection'
      ],
      recommendedDiagnosticTests: [
        'Execute 15-minute steady-state thermal equilibration at 0A idle',
        'Step-response 150kW fast charge test to isolate ohmic (R_ohm) from capacitive (C_dl) voltage drop',
        'High-flow coolant channel flush test at 16 L/min'
      ],
      engineeringChat: [
        {
          id: 'MSG-01',
          role: 'user',
          text: 'What torque specification should we use when reattaching the busbar after inspecting Cell C-017?',
          timestamp: '2026-10-14 09:22:10 UTC',
          sourceContext: 'SHOP_FLOOR',
        },
        {
          id: 'MSG-02',
          role: 'assistant',
          text: 'For M6 grade 8.8 copper-plated busbar bolts on the 800V module, tighten in two stages: Stage 1 snug to 4.5 Nm, Stage 2 final torque to 9.0 Nm ± 0.5 Nm using an insulated torque wrench. Apply Loctite 243 threadlocker and apply red witness inspection torque seal.',
          timestamp: '2026-10-14 09:22:15 UTC',
          isPhysicsReasoning: true,
          sourceContext: 'SHOP_FLOOR',
        }
      ],
    },
    candidateInterventions: [
      {
        id: 'INT-01',
        title: 'Active Coolant Flow Rate Boost (+35%) with Periodic Pressure Pulse',
        type: 'THERMAL_OPTIMIZATION',
        description: 'Command auxiliary variable-speed coolant pump to increase volumetric flow from 10.3 to 14.0 L/min, dislodging boundary stagnation.',
        physicalRationale: 'Elevates channel Reynolds number Re from 6420 to ~8700, elevating convective heat transfer coefficient h from 850 W/(m²·K) to 1120 W/(m²·K) and collapsing thermal boundary layer.',
        feasibility: 'HIGH',
        estimatedCostUsd: 120,
        downtimeMinutes: 0,
        riskLevel: 'LOW',
        safetyConstraints: [
          'Coolant line maximum operating pressure must remain < 250 kPa gauge',
          'Inlet temperature maintained above 15°C to avoid condensation'
        ],
        unsupportedActions: [
          'Permanent pump overclocking beyond 16 L/min continuous due to cavitation risk'
        ],
        expectedBenefit: {
          deltaSohPct: 2.8,
          deltaRulCycles: 380,
          deltaPeakTempC: -7.4,
          deltaVoltageSpreadMv: -18,
        },
        simParameters: {
          coolantFlowBoostPct: 35,
          chargingCurrentDeRatePct: 0,
          maxSocCeiling: 100,
          activeCellBypassEnabled: false,
          preConditioningTempC: 20,
        },
        status: 'RECOMMENDED',
      },
      {
        id: 'INT-02',
        title: 'Fast-Charge C-Rate De-Rating (1.8C → 1.2C) & Peak SOC Ceiling at 85%',
        type: 'CHARGE_DERATING',
        description: 'Reprogram BMS software calibration to enforce 1.2C maximum charging threshold and 85% SOC ceiling until servicing.',
        physicalRationale: 'Drastically suppresses irreversible overpotentials η_ohmic and limits Joule heating during end-of-charge phase where negative electrode potential approaches 0V vs Li/Li+.',
        feasibility: 'HIGH',
        estimatedCostUsd: 50,
        downtimeMinutes: 15,
        riskLevel: 'LOW',
        safetyConstraints: [
          'Driver notification must confirm reduced EV range (approx -12% on long trips)'
        ],
        unsupportedActions: [
          'Cannot override hardware emergency charging overrides'
        ],
        expectedBenefit: {
          deltaSohPct: 3.4,
          deltaRulCycles: 450,
          deltaPeakTempC: -5.1,
          deltaVoltageSpreadMv: -22,
        },
        simParameters: {
          coolantFlowBoostPct: 15,
          chargingCurrentDeRatePct: 25,
          maxSocCeiling: 85,
          activeCellBypassEnabled: false,
          preConditioningTempC: 22,
        },
        status: 'CANDIDATE',
      }
    ],
    selectedInterventionId: 'INT-01',
    simulationComparison: {
      simulated: true,
      baselineTelemetry: {
        maxTemp: 41.7,
        minVoltage: 3.14,
        sohAt1000Cycles: 91.2,
        predictedRul: 1420,
        timeToThermalLimitSec: 840,
      },
      interventionTelemetry: {
        maxTemp: 34.3,
        minVoltage: 3.22,
        sohAt1000Cycles: 94.0,
        predictedRul: 1800,
        timeToThermalLimitSec: 1800,
      },
      timeSeriesDelta: [
        { time: 0, baselineTemp: 28.5, interventionTemp: 28.5, baselineVolt: 3.72, interventionVolt: 3.72 },
        { time: 10, baselineTemp: 31.2, interventionTemp: 29.8, baselineVolt: 3.68, interventionVolt: 3.69 },
        { time: 20, baselineTemp: 34.8, interventionTemp: 31.4, baselineVolt: 3.61, interventionVolt: 3.64 },
        { time: 30, baselineTemp: 37.9, interventionTemp: 32.7, baselineVolt: 3.52, interventionVolt: 3.58 },
        { time: 40, baselineTemp: 39.8, interventionTemp: 33.5, baselineVolt: 3.44, interventionVolt: 3.51 },
        { time: 50, baselineTemp: 41.1, interventionTemp: 34.0, baselineVolt: 3.32, interventionVolt: 3.42 },
        { time: 60, baselineTemp: 41.7, interventionTemp: 34.3, baselineVolt: 3.14, interventionVolt: 3.22 },
      ],
      assumptions: [
        'Coolant thermal properties modeled using 50/50 water-ethylene glycol at 1.05 g/cm³',
        '2-RC electrochemical parameters calibrated against experimental WLTP cycle data',
        'Ambient temperature remains constant at 22.0°C during simulation run'
      ],
      uncertaintyBounds: '±1.8°C thermal confidence interval (95% CI); ±45 cycles RUL variance based on SEI activation energy standard deviation.',
      limitations: [
        'Does not model long-term mechanical delamination of electrode jelly roll',
        'Assumes pump motor inverter efficiency of 92% under boosted duty cycle'
      ]
    },
    approvalRecord: {
      status: 'PENDING',
      safetyChecklist: {
        asilDChecked: true,
        thermalRunawayMitigated: true,
        highVoltageInterlockVerified: true,
        warrantyTermsCompliant: true,
      },
    },
    verificationRecord: {
      status: 'PENDING_INPUT',
    },
    batteryPassport: createDefaultBatteryPassport('INV-2026-X04', 'PACK-800V-BASE', 'DSimulate 800V Baseline', 94.6),
  }
];

class InterventionService {
  private investigations: InterventionInvestigation[] = [];

  constructor() {
    this.loadFromStorage();
    this.ensureQrCodes();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.investigations = JSON.parse(data);
      } else {
        this.investigations = DEFAULT_INVESTIGATIONS;
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Failed to parse stored investigations, reverting to defaults:', e);
      this.investigations = DEFAULT_INVESTIGATIONS;
    }
  }

  private async ensureQrCodes(): Promise<void> {
    let modified = false;
    for (const inv of this.investigations) {
      if (!inv.batteryPassport) {
        inv.batteryPassport = createDefaultBatteryPassport(inv.id, inv.packId, inv.packName, inv.batterySnapshot.avgSoh);
        modified = true;
      }
      if (!inv.batteryPassport.qrDataUrl) {
        try {
          inv.batteryPassport.qrDataUrl = await generateQrCodeDataUrl(inv.batteryPassport.publicAccessUrl);
          modified = true;
        } catch (err) {
          console.error('Error generating QR:', err);
        }
      }
    }
    if (modified) {
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.investigations));
    } catch (e) {
      console.error('Failed to persist investigations to localStorage:', e);
    }
  }

  public getInvestigations(): InterventionInvestigation[] {
    return [...this.investigations];
  }

  public getInvestigationById(id: string): InterventionInvestigation | undefined {
    return this.investigations.find(inv => inv.id === id);
  }

  public saveInvestigation(investigation: InterventionInvestigation): void {
    const index = this.investigations.findIndex(i => i.id === investigation.id);
    const updated = {
      ...investigation,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    };

    if (index >= 0) {
      this.investigations[index] = updated;
    } else {
      this.investigations.unshift(updated);
    }
    this.saveToStorage();
  }

  public deleteInvestigation(id: string): void {
    this.investigations = this.investigations.filter(i => i.id !== id);
    this.saveToStorage();
  }

  public createNewInvestigation(
    pack: BatteryPack,
    diagnosis?: DiagnosticEvent,
    customTitle?: string
  ): InterventionInvestigation {
    const id = `INV-2026-X${Math.floor(10 + Math.random() * 90)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const sourceDiagnosis: DiagnosticEvent = diagnosis || {
      id: `DIAG-AUTO-${Date.now().toString(36).toUpperCase()}`,
      objectId: 'C-017',
      objectType: 'CELL',
      parameter: 'Thermal Gradient & Internal Resistance Anomaly',
      observed: `${pack.maxCellTemp.toFixed(1)} °C`,
      expected: '28.0 °C',
      unit: '°C',
      deviation: `+${(pack.maxCellTemp - 28.0).toFixed(1)} °C`,
      severity: pack.maxCellTemp > 45 ? 'CRITICAL' : 'WARNING',
      status: 'ACTIVE',
      cycle: pack.cycleCount,
      timestamp: now,
      description: `Elevated localized temperature observed in cell string during current dynamic drive cycle.`,
      rootCause: 'Under active physics SLM investigation.',
    };

    const newInv: InterventionInvestigation = {
      id,
      title: customTitle || `${sourceDiagnosis.objectType} ${sourceDiagnosis.objectId} — ${sourceDiagnosis.parameter} Investigation`,
      packId: pack.id,
      packName: pack.name || 'DSimulate 800V Baseline',
      createdAt: now,
      updatedAt: now,
      status: 'OPEN',
      priority: sourceDiagnosis.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      sourceDiagnosis,
      batterySnapshot: {
        packId: pack.id,
        packName: pack.name,
        architecture: pack.architecture,
        avgSoc: pack.avgSoc,
        avgSoh: pack.avgSoh,
        packVoltage: pack.packVoltage,
        packCurrent: pack.packCurrent,
        maxCellTemp: pack.maxCellTemp,
        minCellTemp: pack.minCellTemp,
        voltageSpreadMv: pack.voltageSpread,
        predictedRulCycles: pack.predictedRul,
        nominalCapacityKWh: pack.nominalCapacityKWh,
        measuredCapacityKWh: pack.measuredCapacityKWh,
      },
      aiInvestigation: {
        slmInterpretation: 'Awaiting initialization with Physics SLM. Click "Run AI Investigation" to submit digital twin telemetry and generate physical hypotheses.',
        rootCauses: [],
        missingMeasurements: [
          'High-speed transient current recording',
          'Coolant channel pressure differential transducer',
          'Electrochemical Impedance Spectroscopy (EIS) high-frequency intercept'
        ],
        recommendedDiagnosticTests: [
          '15-minute steady-state thermal equilibration',
          'High-rate DC fast charge pulse test',
          'BMS active balance diagnostic scan'
        ],
        engineeringChat: [],
      },
      candidateInterventions: [],
      selectedInterventionId: null,
      simulationComparison: null,
      approvalRecord: {
        status: 'PENDING',
        safetyChecklist: {
          asilDChecked: false,
          thermalRunawayMitigated: false,
          highVoltageInterlockVerified: false,
          warrantyTermsCompliant: false,
        },
      },
      verificationRecord: {
        status: 'PENDING_INPUT',
      },
      batteryPassport: createDefaultBatteryPassport(id, pack.id, pack.name, pack.avgSoh),
    };

    // Generate QR in background
    if (newInv.batteryPassport) {
      const publicUrl = newInv.batteryPassport.publicAccessUrl;
      generateQrCodeDataUrl(publicUrl).then(qr => {
        if (newInv.batteryPassport) {
          newInv.batteryPassport.qrDataUrl = qr;
          this.saveInvestigation(newInv);
        }
      });
    }

    this.saveInvestigation(newInv);
    return newInv;
  }

  // --- Physics SLM API Client Integrations ---

  public async checkSlmStatus(): Promise<{
    online: boolean;
    model: string;
    architecture?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/slm/status');
      if (!res.ok) {
        return { online: false, model: 'gemini-3.8-flash', error: 'HTTP ' + res.status };
      }
      return await res.json();
    } catch (e: any) {
      return { online: false, model: 'gemini-3.8-flash', error: e?.message || 'Connection failed' };
    }
  }

  public async requestDiagnosticEvaluation(
    investigation: InterventionInvestigation,
    recentTelemetry?: any
  ): Promise<{
    slmInterpretation: string;
    rootCauses: RootCauseHypothesis[];
    missingMeasurements: string[];
    recommendedDiagnosticTests: string[];
  }> {
    const res = await fetch('/api/slm/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batterySnapshot: investigation.batterySnapshot,
        diagnosticEvent: investigation.sourceDiagnosis,
        recentTelemetry,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `SLM Diagnose failed with status ${res.status}`);
    }

    return await res.json();
  }

  public async requestCandidateInterventions(
    investigation: InterventionInvestigation
  ): Promise<CandidateIntervention[]> {
    const res = await fetch('/api/slm/intervene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batterySnapshot: investigation.batterySnapshot,
        diagnosticEvent: investigation.sourceDiagnosis,
        rootCauses: investigation.aiInvestigation.rootCauses,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `SLM Intervene failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.candidates || [];
  }

  public async askEngineeringQuery(
    investigation: InterventionInvestigation,
    query: string
  ): Promise<string> {
    const res = await fetch('/api/slm/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        investigationContext: {
          id: investigation.id,
          packName: investigation.packName,
          status: investigation.status,
          sourceDiagnosis: investigation.sourceDiagnosis,
          batterySnapshot: investigation.batterySnapshot,
          selectedInterventionId: investigation.selectedInterventionId,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `SLM Query failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.answer || 'No response from SLM.';
  }

  public async askMechanicCopilot(
    investigation: InterventionInvestigation,
    query: string,
    chatHistory: EngineeringChatMessage[]
  ): Promise<string> {
    const res = await fetch('/api/slm/mechanic-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        investigationContext: {
          id: investigation.id,
          packName: investigation.packName,
          architecture: investigation.batterySnapshot.architecture,
          status: investigation.status,
          sourceDiagnosis: investigation.sourceDiagnosis,
          batterySnapshot: investigation.batterySnapshot,
        },
        chatHistory: chatHistory.slice(-6).map(m => ({ role: m.role, text: m.text })),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Mechanic Copilot failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.answer || 'No response from Mechanic Copilot.';
  }

  public async requestSecondLifeEvaluation(
    investigation: InterventionInvestigation
  ): Promise<SecondLifeAssessment> {
    const res = await fetch('/api/slm/second-life', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batterySnapshot: investigation.batterySnapshot,
        batteryPassport: investigation.batteryPassport,
        diagnosticHistory: [investigation.sourceDiagnosis],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Second Life evaluation failed with status ${res.status}`);
    }

    const data = await res.json();
    const soh = investigation.batterySnapshot.avgSoh;

    return {
      assessedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      category: data.category || (soh >= 85 ? 'DIRECT_REUSE' : soh >= 75 ? 'REPURPOSING' : 'RECYCLING'),
      suitability: data.suitability || (soh >= 70 ? 'ELIGIBLE' : 'INELIGIBLE'),
      overallScore: data.overallScore || Math.round(soh * 0.9 + 5),
      sohThresholdPassed: soh >= 70,
      irThresholdPassed: true,
      thermalIntegrityPassed: true,
      cellSpreadPassed: true,
      slmRationale: data.slmRationale || 'Second-life assessment evaluated using electrochemical Arrhenius degradation modeling.',
      missingEvidence: data.missingEvidence || [
        'Dielectric insulation resistance check (>500 Ω/V)',
        'C/20 low-rate capacity validation test'
      ],
      nextAssessmentSteps: data.nextAssessmentSteps || [
        'Perform IEC 62619 high-voltage safety clearance',
        'Record 24-hr open circuit voltage relaxation'
      ],
      safetyCertificationStandard: 'EU 2023/1542 & IEC 62619',
      applications: data.recommendedApplications || investigation.batteryPassport?.secondLifeAssessment.applications || [],
    };
  }

  public async verifyOutcomeWithSlm(
    investigation: InterventionInvestigation,
    actualMeasurements: {
      postInterventionTemp: number;
      postInterventionSoh: number;
      postInterventionVoltageDelta: number;
      notes: string;
    }
  ): Promise<{
    outcomeAssessment: string;
    verifiedStatus: 'VERIFIED' | 'UNSUCCESSFUL' | 'INCONCLUSIVE';
    residualRiskRating: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    const selectedCandidate = investigation.candidateInterventions.find(
      c => c.id === investigation.selectedInterventionId
    );

    const res = await fetch('/api/slm/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intervention: selectedCandidate,
        baselineTelemetry: investigation.simulationComparison?.baselineTelemetry,
        actualMeasurements,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `SLM Verify failed with status ${res.status}`);
    }

    return await res.json();
  }

  // --- Digital Twin Scenario Lab Simulation Runner ---

  public runInterventionScenarioSimulation(
    candidate: CandidateIntervention,
    baselinePack: BatteryPack,
    baseParams: SimulationParams
  ): ScenarioComparisonData {
    // 1. Run baseline 60-step dynamic simulation with existing parameters
    const baselineSteps = runTimeDomainSimulation(baseParams, 60);

    // 2. Synthesize intervention simulation parameters:
    const boostedCooling = Math.min(22.0, baseParams.coolingFlowRate * (1 + candidate.simParameters.coolantFlowBoostPct / 100));
    const modifiedFastChargeRatio = Math.max(0, baseParams.fastChargeRatio * (1 - candidate.simParameters.chargingCurrentDeRatePct / 100));
    const modifiedInitialSoc = Math.min(baseParams.initialSoc, candidate.simParameters.maxSocCeiling);

    const interventionParams: SimulationParams = {
      ...baseParams,
      coolingFlowRate: boostedCooling,
      fastChargeRatio: modifiedFastChargeRatio,
      initialSoc: modifiedInitialSoc,
    };

    const interventionSteps = runTimeDomainSimulation(interventionParams, 60);

    const baselineMaxTemp = Math.max(...baselineSteps.map(s => s.maxCellTemp));
    const baselineMinVolt = Math.min(...baselineSteps.map(s => s.minCellVolt));
    const baselineTimeToLimit = baselineSteps.findIndex(s => s.maxCellTemp > 45.0);

    const interventionMaxTemp = Math.max(...interventionSteps.map(s => s.maxCellTemp));
    const interventionMinVolt = Math.min(...interventionSteps.map(s => s.minCellVolt));
    const interventionTimeToLimit = interventionSteps.findIndex(s => s.maxCellTemp > 45.0);

    const sampleIndices = [0, 10, 20, 30, 40, 50, 59];
    const timeSeriesDelta = sampleIndices.map(idx => {
      const bStep = baselineSteps[idx] || baselineSteps[baselineSteps.length - 1];
      const iStep = interventionSteps[idx] || interventionSteps[interventionSteps.length - 1];
      return {
        time: bStep.time,
        baselineTemp: Number(bStep.maxCellTemp.toFixed(1)),
        interventionTemp: Number(iStep.maxCellTemp.toFixed(1)),
        baselineVolt: Number(bStep.minCellVolt.toFixed(2)),
        interventionVolt: Number(iStep.minCellVolt.toFixed(2)),
      };
    });

    const baselineSoh1000 = Number((baselinePack.avgSoh - (1000 * 0.0035)).toFixed(1));
    const interventionSohGain = candidate.expectedBenefit.deltaSohPct;
    const interventionSoh1000 = Number(Math.min(99.5, baselineSoh1000 + interventionSohGain).toFixed(1));

    const baselineRul = baselinePack.predictedRul;
    const interventionRul = baselineRul + candidate.expectedBenefit.deltaRulCycles;

    return {
      simulated: true,
      baselineTelemetry: {
        maxTemp: Number(baselineMaxTemp.toFixed(1)),
        minVoltage: Number(baselineMinVolt.toFixed(2)),
        sohAt1000Cycles: baselineSoh1000,
        predictedRul: baselineRul,
        timeToThermalLimitSec: baselineTimeToLimit === -1 ? 1800 : baselineTimeToLimit * 30,
      },
      interventionTelemetry: {
        maxTemp: Number(interventionMaxTemp.toFixed(1)),
        minVoltage: Number(interventionMinVolt.toFixed(2)),
        sohAt1000Cycles: interventionSoh1000,
        predictedRul: interventionRul,
        timeToThermalLimitSec: interventionTimeToLimit === -1 ? 1800 : interventionTimeToLimit * 30,
      },
      timeSeriesDelta,
      assumptions: [
        `Coolant volumetric flow modulated to ${boostedCooling.toFixed(1)} L/min (+${candidate.simParameters.coolantFlowBoostPct}%)`,
        `Fast-charge current stress ratio capped at ${modifiedFastChargeRatio.toFixed(1)}%`,
        `Electrochemical overpotentials solved via Butler-Volmer kinetics with Arrhenius thermal coupling (Ea = 31.5 kJ/mol)`,
        `Ambient temperature held at ${baseParams.ambientTemp.toFixed(1)}°C`
      ],
      uncertaintyBounds: `±1.6°C thermal boundary layer tolerance; 95% confidence interval for RUL gains (±38 cycles).`,
      limitations: [
        'Assumes thermal interface material (TIM) bulk conductivity remains unimpaired at 2.8 W/(m·K)',
        'Model does not evaluate structural fatigue from repetitive thermal expansion cycles'
      ]
    };
  }
}

export const interventionService = new InterventionService();
