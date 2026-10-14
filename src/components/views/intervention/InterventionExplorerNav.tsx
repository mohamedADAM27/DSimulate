/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Left Navigation Investigation Explorer (Brutalist Style)
 */

import React, { useState } from 'react';
import { 
  InterventionInvestigation, 
  InterventionExplorerSection,
  InterventionWorkspaceTab
} from '../../../types/intervention';
import { 
  FolderSearch, 
  AlertOctagon, 
  Wrench, 
  GitCompare, 
  ShieldCheck, 
  ClipboardCheck, 
  History, 
  Search, 
  ChevronRight,
  PlusCircle,
  Clock,
  QrCode
} from 'lucide-react';

interface InterventionExplorerNavProps {
  investigations: InterventionInvestigation[];
  currentInvestigationId: string;
  onSelectInvestigation: (id: string) => void;
  activeSection: InterventionExplorerSection;
  onSelectSection: (section: InterventionExplorerSection) => void;
  onSelectTab: (tab: InterventionWorkspaceTab) => void;
  onNewInvestigation: () => void;
}

export const InterventionExplorerNav: React.FC<InterventionExplorerNavProps> = ({
  investigations,
  currentInvestigationId,
  onSelectInvestigation,
  activeSection,
  onSelectSection,
  onSelectTab,
  onNewInvestigation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter investigations
  const filteredInvestigations = investigations.filter(inv => {
    const matchesSearch = inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.sourceDiagnosis.parameter.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && inv.status === statusFilter;
  });

  // Calculate counts for section badges
  const pendingApprovalsCount = investigations.filter(i => i.status === 'PENDING_APPROVAL').length;
  const verifiedCount = investigations.filter(i => i.status === 'VERIFIED').length;
  const activeDiagnosesCount = investigations.filter(i => i.sourceDiagnosis.status === 'ACTIVE').length;

  const sections: Array<{
    id: InterventionExplorerSection;
    label: string;
    icon: React.ElementType;
    count?: number;
    targetTab: InterventionWorkspaceTab;
  }> = [
    { id: 'investigations', label: 'Investigations', icon: FolderSearch, count: investigations.length, targetTab: 'diagnosis-overview' },
    { id: 'active-diagnoses', label: 'Active Diagnoses', icon: AlertOctagon, count: activeDiagnosesCount, targetTab: 'diagnosis-overview' },
    { id: 'intervention-plans', label: 'Intervention Plans', icon: Wrench, targetTab: 'intervention-planner' },
    { id: 'scenario-comparisons', label: 'Scenario Comparisons', icon: GitCompare, targetTab: 'scenario-lab' },
    { id: 'pending-approvals', label: 'Pending Approvals', icon: ShieldCheck, count: pendingApprovalsCount, targetTab: 'decision-report' },
    { id: 'verification-records', label: 'Verification Records', icon: ClipboardCheck, count: verifiedCount, targetTab: 'verification-ledger' },
    { id: 'intervention-history', label: 'Intervention History', icon: History, targetTab: 'verification-ledger' },
    { id: 'battery-passport', label: 'Battery Passport & 2nd-Life', icon: QrCode, targetTab: 'second-life-passport' },
  ];

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="bg-[#2E7D32] text-white px-1 py-0.2 text-[8.5px] font-bold font-mono">VERIFIED</span>;
      case 'APPROVED':
        return <span className="bg-[#005B91] text-white px-1 py-0.2 text-[8.5px] font-bold font-mono">APPROVED</span>;
      case 'PENDING_APPROVAL':
        return <span className="bg-[#D97706] text-white px-1 py-0.2 text-[8.5px] font-bold font-mono">APPROVAL</span>;
      case 'REJECTED':
      case 'FAILED':
        return <span className="bg-[#C62828] text-white px-1 py-0.2 text-[8.5px] font-bold font-mono">REJECTED</span>;
      default:
        return <span className="bg-[#E2E8F0] text-[#20252A] px-1 py-0.2 text-[8.5px] font-bold font-mono">{status}</span>;
    }
  };

  return (
    <div className="w-72 bg-[#FFFFFF] border-r-2 border-black flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* 1. Explorer Header */}
      <div className="h-[34px] bg-[#003B5C] border-b-2 border-black px-2.5 flex items-center justify-between text-white shrink-0">
        <span className="font-mono font-bold text-[11px] tracking-wider uppercase">
          INVESTIGATION EXPLORER
        </span>
        <button
          onClick={onNewInvestigation}
          className="text-[#38BDF8] hover:text-white flex items-center gap-1 font-mono text-[10px] font-bold cursor-pointer"
          title="New Investigation"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>NEW</span>
        </button>
      </div>

      {/* 2. Primary Navigation Sections */}
      <div className="p-1.5 border-b-2 border-black bg-[#F4F5F6] flex flex-col gap-0.5 shrink-0">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              onClick={() => {
                onSelectSection(sec.id);
                onSelectTab(sec.targetTab);
              }}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-mono font-bold text-left border transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#005B91] text-white border-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-[#20252A] border-[#D5D9DD] hover:border-black hover:bg-[#F0F6FA]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#38BDF8]' : 'text-[#005B91]'}`} />
                <span className="truncate">{sec.label}</span>
              </div>
              {sec.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 text-[9px] font-bold font-mono border ${
                    isActive
                      ? 'bg-black text-white border-white'
                      : sec.count > 0 && sec.id === 'pending-approvals'
                      ? 'bg-[#D97706] text-white border-black'
                      : 'bg-[#F4F5F6] text-[#20252A] border-black'
                  }`}
                >
                  {sec.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Investigation Cases Search & Filter */}
      <div className="p-2 border-b-2 border-black bg-[#FFFFFF] shrink-0">
        <div className="relative mb-1.5">
          <Search className="w-3 h-3 absolute left-2 top-2 text-[#7A8289]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases, cells, IDs..."
            className="w-full bg-[#F4F5F6] border border-black pl-7 pr-2 py-1 text-[10.5px] font-mono text-[#20252A] placeholder-[#7A8289] focus:outline-hidden focus:border-[#005B91] focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
          {['ALL', 'PENDING_APPROVAL', 'VERIFIED', 'OPEN'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-1.5 py-0.5 border cursor-pointer ${
                statusFilter === f
                  ? 'bg-black text-white border-black'
                  : 'bg-[#F4F5F6] text-[#5E666D] border-[#D5D9DD] hover:border-black'
              }`}
            >
              {f === 'PENDING_APPROVAL' ? 'PENDING' : f}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Active Investigation List */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5 bg-[#FAFBFD]">
        <div className="text-[9.5px] font-mono uppercase text-[#7A8289] px-1 font-bold">
          CASE DIRECTORY ({filteredInvestigations.length})
        </div>

        {filteredInvestigations.length === 0 ? (
          <div className="p-4 text-center text-[11px] font-mono text-[#7A8289] bg-white border border-[#D5D9DD]">
            No investigations match criteria.
          </div>
        ) : (
          filteredInvestigations.map((inv) => {
            const isSelected = inv.id === currentInvestigationId;

            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvestigation(inv.id)}
                className={`p-2 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EBF4FA] border-black shadow-[3px_3px_0px_#003B5C]'
                    : 'bg-white border-[#D5D9DD] hover:border-black hover:shadow-[2px_2px_0px_#000]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-[11px] text-[#005B91]">
                      {inv.id}
                    </span>
                    <span className="text-[9px] font-mono text-[#7A8289]">
                      [{inv.sourceDiagnosis.objectId}]
                    </span>
                  </div>
                  {getStatusChip(inv.status)}
                </div>

                <div className="font-bold text-[11px] text-[#20252A] leading-tight line-clamp-2 mb-1.5">
                  {inv.title}
                </div>

                <div className="flex items-center justify-between text-[9.5px] font-mono text-[#5E666D]">
                  <span className="truncate max-w-[140px] text-[#C62828] font-semibold">
                    Δ {inv.sourceDiagnosis.deviation}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[#7A8289]" />
                    <span>{inv.createdAt.substring(5, 10)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Explorer Footer Context */}
      <div className="p-2 border-t-2 border-black bg-[#F4F5F6] text-[10px] font-mono flex items-center justify-between shrink-0">
        <span className="text-[#5E666D]">REASONING ARCH:</span>
        <span className="font-bold text-[#005B91]">SLM / GEMINI 3.8</span>
      </div>
    </div>
  );
};
