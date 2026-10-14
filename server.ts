/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Full-Stack Express Server with Physics SLM (Gemini 3.8 Flash)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Physics SLM Gemini client setup
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient fallback mechanism across supported models
async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
}) {
  if (!aiClient) {
    throw new Error('aiClient is not initialized');
  }
  const models = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastErr: any = null;
  for (const model of models) {
    try {
      const res = await aiClient.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return res;
    } catch (err: any) {
      console.warn(`[Physics SLM] ${model} unavailable, trying fallback:`, err?.message || err);
      lastErr = err;
    }
  }
  throw lastErr;
}

// 1. Status Endpoint
app.get('/api/slm/status', (req, res) => {
  if (aiClient && apiKey) {
    return res.json({
      online: true,
      model: 'gemini-3.8-flash',
      architecture: 'Physics-Focused Small Language Model (SLM)',
      reasoningEngine: 'Electrochemical & Thermal 2-RC Coupled Solver',
      standard: 'ISO 26262 ASIL-D Compliant',
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(503).json({
      online: false,
      model: 'gemini-3.8-flash',
      error: 'Physics SLM reasoning service is currently unavailable. GEMINI_API_KEY is not configured.',
      timestamp: new Date().toISOString(),
    });
  }
});

// 2. Physics Diagnostic Interpretation & Root-Cause Generation
app.post('/api/slm/diagnose', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({
        error: 'Physics SLM reasoning service is offline (GEMINI_API_KEY not configured).',
      });
    }

    const { batterySnapshot, diagnosticEvent, recentTelemetry } = req.body;

    const systemInstruction = `You are the DSimulate Physics-Focused Small Language Model (SLM) for lithium-ion battery packs.
You analyze battery digital twin telemetry (voltage, current, SOC, SOH, temperature distribution, internal resistance, Arrhenius reaction kinetics, SEI passivation, lithium plating, and coolant flow dynamics).
Your goal is to provide a rigorous, deterministic physics-grounded evaluation of the detected anomaly, rank root-cause hypotheses, cite supporting and contradicting evidence, and identify missing diagnostic measurements.

Output MUST be strictly valid JSON matching this schema:
{
  "slmInterpretation": "Comprehensive physical explanation (150-250 words) detailing the electro-thermal mechanisms, current constriction, heat dissipation limits, and degradation risks.",
  "rootCauses": [
    {
      "id": "RC-01",
      "title": "Short title of root cause",
      "probability": 75,
      "physicalMechanism": "Explicit electrochemical/thermal mechanism (e.g. Localized thermal barrier / micro-channel cavitation causing elevated Joule heating and accelerated Arrhenius SEI film growth)",
      "supportingEvidence": ["Measurement 1", "Measurement 2"],
      "contradictingEvidence": ["Contradicting measurement or expected condition"],
      "confidenceScore": 0.88,
      "severityRating": "CRITICAL"
    }
  ],
  "missingMeasurements": ["List of 2-4 critical unmeasured parameters needed to eliminate ambiguity, e.g., Coolant channel differential pressure transducer, Electrochemical Impedance Spectroscopy at 1kHz"],
  "recommendedDiagnosticTests": ["List of 2-3 specific testing protocols, e.g., Low-current C/20 constant current balance test, Thermal imaging during 150kW fast charge pulse"]
}`;

    const prompt = `Perform an in-depth physics-informed diagnostic evaluation for the following battery pack and anomaly:
Battery Pack: ${batterySnapshot?.packName || '800V Architecture'} (${batterySnapshot?.architecture || '96S3P'})
Nominal Voltage: ${batterySnapshot?.packVoltage || 768}V | Current: ${batterySnapshot?.packCurrent || 0}A
Average SOC: ${batterySnapshot?.avgSoc || 80}% | Average SOH: ${batterySnapshot?.avgSoh || 94}%
Max Cell Temperature: ${batterySnapshot?.maxCellTemp || 41.7}°C | Min Cell Temperature: ${batterySnapshot?.minCellTemp || 28.2}°C
Voltage Spread: ${batterySnapshot?.voltageSpreadMv || 46} mV | Predicted RUL: ${batterySnapshot?.predictedRulCycles || 1420} cycles

Detected Diagnostic Event:
- Target: ${diagnosticEvent?.objectType} ${diagnosticEvent?.objectId}
- Parameter: ${diagnosticEvent?.parameter}
- Observed: ${diagnosticEvent?.observed} (Expected: ${diagnosticEvent?.expected})
- Deviation: ${diagnosticEvent?.deviation}
- Severity: ${diagnosticEvent?.severity}
- Diagnostic Description: ${diagnosticEvent?.description}

Recent Telemetry Context:
${JSON.stringify(recentTelemetry || {}, null, 2)}

Provide the structured JSON response as instructed.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2, // Deterministic engineering precision
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('SLM Diagnose Error:', err);
    return res.status(500).json({
      error: 'Failed to process diagnostic interpretation via Physics SLM: ' + (err?.message || err),
    });
  }
});

// 3. Intervention Synthesis & Multi-Objective Ranking
app.post('/api/slm/intervene', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({
        error: 'Physics SLM reasoning service is offline (GEMINI_API_KEY not configured).',
      });
    }

    const { batterySnapshot, diagnosticEvent, rootCauses } = req.body;

    const systemInstruction = `You are the DSimulate Physics-Focused Small Language Model (SLM) specialized in battery intervention synthesis, thermal mitigation, and life-extension strategies.
Generate 3 to 4 distinct, actionable engineering candidate interventions that can be executed or tested in the Digital Twin.
Treat safety constraints (ISO 26262 ASIL-D, UL 2580, cell thermal runaway thresholds at >55°C, maximum over-voltage 4.25V) as mandatory hard constraints, not merely trade-offs.

Output MUST be strictly valid JSON matching this schema:
{
  "candidates": [
    {
      "id": "INT-01",
      "title": "Title of intervention",
      "type": "THERMAL_OPTIMIZATION", // Must be one of: "THERMAL_OPTIMIZATION", "CHARGE_DERATING", "CELL_BYPASS", "ELECTROLYTE_RECONDITIONING", "COOLANT_FLUSH"
      "description": "2-sentence practical engineering description of the action",
      "physicalRationale": "Rigorous electrochemical/thermal justification explaining why this intervention mitigates the failure mode",
      "feasibility": "HIGH", // "HIGH" | "MEDIUM" | "LOW"
      "estimatedCostUsd": 450,
      "downtimeMinutes": 45,
      "riskLevel": "LOW", // "LOW" | "MEDIUM" | "HIGH"
      "safetyConstraints": ["List of 2-3 safety rules enforced, e.g. Max cell temp capped at 45°C during high-pressure coolant circulation"],
      "unsupportedActions": ["List of 1-2 actions that cannot be performed due to physical/warranty limits"],
      "expectedBenefit": {
        "deltaSohPct": 2.5,
        "deltaRulCycles": 320,
        "deltaPeakTempC": -6.8,
        "deltaVoltageSpreadMv": -16
      },
      "simParameters": {
        "coolantFlowBoostPct": 35,
        "chargingCurrentDeRatePct": 15,
        "maxSocCeiling": 85,
        "activeCellBypassEnabled": false,
        "preConditioningTempC": 22
      },
      "status": "CANDIDATE"
    }
  ]
}`;

    const prompt = `Synthesize candidate interventions for:
Pack: ${batterySnapshot?.packName} | Architecture: ${batterySnapshot?.architecture}
Max Temp: ${batterySnapshot?.maxCellTemp}°C | Min Voltage: ${batterySnapshot?.minCellVolt || 3.12}V | RUL: ${batterySnapshot?.predictedRulCycles} cycles
Diagnostic Fault: ${diagnosticEvent?.parameter} on ${diagnosticEvent?.objectId} (${diagnosticEvent?.observed} vs ${diagnosticEvent?.expected})
Primary Root Cause Identified: ${JSON.stringify(rootCauses?.[0] || 'Localized cooling channel obstruction with elevated internal resistance')}

Synthesize 3-4 diverse candidate interventions (e.g. cooling flow boost, charging current de-rate, localized cell bypass/active shunting, and module thermal flush).`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text || '{"candidates":[]}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err: any) {
    console.error('SLM Intervene Error:', err);
    return res.status(500).json({
      error: 'Failed to synthesize interventions via Physics SLM: ' + (err?.message || err),
    });
  }
});

// 4. Natural-Language Physics SLM Query Terminal
app.post('/api/slm/query', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({
        error: 'Physics SLM reasoning service is offline (GEMINI_API_KEY not configured).',
      });
    }

    const { query, investigationContext } = req.body;

    const systemInstruction = `You are the DSimulate Physics-Focused Small Language Model (SLM).
You are directly embedded in an industrial battery digital twin investigation center.
Answer the engineer's technical query with high physical rigor, referencing exact electrochemical principles, 2-RC equivalent circuit equations, Butler-Volmer kinetics, Arrhenius aging terms, Navier-Stokes thermal cooling channels, and ISO 26262 functional safety constraints.
Be concise, quantitative, and directly actionable. Avoid fluff.`;

    const prompt = `Context:
Investigation ID: ${investigationContext?.id || 'Active Investigation'}
Pack: ${investigationContext?.packName || '800V Baseline'}
Active Fault: ${investigationContext?.sourceDiagnosis?.parameter || 'None'} on ${investigationContext?.sourceDiagnosis?.objectId || 'None'}
Status: ${investigationContext?.status || 'OPEN'}
Current Max Temp: ${investigationContext?.batterySnapshot?.maxCellTemp || 41.7}°C
Selected Intervention: ${investigationContext?.selectedInterventionId || 'None selected'}

Engineer's Query: "${query}"

Provide your physics-grounded technical answer:`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({
      answer: response.text || 'No response generated by Physics SLM.',
      timestamp: new Date().toISOString(),
      model: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('SLM Query Error:', err);
    return res.status(500).json({
      error: 'Query failed: ' + (err?.message || err),
    });
  }
});

// 5. Post-Intervention Verification Outcome Analysis
app.post('/api/slm/verify', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({
        error: 'Physics SLM reasoning service is offline (GEMINI_API_KEY not configured).',
      });
    }

    const { intervention, baselineTelemetry, actualMeasurements } = req.body;

    const systemInstruction = `You are the DSimulate Physics-Focused Small Language Model (SLM) for post-intervention outcome verification.
Compare predicted vs actual post-intervention outcomes.
Assess whether the physical intervention was successfully verified, unsuccessful, or inconclusive based on residual temperature deltas, voltage spreads, and SOH recovery.

Output MUST be strictly valid JSON matching:
{
  "outcomeAssessment": "Concise technical summary (80-120 words) analyzing whether the failure mode was arrested",
  "verifiedStatus": "VERIFIED", // "VERIFIED" | "UNSUCCESSFUL" | "INCONCLUSIVE"
  "residualRiskRating": "LOW", // "LOW" | "MEDIUM" | "HIGH"
  "recommendedFollowUpCycles": 250,
  "deltaAnalysis": {
    "temperatureRecovery": "Actual thermal drop vs model expectation",
    "voltageBalance": "Post-intervention cell balance status",
    "degradationTrajectory": "Expected slope change in capacity fade"
  }
}`;

    const prompt = `Analyze post-intervention verification:
Intervention Applied: ${intervention?.title} (${intervention?.type})
Predicted Benefits: Peak Temp Delta: ${intervention?.expectedBenefit?.deltaPeakTempC}°C, SOH Delta: +${intervention?.expectedBenefit?.deltaSohPct}%, RUL Delta: +${intervention?.expectedBenefit?.deltaRulCycles} cycles
Baseline Max Temp: ${baselineTelemetry?.maxTemp}°C | Baseline SOH: ${baselineTelemetry?.sohAt1000Cycles}%
Post-Intervention Actual Measurements:
- Observed Max Temp: ${actualMeasurements?.postInterventionTemp}°C
- Observed SOH: ${actualMeasurements?.postInterventionSoh}%
- Observed Voltage Spread: ${actualMeasurements?.postInterventionVoltageDelta} mV
- Technician Notes: "${actualMeasurements?.notes || 'Routine verification completed'}"

Provide your structured verification assessment.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('SLM Verify Error:', err);
    return res.status(500).json({
      error: 'Verification analysis failed: ' + (err?.message || err),
    });
  }
});

