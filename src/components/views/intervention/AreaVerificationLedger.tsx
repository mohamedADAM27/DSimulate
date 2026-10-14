/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Area F: Verification and Ledger (Brutalist Style)
 */

import React, { useState } from 'react';
import { 
  InterventionInvestigation, 
  VerificationRecord 
} from '../../../types/intervention';
import { interventionService } from '../../../services/interventionService';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  History, 
  FileDown, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Award,
  Check,
  X
} from 'lucide-react';
import { generateInterventionPdfReport } from '../../../services/interventionPdfReportService';

interface AreaVerificationLedgerProps {
  investigation: InterventionInvestigation;
  allInvestigations: InterventionInvestigation[];
  onUpdateInvestigation: (updated: InterventionInvestigation) => void;
  onSelectInvestigation: (id: string) => void;
}

export const AreaVerificationLedger: React.FC<AreaVerificationLedgerProps> = ({
  investigation,
  allInvestigations,
  onUpdateInvestigation,
  onSelectInvestigation,
}) => {
  const ver = investigation.verificationRecord || { status: 'PENDING_INPUT' };

  const [techId, setTechId] = useState(ver.technicianId || 'TECH-842-MARTINEZ');
  const [observedTemp, setObservedTemp] = useState<number>(ver.postInterventionTemp ?? 34.1);
  const [observedSoh, setObservedSoh] = useState<number>(ver.postInterventionSoh ?? 94.6);
  const [observedVoltDelta, setObservedVoltDelta] = useState<number>(ver.postInterventionVoltageDelta ?? 18.0);
  const [notes, setNotes] = useState(
    ver.notes || 'Executed coolant channel ultrasonic backflush and modulated auxiliary pump flow to 14.0 L/min (+35%). Post-service telemetry confirms elimination of Cell C-017 localized hotspot.'
  );

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyError(null);

    const actualData = {
      postInterventionTemp: observedTemp,
      postInterventionSoh: observedSoh,
      postInterventionVoltageDelta: observedVoltDelta,
      notes,
    };

    try {
      const slmResult = await interventionService.verifyOutcomeWithSlm(investigation, actualData);
      
      const updatedRecord: VerificationRecord = {
        status: slmResult.verifiedStatus,
        recordedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        technicianId: techId,
        postInterventionTemp: observedTemp,
        postInterventionSoh: observedSoh,
        postInterventionVoltageDelta: observedVoltDelta,
        notes,
        outcomeAssessment: slmResult.outcomeAssessment,
      };

      const updated: InterventionInvestigation = {
        ...investigation,
        status: slmResult.verifiedStatus === 'VERIFIED' ? 'VERIFIED' : 'INCONCLUSIVE',
        verificationRecord: updatedRecord,
      };

      onUpdateInvestigation(updated);
    } catch (e: any) {
      console.warn('SLM verify failed, falling back to deterministic check:', e);
      // Fallback deterministic verification rule
      const predictedTemp = investigation.simulationComparison?.interventionTelemetry.maxTemp ?? 34.3;
      const tempDiff = Math.abs(observedTemp - predictedTemp);
      const isVerified = tempDiff <= 2.5;

      const updatedRecord: VerificationRecord = {
        status: isVerified ? 'VERIFIED' : 'INCONCLUSIVE',
        recordedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        technicianId: techId,
        postInterventionTemp: observedTemp,
        postInterventionSoh: observedSoh,
        postInterventionVoltageDelta: observedVoltDelta,
        notes,
        predictedVsActualDeltaTemp: Number(tempDiff.toFixed(1)),
        outcomeAssessment: isVerified
          ? 'Physical outcome verified within 2-RC model tolerance bounds. Thermal boundary layer hotspot eliminated.'
          : 'Observed parameters diverge from prediction. Additional telemetry cycles required.',
      };

      onUpdateInvestigation({
        ...investigation,
        status: isVerified ? 'VERIFIED' : 'INCONCLUSIVE',
        verificationRecord: updatedRecord,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="bg-[#2E7D32] text-white px-2 py-0.5 text-[9.5px] font-black font-mono border border-black inline-flex items-center gap-1"><Check className="w-3 h-3" /> VERIFIED</span>;
      case 'UNSUCCESSFUL':
        return <span className="bg-[#C62828] text-white px-2 py-0.5 text-[9.5px] font-black font-mono border border-black inline-flex items-center gap-1"><X className="w-3 h-3" /> FAILED</span>;
      case 'INCONCLUSIVE':
        return <span className="bg-[#D97706] text-white px-2 py-0.5 text-[9.5px] font-black font-mono border border-black inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> INCONCLUSIVE</span>;
      default:
        return <span className="bg-[#E2E8F0] text-[#20252A] px-2 py-0.5 text-[9.5px] font-black font-mono border border-black">AWAITING INPUT</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-3 bg-[#F4F5F6]">
      {/* 1. Header Banner */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-2 font-mono">
          <div className="w-8 h-8 bg-[#003B5C] border-2 border-black flex items-center justify-center text-white">
            <ClipboardCheck className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div>
            <h2 className="font-extrabold text-[12px] uppercase text-[#003B5C]">
              POST-INTERVENTION OUTCOME VERIFICATION & AUDITABLE LEDGER
            </h2>
            <div className="text-[10px] text-[#5E666D]">
              Record real-world observed telemetry, compare against counterfactual predictions, and certify failure resolution
            </div>
          </div>
        </div>

        {/* Verification Status Callout */}
        <div className="flex items-center justify-between p-2 border-2 border-black bg-[#FAFBFD] font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#5E666D]">CASE VERIFICATION STATE:</span>
            {getStatusBadge(ver.status)}
          </div>
          {ver.recordedAt && (
            <span className="text-[10px] text-[#7A8289]">RECORDED: {ver.recordedAt}</span>
          )}
        </div>
      </div>

      {/* 2. Real-World Outcome Logging Form */}
      <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] font-mono">
        <div className="border-b-2 border-black pb-1.5 mb-3 flex items-center justify-between">
          <span className="font-extrabold text-[12px] uppercase text-[#20252A] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#005B91]" />
            IMPORT OR ENTER OBSERVED POST-INTERVENTION MEASUREMENTS
          </span>
          <span className="text-[9.5px] text-[#005B91] font-bold">CALIBRATION & VALIDATION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-[11px]">
          <div>
            <label className="text-[9.5px] uppercase font-bold text-[#5E666D] block mb-1">
              TECHNICIAN / FIELD ID
            </label>
            <input
              type="text"
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
              className="w-full bg-[#FAFBFD] border border-black p-1.5 text-[#20252A] focus:outline-hidden focus:border-[#005B91]"
            />
          </div>

          <div>
            <label className="text-[9.5px] uppercase font-bold text-[#5E666D] block mb-1">
              OBSERVED MAX TEMP (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={observedTemp}
              onChange={(e) => setObservedTemp(Number(e.target.value))}
              className="w-full bg-[#FAFBFD] border border-black p-1.5 font-bold text-[#20252A] focus:outline-hidden focus:border-[#005B91]"
            />
            <div className="text-[9px] text-[#7A8289]">Baseline: 41.7°C | Pred: 34.3°C</div>
          </div>

          <div>
            <label className="text-[9.5px] uppercase font-bold text-[#5E666D] block mb-1">
              OBSERVED SOH (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={observedSoh}
              onChange={(e) => setObservedSoh(Number(e.target.value))}
              className="w-full bg-[#FAFBFD] border border-black p-1.5 font-bold text-[#20252A] focus:outline-hidden focus:border-[#005B91]"
            />
            <div className="text-[9px] text-[#7A8289]">Capacity check: 75.8 kWh</div>
          </div>

          <div>
            <label className="text-[9.5px] uppercase font-bold text-[#5E666D] block mb-1">
              VOLTAGE SPREAD ΔV (mV)
            </label>
            <input
              type="number"
              step="1"
              value={observedVoltDelta}
              onChange={(e) => setObservedVoltDelta(Number(e.target.value))}
              className="w-full bg-[#FAFBFD] border border-black p-1.5 font-bold text-[#20252A] focus:outline-hidden focus:border-[#005B91]"
            />
            <div className="text-[9px] text-[#7A8289]">Baseline: 46 mV | Target: &lt;25 mV</div>
          </div>
        </div>

        <div className="mb-3 text-[11px]">
          <label className="text-[9.5px] uppercase font-bold text-[#5E666D] block mb-1">
            FIELD TECHNICIAN WORK LOG & POST-SERVICE OBSERVATIONS
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[#FAFBFD] border border-black p-1.5 text-[#20252A] focus:outline-hidden focus:border-[#005B91]"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className={`flex items-center gap-1.5 px-4 py-2 border-2 border-black font-bold uppercase text-[11px] shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
              isVerifying
                ? 'bg-[#E2E8F0] text-[#7A8289] cursor-not-allowed'
                : 'bg-[#2E7D32] hover:bg-[#1E5622] text-white'
            }`}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running SLM Verification...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Certify & Verify Against Digital Twin Predictions</span>
              </>
            )}
          </button>
        </div>

        {ver.outcomeAssessment && (
          <div className="mt-3 p-3 bg-[#F0FDF4] border-2 border-[#166534] text-[11px] leading-relaxed text-[#14532D]">
            <strong className="text-[#166534] uppercase font-black">SLM OUTCOME CERTIFICATION: </strong>
            {ver.outcomeAssessment}
          </div>
        )}
      </div>

      {/* 3. Auditable Investigation History Ledger Table */}
      <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] font-mono">
        <div className="border-b-2 border-black pb-1.5 mb-2 flex items-center justify-between">
          <span className="font-extrabold text-[12px] uppercase text-[#20252A] flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#005B91]" />
            AUDITABLE INTERVENTION HISTORY LEDGER ({allInvestigations.length} CASES)
          </span>
          <span className="text-[9.5px] text-[#7A8289]">ISO 26262 ASIL-D AUDIT TRAIL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10.5px] border-collapse">
            <thead>
              <tr className="bg-[#F4F5F6] border-b-2 border-black text-[#5E666D]">
                <th className="py-1 px-2">CASE ID</th>
                <th className="py-1 px-2">TITLE & COMPONENT</th>
                <th className="py-1 px-2">BATTERY PACK</th>
                <th className="py-1 px-2">STATUS</th>
                <th className="py-1 px-2">APPROVER</th>
                <th className="py-1 px-2">TIMESTAMP</th>
                <th className="py-1 px-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {allInvestigations.map((inv: InterventionInvestigation) => {
                const isCurrent = inv.id === investigation.id;

                return (
                  <tr 
                    key={inv.id} 
                    className={`border-b border-[#D5D9DD] hover:bg-[#F9FAFB] ${isCurrent ? 'bg-[#F0F6FA] font-semibold' : ''}`}
                  >
                    <td className="py-2 px-2 font-black text-[#005B91]">
                      {inv.id}
                      {isCurrent && <span className="ml-1 text-[8.5px] text-[#D97706]">[ACTIVE]</span>}
                    </td>
                    <td className="py-2 px-2 max-w-[220px] truncate">
                      {inv.title}
                    </td>
                    <td className="py-2 px-2 text-[#5E666D]">{inv.packName}</td>
                    <td className="py-2 px-2">{getStatusBadge(inv.status)}</td>
                    <td className="py-2 px-2 text-[#5E666D]">
                      {inv.approvalRecord?.engineerName ? inv.approvalRecord.engineerName.split(',')[0] : 'Pending'}
                    </td>
                    <td className="py-2 px-2 text-[#7A8289]">{inv.updatedAt.substring(0, 16)}</td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectInvestigation(inv.id)}
                          className="px-2 py-0.5 border border-black bg-white hover:bg-[#005B91] hover:text-white text-[9.5px] font-bold cursor-pointer"
                        >
                          OPEN
                        </button>
                        <button
                          onClick={() => {
                            const doc = generateInterventionPdfReport(inv);
                            doc.save(`Intervention_${inv.id}.pdf`);
                          }}
                          className="p-1 border border-black bg-[#F4F5F6] hover:bg-[#20252A] hover:text-white text-[9.5px] cursor-pointer"
                          title="Export PDF"
                        >
                          <FileDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
