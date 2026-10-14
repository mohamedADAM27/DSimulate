/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Intervention Intelligence — Vertical AI Dedicated Engineering Workspace
 */

import React, { useState, useEffect } from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  InterventionInvestigation, 
  InterventionWorkspaceTab, 
  InterventionExplorerSection 
} from '../../types/intervention';
import { interventionService } from '../../services/interventionService';
import { InterventionHeader } from './intervention/InterventionHeader';
import { InterventionExplorerNav } from './intervention/InterventionExplorerNav';
import { AreaDiagnosisOverview } from './intervention/AreaDiagnosisOverview';
import { AreaAiInvestigation } from './intervention/AreaAiInvestigation';
import { AreaInterventionPlanner } from './intervention/AreaInterventionPlanner';
import { AreaScenarioLab } from './intervention/AreaScenarioLab';
import { AreaDecisionReport } from './intervention/AreaDecisionReport';
import { AreaVerificationLedger } from './intervention/AreaVerificationLedger';
import { AreaSecondLifePassport } from './intervention/AreaSecondLifePassport';
import { NewInvestigationModal } from './intervention/NewInvestigationModal';
import { 
  ShieldAlert, 
  Cpu, 
  Wrench, 
  GitCompare, 
  FileCheck, 
  ClipboardCheck,
  CheckCircle2,
  QrCode
} from 'lucide-react';

