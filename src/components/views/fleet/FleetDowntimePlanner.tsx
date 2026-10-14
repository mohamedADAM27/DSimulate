/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Downtime-Aware Fleet Maintenance Scheduler & Bay Allocator
 */

import React, { useState } from 'react';
import { 
  FleetMaintenanceItem, 
  ServiceBay, 
  FleetVehicle, 
  FleetDowntimePlanSummary 
} from '../../../types/fleetMaintenance';
import { 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Zap, 
  TrendingUp, 
  Info,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';

interface FleetDowntimePlannerProps {
  items: FleetMaintenanceItem[];
  bays: ServiceBay[];
  vehicles: FleetVehicle[];
  summary: FleetDowntimePlanSummary;
  onScheduleItem: (item: FleetMaintenanceItem) => void;
  onStartService: (itemId: string) => void;
}

export const FleetDowntimePlanner: React.FC<FleetDowntimePlannerProps> = ({
  items,
  bays,
  vehicles,
  summary,
  onScheduleItem,
  onStartService
}) => {
  const [selectedShiftView, setSelectedShiftView] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT_DEPOT'>('ALL');

  const scheduledOrActive = items.filter(i => 
    i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS' || (i.status === 'QUEUED' && i.severity === 'CRITICAL_SAFETY')
  );

  return (
    <div className="flex flex-col h-full space-y-2.5 overflow-y-auto pr-1 text-[12px]">
      {/* ASIL-D Safety Override Enforcer Banner */}
      <div className="border-2 border-[#DC2626] bg-[#FEF2F2] p-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <AlertOctagon className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-[12px] text-[#991B1B] uppercase tracking-wide flex items-center gap-2">
              <span>ASIL-D Safety-First Scheduling Engine</span>
              <span className="bg-[#DC2626] text-white text-[9px] px-1.5 py-0.2 border border-black font-mono">
                NON-NEGOTIABLE SAFETY MANDATE
              </span>
            </div>
            <p className="text-[11.5px] text-[#7F1D1D] leading-snug">
              Safety-critical thermal runaway risks and severe cell voltage deviations (ΔV &gt; 40mV) are <strong>automatically locked into the earliest depot arrival window</strong>. The scheduling algorithm strictly prohibits deferring safety repairs to maximize route availability. Non-critical electrochemistry and balancing jobs are shifted to Night Depot hours (22:00–06:00 IST) to preserve 85% peak fleet availability.
            </p>
          </div>
        </div>
      </div>

      {/* Fleet Capacity & Operational Demand Meters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div className="border-2 border-black bg-white p-2.5">
          <div className="text-[10px] font-mono text-[#5E666D] uppercase font-bold">Fleet Availability</div>
          <div className="text-[20px] font-mono font-bold text-[#005B91] mt-0.5">
            {summary.fleetAvailabilityPct}%
          </div>
          <div className="text-[10px] text-[#5E666D]">
            {summary.activeOnRouteCount} active / {summary.totalFleetSize} total vehicles
          </div>
        </div>

        <div className="border-2 border-black bg-white p-2.5">
          <div className="text-[10px] font-mono text-[#5E666D] uppercase font-bold">Safety Grounded / Derated</div>
          <div className="text-[20px] font-mono font-bold text-[#DC2626] mt-0.5">
            {summary.safetyGroundedCount} <span className="text-[11px] font-normal text-[#991B1B]">Vehicles</span>
          </div>
          <div className="text-[10px] text-[#DC2626] font-mono">
            {summary.criticalSafetyQueueCount} ASIL-D critical safety actions
          </div>
        </div>

        <div className="border-2 border-black bg-white p-2.5">
          <div className="text-[10px] font-mono text-[#5E666D] uppercase font-bold">Active Service Bays</div>
          <div className="text-[20px] font-mono font-bold text-[#15803D] mt-0.5">
            {bays.filter(b => b.status === 'OCCUPIED').length} / {bays.length} <span className="text-[11px] font-normal text-[#5E666D]">Occupied</span>
          </div>
          <div className="text-[10px] text-[#5E666D]">
            {summary.scheduledMaintenanceCount} maintenance jobs booked
          </div>
        </div>

        <div className="border-2 border-black bg-white p-2.5">
          <div className="text-[10px] font-mono text-[#5E666D] uppercase font-bold">Estimated Cost Avoided</div>
          <div className="text-[20px] font-mono font-bold text-[#003B5C] mt-0.5">
            ${summary.estimatedCostAvoidedUsd.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#166534] font-mono">
            Prevented {summary.preventedUnplannedBreakdowns} en-route strandings
          </div>
        </div>
      </div>

      {/* 24-Hour Shift Horizon & Demand Overlay */}
      <div className="border-2 border-black bg-white p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#005B91]" />
            <span>24-Hour Fleet Duty Shifts & Service Bay Windows</span>
          </span>
          <span className="font-mono text-[10px] text-[#5E666D]">Timezone: Asia/Kolkata (IST)</span>
        </div>

        {/* Shift timeline blocks */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Shift 1: Morning Peak */}
          <div className="border border-black p-2 bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px] text-[#003B5C]">Morning Peak</span>
              <span className="font-mono text-[9px] text-[#5E666D]">06:00 - 11:00</span>
            </div>
            <div className="text-[10px] text-[#5E666D]">Fleet Demand: <strong className="text-black">88%</strong></div>
            <div className="text-[10px] text-[#DC2626] font-mono mt-1 font-bold">
              Emergency Safety Slots Only
            </div>
          </div>

          {/* Shift 2: Afternoon Service */}
          <div className="border border-black p-2 bg-[#EFF6FF]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px] text-[#005B91]">Afternoon Window</span>
              <span className="font-mono text-[9px] text-[#5E666D]">11:00 - 17:00</span>
            </div>
            <div className="text-[10px] text-[#5E666D]">Fleet Demand: <strong className="text-black">62%</strong></div>
            <div className="text-[10px] text-[#005B91] font-mono mt-1 font-bold">
              2 Bays Active (HV + Glycol)
            </div>
          </div>

          {/* Shift 3: Evening Peak */}
          <div className="border border-black p-2 bg-[#F8FAFC]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px] text-[#003B5C]">Evening Peak</span>
              <span className="font-mono text-[9px] text-[#5E666D]">17:00 - 22:00</span>
            </div>
            <div className="text-[10px] text-[#5E666D]">Fleet Demand: <strong className="text-black">92%</strong></div>
            <div className="text-[10px] text-[#DC2626] font-mono mt-1 font-bold">
              Emergency Safety Slots Only
            </div>
          </div>

          {/* Shift 4: Night Depot Overhaul */}
          <div className="border border-black p-2 bg-[#F0FDF4]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[11px] text-[#166534]">Night Depot Overhaul</span>
              <span className="font-mono text-[9px] text-[#5E666D]">22:00 - 06:00</span>
            </div>
            <div className="text-[10px] text-[#5E666D]">Fleet Demand: <strong className="text-black">15%</strong></div>
            <div className="text-[10px] text-[#166534] font-mono mt-1 font-bold">
              Full Bay Capacity (Degradation + Balancing)
            </div>
          </div>
        </div>
      </div>

      {/* Service Bays Live Status Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-[#005B91]" />
            <span>Service Bay Capacities & Live Technician Allocations</span>
          </span>
          <span className="text-[10.5px] text-[#5E666D] font-mono">
            Depot Central Workshop · Bangalore Zone
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {bays.map(bay => {
            const isOccupied = bay.status === 'OCCUPIED';
            const occupiedVehicle = isOccupied ? vehicles.find(v => v.id === bay.currentVehicleId) : null;
            const activeMnt = isOccupied ? items.find(m => m.id === bay.currentMaintenanceId) : null;
            const queuedForBay = items.filter(m => m.scheduledBayId === bay.id && (m.status === 'SCHEDULED' || m.status === 'QUEUED'));

            return (
              <div key={bay.id} className="border-2 border-black bg-white flex flex-col justify-between p-3">
                <div>
                  <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                    <span className="font-mono font-bold text-[11px] text-[#005B91]">{bay.id}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${
                      isOccupied ? 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]' : 'bg-[#DCFCE7] text-[#166534] border-[#166534]'
                    }`}>
                      {bay.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-[12px] text-[#20252A] leading-tight mb-1">{bay.name}</h4>
                  
                  <div className="text-[10px] text-[#5E666D] font-mono mb-2">
                    Techs: <strong>{bay.techniciansOnDuty.join(', ')}</strong>
                  </div>

                  {/* Current Active Vehicle in Bay */}
                  {isOccupied && occupiedVehicle ? (
                    <div className="border border-[#DC2626] bg-[#FEF2F2] p-2 mb-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9.5px] font-bold bg-[#DC2626] text-white px-1">
                          ACTIVE SERVICE
                        </span>
                        <span className="font-mono text-[9px] text-[#7F1D1D]">{bay.allocatedUntil}</span>
                      </div>
                      <div className="font-bold text-[11px] text-[#991B1B]">{occupiedVehicle.vehicleName}</div>
                      <div className="text-[10px] text-[#7F1D1D] truncate">{activeMnt?.detectedIssue}</div>
                    </div>
                  ) : (
                    <div className="border border-[#D5D9DD] bg-[#F9FAFB] p-2 text-center text-[#5E666D] text-[10.5px] font-mono mb-2">
                      Ready for next scheduled vehicle
                    </div>
                  )}

                  {/* Upcoming scheduled vehicles for this bay */}
                  <div className="space-y-1">
                    <div className="text-[9.5px] font-mono text-[#5E666D] uppercase font-bold">
                      Upcoming Assigned ({queuedForBay.length}):
                    </div>
                    {queuedForBay.length === 0 ? (
                      <div className="text-[10px] text-[#9CA3AF] italic">No queued vehicles</div>
                    ) : (
                      queuedForBay.map(q => (
                        <div key={q.id} className="text-[10px] font-mono bg-[#F3F4F6] p-1 border flex items-center justify-between">
                          <span className="font-bold text-[#005B91]">{q.vehicleId}</span>
                          <span className="text-[9px] text-[#5E666D] truncate max-w-[140px]">{q.scheduledTime || q.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] font-mono text-[#5E666D]">
                  <span>Supported: {bay.supportedCategories.length} domains</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Maintenance Horizon List */}
      <div className="border-2 border-black bg-white p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#003B5C] uppercase tracking-wider text-[11px]">
            Downtime-Aware Schedule Queue ({scheduledOrActive.length} items)
          </span>
          <span className="font-mono text-[10.5px] text-[#5E666D]">
            Prioritized by ASIL-D Urgency + Fleet Shift Minimums
          </span>
        </div>

        <div className="space-y-2">
          {scheduledOrActive.map(item => {
            const isCritical = item.severity === 'CRITICAL_SAFETY';
            return (
              <div 
                key={item.id}
                className={`border p-2.5 flex items-center justify-between ${
                  isCritical ? 'border-[#DC2626] bg-[#FEF2F2]/60' : 'border-black bg-[#F8FAFC]'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-[#003B5C] text-white px-1.5 py-0.5">
                      {item.vehicleId}
                    </span>
                    <span className="font-bold text-[11.5px] text-[#20252A]">{item.vehicleName}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${
                      isCritical ? 'bg-[#DC2626] text-white border-black' : 'bg-[#D97706] text-white border-black'
                    }`}>
                      {item.severity}
                    </span>
                    <span className="text-[9.5px] font-mono text-[#5E666D]">
                      Bay: <strong className="text-black">{item.scheduledBayId || 'TBD'}</strong>
                    </span>
                  </div>

                  <div className="text-[11px] text-[#20252A] font-medium">{item.detectedIssue}</div>

                  <div className="text-[10px] text-[#5E666D] font-mono flex items-center gap-3">
                    <span>Slot: <strong className="text-[#005B91]">{item.scheduledTime || item.estimatedMaintenanceWindow.recommendedStart}</strong></span>
                    <span>·</span>
                    <span>Duration: {item.expectedServiceDurationHours}h</span>
                    <span>·</span>
                    <span>Tech: {item.assignedTechnician || 'Unassigned'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {item.status === 'QUEUED' && (
                    <button
                      onClick={() => onScheduleItem(item)}
                      className="px-3 py-1 bg-[#005B91] hover:bg-[#003B5C] text-white border border-black font-mono font-bold text-[10px] uppercase"
                    >
                      Allocate Bay Slot
                    </button>
                  )}
                  {item.status === 'SCHEDULED' && (
                    <button
                      onClick={() => onStartService(item.id)}
                      className="px-3 py-1 bg-[#D97706] hover:bg-[#B45309] text-white border border-black font-mono font-bold text-[10px] uppercase flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Start Bay Service</span>
                    </button>
                  )}
                  {item.status === 'IN_PROGRESS' && (
                    <span className="px-2 py-1 bg-[#FEF08A] text-[#854D0E] border border-[#CA8A04] font-mono font-bold text-[10px] uppercase animate-pulse">
                      In Service
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
