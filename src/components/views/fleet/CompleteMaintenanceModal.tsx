/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Complete & Verify Maintenance Modal
 */

import React, { useState } from 'react';
import { FleetMaintenanceItem, MaintenanceActualOutcome } from '../../../types/fleetMaintenance';
import { 
  X, 
  CheckCircle, 
  ClipboardCheck, 
  DollarSign, 
  Clock, 
  Activity, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';

interface CompleteMaintenanceModalProps {
  item: FleetMaintenanceItem;
  onClose: () => void;
  onComplete: (itemId: string, outcome: MaintenanceActualOutcome) => void;
}

export const CompleteMaintenanceModal: React.FC<CompleteMaintenanceModalProps> = ({
  item,
  onClose,
  onComplete
}) => {
  const [actualDuration, setActualDuration] = useState<number>(item.expectedServiceDurationHours);
  const [actualCost, setActualCost] = useState<number>(320);
  const [rootCauseConfirmed, setRootCauseConfirmed] = useState<boolean>(true);
  const [sohRecovery, setSohRecovery] = useState<number>(0.6);
  const [postServiceDeltaV, setPostServiceDeltaV] = useState<number>(14.0);
  const [technicianName, setTechnicianName] = useState<string>(item.assignedTechnician || 'Senior HV Tech: S. Raman');
  const [authorizedEngineerId, setAuthorizedEngineerId] = useState<string>('ENG-DSIM-884');
  const [serviceNotes, setServiceNotes] = useState<string>(
    `Physical intervention executed. Coolant manifold line flushed, thermal interface paste reapplied, and cell balancing cycle completed. Post-service voltage spread normalized to 14 mV (nominal < 15 mV). ASIL-D safety checklist certified.`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const outcome: MaintenanceActualOutcome = {
      actualDurationHours: actualDuration,
      actualCostUsd: actualCost,
      rootCauseConfirmed,
      sohRecoveryOrStabilizationPct: sohRecovery,
      postServiceDeltaV,
      serviceNotes,
      completedAt: new Date().toISOString(),
      technicianName,
      authorizedEngineerId
    };
    onComplete(item.id, outcome);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-[#15803D] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-white" />
            <span className="font-bold text-[13px] tracking-wide uppercase">
              Log Maintenance Outcome & Post-Service Telemetry
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-[#166534] border border-black/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-[12px]">
          {/* Item details */}
          <div className="border border-black bg-[#F8FAFC] p-3 space-y-1">
            <div className="flex justify-between items-start">
              <span className="font-mono text-[10px] bg-[#003B5C] text-white px-1.5 py-0.5 border border-black font-bold">
                {item.vehicleId} · {item.vin}
              </span>
              <span className="font-mono text-[10px] text-[#5E666D]">
                WO: {item.serviceWorkOrderNumber || 'WO-AUTO-2026'}
              </span>
            </div>
            <h4 className="font-bold text-[13px] text-[#003B5C]">{item.vehicleName}</h4>
            <p className="text-[11.5px] text-[#20252A] font-semibold">{item.detectedIssue}</p>
            <div className="text-[10px] text-[#5E666D] font-mono">
              Predicted Duration: <strong className="text-black">{item.expectedServiceDurationHours} hrs</strong> · Method: {item.calculationMethod}
            </div>
          </div>

          {/* Actual Duration vs Predicted Variance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                Actual Service Duration (Hours)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="48"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(parseFloat(e.target.value) || 0)}
                  className="w-full border-2 border-black p-2 font-mono text-[12px] bg-white"
                />
                <span className="font-mono text-[11px] text-[#5E666D] shrink-0">
                  Δ: {(actualDuration - item.expectedServiceDurationHours).toFixed(1)}h
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                Actual Direct Service Cost ($ USD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="5"
                  min="0"
                  value={actualCost}
                  onChange={(e) => setActualCost(parseFloat(e.target.value) || 0)}
                  className="w-full border-2 border-black p-2 font-mono text-[12px] bg-white pl-7"
                />
                <DollarSign className="w-3.5 h-3.5 text-[#5E666D] absolute left-2 top-3" />
              </div>
            </div>
          </div>

          {/* Post-Service Physical Validation Telemetry */}
          <div className="border border-black p-3 bg-[#F0FDF4] space-y-3">
            <span className="font-bold text-[#166534] uppercase tracking-wider text-[11px] block">
              Post-Service Physical Validation Telemetry (Closed Loop)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#20252A] text-[10.5px] block mb-1">
                  Post-Service Pack Cell Imbalance (ΔV in mV)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={postServiceDeltaV}
                    onChange={(e) => setPostServiceDeltaV(parseFloat(e.target.value) || 0)}
                    className="w-full border-2 border-black p-1.5 font-mono text-[11.5px] bg-white"
                  />
                  <span className="text-[10px] font-mono text-[#166534] shrink-0 font-bold">
                    {postServiceDeltaV <= 15 ? 'NORMAL (<15mV)' : 'HIGH'}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#20252A] text-[10.5px] block mb-1">
                  Calculated SOH Recovery / Stabilization (% SOH)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={sohRecovery}
                  onChange={(e) => setSohRecovery(parseFloat(e.target.value) || 0)}
                  className="w-full border-2 border-black p-1.5 font-mono text-[11.5px] bg-white"
                />
              </div>
            </div>

            {/* Root Cause Confirmation */}
            <div className="pt-2 border-t border-[#86EFAC]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rootCauseConfirmed}
                  onChange={(e) => setRootCauseConfirmed(e.target.checked)}
                  className="w-4 h-4 border-2 border-black rounded-none text-[#15803D]"
                />
                <span className="text-[11px] font-mono text-[#14532D] font-bold">
                  Physical teardown confirmed the digital twin's predicted root cause mechanism
                </span>
              </label>
            </div>
          </div>

          {/* Service Notes */}
          <div>
            <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
              Technician Findings & ASIL-D Verification Log
            </label>
            <textarea
              rows={3}
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              className="w-full border-2 border-black p-2 font-mono text-[11px] bg-white resize-none"
            />
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                Servicing Lead Technician
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full border-2 border-black p-1.5 font-mono text-[11px] bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                Certifying Engineer ID (ISO 26262)
              </label>
              <input
                type="text"
                value={authorizedEngineerId}
                onChange={(e) => setAuthorizedEngineerId(e.target.value)}
                className="w-full border-2 border-black p-1.5 font-mono text-[11px] bg-white"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t-2 border-black flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-black bg-white hover:bg-[#F3F4F6] font-mono font-bold text-[11px] uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 border-2 border-black bg-[#15803D] hover:bg-[#166534] text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sign-Off & Complete Service</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
