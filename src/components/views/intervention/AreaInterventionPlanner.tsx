/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Area C: Intervention Planner (Brutalist Style)
 */

import React, { useState } from 'react';
import { 
  InterventionInvestigation, 
  CandidateIntervention 
} from '../../../types/intervention';
import { interventionService } from '../../../services/interventionService';
import { 
  Wrench, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Sliders,
  TrendingUp,
  Cpu,
  Check,
  X
} from 'lucide-react';

interface AreaInterventionPlannerProps {
  investigation: InterventionInvestigation;
  onUpdateInvestigation: (updated: InterventionInvestigation) => void;
  onProceedToScenarioLab: () => void;
  slmStatus: { online: boolean; model: string; error?: string };
}

export const AreaInterventionPlanner: React.FC<AreaInterventionPlannerProps> = ({
  investigation,
  onUpdateInvestigation,
  onProceedToScenarioLab,
  slmStatus,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleGenerateCandidates = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const candidates = await interventionService.requestCandidateInterventions(investigation);
      const updated: InterventionInvestigation = {
        ...investigation,
        candidateInterventions: candidates,
        selectedInterventionId: candidates[0]?.id || investigation.selectedInterventionId,
      };
      onUpdateInvestigation(updated);
    } catch (e: any) {
      console.error(e);
      setGenerateError(e?.message || 'Failed to synthesize candidate interventions via Physics SLM.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIntervention = (candidateId: string) => {
    onUpdateInvestigation({
      ...investigation,
      selectedInterventionId: candidateId,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'THERMAL_OPTIMIZATION':
        return 'bg-[#005B91] text-white';
      case 'CHARGE_DERATING':
        return 'bg-[#D97706] text-white';
      case 'CELL_BYPASS':
        return 'bg-[#7C3AED] text-white';
      case 'COOLANT_FLUSH':
        return 'bg-[#003B5C] text-white';
      default:
        return 'bg-black text-white';
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-3 bg-[#F4F5F6]">
      {/* 1. Header Banner & Synthesis Trigger */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#005B91] border-2 border-black flex items-center justify-center text-white">
              <Wrench className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[12px] uppercase text-[#003B5C] font-mono">
                INTERVENTION SYNTHESIS & MULTI-OBJECTIVE FEASIBILITY
              </h2>
              <div className="text-[10px] font-mono text-[#5E666D]">
                Generates physically constrained mitigation plans targeting identified root cause
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateCandidates}
            disabled={isGenerating}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-mono font-bold text-[11px] uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
              isGenerating
                ? 'bg-[#E2E8F0] text-[#7A8289] cursor-not-allowed'
                : 'bg-[#005B91] hover:bg-[#003B5C] text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Interventions...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Re-Synthesize Candidates (SLM)</span>
              </>
            )}
          </button>
        </div>

        {generateError && (
          <div className="mt-2.5 p-2 bg-[#FEE2E2] border-2 border-[#C62828] text-[#991B1B] text-[10.5px] font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#C62828]" />
            <span>{generateError}</span>
          </div>
        )}
      </div>

      {/* 2. Candidate Interventions Grid */}
      <div className="flex flex-col gap-3">
        {investigation.candidateInterventions.length === 0 ? (
          <div className="bg-white border-2 border-black p-8 text-center font-mono">
            <div className="text-[13px] font-bold text-[#20252A] mb-1">
              No Candidate Interventions Generated Yet
            </div>
            <p className="text-[11px] text-[#5E666D] max-w-md mx-auto mb-3">
              Click the &apos;Re-Synthesize Candidates (SLM)&apos; button above to prompt the Physics SLM for feasible remediation candidates.
            </p>
            <button
              onClick={handleGenerateCandidates}
              className="bg-[#005B91] text-white border-2 border-black px-4 py-2 font-mono font-bold text-[11px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              Generate Candidate Interventions
            </button>
          </div>
        ) : (
          investigation.candidateInterventions.map((cand: CandidateIntervention) => {
            const isSelected = cand.id === investigation.selectedInterventionId;

            return (
              <div
                key={cand.id}
                className={`bg-white border-2 border-black p-3.5 transition-all shadow-[3px_3px_0px_#000] ${
                  isSelected ? 'border-black ring-2 ring-[#005B91] bg-[#FAFBFD]' : 'hover:border-black'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2 mb-2.5 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="bg-black text-white px-2 py-0.5 text-[10.5px] font-black">
                      {cand.id}
                    </span>
                    <span className={`px-2 py-0.5 text-[9.5px] font-black uppercase border border-black ${getTypeColor(cand.type)}`}>
                      {cand.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-extrabold text-[13px] text-[#20252A]">{cand.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border border-black ${
                      cand.feasibility === 'HIGH' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'
                    }`}>
                      FEASIBILITY: {cand.feasibility}
                    </span>
                    <button
                      onClick={() => handleSelectIntervention(cand.id)}
                      className={`px-3 py-1 font-mono font-bold text-[10.5px] uppercase border-2 border-black cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] ${
                        isSelected
                          ? 'bg-[#2E7D32] text-white'
                          : 'bg-[#F4F5F6] text-[#20252A] hover:bg-[#005B91] hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> SELECTED FOR LAB</span>
                      ) : (
                        'SELECT FOR SIMULATION'
                      )}
                    </button>
                  </div>
                </div>

                {/* Description & Physical Rationale */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-3 font-mono text-[11px]">
                  <div className="p-2 border border-black bg-[#FAFBFD]">
                    <div className="text-[9.5px] text-[#5E666D] font-bold uppercase mb-0.5">PRACTICAL DESCRIPTION</div>
                    <div className="text-[#20252A] leading-relaxed">{cand.description}</div>
                  </div>

                  <div className="p-2 border border-black bg-[#F0F6FA]">
                    <div className="text-[9.5px] text-[#005B91] font-bold uppercase mb-0.5">PHYSICAL & ELECTROCHEMICAL RATIONALE</div>
                    <div className="text-[#20252A] leading-relaxed">{cand.physicalRationale}</div>
                  </div>
                </div>

                {/* Expected Benefits Matrix & Operational Estimates */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 font-mono mb-3">
                  <div className="p-2 border border-black bg-[#FAFBFD]">
                    <div className="text-[9px] text-[#5E666D] font-bold">PEAK TEMP DELTA</div>
                    <div className="text-[14px] font-black text-[#2E7D32] mt-0.5">
                      {cand.expectedBenefit.deltaPeakTempC > 0 ? `+${cand.expectedBenefit.deltaPeakTempC}` : cand.expectedBenefit.deltaPeakTempC} °C
                    </div>
                  </div>

                  <div className="p-2 border border-black bg-[#FAFBFD]">
                    <div className="text-[9px] text-[#5E666D] font-bold">RUL CYCLE EXTENSION</div>
                    <div className="text-[14px] font-black text-[#005B91] mt-0.5">
                      +{cand.expectedBenefit.deltaRulCycles} cyc
                    </div>
                  </div>

                  <div className="p-2 border border-black bg-[#FAFBFD]">
                    <div className="text-[9px] text-[#5E666D] font-bold">SOH RETENTION GAIN</div>
                    <div className="text-[14px] font-black text-[#2E7D32] mt-0.5">
                      +{cand.expectedBenefit.deltaSohPct}%
                    </div>
                  </div>

                  <div className="p-2 border border-black bg-[#FAFBFD]">
                    <div className="text-[9px] text-[#5E666D] font-bold">VOLTAGE IMBALANCE Δ</div>
                    <div className="text-[14px] font-black text-[#003B5C] mt-0.5">
                      {cand.expectedBenefit.deltaVoltageSpreadMv} mV
                    </div>
                  </div>

                  <div className="p-2 border border-black bg-[#FAFBFD]">
                    <div className="text-[9px] text-[#5E666D] font-bold">ESTIMATED COST</div>
                    <div className="text-[14px] font-black text-[#20252A] mt-0.5">
                      ${cand.estimatedCostUsd} USD
                    </div>
                  </div>

                  <div className="p-2 border border-black bg-[#FAFBFD]">
                    <div className="text-[9px] text-[#5E666D] font-bold">ESTIMATED DOWNTIME</div>
                    <div className="text-[14px] font-black text-[#D97706] mt-0.5">
                      {cand.downtimeMinutes} min
                    </div>
                  </div>
                </div>

                {/* Safety Constraints & Unsupported Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[10px]">
                  <div className="p-2 border border-black bg-[#FEF2F2]">
                    <div className="font-bold text-[#991B1B] mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-[#991B1B]" />
                      <span>MANDATORY SAFETY CONSTRAINTS (ISO 26262 ASIL-D)</span>
                    </div>
                    <ul className="space-y-0.5 text-[#B91C1C]">
                      {cand.safetyConstraints.map((sc: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0 text-[#C62828] mt-0.5" />
                          <span>{sc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2 border border-black bg-[#F8FAFC]">
                    <div className="font-bold text-[#475569] mb-1 flex items-center gap-1">
                      <X className="w-3 h-3 text-[#64748B]" />
                      <span>UNSUPPORTED / PROHIBITED ACTIONS</span>
                    </div>
                    <ul className="space-y-0.5 text-[#64748B]">
                      {cand.unsupportedActions.map((ua: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <X className="w-3 h-3 shrink-0 text-[#64748B] mt-0.5" />
                          <span>{ua}</span>
                        </li>
                      ))}
                      {cand.unsupportedActions.length === 0 && (
                        <li className="italic">All proposed parameter ranges within legal bounds.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Footer Step Action */}
      <div className="flex justify-between items-center pt-2 font-mono text-[11px]">
        <span className="text-[#5E666D]">
          Selected: <strong className="text-[#005B91]">{investigation.selectedInterventionId || 'None'}</strong>
        </span>
        <button
          onClick={onProceedToScenarioLab}
          className="flex items-center gap-2 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black py-2 px-4 font-mono font-bold text-[11px] uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <span>Step 4: Launch Digital Twin Scenario Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
