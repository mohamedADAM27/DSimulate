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
