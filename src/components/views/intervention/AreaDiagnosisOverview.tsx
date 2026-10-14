/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Area A: Diagnosis Overview (Brutalist Style)
 */

import React from 'react';
import { InterventionInvestigation } from '../../../types/intervention';
import { 
  AlertTriangle, 
  Thermometer, 
  Zap, 
  BatteryCharging, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';

interface AreaDiagnosisOverviewProps {
  investigation: InterventionInvestigation;
  onProceedToAiInvestigation: () => void;
}

export const AreaDiagnosisOverview: React.FC<AreaDiagnosisOverviewProps> = ({
  investigation,
  onProceedToAiInvestigation,
}) => {
  const diag = investigation.sourceDiagnosis;
  const snap = investigation.batterySnapshot;

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-3 bg-[#F4F5F6]">
      {/* 1. Anomaly Banner Card */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-[#D97706] text-white border border-black font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#7A8289] uppercase tracking-wider font-bold">
                DIAGNOSTIC EVENT // {diag.id}
              </span>
              <h2 className="text-[14px] font-extrabold text-[#20252A] font-mono leading-tight">
                {diag.parameter} — {diag.objectType} [{diag.objectId}]
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] bg-[#DCECF6] text-[#003B5C] border-2 border-black px-2 py-0.5 font-bold">
              SEVERITY: {diag.severity}
            </span>
            <span className="font-mono text-[11px] bg-black text-white px-2 py-0.5 font-bold">
              CYCLE: {diag.cycle}
            </span>
          </div>
        </div>

        {/* Deviation Metrics Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 font-mono">
          <div className="bg-[#FAFBFD] border-2 border-black p-2 shadow-[2px_2px_0px_#000]">
            <div className="text-[10px] text-[#5E666D] uppercase font-bold">Observed Telemetry</div>
            <div className="text-[18px] font-black text-[#C62828] mt-0.5">{diag.observed}</div>
            <div className="text-[9.5px] text-[#7A8289]">Sensor ID: SENS-{diag.objectId}</div>
          </div>

          <div className="bg-[#FAFBFD] border-2 border-black p-2 shadow-[2px_2px_0px_#000]">
            <div className="text-[10px] text-[#5E666D] uppercase font-bold">Expected Baseline</div>
            <div className="text-[18px] font-black text-[#2E7D32] mt-0.5">{diag.expected}</div>
            <div className="text-[9.5px] text-[#7A8289]">2-RC Nominal Solver</div>
          </div>

          <div className="bg-[#FAFBFD] border-2 border-black p-2 shadow-[2px_2px_0px_#000]">
            <div className="text-[10px] text-[#5E666D] uppercase font-bold">Physical Deviation</div>
            <div className="text-[18px] font-black text-[#D97706] mt-0.5">{diag.deviation}</div>
            <div className="text-[9.5px] text-[#7A8289]">Above nominal threshold</div>
          </div>

          <div className="bg-[#003B5C] text-white border-2 border-black p-2 shadow-[2px_2px_0px_#000] flex flex-col justify-between">
            <div className="text-[10px] text-[#38BDF8] uppercase font-bold">Diagnostic Confidence</div>
            <div className="text-[18px] font-black text-white mt-0.5">88.5%</div>
            <div className="text-[9.5px] text-white/80">ISO 26262 ASIL-D Rule</div>
          </div>
        </div>

        <div className="mt-3 p-2 bg-[#F4F5F6] border border-black text-[11px] font-mono leading-relaxed text-[#20252A]">
          <strong className="text-[#005B91]">ENGINEERING LOG: </strong>
          {diag.description}
        </div>
      </div>

      {/* 2. Battery Telemetry & State Estimation Snapshot */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-2 font-mono">
          <span className="font-bold text-[12px] uppercase text-[#003B5C] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#005B91]" />
            CURRENT DIGITAL TWIN OPERATING STATE SNAPSHOT
          </span>
          <span className="text-[10px] text-[#7A8289]">TIMESTAMP: {diag.timestamp}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono">
          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9.5px] text-[#7A8289] font-bold">PACK VOLTAGE</div>
            <div className="text-[15px] font-black text-[#20252A] mt-0.5">{snap.packVoltage.toFixed(1)} V</div>
            <div className="text-[9px] text-[#5E666D]">Architecture: 800V</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9.5px] text-[#7A8289] font-bold">STATE OF CHARGE</div>
            <div className="text-[15px] font-black text-[#005B91] mt-0.5">{snap.avgSoc.toFixed(1)} %</div>
            <div className="text-[9px] text-[#5E666D]">Usable Window: 10-90%</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9.5px] text-[#7A8289] font-bold">STATE OF HEALTH</div>
            <div className="text-[15px] font-black text-[#2E7D32] mt-0.5">{snap.avgSoh.toFixed(1)} %</div>
            <div className="text-[9px] text-[#5E666D]">Cap Ret: {snap.measuredCapacityKWh} kWh</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9.5px] text-[#7A8289] font-bold">MAX CELL TEMP</div>
            <div className="text-[15px] font-black text-[#C62828] mt-0.5">{snap.maxCellTemp.toFixed(1)} °C</div>
            <div className="text-[9px] text-[#5E666D]">Min: {snap.minCellTemp.toFixed(1)} °C</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9.5px] text-[#7A8289] font-bold">VOLTAGE SPREAD (ΔV)</div>
            <div className="text-[15px] font-black text-[#D97706] mt-0.5">{snap.voltageSpreadMv} mV</div>
            <div className="text-[9px] text-[#5E666D]">Max Threshold: 50 mV</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9.5px] text-[#7A8289] font-bold">PREDICTED RUL</div>
            <div className="text-[15px] font-black text-[#003B5C] mt-0.5">{snap.predictedRulCycles} cyc</div>
            <div className="text-[9px] text-[#5E666D]">To 80% EOL Threshold</div>
          </div>
        </div>
      </div>

      {/* 3. Supporting Measurements & Physical Evidence Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Supporting Measurements */}
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
          <div className="border-b-2 border-black pb-1.5 mb-2 font-mono font-bold text-[11px] uppercase text-[#20252A] flex items-center justify-between">
            <span>SUPPORTING TELEMETRY EVIDENCE</span>
            <span className="text-[9.5px] text-[#005B91]">MEASURED DATA</span>
          </div>

          <table className="w-full text-left font-mono text-[10.5px] border-collapse">
            <thead>
              <tr className="border-b border-black bg-[#F4F5F6] text-[#5E666D]">
                <th className="py-1 px-1.5">CHANNEL</th>
                <th className="py-1 px-1.5">OBSERVED</th>
                <th className="py-1 px-1.5">BASELINE</th>
                <th className="py-1 px-1.5">STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#D5D9DD]">
                <td className="py-1.5 px-1.5 font-bold">Cell C-017 Surface Temp</td>
                <td className="py-1.5 px-1.5 text-[#C62828] font-black">41.7 °C</td>
                <td className="py-1.5 px-1.5">28.5 °C</td>
                <td className="py-1.5 px-1.5 text-[#C62828] font-bold">ANOMALOUS</td>
              </tr>
              <tr className="border-b border-[#D5D9DD]">
                <td className="py-1.5 px-1.5 font-bold">Internal Resistance (R_int)</td>
                <td className="py-1.5 px-1.5 text-[#D97706] font-black">2.85 mΩ</td>
                <td className="py-1.5 px-1.5">1.72 mΩ</td>
                <td className="py-1.5 px-1.5 text-[#D97706] font-bold">+65.7% SKEW</td>
              </tr>
              <tr className="border-b border-[#D5D9DD]">
                <td className="py-1.5 px-1.5 font-bold">Module MOD-03 Pressure Drop</td>
                <td className="py-1.5 px-1.5">3.45 kPa</td>
                <td className="py-1.5 px-1.5">3.20 kPa</td>
                <td className="py-1.5 px-1.5 text-[#5E666D]">MARGINAL (+7.8%)</td>
              </tr>
              <tr className="border-b border-[#D5D9DD]">
                <td className="py-1.5 px-1.5 font-bold">Inlet Coolant Flow Rate</td>
                <td className="py-1.5 px-1.5">10.3 L/min</td>
                <td className="py-1.5 px-1.5">10.0 L/min</td>
                <td className="py-1.5 px-1.5 text-[#2E7D32] font-bold">NOMINAL</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Unresolved Uncertainties & Diagnostic Action */}
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="border-b-2 border-black pb-1.5 mb-2 font-mono font-bold text-[11px] uppercase text-[#20252A] flex items-center justify-between">
              <span>UNRESOLVED UNCERTAINTIES</span>
              <span className="text-[9.5px] text-[#D97706] font-bold">RISK FACTORS</span>
            </div>

            <ul className="text-[10.5px] font-mono space-y-1.5 text-[#20252A]">
              <li className="flex items-start gap-1.5">
                <span className="text-[#C62828] font-bold">·</span>
                <span>Cannot confirm whether micro-channel clogging is particulate accumulation or coolant boiling cavitation without differential flow probe.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#C62828] font-bold">·</span>
                <span>Ultrasonic tab weld integrity unconfirmed under high-frequency vibration spectrum.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#005B91] font-bold">·</span>
                <span>Secondary SEI layer growth rate may accelerate if pack experiences consecutive DC fast-charging sessions.</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t-2 border-black mt-2">
            <button
              onClick={onProceedToAiInvestigation}
              className="w-full flex items-center justify-center gap-2 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black py-2 px-3 font-mono font-bold text-[11px] uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#38BDF8]" />
              <span>Step 2: Engage Physics SLM Investigation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