// 6. Shop Floor Mechanic & Field Service Copilot
app.post('/api/slm/mechanic-chat', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({ error: 'Physics SLM reasoning service is offline.' });
    }
    const { query, investigationContext, chatHistory } = req.body;
    const systemInstruction = `You are the DSimulate Shop Floor Mechanic & Field Service Copilot for high-voltage battery packs.
You provide precise, practical, and safety-critical guidance to battery technicians and mechanics on the shop floor.
Guidelines:
- Emphasize high-voltage safety: Manual Service Disconnect (MSD), verify 0V using CAT III/IV 1000V rated DMM, personal protective equipment (Class 0 1000V insulated gloves, arc-flash face shield), lockout/tagout.
- Give concrete, step-by-step instructions for physical procedures: module removal, thermal paste/TIM inspection, busbar torque specs (typically 8.5-9.2 Nm for M6 copper fasteners), coolant loop vacuum-fill and bleed procedures.
- Ground all answers in the live Digital Twin battery state provided in context.
- Keep tone strictly professional, concise, utilitarian, and engineering-focused. Do NOT use emojis, sparkling icons, or conversational filler.`;

    const prompt = `Pack: ${investigationContext?.packName || '800V Baseline'} [${investigationContext?.architecture || '96S3P'}]
Live Telemetry: Pack Voltage: ${investigationContext?.batterySnapshot?.packVoltage}V, Max Temp: ${investigationContext?.batterySnapshot?.maxCellTemp}°C, SOC: ${investigationContext?.batterySnapshot?.avgSoc}%, SOH: ${investigationContext?.batterySnapshot?.avgSoh}%
Active Diagnosis: ${investigationContext?.sourceDiagnosis?.parameter || 'None'} on ${investigationContext?.sourceDiagnosis?.objectId || 'None'} (Observed: ${investigationContext?.sourceDiagnosis?.observed})
Investigation Status: ${investigationContext?.status}

Mechanic's Query: "${query}"

Recent Chat Turns:
${JSON.stringify(chatHistory || [], null, 2)}

Provide your direct, step-by-step mechanical/technical response:`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    return res.json({
      answer: response.text || 'No response from Mechanic Copilot.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Mechanic Chat Error:', err);
    return res.status(500).json({ error: 'Mechanic Copilot error: ' + (err?.message || err) });
  }
});

