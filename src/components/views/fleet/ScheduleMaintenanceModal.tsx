/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Schedule Maintenance Modal
 */

import React, { useState } from 'react';
import { FleetMaintenanceItem, ServiceBay } from '../../../types/fleetMaintenance';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Wrench,
  UserCheck
} from 'lucide-react';

interface ScheduleMaintenanceModalProps {
  item: FleetMaintenanceItem;
  bays: ServiceBay[];
  onClose: () => void;
  onSchedule: (
    itemId: string, 
    bayId: string, 
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT_DEPOT' | 'WEEKEND_OVERHAUL',
    scheduledTime: string,
    technician: string
  ) => void;
}

export const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({
  item,
  bays,
  onClose,
  onSchedule
}) => {
  const isSafetyCritical = item.severity === 'CRITICAL_SAFETY';
  
  // Default bay matching supported category
  const suitableBay = bays.find(b => b.supportedCategories.includes(item.category)) || bays[0];
  
  const [selectedBayId, setSelectedBayId] = useState<string>(item.scheduledBayId || suitableBay?.id || 'BAY-01-HV');
  const [selectedShift, setSelectedShift] = useState<'MORNING' | 'AFTERNOON' | 'NIGHT_DEPOT' | 'WEEKEND_OVERHAUL'>(
    item.scheduledShift || (isSafetyCritical ? 'AFTERNOON' : 'NIGHT_DEPOT')
  );
  const [scheduledDate, setScheduledDate] = useState<string>('2026-10-14');
  const [scheduledTimeRange, setScheduledTimeRange] = useState<string>(
    item.scheduledTime || (isSafetyCritical ? 'Today 14:30 - 18:00 IST (Immediate Safety Pullout)' : 'Tonight 21:00 - Tomorrow 02:00 IST')
  );
  
  const activeBay = bays.find(b => b.id === selectedBayId) || bays[0];
  const [technician, setTechnician] = useState<string>(
    item.assignedTechnician || (activeBay?.techniciansOnDuty[0] || 'Senior HV Tech: S. Raman')
  );
  const [authorizedEngineer, setAuthorizedEngineer] = useState<string>('ENG-DSIM-884 (Certified ASIL-D)');
  const [acknowledgeSafetyPolicy, setAcknowledgeSafetyPolicy] = useState<boolean>(!isSafetyCritical);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSafetyCritical && !acknowledgeSafetyPolicy) {
      alert('ASIL-D Mandate: You must acknowledge safety override protocols before scheduling.');
      return;
    }
    onSchedule(item.id, selectedBayId, selectedShift, scheduledTimeRange, technician);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border-2 border-black w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-[#005B91] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-black">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#38BDF8]" />
            <span className="font-bold text-[13px] tracking-wide uppercase">
              Schedule Downtime-Aware Maintenance Window
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 hover:bg-[#003B5C] border border-black/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-[12px]">
          {/* Target Issue & Vehicle Overview */}
          <div className="border border-black bg-[#F8FAFC] p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] bg-[#003B5C] text-white px-1.5 py-0.5 border border-black font-bold">
                  {item.vehicleId} · {item.vin}
                </span>
                <h4 className="font-bold text-[13px] text-[#003B5C] mt-1">{item.vehicleName}</h4>
                <p className="text-[11px] text-[#20252A] font-semibold">{item.detectedIssue}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 text-[9.5px] font-mono font-black border border-black ${
                  isSafetyCritical ? 'bg-[#DC2626] text-white' : 'bg-[#D97706] text-white'
                }`}>
                  {item.severity}
                </span>
                <div className="text-[10px] text-[#5E666D] font-mono mt-1">
                  Est. Service: {item.expectedServiceDurationHours} hrs
                </div>
              </div>
            </div>

            {isSafetyCritical && (
              <div className="bg-[#FEF2F2] border border-[#DC2626] p-2 flex items-start gap-2 text-[#991B1B]">
                <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-snug">
                  <strong className="font-bold">ASIL-D Safety Override Active: </strong>
                  This item is safety-critical ({item.estimatedMaintenanceWindow.urgencyReason}). Scheduling rules mandate isolation within the current shift deadline ({item.estimatedMaintenanceWindow.deadline}). It cannot be deferred to optimize fleet utilization.
                </div>
              </div>
            )}
          </div>

          {/* Bay Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block">
              1. Assign Service Bay & Dedicated Rig
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {bays.map(bay => {
                const isSelected = selectedBayId === bay.id;
                const isOccupied = bay.status === 'OCCUPIED';
                return (
                  <button
                    type="button"
                    key={bay.id}
                    onClick={() => {
                      setSelectedBayId(bay.id);
                      if (bay.techniciansOnDuty.length > 0) {
                        setTechnician(bay.techniciansOnDuty[0]);
                      }
                    }}
                    className={`text-left p-2.5 border-2 transition-all ${
                      isSelected 
                        ? 'border-[#005B91] bg-[#EFF6FF]' 
                        : 'border-[#D5D9DD] bg-white hover:border-black'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-[10.5px] text-[#005B91]">{bay.id}</span>
                      <span className={`text-[8.5px] font-mono font-bold px-1 border ${
                        isOccupied ? 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]' : 'bg-[#DCFCE7] text-[#166534] border-[#166534]'
                      }`}>
                        {bay.status}
                      </span>
                    </div>
                    <div className="font-bold text-[11px] text-[#20252A] leading-tight mb-1">{bay.name}</div>
                    <div className="text-[9.5px] text-[#5E666D]">
                      Techs: {bay.techniciansOnDuty.join(', ')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Selection & Downtime Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                2. Operational Shift Window
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value as any)}
                className="w-full border-2 border-black p-2 font-mono text-[11px] bg-white"
              >
                <option value="AFTERNOON">Afternoon Service (11:00 - 17:00 IST)</option>
                <option value="NIGHT_DEPOT">Night Depot Overhaul (21:00 - 05:00 IST) [Min Disruption]</option>
                <option value="MORNING">Morning Peak Shift (06:00 - 11:00 IST)</option>
                <option value="WEEKEND_OVERHAUL">Weekend Complete Pack Overhaul</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                3. Scheduled Time Slot String
              </label>
              <input
                type="text"
                value={scheduledTimeRange}
                onChange={(e) => setScheduledTimeRange(e.target.value)}
                className="w-full border-2 border-black p-2 font-mono text-[11px] bg-white"
                placeholder="e.g. Today 14:30 - 18:00 IST"
              />
            </div>
          </div>

          {/* Assigned Technician & Authorized Engineer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                4. Assigned Lead Technician
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full border-2 border-black p-2 font-mono text-[11px] bg-white"
                placeholder="Lead Technician Name"
              />
            </div>

            <div>
              <label className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] block mb-1">
                5. Authorized Systems Engineer ID
              </label>
              <input
                type="text"
                value={authorizedEngineer}
                onChange={(e) => setAuthorizedEngineer(e.target.value)}
                className="w-full border-2 border-black p-2 font-mono text-[11px] bg-white"
                placeholder="Authorized Engineer ID"
              />
            </div>
          </div>

          {/* ASIL-D Safety Policy Acknowledgment */}
          {isSafetyCritical && (
            <div className="border-2 border-[#DC2626] bg-[#FEF2F2] p-2.5">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledgeSafetyPolicy}
                  onChange={(e) => setAcknowledgeSafetyPolicy(e.target.checked)}
                  className="mt-1 w-4 h-4 border-2 border-black rounded-none text-[#005B91] focus:ring-0"
                />
                <span className="text-[11px] text-[#991B1B] font-mono leading-tight">
                  <strong>ENGINEER AUTHORIZATION:</strong> I certify under ISO 26262 ASIL-D that this vehicle ({item.vehicleId}) will be grounded upon arrival at the depot and will not be reassigned to commercial route operations until physical verification is logged.
                </span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={isSafetyCritical && !acknowledgeSafetyPolicy}
              className="px-5 py-2 border-2 border-black bg-[#005B91] hover:bg-[#003B5C] disabled:bg-[#9CA3AF] disabled:border-[#6B7280] text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Confirm & Commit Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
