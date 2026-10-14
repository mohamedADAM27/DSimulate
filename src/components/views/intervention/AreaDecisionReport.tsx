/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Area E: Decision Report & Human Approval Gate (Brutalist Style)
 */

import React, { useState } from 'react';
import { 
  InterventionInvestigation, 
  ApprovalRecord,
  CandidateIntervention 
} from '../../../types/intervention';
import { 
  ShieldCheck, 
  FileDown, 
  CheckSquare, 
  Square, 
  AlertOctagon, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  UserCheck,
  Award
} from 'lucide-react';
import { generateInterventionPdfReport } from '../../../services/interventionPdfReportService';

interface AreaDecisionReportProps {
  investigation: InterventionInvestigation;
  onUpdateInvestigation: (updated: InterventionInvestigation) => void;
  onProceedToVerification: () => void;
}

export const AreaDecisionReport: React.FC<AreaDecisionReportProps> = ({
  investigation,
  onUpdateInvestigation,
  onProceedToVerification,
}) => {
  const selectedCandidate = investigation.candidateInterventions.find(
    (c: CandidateIntervention) => c.id === investigation.selectedInterventionId
  ) || investigation.candidateInterventions[0];

  const alternatives = investigation.candidateInterventions.filter(
    (c: CandidateIntervention) => c.id !== investigation.selectedInterventionId
  );

  const approval = investigation.approvalRecord || {
    status: 'PENDING',
    safetyChecklist: {
      asilDChecked: false,
      thermalRunawayMitigated: false,
      highVoltageInterlockVerified: false,
      warrantyTermsCompliant: false,
    },
  };

  const [engineerName, setEngineerName] = useState(approval.engineerName || 'Dr. Elena Rostova');
  const [engineerRole, setEngineerRole] = useState(approval.engineerRole || 'Principal Battery Safety & Controls Engineer');
  const [engineerLicense, setEngineerLicense] = useState(approval.engineerLicense || 'PE-ASIL-D-2026-9041');
  const [justificationNotes, setJustificationNotes] = useState(
    approval.justificationNotes || 'Digital Twin counterfactual simulation demonstrates that increasing coolant flow rate by 35% eliminates the 13.2°C thermal boundary layer hotspot at Cell C-017 without exceeding maximum allowable cold-plate pressure. Functional safety constraints satisfied.'
  );

  const [checklist, setChecklist] = useState({
    asilDChecked: approval.safetyChecklist.asilDChecked,
    thermalRunawayMitigated: approval.safetyChecklist.thermalRunawayMitigated,
    highVoltageInterlockVerified: approval.safetyChecklist.highVoltageInterlockVerified,
    warrantyTermsCompliant: approval.safetyChecklist.warrantyTermsCompliant,
  });

  const [rejectionReason, setRejectionReason] = useState(approval.rejectionReason || '');
  const [isRejecting, setIsRejecting] = useState(false);

  const allChecklistPassed = checklist.asilDChecked && 
    checklist.thermalRunawayMitigated && 
    checklist.highVoltageInterlockVerified && 
    checklist.warrantyTermsCompliant;

  const handleApprove = () => {
    if (!allChecklistPassed) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const newApproval: ApprovalRecord = {
      status: 'APPROVED',
      engineerName,
      engineerRole,
      engineerLicense,
      decisionTimestamp: now,
      justificationNotes,
      safetyChecklist: checklist,
    };

    onUpdateInvestigation({
      ...investigation,
      status: 'APPROVED',
      approvalRecord: newApproval,
    });
  };

  const handleReject = () => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const newApproval: ApprovalRecord = {
      status: 'REJECTED',
      engineerName,
      engineerRole,
      engineerLicense,
      decisionTimestamp: now,
      justificationNotes,
      rejectionReason: rejectionReason || 'Intervention rejected due to unverified operational risks or warranty constraints.',
      safetyChecklist: checklist,
    };

    onUpdateInvestigation({
      ...investigation,
      status: 'REJECTED',
      approvalRecord: newApproval,
    });
  };

  const handleExportPdf = () => {
    const doc = generateInterventionPdfReport(investigation);
    doc.save(`DSimulate_Intervention_Decision_${investigation.id}.pdf`);
  };

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-3 bg-[#F4F5F6]">
      {/* 1. Header Banner & Decision Summary */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2 mb-2 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#003B5C] border-2 border-black flex items-center justify-center text-white">
              <FileText className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div>
              <h2 className="font-extrabold text-[12px] uppercase text-[#003B5C]">
                ENGINEERING DECISION REPORT & HUMAN-IN-THE-LOOP APPROVAL
              </h2>
              <div className="text-[10px] text-[#5E666D]">
                Mission-critical engineering sign-off gate requiring certified engineer credentials and ASIL-D verification
              </div>
            </div>
          </div>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 bg-[#20252A] hover:bg-black text-white border-2 border-black px-3 py-1.5 font-mono font-bold text-[11px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Export Official PDF Report</span>
          </button>
        </div>

        {/* Status Callout */}
        <div className={`p-2 border-2 border-black font-mono text-[11px] flex items-center justify-between ${
          investigation.approvalRecord?.status === 'APPROVED' 
            ? 'bg-[#DCFCE7] text-[#166534]' 
            : investigation.approvalRecord?.status === 'REJECTED'
            ? 'bg-[#FEE2E2] text-[#991B1B]'
            : 'bg-[#FEF3C7] text-[#92400E]'
        }`}>
          <div className="flex items-center gap-2">
            {investigation.approvalRecord?.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-[#166534]" />}
            {investigation.approvalRecord?.status === 'REJECTED' && <XCircle className="w-4 h-4 text-[#991B1B]" />}
            {investigation.approvalRecord?.status === 'PENDING' && <AlertOctagon className="w-4 h-4 text-[#92400E]" />}
            <span className="font-extrabold uppercase">
              STATUS: {investigation.approvalRecord?.status || 'PENDING QUALIFIED HUMAN APPROVAL'}
            </span>
          </div>
          {investigation.approvalRecord?.decisionTimestamp && (
            <span className="text-[10px]">RECORDED: {investigation.approvalRecord.decisionTimestamp}</span>
          )}
        </div>
      </div>

      {/* 2. Preferred Intervention & Justification Card */}
      <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000]">
        <div className="border-b-2 border-black pb-1.5 mb-2 font-mono flex items-center justify-between">
          <span className="font-extrabold text-[12px] uppercase text-[#005B91] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#005B91]" />
            PREFERRED INTERVENTION RECOMMENDATION
          </span>
          <span className="text-[10px] bg-black text-white px-2 py-0.5 font-mono font-bold">
            RECOMMENDED BY PHYSICS SLM & DIGITAL TWIN
          </span>
        </div>

        {selectedCandidate ? (
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono">
              <span className="bg-[#005B91] text-white px-2 py-0.5 text-[11px] font-black border border-black">
                {selectedCandidate.id}
              </span>
              <h3 className="font-extrabold text-[13px] text-[#20252A]">{selectedCandidate.title}</h3>
            </div>

            <div className="p-2.5 bg-[#FAFBFD] border border-black font-mono text-[11px] text-[#20252A] leading-relaxed mb-3">
              <strong className="text-[#005B91]">TECHNICAL JUSTIFICATION: </strong>
              {selectedCandidate.physicalRationale}
            </div>

            {/* Projected Benefits vs Baseline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 border border-black bg-[#F0FDF4]">
                <div className="text-[9.5px] text-[#166534] font-bold">THERMAL RECOVERY</div>
                <div className="text-[15px] font-black text-[#15803D] mt-0.5">
                  {selectedCandidate.expectedBenefit.deltaPeakTempC} °C
                </div>
                <div className="text-[9px] text-[#166534]">Arrests SEI growth</div>
              </div>

              <div className="p-2 border border-black bg-[#F0FDF4]">
                <div className="text-[9.5px] text-[#166534] font-bold">LIFETIME EXTENSION</div>
                <div className="text-[15px] font-black text-[#005B91] mt-0.5">
                  +{selectedCandidate.expectedBenefit.deltaRulCycles} CYCLES
                </div>
                <div className="text-[9px] text-[#005B91]">Prevents early EOL</div>
              </div>

              <div className="p-2 border border-black bg-[#F0FDF4]">
                <div className="text-[9.5px] text-[#166534] font-bold">VOLTAGE BALANCE</div>
                <div className="text-[15px] font-black text-[#003B5C] mt-0.5">
                  {selectedCandidate.expectedBenefit.deltaVoltageSpreadMv} mV
                </div>
                <div className="text-[9px] text-[#003B5C]">Under 30mV target</div>
              </div>

              <div className="p-2 border border-black bg-[#F0FDF4]">
                <div className="text-[9.5px] text-[#166534] font-bold">TOTAL COST & TIME</div>
                <div className="text-[15px] font-black text-[#20252A] mt-0.5">
                  ${selectedCandidate.estimatedCostUsd} / {selectedCandidate.downtimeMinutes}m
                </div>
                <div className="text-[9px] text-[#5E666D]">Minimal disruption</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-[#7A8289] italic">No intervention selected.</div>
        )}
      </div>

      {/* 3. Feasible Alternatives Trade-off Comparison Table */}
      {alternatives.length > 0 && (
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
          <div className="border-b-2 border-black pb-1 mb-2 font-mono font-bold text-[11px] uppercase text-[#20252A] flex items-center justify-between">
            <span>FEASIBLE ALTERNATIVE INTERVENTIONS & TRADE-OFF COMPARISON</span>
            <span className="text-[9.5px] text-[#7A8289]">FALLBACK OPTIONS</span>
          </div>

          <table className="w-full text-left font-mono text-[10.5px] border-collapse">
            <thead>
              <tr className="bg-[#F4F5F6] border-b border-black text-[#5E666D]">
                <th className="py-1 px-2">ID</th>
                <th className="py-1 px-2">INTERVENTION</th>
                <th className="py-1 px-2">TYPE</th>
                <th className="py-1 px-2">FEASIBILITY</th>
                <th className="py-1 px-2">ΔRUL</th>
                <th className="py-1 px-2">COST</th>
                <th className="py-1 px-2">DOWNTIME</th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map((alt: CandidateIntervention) => (
                <tr key={alt.id} className="border-b border-[#D5D9DD] hover:bg-[#F9FAFB]">
                  <td className="py-1.5 px-2 font-bold">{alt.id}</td>
                  <td className="py-1.5 px-2 font-medium">{alt.title}</td>
                  <td className="py-1.5 px-2 text-[#5E666D]">{alt.type.replace('_', ' ')}</td>
                  <td className="py-1.5 px-2 font-bold">{alt.feasibility}</td>
                  <td className="py-1.5 px-2 text-[#005B91] font-bold">+{alt.expectedBenefit.deltaRulCycles} cyc</td>
                  <td className="py-1.5 px-2">${alt.estimatedCostUsd}</td>
                  <td className="py-1.5 px-2">{alt.downtimeMinutes}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Qualified Human-In-The-Loop Approval Gate */}
      <div className="bg-[#00273D] text-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] font-mono">
        <div className="border-b-2 border-black/80 pb-1.5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-[#38BDF8]" />
            <span className="font-extrabold text-[12px] uppercase text-white tracking-wider">
              QUALIFIED HUMAN-IN-THE-LOOP APPROVAL & ASIL-D GATE
            </span>
          </div>
          <span className="text-[9.5px] bg-[#38BDF8] text-[#00273D] px-1.5 py-0.2 font-black">
            MANDATORY SAFETY COMPLIANCE
          </span>
        </div>

        {/* Safety Checklist Checkboxes */}
        <div className="bg-[#001B2B] border-2 border-black p-3 mb-3 text-[11px] space-y-2">
          <div className="text-[10px] uppercase font-bold text-[#38BDF8] mb-1">
            SAFETY CONSTRAINTS & FEASIBILITY VERIFICATION CHECKLIST (ALL REQUIRED):
          </div>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#38BDF8]">
            <input
              type="checkbox"
              checked={checklist.asilDChecked}
              onChange={(e) => setChecklist({ ...checklist, asilDChecked: e.target.checked })}
              className="accent-[#38BDF8] w-4 h-4 rounded-none cursor-pointer"
            />
            <span>[ASIL-D] Verified operational limits do not breach ISO 26262 functional safety envelopes</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#38BDF8]">
            <input
              type="checkbox"
              checked={checklist.thermalRunawayMitigated}
              onChange={(e) => setChecklist({ ...checklist, thermalRunawayMitigated: e.target.checked })}
              className="accent-[#38BDF8] w-4 h-4 rounded-none cursor-pointer"
            />
            <span>[THERMAL] Maximum cell temperature under dynamic drive cycle capped under 45.0°C (&lt; 55°C runaway limit)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#38BDF8]">
            <input
              type="checkbox"
              checked={checklist.highVoltageInterlockVerified}
              onChange={(e) => setChecklist({ ...checklist, highVoltageInterlockVerified: e.target.checked })}
              className="accent-[#38BDF8] w-4 h-4 rounded-none cursor-pointer"
            />
            <span>[ELECTRICAL] High-voltage interlock loop (HVIL) and contactor sequencing remain intact</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer hover:text-[#38BDF8]">
            <input
              type="checkbox"
              checked={checklist.warrantyTermsCompliant}
              onChange={(e) => setChecklist({ ...checklist, warrantyTermsCompliant: e.target.checked })}
              className="accent-[#38BDF8] w-4 h-4 rounded-none cursor-pointer"
            />
            <span>[OEM / WARRANTY] Proposed parameter calibration compliant with manufacturer authorized service terms</span>
          </label>
        </div>

        {/* Signer Credentials & Justification */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3 text-[11px]">
          <div>
            <label className="text-[9.5px] uppercase font-bold text-white/70 block mb-1">
              CERTIFIED APPROVER NAME
            </label>
            <input
              type="text"
              value={engineerName}
              onChange={(e) => setEngineerName(e.target.value)}
              className="w-full bg-[#001B2B] border border-black p-1.5 text-white focus:outline-hidden focus:border-[#38BDF8]"
            />
          </div>

          <div>
            <label className="text-[9.5px] uppercase font-bold text-white/70 block mb-1">
              ENGINEERING ROLE / TITLE
            </label>
            <input
              type="text"
              value={engineerRole}
              onChange={(e) => setEngineerRole(e.target.value)}
              className="w-full bg-[#001B2B] border border-black p-1.5 text-white focus:outline-hidden focus:border-[#38BDF8]"
            />
          </div>

          <div>
            <label className="text-[9.5px] uppercase font-bold text-white/70 block mb-1">
              PE LICENSE / CERTIFICATE ID
            </label>
            <input
              type="text"
              value={engineerLicense}
              onChange={(e) => setEngineerLicense(e.target.value)}
              className="w-full bg-[#001B2B] border border-black p-1.5 text-white focus:outline-hidden focus:border-[#38BDF8]"
            />
          </div>
        </div>

        <div className="mb-3 text-[11px]">
          <label className="text-[9.5px] uppercase font-bold text-white/70 block mb-1">
            TECHNICAL JUSTIFICATION & AUDIT STATEMENT
          </label>
          <textarea
            rows={2}
            value={justificationNotes}
            onChange={(e) => setJustificationNotes(e.target.value)}
            className="w-full bg-[#001B2B] border border-black p-1.5 text-white focus:outline-hidden focus:border-[#38BDF8]"
          />
        </div>

        {isRejecting && (
          <div className="mb-3 p-2 bg-[#7F1D1D] border border-black text-[11px]">
            <label className="text-[9.5px] uppercase font-bold text-white block mb-1">
              REJECTION REASON (REQUIRED FOR AUDIT LOG):
            </label>
            <textarea
              rows={2}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="State reason for rejection (e.g. pressure line exceeds 220 kPa rated burst pressure)..."
              className="w-full bg-[#450A0A] border border-black p-1.5 text-white focus:outline-hidden"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/80">
          <div className="text-[10px] text-white/70">
            {!allChecklistPassed && (
              <span className="text-[#FBBF24] flex items-center gap-1 font-mono">
                <AlertOctagon className="w-3 h-3 text-[#FBBF24]" />
                Must verify all 4 ASIL-D safety requirements to authorize intervention
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isRejecting ? (
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                className="bg-[#C62828] hover:bg-[#991B1B] text-white border-2 border-black px-3 py-1.5 font-bold uppercase text-[10.5px] shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Reject Intervention
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReject}
                className="bg-[#C62828] hover:bg-[#991B1B] text-white border-2 border-black px-3 py-1.5 font-bold uppercase text-[10.5px] shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Confirm Formal Rejection
              </button>
            )}

            <button
              type="button"
              onClick={handleApprove}
              disabled={!allChecklistPassed}
              className={`border-2 border-black px-4 py-1.5 font-bold uppercase text-[10.5px] shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 ${
                allChecklistPassed
                  ? 'bg-[#2E7D32] hover:bg-[#1E5622] text-white'
                  : 'bg-black/40 text-white/40 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Authorize & Sign-off Intervention</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Footer Proceed Button */}
      <div className="flex justify-end pt-1 font-mono text-[11px]">
        <button
          onClick={onProceedToVerification}
          className="flex items-center gap-2 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black py-2 px-4 font-mono font-bold text-[11px] uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <span>Step 6: Proceed to Verification & Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