export const InterventionIntelligenceView: React.FC = () => {
  const { batteryPack } = useBatteryStore();

  const [investigations, setInvestigations] = useState<InterventionInvestigation[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<InterventionWorkspaceTab>('diagnosis-overview');
  const [activeSection, setActiveSection] = useState<InterventionExplorerSection>('investigations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [slmStatus, setSlmStatus] = useState<{
    online: boolean;
    model: string;
    error?: string;
  }>({
    online: false,
    model: 'gemini-3.8-flash',
  });

  // Load investigations and check SLM status
  useEffect(() => {
    const list = interventionService.getInvestigations();
    setInvestigations(list);
    if (list.length > 0) {
      setCurrentId(list[0].id);
    }

    checkSlm();
  }, []);

  const checkSlm = async () => {
    const status = await interventionService.checkSlmStatus();
    setSlmStatus(status);
  };

  const currentInvestigation = investigations.find(i => i.id === currentId) || investigations[0];

  const handleUpdateInvestigation = (updated: InterventionInvestigation) => {
    interventionService.saveInvestigation(updated);
    setInvestigations(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
    setHasUnsavedChanges(false);
  };

  const handleCreateNew = (customTitle?: string, diagnosis?: any) => {
    const newInv = interventionService.createNewInvestigation(batteryPack, diagnosis, customTitle);
    const updatedList = interventionService.getInvestigations();
    setInvestigations(updatedList);
    setCurrentId(newInv.id);
    setActiveTab('diagnosis-overview');
  };

  const handleManualSave = () => {
    if (currentInvestigation) {
      interventionService.saveInvestigation(currentInvestigation);
      setHasUnsavedChanges(false);
    }
  };

  const tabs: Array<{
    id: InterventionWorkspaceTab;
    step: string;
    label: string;
    icon: React.ElementType;
  }> = [
    { id: 'diagnosis-overview', step: '1', label: 'Diagnosis Overview', icon: ShieldAlert },
    { id: 'ai-investigation', step: '2', label: 'AI Investigation (Physics SLM)', icon: Cpu },
    { id: 'intervention-planner', step: '3', label: 'Intervention Planner', icon: Wrench },
    { id: 'scenario-lab', step: '4', label: 'Digital Twin Scenario Lab', icon: GitCompare },
    { id: 'decision-report', step: '5', label: 'Decision Report & Approval', icon: FileCheck },
    { id: 'verification-ledger', step: '6', label: 'Verification & Ledger', icon: ClipboardCheck },
    { id: 'second-life-passport', step: '7', label: 'Second-Life & Battery Passport', icon: QrCode },
  ];

  if (!currentInvestigation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F5F6] font-mono">
        <div className="p-6 bg-white border-4 border-black shadow-[6px_6px_0px_#000] text-center max-w-md">
          <Cpu className="w-10 h-10 text-[#005B91] mx-auto mb-2" />
          <h2 className="font-extrabold text-[14px] text-[#20252A] mb-2 uppercase">
            No Active Investigation Cases
          </h2>
          <p className="text-[11px] text-[#5E666D] mb-4">
            Initialize an investigation from the current Digital Twin state to begin physics-informed intervention analysis.
          </p>
          <button
            onClick={() => handleCreateNew()}
            className="bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black px-4 py-2 font-bold uppercase text-[11px] shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            Create Investigation Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F5F6]">
      {/* 1. Desktop Header */}
      <InterventionHeader
        investigation={currentInvestigation}
        slmStatus={slmStatus}
        onNewInvestigation={() => setIsModalOpen(true)}
        onSaveInvestigation={handleManualSave}
        onRefreshSlm={checkSlm}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* 2. Main Layout: Left Navigation + Central Decision Canvas */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Explorer Navigation */}
        <InterventionExplorerNav
          investigations={investigations}
          currentInvestigationId={currentId}
          onSelectInvestigation={(id) => {
            setCurrentId(id);
          }}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onSelectTab={setActiveTab}
          onNewInvestigation={() => setIsModalOpen(true)}
        />

        {/* Central Workspace Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#F4F5F6]">
          {/* Step Sequence Workspace Tab Bar (Brutalist style) */}
          <div className="h-[36px] bg-[#FFFFFF] border-b-2 border-black px-2 flex items-center justify-between select-none shrink-0 overflow-x-auto">
            <div className="flex items-center space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 font-mono text-[10.5px] uppercase font-bold border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#005B91] text-white border-black shadow-[2px_2px_0px_#000]'
                        : 'bg-[#F4F5F6] text-[#5E666D] border-transparent hover:border-black hover:text-[#20252A] hover:bg-white'
                    }`}
                  >
                    <span className={`w-4 h-4 flex items-center justify-center text-[9px] font-black border ${
                      isActive ? 'bg-black text-white border-white' : 'bg-white text-black border-black'
                    }`}>
                      {tab.step}
                    </span>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Current Case Quick Indicator */}
            <div className="hidden xl:flex items-center gap-2 font-mono text-[10.5px] text-[#5E666D] pr-2">
              <span>TARGET: <strong className="text-[#C62828]">{currentInvestigation.sourceDiagnosis.objectId}</strong></span>
              <span>·</span>
              <span>Δ: <strong className="text-[#20252A]">{currentInvestigation.sourceDiagnosis.observed}</strong></span>
            </div>
          </div>

          {/* Active Tab Working Canvas */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {activeTab === 'diagnosis-overview' && (
              <AreaDiagnosisOverview
                investigation={currentInvestigation}
                onProceedToAiInvestigation={() => setActiveTab('ai-investigation')}
              />
            )}

            {activeTab === 'ai-investigation' && (
              <AreaAiInvestigation
                investigation={currentInvestigation}
                onUpdateInvestigation={handleUpdateInvestigation}
                onProceedToPlanner={() => setActiveTab('intervention-planner')}
                slmStatus={slmStatus}
              />
            )}

            {activeTab === 'intervention-planner' && (
              <AreaInterventionPlanner
                investigation={currentInvestigation}
                onUpdateInvestigation={handleUpdateInvestigation}
                onProceedToScenarioLab={() => setActiveTab('scenario-lab')}
                slmStatus={slmStatus}
              />
            )}

            {activeTab === 'scenario-lab' && (
              <AreaScenarioLab
                investigation={currentInvestigation}
                onUpdateInvestigation={handleUpdateInvestigation}
                onProceedToDecisionReport={() => setActiveTab('decision-report')}
              />
            )}

            {activeTab === 'decision-report' && (
              <AreaDecisionReport
                investigation={currentInvestigation}
                onUpdateInvestigation={handleUpdateInvestigation}
                onProceedToVerification={() => setActiveTab('verification-ledger')}
              />
            )}

            {activeTab === 'verification-ledger' && (
              <AreaVerificationLedger
                investigation={currentInvestigation}
                allInvestigations={investigations}
                onUpdateInvestigation={handleUpdateInvestigation}
                onSelectInvestigation={(id) => setCurrentId(id)}
              />
            )}

            {activeTab === 'second-life-passport' && (
              <AreaSecondLifePassport
                investigation={currentInvestigation}
                onUpdateInvestigation={handleUpdateInvestigation}
                slmStatus={slmStatus}
              />
            )}
          </main>
        </div>
      </div>

      {/* New Investigation Modal */}
      {isModalOpen && (
        <NewInvestigationModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateNew}
        />
      )}
    </div>
  );
};