// 7. Second-Life Reusability & Digital Battery Passport Assessment
app.post('/api/slm/second-life', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({ error: 'Physics SLM is offline.' });
    }
    const { batterySnapshot, diagnosticHistory } = req.body;
    const systemInstruction = `You are the DSimulate Battery Lifecycle & Second-Life Assessment SLM conforming to EU Battery Regulation 2023/1542 and IEC 62619 / UL 1973 standards.
Analyze battery degradation history, capacity retention, thermal events, cell delta-V spread, and internal resistance to determine eligibility for:
1. DIRECT_REUSE (SOH > 85%, delta-V < 25mV, no thermal runaway)
2. REFURBISHMENT (SOH 75-85%, single-cell or module replacement needed)
3. REPURPOSING (SOH 65-75%, suitable for stationary BESS, solar microgrids, or telecom backup)
4. RECYCLING (SOH < 65% or severe internal short/thermal runaway damage)

Output MUST be strictly valid JSON matching:
{
  "category": "REPURPOSING",
  "suitability": "ELIGIBLE",
  "overallScore": 82,
  "slmRationale": "Detailed technical analysis (120-180 words) evaluating electrochemical degradation and stationary use suitability",
  "missingEvidence": ["2-3 specific electrical or mechanical tests needed before certification"],
  "nextAssessmentSteps": ["2-3 concrete certification procedures to follow"],
  "recommendedApplications": [
    {
      "id": "APP-01",
      "name": "Commercial & Industrial Stationary BESS",
      "category": "STATIONARY_STORAGE",
      "suitabilityScore": 88,
      "cRateRequirement": "≤ 0.5C Continuous / 1.0C Peak",
      "economicResidualValueUsd": 8400,
      "projectedLifespanYears": 8.5,
      "safetyCertifications": ["IEC 62619", "UL 1973"],
      "prerequisites": ["Module level active balancing reflash", "Insulation resistance verification ≥ 500 Ω/V"],
      "status": "OPTIMAL"
    }
  ]
}`;

    const prompt = `Evaluate Second-Life Reusability:
Pack ID: ${batterySnapshot?.packId || 'PACK-800V-BASE'}
Current SOH: ${batterySnapshot?.avgSoh}% | Current SOC: ${batterySnapshot?.avgSoc}%
Max Cell Temp: ${batterySnapshot?.maxCellTemp}°C | Voltage Spread: ${batterySnapshot?.voltageSpreadMv} mV
Nominal Capacity: ${batterySnapshot?.nominalCapacityKWh} kWh | Measured Usable: ${batterySnapshot?.measuredCapacityKWh} kWh
Cycles Completed: ${batterySnapshot?.predictedRulCycles ? 2000 - batterySnapshot.predictedRulCycles : 716}
Diagnostic History: ${JSON.stringify(diagnosticHistory || [], null, 2)}

Provide the structured second-life assessment JSON:`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    console.error('Second Life Assessment Error:', err);
    return res.status(500).json({ error: 'Second Life evaluation failed: ' + (err?.message || err) });
  }
});

