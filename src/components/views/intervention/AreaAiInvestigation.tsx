/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Area B: AI Investigation & Mechanic Engineering Chatbot (Brutalist Style)
 */

import React, { useState } from 'react';
import { 
  InterventionInvestigation, 
  RootCauseHypothesis,
  EngineeringChatMessage 
} from '../../../types/intervention';
import { interventionService } from '../../../services/interventionService';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Send, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert,
  Flame,
  FileQuestion,
  Terminal,
  Activity,
  Wrench,
  MessageSquare,
  Copy,
  Trash2,
  Check
} from 'lucide-react';

interface AreaAiInvestigationProps {
  investigation: InterventionInvestigation;
  onUpdateInvestigation: (updated: InterventionInvestigation) => void;
  onProceedToPlanner: () => void;
  slmStatus: { online: boolean; model: string; error?: string };
}

export const AreaAiInvestigation: React.FC<AreaAiInvestigationProps> = ({
  investigation,
  onUpdateInvestigation,
  onProceedToPlanner,
  slmStatus,
}) => {
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [queryInput, setQueryInput] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ai = investigation.aiInvestigation;
  const snap = investigation.batterySnapshot;

  const handleRunSlmDiagnostics = async () => {
    setIsRunningAnalysis(true);
    setAnalysisError(null);

    try {
      const result = await interventionService.requestDiagnosticEvaluation(investigation);
      const updated: InterventionInvestigation = {
        ...investigation,
        status: investigation.status === 'OPEN' ? 'INVESTIGATING' : investigation.status,
        aiInvestigation: {
          ...investigation.aiInvestigation,
          slmInterpretation: result.slmInterpretation,
          rootCauses: result.rootCauses,
          missingMeasurements: result.missingMeasurements,
          recommendedDiagnosticTests: result.recommendedDiagnosticTests,
        },
      };
      onUpdateInvestigation(updated);
    } catch (e: any) {
      console.error(e);
      setAnalysisError(e?.message || 'Failed to connect to Physics SLM reasoning service.');
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const executeQuery = async (queryText: string) => {
    if (!queryText.trim() || isQuerying) return;

    setQueryInput('');
    setIsQuerying(true);

    const now = new Date().toISOString().replace('T', ' ').substring(11, 19) + ' UTC';
    const userMsgId = `MSG-${Date.now()}`;
    const newChat = [
      ...ai.engineeringChat,
      { id: userMsgId, role: 'user' as const, text: queryText, timestamp: now },
    ];

    onUpdateInvestigation({
      ...investigation,
      aiInvestigation: {
        ...ai,
        engineeringChat: newChat,
      },
    });

    try {
      const answer = await interventionService.askEngineeringQuery(investigation, queryText);
      const assistantMsgId = `MSG-${Date.now() + 1}`;
      onUpdateInvestigation({
        ...investigation,
        aiInvestigation: {
          ...ai,
          engineeringChat: [
            ...newChat,
            { 
              id: assistantMsgId, 
              role: 'assistant' as const, 
              text: answer, 
              timestamp: new Date().toISOString().replace('T', ' ').substring(11, 19) + ' UTC', 
              isPhysicsReasoning: true 
            },
          ],
        },
      });
    } catch (err: any) {
      const errMsgId = `MSG-${Date.now() + 1}`;
      onUpdateInvestigation({
        ...investigation,
        aiInvestigation: {
          ...ai,
          engineeringChat: [
            ...newChat,
            { 
              id: errMsgId, 
              role: 'assistant' as const, 
              text: `Physics SLM Error: ${err?.message || 'Inference engine unresponsive. Verify API connectivity.'}`, 
              timestamp: now,
              isPhysicsReasoning: false 
            },
          ],
        },
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSendQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeQuery(queryInput);
  };

  const handleInsertTelemetry = () => {
    const telemetrySnippet = `Current Live Telemetry: Max Cell Temp = ${snap.maxCellTemp}°C, Min Temp = ${snap.minCellTemp}°C, Voltage Spread = ${snap.voltageSpreadMv} mV, Pack Voltage = ${snap.packVoltage}V, SOH = ${snap.avgSoh}%. `;
    setQueryInput(prev => telemetrySnippet + prev);
  };

  const handleClearChat = () => {
    onUpdateInvestigation({
      ...investigation,
      aiInvestigation: {
        ...ai,
        engineeringChat: [],
      },
    });
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const mechanicQuickQueries = [
    { label: 'HV Interlock Safety & PPE', query: 'What is the required high-voltage isolation and PPE checklist before touching Module 2 terminals?' },
    { label: 'Cell C-014 Terminal Torque', query: 'What is the factory bolt torque specification and test protocol for high-resistance busbar connections?' },
    { label: 'Coolant Channel Flow Check', query: 'How do I test the cooling plate channel for vapor locks, air pockets, or flow cavitation in this 800V pack?' },
    { label: 'Hotspot Kinetics (41.7°C)', query: 'Explain the electrochemical mechanism causing the 41.7°C hotspot on Cell C-014 during dynamic discharge.' },
    { label: 'Second-Life Reusability Check', query: 'Based on current SOH and cell delta, is this battery pack eligible for second-life stationary storage reuse?' },
  ];

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto p-3 bg-[#F4F5F6]">
      {/* 1. Header Banner & Diagnostics Trigger */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#003B5C] border-2 border-black flex items-center justify-center text-white">
              <Cpu className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-[12px] uppercase text-[#003B5C] font-mono">
                  PHYSICS-INFORMED SLM ROOT-CAUSE REASONING
                </h2>
                <span className="bg-[#DCECF6] text-[#003B5C] border border-black px-1.5 py-0.2 font-mono text-[9px] font-bold">
                  GEMINI 3.8 FLASH SLM
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#5E666D]">
                Coupled 2-RC Electro-Thermal Model · Navier-Stokes Cooling Channels · Arrhenius SEI Kinetics
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunSlmDiagnostics}
              disabled={isRunningAnalysis}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black font-mono font-bold text-[11px] uppercase shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                isRunningAnalysis
                  ? 'bg-[#E2E8F0] text-[#7A8289] cursor-not-allowed'
                  : 'bg-[#005B91] hover:bg-[#003B5C] text-white'
              }`}
            >
              {isRunningAnalysis ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Solving Physics Equations...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Execute Physics SLM Diagnosis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {analysisError && (
          <div className="mt-2.5 p-2 bg-[#FEE2E2] border-2 border-[#C62828] text-[#991B1B] text-[10.5px] font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#C62828]" />
            <span>{analysisError}</span>
          </div>
        )}
      </div>

      {/* 2. Physics SLM Interpretation Textbox */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="border-b-2 border-black pb-1.5 mb-2 flex items-center justify-between font-mono">
          <span className="font-bold text-[11px] uppercase text-[#20252A] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#005B91]" />
            PHYSICS SLM DIAGNOSTIC INTERPRETATION
          </span>
          <span className="text-[10px] text-[#005B91] font-bold">SOLVER MODEL: D-2RC-SLM</span>
        </div>

        <div className="p-3 bg-[#FAFBFD] border border-black font-mono text-[11px] leading-relaxed text-[#20252A] whitespace-pre-wrap">
          {ai.slmInterpretation || (
            <span className="text-[#7A8289] italic">
              SLM has not yet analyzed this case. Click &apos;Execute Physics SLM Diagnosis&apos; above to ingest live Digital Twin telemetry into the Gemini 3.8 Flash physics model.
            </span>
          )}
        </div>
      </div>

      {/* 3. Ranked Root-Cause Hypotheses */}
      <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
        <div className="border-b-2 border-black pb-1.5 mb-2.5 flex items-center justify-between font-mono">
          <span className="font-bold text-[11px] uppercase text-[#20252A] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#C62828]" />
            RANKED ROOT-CAUSE HYPOTHESES (PHYSICS EVIDENCE CORRELATION)
          </span>
          <span className="text-[10px] text-[#5E666D]">
            {ai.rootCauses.length} HYPOTHESES IDENTIFIED
          </span>
        </div>

        {ai.rootCauses.length === 0 ? (
          <div className="p-4 border border-dashed border-black/40 text-center font-mono text-[11px] text-[#5E666D]">
            Awaiting automated hypothesis ranking. Run the SLM diagnosis to calculate posterior probabilities.
          </div>
        ) : (
          <div className="space-y-3">
            {ai.rootCauses.map((rc: RootCauseHypothesis, idx: number) => (
              <div 
                key={rc.id || idx}
                className="border-2 border-black p-3 bg-[#F4F5F6] shadow-[2px_2px_0px_#000]"
              >
                {/* Hypothesis Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black pb-2 mb-2 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-black text-white flex items-center justify-center font-black text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[12px] text-[#003B5C] uppercase">
                      {rc.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#5E666D] font-bold">PROBABILITY:</span>
                    <div className="w-24 bg-[#E2E8F0] border border-black h-3.5 relative overflow-hidden">
                      <div 
                        className={`h-full ${rc.probability > 50 ? 'bg-[#C62828]' : 'bg-[#D97706]'}`}
                        style={{ width: `${rc.probability}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-black">
                        {rc.probability}%
                      </span>
                    </div>
                    <span className="text-[9.5px] bg-[#DCECF6] text-[#003B5C] border border-black px-1 font-bold">
                      CONF: {(rc.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Physical Mechanism */}
                <div className="p-2 bg-white border border-black font-mono text-[10.5px] text-[#20252A] mb-2 leading-relaxed">
                  <strong className="text-[#005B91]">ELECTROCHEMICAL MECHANISM: </strong>
                  {rc.physicalMechanism}
                </div>

                {/* Evidence Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[10px]">
                  {/* Supporting Evidence */}
                  <div className="p-2 border border-black bg-[#F0FDF4]">
                    <div className="font-bold text-[#166534] mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                      <span>SUPPORTING EVIDENCE ({rc.supportingEvidence.length})</span>
                    </div>
                    <ul className="space-y-1 text-[#15803D]">
                      {rc.supportingEvidence.map((ev: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span>+</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Contradicting Evidence */}
                  <div className="p-2 border border-black bg-[#FEF2F2]">
                    <div className="font-bold text-[#991B1B] mb-1 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-[#991B1B]" />
                      <span>CONTRADICTING / COUNTER EVIDENCE ({rc.contradictingEvidence.length})</span>
                    </div>
                    <ul className="space-y-1 text-[#B91C1C]">
                      {rc.contradictingEvidence.map((ev: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span>-</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                      {rc.contradictingEvidence.length === 0 && (
                        <li className="text-[#7A8289] italic">None identified.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Missing Measurements & Recommended Testing Protocols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Missing Measurements */}
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
          <div className="border-b-2 border-black pb-1 mb-2 font-mono font-bold text-[11px] uppercase text-[#20252A] flex items-center gap-1.5">
            <FileQuestion className="w-3.5 h-3.5 text-[#D97706]" />
            <span>MISSING MEASUREMENTS TO RESOLVE AMBIGUITY</span>
          </div>

          <ul className="space-y-1.5 font-mono text-[10.5px]">
            {ai.missingMeasurements.map((item: string, idx: number) => (
              <li key={idx} className="p-1.5 border border-black bg-[#FAFBFD] flex items-start gap-2">
                <span className="font-bold text-[#005B91]">[{idx + 1}]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Testing Protocols */}
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_#000]">
          <div className="border-b-2 border-black pb-1 mb-2 font-mono font-bold text-[11px] uppercase text-[#20252A] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#005B91]" />
            <span>RECOMMENDED EXPERIMENTAL DIAGNOSTIC TESTS</span>
          </div>

          <ul className="space-y-1.5 font-mono text-[10.5px]">
            {ai.recommendedDiagnosticTests.map((item: string, idx: number) => (
              <li key={idx} className="p-1.5 border border-black bg-[#FAFBFD] flex items-start gap-2">
                <span className="font-bold text-[#2E7D32]">[{idx + 1}]</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. MECHANIC & FIELD TECHNICIAN ENGINEERING CHATBOT (AI ZONE) */}
      <div className="bg-[#00273D] text-white border-2 border-black p-3.5 shadow-[4px_4px_0px_#000]">
        {/* Header */}
        <div className="border-b-2 border-black/70 pb-2 mb-3 flex flex-wrap items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#005B91] border border-black flex items-center justify-center text-white">
              <Wrench className="w-3.5 h-3.5 text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[12px] uppercase text-white tracking-wider">
                  MECHANIC & WORKSHOP FIELD DIAGNOSTICS COPILOT
                </span>
                <span className="bg-[#003B5C] border border-[#38BDF8] text-[#38BDF8] px-1.5 py-0.2 text-[9px] font-bold">
                  LIVE SLM REASONING
                </span>
              </div>
              <div className="text-[10px] text-white/60">
                Direct communication channel for shop floor mechanics, servicing engineers, and field technicians
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInsertTelemetry}
              className="bg-[#003B5C] hover:bg-[#005B91] text-white border border-black px-2 py-1 text-[9.5px] font-bold uppercase transition-all cursor-pointer"
              title="Insert current pack voltage, temperature, and SOH into prompt"
            >
              + Add Pack Telemetry
            </button>
            {ai.engineeringChat.length > 0 && (
              <button
                onClick={handleClearChat}
                className="bg-[#C62828] hover:bg-[#991B1B] text-white border border-black px-2 py-1 text-[9.5px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
                title="Clear conversation history"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Mechanic Question Chips */}
        <div className="mb-3">
          <div className="text-[9.5px] font-mono text-[#38BDF8] font-bold uppercase mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>FIELD MECHANIC PRESET QUERIES (CLICK TO ASK):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mechanicQuickQueries.map((item, idx) => (
              <button
                key={idx}
                onClick={() => executeQuery(item.query)}
                disabled={isQuerying}
                className="bg-[#001B2B] hover:bg-[#003B5C] hover:text-[#38BDF8] text-white/80 border border-black/80 px-2 py-1 font-mono text-[9.5px] transition-all cursor-pointer text-left"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message Scroll Window */}
        <div className="min-h-56 max-h-80 overflow-y-auto space-y-2.5 p-3 bg-[#001726] border-2 border-black font-mono text-[11px] mb-3">
          {ai.engineeringChat.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-white/50 text-center p-4">
              <Terminal className="w-8 h-8 text-[#38BDF8]/40 mb-2" />
              <div className="font-bold text-[11.5px] text-white/80 mb-1">
                MECHANIC COPILOT ONLINE & STANDING BY
              </div>
              <div className="text-[10px] max-w-md text-white/60">
                Ask any workshop question regarding high-voltage disconnect safety, cell thermal limits, torque specs, cooling circuit cavitation, or second-life reusability criteria.
              </div>
            </div>
          ) : (
            ai.engineeringChat.map((msg: EngineeringChatMessage) => {
              const isMechanic = msg.role === 'user';
              return (
                <div 
                  key={msg.id}
                  className={`p-2.5 border-2 transition-all ${
                    isMechanic 
                      ? 'bg-[#003B5C] border-black text-white ml-8 shadow-[2px_2px_0px_#000]' 
                      : 'bg-[#00243A] border-[#005B91] text-[#E0F2FE] mr-8 shadow-[2px_2px_0px_#000]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] mb-1.5 pb-1 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 font-black border ${
                        isMechanic 
                          ? 'bg-[#005B91] text-white border-black' 
                          : 'bg-[#0284C7] text-white border-black'
                      }`}>
                        {isMechanic ? 'FIELD MECHANIC / TECH' : 'PHYSICS SLM ASSISTANT'}
                      </span>
                      {!isMechanic && (
                        <span className="text-[#38BDF8] text-[8.5px]">
                          [PHYSICS-GROUNDED · GEMINI 3.8]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="hover:text-white transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-[#2E7D32]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed font-mono text-[10.5px]">
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Terminal Form */}
        <form onSubmit={handleSendQuery} className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask mechanic questions: e.g. 'What is the safe thermal limit for cell string 2?' or 'BMS rebalancing steps'..."
            disabled={isQuerying}
            className="flex-1 bg-[#001726] border-2 border-black px-3 py-2 font-mono text-[11px] text-white placeholder-white/40 focus:outline-hidden focus:border-[#38BDF8]"
          />
          <button
            type="submit"
            disabled={isQuerying || !queryInput.trim()}
            className={`px-4 py-2 border-2 border-black font-mono font-bold text-[11px] uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer ${
              isQuerying || !queryInput.trim()
                ? 'bg-black/50 text-white/40 cursor-not-allowed'
                : 'bg-[#005B91] hover:bg-[#0072A8] text-white active:translate-x-[1px] active:translate-y-[1px]'
            }`}
          >
            {isQuerying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Answering...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Send Query</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 6. Footer Navigation to Planner */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onProceedToPlanner}
          className="flex items-center gap-2 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black py-2 px-4 font-mono font-bold text-[11px] uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          <span>Step 3: Proceed to Intervention Planner</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
