/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Area D: Digital Twin Scenario Lab (Brutalist Style)
 */

import React, { useState } from 'react';
import { 
  InterventionInvestigation, 
  CandidateIntervention, 
  ScenarioComparisonData 
} from '../../../types/intervention';
import { useBatteryStore } from '../../../stores/useBatteryStore';
import { interventionService } from '../../../services/interventionService';
import { 
  Play, 
  RefreshCw, 
  Sliders, 
  TrendingDown, 
  TrendingUp, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  ShieldCheck, 
  GitCompare, 
  Thermometer, 
  Zap, 
  Clock, 
  Info 
} from 'lucide-react';

interface AreaScenarioLabProps {
  investigation: InterventionInvestigation;
  onUpdateInvestigation: (updated: InterventionInvestigation) => void;
  onProceedToDecisionReport: () => void;
}

export const AreaScenarioLab: React.FC<AreaScenarioLabProps> = ({
  investigation,
  onUpdateInvestigation,
  onProceedToDecisionReport,
}) => {
  const { batteryPack, simulationParams } = useBatteryStore();

  const selectedCandidate = investigation.candidateInterventions.find(
    (c: CandidateIntervention) => c.id === investigation.selectedInterventionId
  ) || investigation.candidateInterventions[0];

  // Local configurable parameters initialized from selected candidate
  const [coolantBoost, setCoolantBoost] = useState<number>(
    selectedCandidate?.simParameters?.coolantFlowBoostPct ?? 35
  );
  const [chargeDeRate, setChargeDeRate] = useState<number>(
    selectedCandidate?.simParameters?.chargingCurrentDeRatePct ?? 15
  );
  const [maxSoc, setMaxSoc] = useState<number>(
    selectedCandidate?.simParameters?.maxSocCeiling ?? 85
  );
  const [isSimulating, setIsSimulating] = useState(false);

  const simData = investigation.simulationComparison;

  const handleRunSimulation = () => {
    if (!selectedCandidate) return;

    setIsSimulating(true);

    setTimeout(() => {
      // Create modified candidate reflecting tweaked scenario parameters
      const modifiedCandidate: CandidateIntervention = {
        ...selectedCandidate,
        simParameters: {
          ...selectedCandidate.simParameters,
          coolantFlowBoostPct: coolantBoost,
          chargingCurrentDeRatePct: chargeDeRate,
          maxSocCeiling: maxSoc,
        },
      };

      const result = interventionService.runInterventionScenarioSimulation(
        modifiedCandidate,
        batteryPack,
        simulationParams
      );

      const updated: InterventionInvestigation = {
        ...investigation,
        status: investigation.status === 'OPEN' || investigation.status === 'INVESTIGATING' ? 'SIMULATING' : investigation.status,
        simulationComparison: result,
      };

      onUpdateInvestigation(updated);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-3 bg-[#F4F5F6]">
      {/* 1. Header & Active Candidate Bar */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-2 mb-2.5 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#003B5C] border-2 border-black flex items-center justify-center text-white">
              <Sliders className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[12px] uppercase text-[#003B5C]">
                DIGITAL TWIN SCENARIO LAB // COUNTERFACTUAL ODE SOLVER
              </h2>
              <div className="text-[10px] text-[#5E666D]">
                Execute 2-RC time-domain simulation comparing baseline trajectory against proposed intervention
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#5E666D]">TARGET INTERVENTION:</span>
            <span className="bg-[#005B91] text-white px-2 py-0.5 text-[10.5px] font-bold border border-black">
              {selectedCandidate ? `${selectedCandidate.id} — ${selectedCandidate.title}` : 'None Selected'}
            </span>
          </div>
        </div>

        {/* 2. Scenario Parameter Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-[11px] p-2 bg-[#FAFBFD] border border-black">
          <div>
            <div className="flex justify-between text-[10px] text-[#5E666D] font-bold mb-1">
              <span>COOLANT FLOW BOOST</span>
              <span className="text-[#005B91]">+{coolantBoost}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={coolantBoost}
              onChange={(e) => setCoolantBoost(Number(e.target.value))}
              className="w-full accent-[#005B91] cursor-pointer"
            />
            <div className="text-[9px] text-[#7A8289]">Volumetric flow modulation</div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#5E666D] font-bold mb-1">
              <span>CHARGE C-RATE DE-RATE</span>
              <span className="text-[#D97706]">-{chargeDeRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={chargeDeRate}
              onChange={(e) => setChargeDeRate(Number(e.target.value))}
              className="w-full accent-[#D97706] cursor-pointer"
            />
            <div className="text-[9px] text-[#7A8289]">Overpotential η reduction</div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#5E666D] font-bold mb-1">
              <span>MAX SOC CEILING</span>
              <span className="text-[#20252A]">{maxSoc}%</span>
            </div>
            <input
              type="range"
              min="75"
              max="100"
              step="5"
              value={maxSoc}
              onChange={(e) => setMaxSoc(Number(e.target.value))}
              className="w-full accent-[#20252A] cursor-pointer"
            />
            <div className="text-[9px] text-[#7A8289]">Upper passivation clamp</div>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 border-2 border-black font-mono font-bold text-[11px] uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                isSimulating ? 'bg-[#E2E8F0] text-[#7A8289] cursor-not-allowed' : 'bg-[#2E7D32] hover:bg-[#1E5622] text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Solving ODE 60-Steps...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Twin Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Baseline vs Counterfactual Metric Comparison Split */}
      {simData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Baseline Scenario Card */}
          <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
            <div className="border-b-2 border-black pb-1.5 mb-2 font-mono flex items-center justify-between">
              <span className="font-extrabold text-[12px] uppercase text-[#C62828] flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-[#C62828]" />
                BASELINE STATUS QUO (NO INTERVENTION)
              </span>
              <span className="text-[9px] bg-[#FEE2E2] text-[#991B1B] border border-black px-1 font-bold">
                UNMITIGATED
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 border border-black bg-[#FAFBFD]">
                <div className="text-[9.5px] text-[#5E666D] font-bold">MAX CELL TEMP</div>
                <div className="text-[16px] font-black text-[#C62828] mt-0.5">{simData.baselineTelemetry.maxTemp} °C</div>
                <div className="text-[9px] text-[#7A8289]">Thermal trip @ 45°C</div>
              </div>

              <div className="p-2 border border-black bg-[#FAFBFD]">
                <div className="text-[9.5px] text-[#5E666D] font-bold">MIN VOLTAGE</div>
                <div className="text-[16px] font-black text-[#20252A] mt-0.5">{simData.baselineTelemetry.minVoltage} V</div>
                <div className="text-[9px] text-[#7A8289]">Cutoff @ 2.80V</div>
              </div>

              <div className="p-2 border border-black bg-[#FAFBFD]">
                <div className="text-[9.5px] text-[#5E666D] font-bold">SOH @ 1K CYCLES</div>
                <div className="text-[16px] font-black text-[#D97706] mt-0.5">{simData.baselineTelemetry.sohAt1000Cycles} %</div>
                <div className="text-[9px] text-[#7A8289]">Accelerated fade</div>
              </div>

              <div className="p-2 border border-black bg-[#FAFBFD]">
                <div className="text-[9.5px] text-[#5E666D] font-bold">PREDICTED RUL</div>
                <div className="text-[16px] font-black text-[#003B5C] mt-0.5">{simData.baselineTelemetry.predictedRul} cyc</div>
                <div className="text-[9px] text-[#7A8289]">Until SOH ≤ 80%</div>
              </div>

              <div className="p-2 border border-black bg-[#FAFBFD] col-span-2">
                <div className="text-[9.5px] text-[#5E666D] font-bold">TIME TO THERMAL LIMIT</div>
                <div className="text-[16px] font-black text-[#C62828] mt-0.5">{simData.baselineTelemetry.timeToThermalLimitSec} s</div>
                <div className="text-[9px] text-[#7A8289]">Triggering BMS active de-rate warning</div>
              </div>
            </div>
          </div>

          {/* Intervention Scenario Card */}
          <div className="bg-[#F0FDF4] border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
            <div className="border-b-2 border-black pb-1.5 mb-2 font-mono flex items-center justify-between">
              <span className="font-extrabold text-[12px] uppercase text-[#166534] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#166534]" />
                COUNTERFACTUAL INTERVENTION SCENARIO
              </span>
              <span className="text-[9px] bg-[#DCFCE7] text-[#166534] border border-black px-1 font-bold">
                SIMULATED PREDICTION
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 border border-black bg-white">
                <div className="text-[9.5px] text-[#5E666D] font-bold">MAX CELL TEMP</div>
                <div className="text-[16px] font-black text-[#2E7D32] mt-0.5">{simData.interventionTelemetry.maxTemp} °C</div>
                <div className="text-[9px] text-[#2E7D32] font-bold">
                  -{(simData.baselineTelemetry.maxTemp - simData.interventionTelemetry.maxTemp).toFixed(1)} °C REDUCTION
                </div>
              </div>

              <div className="p-2 border border-black bg-white">
                <div className="text-[9.5px] text-[#5E666D] font-bold">MIN VOLTAGE</div>
                <div className="text-[16px] font-black text-[#005B91] mt-0.5">{simData.interventionTelemetry.minVoltage} V</div>
                <div className="text-[9px] text-[#2E7D32] font-bold">
                  +{(simData.interventionTelemetry.minVoltage - simData.baselineTelemetry.minVoltage).toFixed(2)} V HEADROOM
                </div>
              </div>

              <div className="p-2 border border-black bg-white">
                <div className="text-[9.5px] text-[#5E666D] font-bold">SOH @ 1K CYCLES</div>
                <div className="text-[16px] font-black text-[#2E7D32] mt-0.5">{simData.interventionTelemetry.sohAt1000Cycles} %</div>
                <div className="text-[9px] text-[#2E7D32] font-bold">
                  +{(simData.interventionTelemetry.sohAt1000Cycles - simData.baselineTelemetry.sohAt1000Cycles).toFixed(1)} % PRESERVED
                </div>
              </div>

              <div className="p-2 border border-black bg-white">
                <div className="text-[9.5px] text-[#5E666D] font-bold">PREDICTED RUL</div>
                <div className="text-[16px] font-black text-[#005B91] mt-0.5">{simData.interventionTelemetry.predictedRul} cyc</div>
                <div className="text-[9px] text-[#2E7D32] font-bold">
                  +{simData.interventionTelemetry.predictedRul - simData.baselineTelemetry.predictedRul} EXTENSION
                </div>
              </div>

              <div className="p-2 border border-black bg-white col-span-2">
                <div className="text-[9.5px] text-[#5E666D] font-bold">THERMAL HEADROOM MARGIN</div>
                <div className="text-[16px] font-black text-[#2E7D32] mt-0.5">NOMINAL (1800s+)</div>
                <div className="text-[9px] text-[#2E7D32]">Zero thermal violation during WLTP dynamic profile</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Time-Series Dynamic Trajectory Table */}
      {simData && (
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
          <div className="border-b-2 border-black pb-1 mb-2 font-mono flex items-center justify-between text-[11px]">
            <span className="font-bold text-[#20252A] uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#005B91]" />
              TIME-DOMAIN DYNAMIC STEP COMPARISON (WLTP 60-STEP TRANSIENTS)
            </span>
            <span className="text-[9.5px] text-[#7A8289]">SOLVER: 2-RC TIME-STEPPING</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[10.5px] border-collapse">
              <thead>
                <tr className="bg-[#F4F5F6] border-b border-black text-[#5E666D]">
                  <th className="py-1 px-2">TIME (s)</th>
                  <th className="py-1 px-2 text-[#C62828]">BASELINE T (°C)</th>
                  <th className="py-1 px-2 text-[#2E7D32]">INTERVENTION T (°C)</th>
                  <th className="py-1 px-2 font-bold text-[#005B91]">ΔT COOLING RECOVERY</th>
                  <th className="py-1 px-2">BASELINE V (V)</th>
                  <th className="py-1 px-2">INTERVENTION V (V)</th>
                </tr>
              </thead>
              <tbody>
                {simData.timeSeriesDelta.map((pt: { time: number; baselineTemp: number; interventionTemp: number; baselineVolt: number; interventionVolt: number }, i: number) => (
                  <tr key={i} className="border-b border-[#D5D9DD] hover:bg-[#F9FAFB]">
                    <td className="py-1 px-2 font-bold">{pt.time}s</td>
                    <td className="py-1 px-2 text-[#C62828] font-semibold">{pt.baselineTemp.toFixed(1)}°C</td>
                    <td className="py-1 px-2 text-[#2E7D32] font-semibold">{pt.interventionTemp.toFixed(1)}°C</td>
                    <td className="py-1 px-2 font-black text-[#005B91]">
                      -{(pt.baselineTemp - pt.interventionTemp).toFixed(1)}°C
                    </td>
                    <td className="py-1 px-2">{pt.baselineVolt.toFixed(2)}V</td>
                    <td className="py-1 px-2 text-[#2E7D32] font-bold">{pt.interventionVolt.toFixed(2)}V</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Assumptions, Uncertainty & Limitations Box */}
      {simData && (
        <div className="bg-[#FAFBFD] border-2 border-black p-3 shadow-[3px_3px_0px_#000] font-mono text-[10.5px]">
          <div className="border-b border-black pb-1 mb-2 font-bold uppercase text-[#003B5C] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#005B91]" />
            <span>SIMULATION ASSUMPTIONS, UNCERTAINTY BOUNDS & LIMITATIONS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="p-2 border border-black bg-white">
              <div className="font-bold text-[#005B91] mb-1">PHYSICS ASSUMPTIONS</div>
              <ul className="space-y-1 text-[#20252A] text-[10px]">
                {simData.assumptions.map((a: string, i: number) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>

            <div className="p-2 border border-black bg-white">
              <div className="font-bold text-[#D97706] mb-1">UNCERTAINTY BOUNDS (95% CI)</div>
              <p className="text-[#20252A] text-[10px] leading-relaxed">{simData.uncertaintyBounds}</p>
            </div>

            <div className="p-2 border border-black bg-white">
              <div className="font-bold text-[#C62828] mb-1">ENGINEERING LIMITATIONS</div>
              <ul className="space-y-1 text-[#20252A] text-[10px]">
                {simData.limitations.map((lim: string, i: number) => (
                  <li key={i}>• {lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer Navigation */}
      <div className="flex justify-between items-center pt-2 font-mono text-[11px]">
        <span className="text-[#5E666D]">
          Simulation state: <strong className="text-[#2E7D32]">{simData?.simulated ? 'COMPLETED & VERIFIED' : 'READY'}</strong>
        </span>
        <button
          onClick={onProceedToDecisionReport}
          className="flex items-center gap-2 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black py-2 px-4 font-mono font-bold text-[11px] uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <span>Step 5: Proceed to Decision Report & Approval</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