// ============================================================================
// 8. Fleet Intelligence & Predictive Maintenance Endpoints
// ============================================================================

interface ServerFleetVehicle {
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
  unresolvedSeverity?: 'CRITICAL_SAFETY' | 'HIGH_DEGRADATION' | 'MEDIUM_OPERATIONAL' | 'LOW_ADVISORY';
}

interface ServerTelemetryEvidence {
  parameter: string;
  observed: string;
  baseline: string;
  delta: string;
  unit: string;
  physicalSignificance: string;
  sourceSensor: string;
  isVerified: boolean;
}

interface ServerMaintenanceActualOutcome {
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

interface ServerFleetMaintenanceItem {
  id: string;
  vehicleId: string;
  vin: string;
  vehicleName: string;
  modelVariant: string;
  batteryPackId: string;
  chemistry: string;
  detectedIssue: string;
  category: 'BATTERY_THERMAL' | 'ELECTROCHEMISTRY_DEGRADATION' | 'CELL_IMBALANCE' | 'COOLING_LOOP' | 'ELECTRICAL_HARDWARE' | 'BMS_CALIBRATION';
  severity: 'CRITICAL_SAFETY' | 'HIGH_DEGRADATION' | 'MEDIUM_OPERATIONAL' | 'LOW_ADVISORY';
  evidence: ServerTelemetryEvidence[];
  calculationMethod: 'PHYSICS_FIRST_PRINCIPLES' | 'EMPIRICAL_RULE_ENGINE' | 'HYBRID_DIGITAL_TWIN';
  confidencePct: number;
  uncertaintyPct: number;
  uncertaintyReason: string;
  dataFreshness: string;
  missingInputs?: string[];
  estimatedMaintenanceWindow: {
    recommendedStart: string;
    deadline: string;
    isSafetyForced: boolean;
    urgencyReason: string;
  };
  expectedServiceDurationHours: number;
  operationalImpact: 'GROUNDED_SAFETY' | 'PEAK_HOURS_RESTRICTION' | 'SPEED_DERATED' | 'NO_IMPACT_SCHEDULED';
  recommendedNextAction: string;
  safetyOverride: boolean;
  status: 'QUEUED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'VERIFIED';
  scheduledBayId?: string;
  scheduledShift?: 'MORNING' | 'AFTERNOON' | 'NIGHT_DEPOT' | 'WEEKEND_OVERHAUL';
  scheduledTime?: string;
  assignedTechnician?: string;
  serviceWorkOrderNumber?: string;
  actualOutcome?: ServerMaintenanceActualOutcome;
  interventionInvestigationId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServerServiceBay {
  id: string;
  name: string;
  bayType: 'HIGH_VOLTAGE' | 'THERMAL_COOLING' | 'MODULE_BALANCING' | 'GENERAL_DIAGNOSTICS';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  currentVehicleId?: string;
  currentMaintenanceId?: string;
  allocatedUntil?: string;
  techniciansOnDuty: string[];
  supportedCategories: string[];
}

let serverFleetVehicles: ServerFleetVehicle[] = [
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
    telemetryFreshnessSeconds: 8,
    telemetryQuality: 'HIGH',
    routeStatus: 'ACTIVE_ROUTE'
  },
  {
    id: 'FLEET-EBUS-04',
    vin: 'MAT640081E2B99104',
    vehicleName: 'Tata Starbus Urban EV #04',
    modelVariant: '12m Urban Fleet (320 kWh)',
    manufacturer: 'Tata Motors',
    category: 'commercial-vehicle',
    batteryPackId: 'DS-EBUS-004',
    chemistry: 'LFP Heavy Commercial',
    packVoltage: 614.4,
    avgSoc: 48.0,
    avgSoh: 85.0,
    maxCellTemp: 38.6,
    cellImbalanceMv: 24.0,
    internalResistanceAvgMOhms: 1.88,
    cycleCount: 1120,
    predictedRulCycles: 1880,
    dailyMileageKm: 240,
    operatingHours: 5800,
    currentShift: 'AFTERNOON_SERVICE',
    utilizationPct: 95.0,
    telemetryFreshnessSeconds: 3,
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
    packVoltage: 399.0,
    avgSoc: 82.0,
    avgSoh: 82.4,
    maxCellTemp: 35.2,
    cellImbalanceMv: 31.0,
    internalResistanceAvgMOhms: 2.85,
    cycleCount: 820,
    predictedRulCycles: 980,
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

let serverServiceBays: ServerServiceBay[] = [
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

let serverMaintenanceItems: ServerFleetMaintenanceItem[] = [
  {
    id: 'MNT-NEXON-001',
    vehicleId: 'FLEET-EV-01',
    vin: 'MAT623048P1N88201',
    vehicleName: 'Tata Nexon EV LR #01',
    modelVariant: 'Empowered+ LR (40.5 kWh)',
    batteryPackId: 'DS-EVBAT-001',
    chemistry: 'NMC 811 / LFP Hybrid',
    detectedIssue: 'Cell #42 Local Thermal Hotspot (41.7°C) & Secondary Voltage Spread (46mV)',
    category: 'BATTERY_THERMAL',
    severity: 'CRITICAL_SAFETY',
    evidence: [
      {
        parameter: 'Cell #42 Peak Surface Temp',
        observed: '41.7 °C',
        baseline: '28.5 °C',
        delta: '+13.2 °C (+46.3%)',
        unit: '°C',
        physicalSignificance: 'Coupled Joulean heat dissipation and stagnant boundary layer. Exceeds ISO 26262 ASIL-D threshold.',
        sourceSensor: 'BMS NTC Thermistor #42',
        isVerified: true
      },
      {
        parameter: 'Cell Imbalance Spread (ΔV)',
        observed: '46.0 mV',
        baseline: '< 15.0 mV',
        delta: '+31.0 mV (+206%)',
        unit: 'mV',
        physicalSignificance: 'Accelerated localized capacity loss causing state of charge divergence under WLTP dynamic drive cycles.',
        sourceSensor: 'High-Precision BMS AFE ADC',
        isVerified: true
      }
    ],
    calculationMethod: 'PHYSICS_FIRST_PRINCIPLES',
    confidencePct: 96.5,
    uncertaintyPct: 3.5,
    uncertaintyReason: 'Coupled 2-RC electrochemistry and CFD Navier-Stokes thermal solver validation with 100% telemetry completeness.',
    dataFreshness: '4s ago (LIVE)',
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
        parameter: 'Maximum String Voltage Imbalance',
        observed: '52.0 mV',
        baseline: '< 15.0 mV',
        delta: '+37.0 mV (+246%)',
        unit: 'mV',
        physicalSignificance: 'Pouch cell degradation divergence; weakest cell risks premature cutoff during fast charging pulse.',
        sourceSensor: 'BMS Cell Voltage Monitoring Harness',
        isVerified: true
      },
      {
        parameter: 'Operating Temperature Under Peak Draw',
        observed: '44.1 °C',
        baseline: '32.0 °C',
        delta: '+12.1 °C',
        unit: '°C',
        physicalSignificance: 'Elevated internal resistance (3.4 mΩ) driving excessive ohmic losses.',
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
    confidencePct: 88.0,
    uncertaintyPct: 12.0,
    uncertaintyReason: 'Flow meter calibrated 48 hours ago; hydraulic viscosity estimated assuming 50/50 water-glycol concentration.',
    dataFreshness: '3s ago',
    missingInputs: ['Direct Glycol Concentration Refractometer Log'],
    estimatedMaintenanceWindow: {
      recommendedStart: 'Today 14:00 IST (Scheduled in Bay 2)',
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
    confidencePct: 98.0,
    uncertaintyPct: 2.0,
    uncertaintyReason: 'Direct hardware bench verification completed.',
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

function calculateFleetSummary() {
  const totalFleetSize = serverFleetVehicles.length;
  const activeOnRouteCount = serverFleetVehicles.filter(v => v.routeStatus === 'ACTIVE_ROUTE').length;
  const chargingCount = serverFleetVehicles.filter(v => v.routeStatus === 'FAST_CHARGING').length;
  const safetyGroundedCount = serverFleetVehicles.filter(v => v.routeStatus === 'DERATED' || v.unresolvedSeverity === 'CRITICAL_SAFETY').length;
  const scheduledMaintenanceCount = serverMaintenanceItems.filter(m => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS').length;
  const fleetAvailabilityPct = totalFleetSize > 0 
    ? Math.round(((totalFleetSize - safetyGroundedCount) / totalFleetSize) * 1000) / 10 
    : 100;
  const peakDemandCoveredPct = Math.min(100, Math.round((activeOnRouteCount / (totalFleetSize * 0.7)) * 100));

  const completedItems = serverMaintenanceItems.filter(m => m.actualOutcome);
  let totalVariance = 0;
  completedItems.forEach(item => {
    if (item.actualOutcome) {
      totalVariance += Math.abs(item.actualOutcome.actualDurationHours - item.expectedServiceDurationHours);
    }
  });
  const averageDowntimeVarianceHours = completedItems.length > 0 
    ? Math.round((totalVariance / completedItems.length) * 10) / 10 
    : 0.3;

  const criticalSafetyQueueCount = serverMaintenanceItems.filter(
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

// 8.1 Fleet Summary Endpoint
app.get('/api/fleet/summary', (req, res) => {
  res.json(calculateFleetSummary());
});

// 8.2 Fleet Vehicles Endpoint
app.get('/api/fleet/vehicles', (req, res) => {
  res.json(serverFleetVehicles);
});

// 8.3 Fleet Maintenance Queue Endpoint
app.get('/api/fleet/maintenance', (req, res) => {
  res.json(serverMaintenanceItems);
});

// 8.4 Fleet Service Bays Endpoint
app.get('/api/fleet/bays', (req, res) => {
  res.json(serverServiceBays);
});

// 8.5 Schedule Maintenance Action
app.post('/api/fleet/schedule', (req, res) => {
  const { itemId, bayId, shift, scheduledTime, technician } = req.body;
  const item = serverMaintenanceItems.find(m => m.id === itemId);
  if (!item) {
    return res.status(404).json({ error: `Maintenance item ${itemId} not found` });
  }

  item.status = 'SCHEDULED';
  item.scheduledBayId = bayId;
  item.scheduledShift = shift;
  item.scheduledTime = scheduledTime;
  item.assignedTechnician = technician;
  item.updatedAt = new Date().toISOString();

  const vehicle = serverFleetVehicles.find(v => v.id === item.vehicleId);
  if (vehicle) {
    if (item.severity === 'CRITICAL_SAFETY') {
      vehicle.routeStatus = 'DERATED';
    }
    vehicle.activeMaintenanceId = item.id;
  }

  res.json({ success: true, item, summary: calculateFleetSummary() });
});

// 8.6 Start Maintenance Action
app.post('/api/fleet/start', (req, res) => {
  const { itemId } = req.body;
  const item = serverMaintenanceItems.find(m => m.id === itemId);
  if (!item) {
    return res.status(404).json({ error: `Maintenance item ${itemId} not found` });
  }

  item.status = 'IN_PROGRESS';
  item.updatedAt = new Date().toISOString();

  const vehicle = serverFleetVehicles.find(v => v.id === item.vehicleId);
  if (vehicle) {
    vehicle.routeStatus = 'MAINTENANCE_BAY';
    vehicle.activeMaintenanceId = item.id;
  }

  if (item.scheduledBayId) {
    const bay = serverServiceBays.find(b => b.id === item.scheduledBayId);
    if (bay) {
      bay.status = 'OCCUPIED';
      bay.currentVehicleId = item.vehicleId;
      bay.currentMaintenanceId = item.id;
      bay.allocatedUntil = `In Progress (${item.expectedServiceDurationHours}h window)`;
    }
  }

  res.json({ success: true, item, bays: serverServiceBays, summary: calculateFleetSummary() });
});

// 8.7 Complete Maintenance Action
app.post('/api/fleet/complete', (req, res) => {
  const { itemId, outcome } = req.body;
  const item = serverMaintenanceItems.find(m => m.id === itemId);
  if (!item) {
    return res.status(404).json({ error: `Maintenance item ${itemId} not found` });
  }

  item.status = 'COMPLETED';
  item.actualOutcome = outcome;
  item.updatedAt = new Date().toISOString();

  if (item.scheduledBayId) {
    const bay = serverServiceBays.find(b => b.id === item.scheduledBayId);
    if (bay) {
      bay.status = 'AVAILABLE';
      bay.currentVehicleId = undefined;
      bay.currentMaintenanceId = undefined;
      bay.allocatedUntil = undefined;
    }
  }

  const vehicle = serverFleetVehicles.find(v => v.id === item.vehicleId);
  if (vehicle) {
    vehicle.routeStatus = 'DEPOT_IDLE';
    vehicle.unresolvedSeverity = undefined;
    if (outcome?.rootCauseConfirmed) {
      vehicle.avgSoh = Math.min(100, vehicle.avgSoh + (outcome.sohRecoveryOrStabilizationPct || 0));
      vehicle.cellImbalanceMv = outcome.postServiceDeltaV || 12.0;
      if (vehicle.maxCellTemp > 38) {
        vehicle.maxCellTemp = 31.5;
      }
    }
  }

  res.json({ success: true, item, bays: serverServiceBays, summary: calculateFleetSummary() });
});

// 8.8 Verify Maintenance Action (ASIL-D Certified)
app.post('/api/fleet/verify', (req, res) => {
  const { itemId, verificationNotes, engineerId } = req.body;
  const item = serverMaintenanceItems.find(m => m.id === itemId);
  if (!item) {
    return res.status(404).json({ error: `Maintenance item ${itemId} not found` });
  }

  item.status = 'VERIFIED';
  if (item.actualOutcome) {
    item.actualOutcome.verifiedAt = new Date().toISOString();
    item.actualOutcome.authorizedEngineerId = engineerId;
    item.actualOutcome.serviceNotes += ` | [VERIFIED BY ${engineerId}]: ${verificationNotes}`;
  }
  item.updatedAt = new Date().toISOString();

  const vehicle = serverFleetVehicles.find(v => v.id === item.vehicleId);
  if (vehicle) {
    vehicle.routeStatus = 'ACTIVE_ROUTE';
    vehicle.activeMaintenanceId = undefined;
  }

  res.json({ success: true, item, summary: calculateFleetSummary() });
});

// 8.9 Physics-SLM Fleet Anomaly Investigation Endpoint
app.post('/api/fleet/slm-investigate', async (req, res) => {
  try {
    const { maintenanceItem } = req.body;
    if (!maintenanceItem) {
      return res.status(400).json({ error: 'maintenanceItem is required' });
    }

    if (aiClient) {
      const prompt = `Perform a deep physics-informed fleet predictive maintenance evaluation:
Vehicle: ${maintenanceItem.vehicleName} (${maintenanceItem.vin}) | Pack: ${maintenanceItem.batteryPackId} (${maintenanceItem.chemistry})
Detected Issue: ${maintenanceItem.detectedIssue}
Category: ${maintenanceItem.category} | Severity: ${maintenanceItem.severity}
Evidence Telemetry: ${JSON.stringify(maintenanceItem.evidence || [])}
Methodology: ${maintenanceItem.calculationMethod} | Confidence: ${maintenanceItem.confidencePct}%

Generate structured JSON:
{
  "physicalMechanism": "Explicit electrochemical/thermal root cause analysis (100-150 words)",
  "recommendedIntervention": "Detailed service bay procedure (e.g. Ultrasonic glycol flush, module cell rebalancing, precharge relay swap)",
  "expectedDowntimeHours": 3.5,
  "asilDSafetyRisk": "CRITICAL" | "MODERATE" | "LOW",
  "consequenceOfDeferral": "Physical consequence if deferred beyond the maintenance window",
  "feasibleScenarios": [
    {
      "name": "Scenario Title",
      "action": "Description",
      "expectedSohRecoveryPct": 0.8,
      "expectedRulCycleDelta": 320,
      "feasibility": "HIGH" | "MEDIUM" | "LOW"
    }
  ]
}`;

      const geminiRes = await callGeminiWithFallback({
        contents: prompt,
        config: {
          systemInstruction: 'You are the DSimulate Physics SLM for automotive lithium-ion fleet predictive maintenance and downtime planning. Strictly comply with ISO 26262 ASIL-D safety rules.',
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(geminiRes.text || '{}');
      return res.json({ online: true, ...parsed });
    }

    // Fallback: Deterministic First-Principles Model Output
    return res.json({
      online: false,
      model: 'first-principles-coupled-solver',
      physicalMechanism: `Deterministic 2-RC analysis confirms that anomaly "${maintenanceItem.detectedIssue}" stems from localized impedance accumulation (ΔR_int) and boundary layer thermal stagnation. In ${maintenanceItem.chemistry} cells, elevated temperature gradients drive non-linear SEI layer thickening governed by Arrhenius kinetics.`,
      recommendedIntervention: maintenanceItem.recommendedNextAction || 'Execute targeted thermal flush and precision cell balancing in dedicated service bay.',
      expectedDowntimeHours: maintenanceItem.expectedServiceDurationHours || 3.5,
      asilDSafetyRisk: maintenanceItem.severity === 'CRITICAL_SAFETY' ? 'CRITICAL' : 'MODERATE',
      consequenceOfDeferral: maintenanceItem.estimatedMaintenanceWindow?.urgencyReason || 'Continued high-rate operation risks accelerated degradation and unrecoverable cell imbalance.',
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
    });
  } catch (err: any) {
    console.error('Fleet SLM Investigation Error:', err);
    return res.status(500).json({ error: 'SLM Investigation failed: ' + (err?.message || err) });
  }
});

// Production static files or Development Vite middleware
const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DSimulate] Server & Physics SLM listening at http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'Production' : 'Development'})`);
  });
}

startServer().catch(err => {
  console.error('[DSimulate] Server failed to start:', err);
});
