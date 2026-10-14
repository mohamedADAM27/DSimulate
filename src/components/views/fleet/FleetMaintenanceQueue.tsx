/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Fleet Predictive Maintenance Queue Component
 */

import React, { useState } from 'react';
import { 
  FleetMaintenanceItem, 
  MaintenanceSeverity, 
  MaintenanceStatus, 
  MaintenanceCategory,
  ServiceBay
} from '../../../types/fleetMaintenance';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Wrench, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  Cpu, 
  CheckCircle2, 
  ArrowUpRight, 
  Activity, 
  ShieldCheck,
  AlertOctagon,
  FileText
} from 'lucide-react';

interface FleetMaintenanceQueueProps {
  items: FleetMaintenanceItem[];
  bays: ServiceBay[];
  onScheduleItem: (item: FleetMaintenanceItem) => void;
  onStartService: (itemId: string) => void;
  onCompleteItem: (item: FleetMaintenanceItem) => void;
  onVerifyItem: (itemId: string) => void;
  onInvestigateSlm: (item: FleetMaintenanceItem) => void;
}

export const FleetMaintenanceQueue: React.FC<FleetMaintenanceQueueProps> = ({
  items,
  bays,
  onScheduleItem,
  onStartService,
  onCompleteItem,
  onVerifyItem,
  onInvestigateSlm
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(items[0]?.id || null);

  const filteredItems = items.filter(item => {
    if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVeh = item.vehicleId.toLowerCase().includes(q) || item.vehicleName.toLowerCase().includes(q);
      const matchIssue = item.detectedIssue.toLowerCase().includes(q);
      const matchVin = item.vin.toLowerCase().includes(q);
      if (!matchVeh && !matchIssue && !matchVin) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: MaintenanceSeverity) => {
    switch (severity) {
      case 'CRITICAL_SAFETY':
        return (
          <span className="bg-[#DC2626] text-white px-2 py-0.5 text-[9.5px] font-mono font-black border border-black inline-flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-white" />
            CRITICAL SAFETY (ASIL-D)
          </span>
        );
      case 'HIGH_DEGRADATION':
        return (
          <span className="bg-[#EA580C] text-white px-2 py-0.5 text-[9.5px] font-mono font-black border border-black inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-white" />
            HIGH DEGRADATION
          </span>
        );
      case 'MEDIUM_OPERATIONAL':
        return (
          <span className="bg-[#D97706] text-white px-2 py-0.5 text-[9.5px] font-mono font-bold border border-black">
            MEDIUM OPERATIONAL
          </span>
        );
      case 'LOW_ADVISORY':
      default:
        return (
          <span className="bg-[#6B7280] text-white px-2 py-0.5 text-[9.5px] font-mono font-bold border border-black">
            LOW ADVISORY
          </span>
        );
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'QUEUED':
        return <span className="bg-[#FEF3C7] text-[#92400E] border border-[#D97706] px-1.5 py-0.5 font-mono text-[9px] font-bold">QUEUED</span>;
      case 'SCHEDULED':
        return <span className="bg-[#DBEAFE] text-[#1E40AF] border border-[#2563EB] px-1.5 py-0.5 font-mono text-[9px] font-bold">SCHEDULED</span>;
      case 'IN_PROGRESS':
        return <span className="bg-[#FEF08A] text-[#854D0E] border border-[#CA8A04] px-1.5 py-0.5 font-mono text-[9px] font-bold animate-pulse">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="bg-[#DCFCE7] text-[#166534] border border-[#16A34A] px-1.5 py-0.5 font-mono text-[9px] font-bold">COMPLETED</span>;
      case 'OVERDUE':
        return <span className="bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626] px-1.5 py-0.5 font-mono text-[9px] font-bold">OVERDUE</span>;
      case 'VERIFIED':
        return <span className="bg-[#15803D] text-white border border-black px-1.5 py-0.5 font-mono text-[9px] font-bold inline-flex items-center gap-0.5"><ShieldCheck className="w-2.5 h-2.5" /> VERIFIED</span>;
      default:
        return null;
    }
  };

  const getOperationalImpactBadge = (impact: string) => {
    switch (impact) {
      case 'GROUNDED_SAFETY':
        return <span className="text-[#DC2626] font-mono font-bold text-[10px]">GROUNDED / IMMEDIATE DEPOT PULLOUT</span>;
      case 'PEAK_HOURS_RESTRICTION':
        return <span className="text-[#EA580C] font-mono font-bold text-[10px]">RESTRICT FROM PEAK HOURS</span>;
      case 'SPEED_DERATED':
        return <span className="text-[#D97706] font-mono font-bold text-[10px]">DERATED / CITY LIMIT ONLY</span>;
      case 'NO_IMPACT_SCHEDULED':
      default:
        return <span className="text-[#166534] font-mono font-bold text-[10px]">OFF-SHIFT / NO ROUTE IMPACT</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2 overflow-hidden">
      {/* Top Controls: Search & Filters */}
      <div className="bg-white border-2 border-black p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Vehicle ID, VIN, or detected issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-black py-1 px-2.5 pl-8 text-[11px] font-mono bg-white focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#5E666D] absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          {/* Severity filter */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[#5E666D] text-[10px] uppercase font-bold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-black py-1 px-1.5 font-mono text-[10.5px] bg-white"
            >
              <option value="ALL">All Severities ({items.length})</option>
              <option value="CRITICAL_SAFETY">Critical Safety ({items.filter(i => i.severity === 'CRITICAL_SAFETY').length})</option>
              <option value="HIGH_DEGRADATION">High Degradation</option>
              <option value="MEDIUM_OPERATIONAL">Medium Operational</option>
              <option value="LOW_ADVISORY">Low Advisory</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[#5E666D] text-[10px] uppercase font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-black py-1 px-1.5 font-mono text-[10.5px] bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="QUEUED">Queued</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-[#5E666D] text-[10px] uppercase font-bold">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-black py-1 px-1.5 font-mono text-[10.5px] bg-white"
            >
              <option value="ALL">All Domains</option>
              <option value="BATTERY_THERMAL">Thermal & Hotspots</option>
              <option value="CELL_IMBALANCE">Cell Imbalance</option>
              <option value="COOLING_LOOP">Cooling Loop</option>
              <option value="ELECTROCHEMISTRY_DEGRADATION">Degradation</option>
              <option value="ELECTRICAL_HARDWARE">Electrical Hardware</option>
              <option value="BMS_CALIBRATION">BMS Calibration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Queue List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredItems.length === 0 ? (
          <div className="bg-white border-2 border-black p-8 text-center text-[#5E666D]">
            <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2" />
            <div className="font-bold text-[13px] text-[#20252A]">No Maintenance Items Found</div>
            <div className="text-[11px] mt-1">No items match the active severity, status, or search filters.</div>
          </div>
        ) : (
          filteredItems.map(item => {
            const isExpanded = expandedItemId === item.id;
            const isCritical = item.severity === 'CRITICAL_SAFETY';

            return (
              <div 
                key={item.id}
                className={`bg-white border-2 transition-all ${
                  isCritical 
                    ? 'border-[#DC2626] shadow-xs' 
                    : 'border-black'
                }`}
              >
                {/* Header Bar */}
                <div 
                  onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                  className={`p-3 flex items-start justify-between cursor-pointer select-none transition-colors ${
                    isCritical ? 'bg-[#FEF2F2]/50 hover:bg-[#FEF2F2]' : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button className="mt-0.5 text-[#5E666D] hover:text-black">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10.5px] bg-[#003B5C] text-white px-1.5 py-0.5 border border-black font-bold">
                          {item.vehicleId}
                        </span>
                        <span className="font-mono text-[10px] text-[#5E666D]">{item.vin}</span>
                        <span className="text-[11px] font-bold text-[#005B91]">{item.vehicleName}</span>
                        <span className="text-[10px] text-[#5E666D] font-mono">({item.chemistry})</span>
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="font-bold text-[13px] text-[#20252A] leading-snug">
                        {item.detectedIssue}
                      </div>

                      <div className="flex items-center gap-3 text-[10.5px] text-[#5E666D] flex-wrap">
                        <span>Window: <strong className="text-black font-mono">{item.estimatedMaintenanceWindow.recommendedStart}</strong></span>
                        <span>·</span>
                        <span>Duration: <strong className="text-black font-mono">{item.expectedServiceDurationHours} hrs</strong></span>
                        <span>·</span>
                        <span>Impact: {getOperationalImpactBadge(item.operationalImpact)}</span>
                        <span>·</span>
                        <span>Confidence: <strong className="text-[#005B91] font-mono">{item.confidencePct}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                    {getSeverityBadge(item.severity)}
                    <span className="text-[9.5px] font-mono text-[#5E666D] bg-[#F3F4F6] px-1.5 py-0.5 border border-[#D5D9DD]">
                      {item.dataFreshness}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="border-t-2 border-black p-3.5 bg-[#FAFBFB] space-y-3.5 text-[11.5px]">
                    {/* Evidence & Telemetry Findings */}
                    <div>
                      <div className="font-bold text-[#003B5C] uppercase tracking-wider text-[10.5px] mb-1.5 flex items-center justify-between">
                        <span>Physical Telemetry Evidence & Sensor Discrepancies</span>
                        <span className="font-mono text-[9.5px] text-[#5E666D]">
                          Methodology: <strong className="text-[#005B91]">{item.calculationMethod}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {item.evidence.map((ev, i) => (
                          <div key={i} className="border border-black p-2 bg-white space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[11px] text-[#20252A]">{ev.parameter}</span>
                              <span className="font-mono text-[9px] px-1 bg-[#EFF6FF] text-[#005B91] border border-[#BFDBFE]">
                                {ev.sourceSensor}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline font-mono">
                              <span className="text-[12px] font-bold text-[#DC2626]">{ev.observed}</span>
                              <span className="text-[10px] text-[#5E666D]">Norm: {ev.baseline} ({ev.delta})</span>
                            </div>
                            <div className="text-[9.5px] text-[#4B5563] leading-tight pt-1 border-t border-[#F3F4F6]">
                              {ev.physicalSignificance}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Window, Urgency & Missing Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border border-black p-2.5 bg-white space-y-1">
                        <span className="font-bold text-[#003B5C] uppercase tracking-wider text-[10px] block">
                          Recommended Action & Service Planning
                        </span>
                        <p className="text-[11.5px] text-[#20252A] leading-snug">
                          {item.recommendedNextAction}
                        </p>
                        <div className="pt-1.5 text-[10px] text-[#5E666D] font-mono">
                          Hard Deadline: <strong className="text-[#DC2626]">{item.estimatedMaintenanceWindow.deadline}</strong>
                        </div>
                      </div>

                      <div className="border border-black p-2.5 bg-white space-y-1 font-mono text-[10.5px]">
                        <span className="font-bold text-[#003B5C] uppercase tracking-wider text-[10px] block font-sans">
                          Uncertainty & Data Integrity
                        </span>
                        <div>Uncertainty: <strong className="text-[#005B91]">{item.uncertaintyPct}%</strong></div>
                        <div className="text-[10px] text-[#5E666D]">{item.uncertaintyReason}</div>
                        {item.missingInputs && item.missingInputs.length > 0 && (
                          <div className="text-[#D97706] text-[10px] pt-1">
                            Missing Inputs: {item.missingInputs.join(', ')}
                          </div>
                        )}
                        {item.assignedTechnician && (
                          <div className="text-[#166534] pt-1 font-bold">
                            Assigned Tech: {item.assignedTechnician} (Slot: {item.scheduledTime || 'TBD'})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Completed Actual Outcome Display if available */}
                    {item.actualOutcome && (
                      <div className="border-2 border-[#16A34A] bg-[#F0FDF4] p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-[#166534] uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Closed-Loop Service Outcome & Verification Record</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#166534]">
                            Verified by: {item.actualOutcome.authorizedEngineerId}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 font-mono text-[10.5px] text-[#14532D]">
                          <div>Actual Duration: <strong>{item.actualOutcome.actualDurationHours}h</strong> (Est: {item.expectedServiceDurationHours}h)</div>
                          <div>Service Cost: <strong>${item.actualOutcome.actualCostUsd}</strong></div>
                          <div>Post-Service ΔV: <strong>{item.actualOutcome.postServiceDeltaV} mV</strong></div>
                          <div>SOH Recovery: <strong>+{item.actualOutcome.sohRecoveryOrStabilizationPct}%</strong></div>
                        </div>
                        <div className="text-[10.5px] text-[#166534] pt-1 border-t border-[#86EFAC]">
                          {item.actualOutcome.serviceNotes}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons Bar */}
                    <div className="pt-2 border-t border-black/30 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* Physics SLM Button */}
                        <button
                          onClick={() => onInvestigateSlm(item)}
                          className="px-3 py-1.5 bg-[#003B5C] hover:bg-[#00273D] text-[#38BDF8] hover:text-white border-2 border-black font-mono font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Investigate with Physics SLM</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'QUEUED' && (
                          <button
                            onClick={() => onScheduleItem(item)}
                            className="px-3.5 py-1.5 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black font-mono font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule Maintenance Window</span>
                          </button>
                        )}

                        {item.status === 'SCHEDULED' && (
                          <>
                            <button
                              onClick={() => onScheduleItem(item)}
                              className="px-2.5 py-1.5 bg-white hover:bg-[#F3F4F6] text-[#20252A] border-2 border-black font-mono font-bold text-[10.5px] uppercase"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => onStartService(item.id)}
                              className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white border-2 border-black font-mono font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>Dispatch to Bay (Start Work)</span>
                            </button>
                          </>
                        )}

                        {item.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => onCompleteItem(item)}
                            className="px-3.5 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white border-2 border-black font-mono font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Log Outcome & Complete Work</span>
                          </button>
                        )}

                        {item.status === 'COMPLETED' && (
                          <button
                            onClick={() => onVerifyItem(item.id)}
                            className="px-3.5 py-1.5 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black font-mono font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>ASIL-D Certified Verification</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
