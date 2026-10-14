/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Area G: Second-Life Battery Reusability & Digital Battery Passport (Brutalist Style)
 * Compliant with EU Battery Regulation EU 2023/1542 & IEC 62619 / UL 1973 standards.
 */

import React, { useState, useEffect } from 'react';
import { 
  InterventionInvestigation, 
  DigitalBatteryPassport, 
  SecondLifeAssessment, 
  RepurposingApplication, 
  PassportLifecycleEvent 
} from '../../../types/intervention';
import { 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  FileDown, 
  ExternalLink, 
  Lock, 
  Unlock, 
  Layers, 
  Activity, 
  Battery, 
  Cpu, 
  Wrench, 
  Globe, 
  Calendar, 
  Check, 
  X, 
  Plus, 
  Info,
  DollarSign,
  Clock
} from 'lucide-react';
import { generateQrCodeDataUrl, interventionService } from '../../../services/interventionService';
import { jsPDF } from 'jspdf';

interface AreaSecondLifePassportProps {
  investigation: InterventionInvestigation;
  onUpdateInvestigation: (updated: InterventionInvestigation) => void;
  slmStatus: { online: boolean; model: string; error?: string };
}

export const AreaSecondLifePassport: React.FC<AreaSecondLifePassportProps> = ({
  investigation,
  onUpdateInvestigation,
  slmStatus,
}) => {
  const [isEvaluatingSlm, setIsEvaluatingSlm] = useState(false);
  const [isPublicModalOpen, setIsPublicModalOpen] = useState(false);
  const [publicViewMode, setPublicViewMode] = useState<'public' | 'authorized'>('public');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isAddingEvent, setIsAddingEvent] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<PassportLifecycleEvent['category']>('SECOND_LIFE');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventActor, setNewEventActor] = useState('LEAD_BATTERY_SYSTEMS_ENGINEER');

  // Assessor Sign-off State
  const [assessorName, setAssessorName] = useState(
    investigation.batteryPassport?.secondLifeAssessment.humanAssessorName || 'Dr. Elena Rostova, PE'
  );
  const [assessorCredential, setAssessorCredential] = useState(
    investigation.batteryPassport?.secondLifeAssessment.humanAssessorCredential || 'ASIL-D Certified Battery Safety Assessor (ISO 26262)'
  );

  const passport = investigation.batteryPassport;
  const assessment = passport?.secondLifeAssessment;
  const snap = investigation.batterySnapshot;

  // Generate QR Code on load or when passport ID changes
  useEffect(() => {
    if (passport?.publicAccessUrl) {
      generateQrCodeDataUrl(passport.publicAccessUrl).then((qr) => {
        setQrCodeData(qr);
      });
    }
  }, [passport?.publicAccessUrl]);

  if (!passport || !assessment) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F4F5F6] font-mono">
        <div className="p-6 bg-white border-4 border-black shadow-[6px_6px_0px_#000] text-center max-w-md">
          <QrCode className="w-10 h-10 text-[#005B91] mx-auto mb-2" />
          <h3 className="font-extrabold text-[13px] text-[#20252A] mb-2 uppercase">
            Passport Identity Not Initialized
          </h3>
          <p className="text-[11px] text-[#5E666D] mb-4">
            Initialize Digital Battery Passport for Pack {investigation.packId}.
          </p>
          <button
            onClick={() => {
              const updated = interventionService.getInvestigationById(investigation.id);
              if (updated) onUpdateInvestigation(updated);
            }}
            className="bg-[#005B91] text-white border-2 border-black px-4 py-2 font-bold uppercase text-[11px] shadow-[3px_3px_0px_#000] cursor-pointer"
          >
            Load Passport
          </button>
        </div>
      </div>
    );
  }

  // Handle SLM Second-Life Evaluation
  const handleRunSlmEvaluation = async () => {
    setIsEvaluatingSlm(true);
    try {
      const prompt = `Perform an evidence-based Second-Life Reusability Assessment for battery pack ${investigation.packId} (${passport.chemistry}, ${passport.nominalCapacityKWh} kWh). Current SOH is ${snap.avgSoh}%, internal resistance is ${passport.healthSnapshot.internalResistanceMohm} mΩ, voltage spread is ${snap.voltageSpreadMv} mV, cycle count is ${passport.totalCycles}. 
Evaluate eligibility for stationary storage repurposing vs refurbishment vs recycling. Cite IEC 62619 / UL 1973 standards. Explain missing evidence, and recommend next testing steps.`;

      const response = await interventionService.askEngineeringQuery(investigation, prompt);

      // Parse and update assessment rationale
      const updatedPassport: DigitalBatteryPassport = {
        ...passport,
        secondLifeAssessment: {
          ...assessment,
          assessedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          slmRationale: response,
          overallScore: Math.round(snap.avgSoh * 0.9 + 5),
          category: snap.avgSoh >= 85 ? 'DIRECT_REUSE' : snap.avgSoh >= 72 ? 'REPURPOSING' : 'RECYCLING',
          suitability: snap.avgSoh >= 70 ? 'ELIGIBLE' : 'INELIGIBLE',
        },
      };

      onUpdateInvestigation({
        ...investigation,
        batteryPassport: updatedPassport,
      });
    } catch (err) {
      console.error('SLM Evaluation error:', err);
    } finally {
      setIsEvaluatingSlm(false);
    }
  };

  // Handle Adding Lifecycle Event
  const handleAddLifecycleEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDesc.trim()) return;

    const newEvent: PassportLifecycleEvent = {
      id: `EVT-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 10),
      event: newEventTitle.trim(),
      category: newEventCategory,
      description: newEventDesc.trim(),
      actor: newEventActor.trim(),
      verified: true,
    };

    const updatedPassport: DigitalBatteryPassport = {
      ...passport,
      lifecycleTimeline: [...passport.lifecycleTimeline, newEvent],
    };

    onUpdateInvestigation({
      ...investigation,
      batteryPassport: updatedPassport,
    });

    setNewEventTitle('');
    setNewEventDesc('');
    setIsAddingEvent(false);
  };

  // Handle Assessor Formal Sign-off
  const handleAssessorSignoff = () => {
    const updatedPassport: DigitalBatteryPassport = {
      ...passport,
      secondLifeAssessment: {
        ...assessment,
        humanAssessorName: assessorName,
        humanAssessorCredential: assessorCredential,
        approvalDate: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      },
    };

    onUpdateInvestigation({
      ...investigation,
      batteryPassport: updatedPassport,
    });
  };

  // Export Passport as PDF Certificate
  const handleExportPassportPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Dark Header Banner
    doc.setFillColor(0, 39, 61);
    doc.rect(0, 0, 210, 30, 'F');

    doc.setFont('courier', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('EU DIGITAL BATTERY PASSPORT CERTIFICATE', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(56, 189, 248);
    doc.text(`PASSPORT ID: ${passport.passportId} | REGULATION EU 2023/1542`, 14, 23);

    // Battery Specs
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(32, 37, 42);
    doc.text('1. BATTERY HARDWARE IDENTITY & PROVENANCE', 14, 40);

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(`Vehicle VIN: ${passport.vin}`, 14, 47);
    doc.text(`Manufacturer: ${passport.manufacturer}`, 14, 53);
    doc.text(`Manufacturing Facility: ${passport.manufacturingLocation}`, 14, 59);
    doc.text(`Manufacturing Date: ${passport.manufacturingDate}`, 14, 65);
    doc.text(`Electrochemistry: ${passport.chemistry}`, 14, 71);
    doc.text(`Original Nominal Capacity: ${passport.nominalCapacityKWh} kWh | Voltage: ${passport.originalVoltage} V`, 14, 77);
    doc.text(`Carbon Footprint: ${passport.carbonFootprintKgCo2PerKWh} kg CO2 eq/kWh`, 14, 83);

    // Second-Life Assessment
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text('2. SECOND-LIFE REUSABILITY & HEALTH SNAPSHOT', 14, 95);

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(`Current State of Health (SOH): ${passport.healthSnapshot.currentSoh}% [ESTIMATED]`, 14, 102);
    doc.text(`Residual Measured Capacity: ${passport.healthSnapshot.currentCapacityKWh} kWh [MEASURED]`, 14, 108);
    doc.text(`Internal Resistance: ${passport.healthSnapshot.internalResistanceMohm} mOhm (1.18x Baseline) [MEASURED]`, 14, 114);
    doc.text(`Cumulative Energy Throughput: ${passport.healthSnapshot.cumulativeEnergyThroughputMWh} MWh`, 14, 120);
    doc.text(`Second-Life Category: ${assessment.category} | Suitability: ${assessment.suitability}`, 14, 126);
    doc.text(`Safety Standard: ${assessment.safetyCertificationStandard}`, 14, 132);

    // Repurposing Applications
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text('3. REPURPOSING APPLICATIONS EVALUATION', 14, 144);

    let yOffset = 151;
    assessment.applications.forEach((app) => {
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.text(`• ${app.name} - Suitability: ${app.suitabilityScore}% [${app.status}]`, 14, yOffset);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(`  C-Rate: ${app.cRateRequirement} | Projected Lifespan: ${app.projectedLifespanYears} yrs | Residual Value: $${app.economicResidualValueUsd} USD`, 14, yOffset + 5);
      doc.text(`  Required Certifications: ${app.safetyCertifications.join(', ')}`, 14, yOffset + 10);
      yOffset += 16;
    });

    // Assessor Sign-off
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text('4. QUALIFIED ASSESSOR ATTESTATION & SIGN-OFF', 14, yOffset + 5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Assessor Name: ${assessment.humanAssessorName || 'Dr. Elena Rostova, PE'}`, 14, yOffset + 12);
    doc.text(`Credential: ${assessment.humanAssessorCredential || 'ASIL-D Certified Battery Safety Assessor'}`, 14, yOffset + 17);
    doc.text(`Attestation Date: ${assessment.approvalDate || 'Pending Final Verification'}`, 14, yOffset + 22);

    doc.save(`BATTERY-PASSPORT-${passport.passportId}.pdf`);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'DIRECT_REUSE':
        return 'bg-[#2E7D32] text-white';
      case 'REFURBISHMENT':
        return 'bg-[#005B91] text-white';
      case 'REPURPOSING':
        return 'bg-[#D97706] text-white';
      case 'RECYCLING':
        return 'bg-[#C62828] text-white';
      default:
        return 'bg-black text-white';
    }
  };

  const getSuitabilityBadge = (suit: string) => {
    switch (suit) {
      case 'ELIGIBLE':
        return (
          <span className="bg-[#2E7D32] text-white px-2 py-0.5 text-[9.5px] font-black font-mono border border-black inline-flex items-center gap-1">
            <Check className="w-3 h-3" /> ELIGIBLE FOR SECOND-LIFE
          </span>
        );
      case 'CONDITIONAL':
        return (
          <span className="bg-[#D97706] text-white px-2 py-0.5 text-[9.5px] font-black font-mono border border-black inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> CONDITIONAL (REQUIRES BENCH TESTS)
          </span>
        );
      case 'INELIGIBLE':
        return (
          <span className="bg-[#C62828] text-white px-2 py-0.5 text-[9.5px] font-black font-mono border border-black inline-flex items-center gap-1">
            <X className="w-3 h-3" /> INELIGIBLE (ROUTE TO RECYCLING)
          </span>
        );
      default:
        return <span className="bg-[#E2E8F0] text-[#20252A] px-2 py-0.5 text-[9.5px] font-black font-mono border border-black">{suit}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto p-3.5 bg-[#F4F5F6]">
      {/* 1. Header Banner & Identity Bar */}
      <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#003B5C] border-2 border-black flex items-center justify-center text-white">
              <QrCode className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-[13px] uppercase text-[#003B5C] font-mono">
                  SECOND-LIFE BATTERY REUSABILITY & DIGITAL BATTERY PASSPORT
                </h2>
                <span className="bg-[#00273D] text-white border border-black px-1.5 py-0.2 font-mono text-[9px] font-bold">
                  EU 2023/1542 COMPLIANT
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#5E666D]">
                Persistent Battery Identity · Provenance & Circularity · Repurposing Intelligence · Lifecycle Audit Chain
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono">
            <button
              onClick={() => setIsPublicModalOpen(true)}
              className="flex items-center gap-1.5 bg-[#003B5C] hover:bg-[#005B91] text-white border-2 border-black px-3 py-1.5 font-bold text-[10.5px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Public Passport View</span>
            </button>

            <button
              onClick={handleExportPassportPdf}
              className="flex items-center gap-1.5 bg-[#2E7D32] hover:bg-[#1E5622] text-white border-2 border-black px-3 py-1.5 font-bold text-[10.5px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF Certificate</span>
            </button>

            <button
              onClick={handleRunSlmEvaluation}
              disabled={isEvaluatingSlm}
              className={`flex items-center gap-1.5 border-2 border-black px-3 py-1.5 font-bold text-[10.5px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer ${
                isEvaluatingSlm 
                  ? 'bg-[#E2E8F0] text-[#7A8289] cursor-not-allowed'
                  : 'bg-[#005B91] hover:bg-[#003B5C] text-white'
              }`}
            >
              {isEvaluatingSlm ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Reusability...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Run SLM Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Passport Identity Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-[10.5px]">
          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9px] text-[#5E666D] font-bold">PASSPORT IDENTITY</div>
            <div className="text-[12px] font-black text-[#003B5C] truncate">{passport.passportId}</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9px] text-[#5E666D] font-bold">VEHICLE VIN</div>
            <div className="text-[12px] font-black text-[#20252A] truncate">{passport.vin}</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9px] text-[#5E666D] font-bold">ELECTROCHEMISTRY</div>
            <div className="text-[12px] font-black text-[#005B91] truncate">{passport.chemistry}</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9px] text-[#5E666D] font-bold">NOMINAL CAPACITY</div>
            <div className="text-[12px] font-black text-[#20252A]">{passport.nominalCapacityKWh} kWh</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9px] text-[#5E666D] font-bold">TOTAL CYCLES</div>
            <div className="text-[12px] font-black text-[#003B5C]">{passport.totalCycles} CYC</div>
          </div>

          <div className="p-2 border border-black bg-[#FAFBFD]">
            <div className="text-[9px] text-[#5E666D] font-bold">CARBON FOOTPRINT</div>
            <div className="text-[12px] font-black text-[#2E7D32]">{passport.carbonFootprintKgCo2PerKWh} kg/kWh</div>
          </div>
        </div>
      </div>

      {/* 2. Mandatory Safety & Validation Banner */}
      <div className="p-3 bg-[#FEF2F2] border-2 border-[#C62828] text-[#991B1B] font-mono text-[10.5px] leading-relaxed shadow-[2px_2px_0px_#000] flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-[#C62828] shrink-0 mt-0.5" />
        <div>
          <strong className="uppercase font-black text-[#991B1B]">MANDATORY REUSABILITY SAFETY STANDARD: </strong>
          DSimulate enforces multi-gate lifecycle verification. Never declare a battery safe for secondary reuse solely from SOH or an AI prediction. Qualified human approval, IEC 62619 / UL 1973 dielectric insulation checks (&ge; 500 &Omega;/V), and destructive risk mitigation are legally required prior to secondary grid commissioning.
        </div>
      </div>

      {/* 3. Main Grid: Left Reusability Assessment Matrix + Right Digital Passport QR & Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Column (7 cols): Second-Life Assessment & Repurposing Intelligence */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {/* A. Reusability Triage & Eligibility Matrix */}
          <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000]">
            <div className="border-b-2 border-black pb-2 mb-3 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span className="font-bold text-[11.5px] uppercase text-[#003B5C] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#005B91]" />
                PHYSICS-INFORMED SECOND-LIFE REUSABILITY TRIAGE
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 text-[9.5px] font-black uppercase border border-black ${getCategoryColor(assessment.category)}`}>
                  {assessment.category}
                </span>
                {getSuitabilityBadge(assessment.suitability)}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono mb-3 text-[10px]">
              <div className={`p-2 border border-black ${assessment.sohThresholdPassed ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#5E666D]">SOH &ge; 70%</span>
                  {assessment.sohThresholdPassed ? <Check className="w-3.5 h-3.5 text-[#166534]" /> : <X className="w-3.5 h-3.5 text-[#991B1B]" />}
                </div>
                <div className="font-black text-[13px] text-[#20252A]">{snap.avgSoh}%</div>
                <div className="text-[8.5px] text-[#5E666D]">[MEASURED/ESTIMATED]</div>
              </div>

              <div className={`p-2 border border-black ${assessment.irThresholdPassed ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#5E666D]">IR INCREASE &lt; 2.0x</span>
                  {assessment.irThresholdPassed ? <Check className="w-3.5 h-3.5 text-[#166534]" /> : <X className="w-3.5 h-3.5 text-[#991B1B]" />}
                </div>
                <div className="font-black text-[13px] text-[#20252A]">{passport.healthSnapshot.internalResistanceMohm} m&Omega;</div>
                <div className="text-[8.5px] text-[#5E666D]">[MEASURED BENCH]</div>
              </div>

              <div className={`p-2 border border-black ${assessment.thermalIntegrityPassed ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#5E666D]">THERMAL INTEGRITY</span>
                  {assessment.thermalIntegrityPassed ? <Check className="w-3.5 h-3.5 text-[#166534]" /> : <X className="w-3.5 h-3.5 text-[#991B1B]" />}
                </div>
                <div className="font-black text-[13px] text-[#20252A]">0 RUNAWAY</div>
                <div className="text-[8.5px] text-[#5E666D]">[SAFETY LOGS]</div>
              </div>

              <div className={`p-2 border border-black ${assessment.cellSpreadPassed ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#5E666D]">CELL SPREAD &lt; 50mV</span>
                  {assessment.cellSpreadPassed ? <Check className="w-3.5 h-3.5 text-[#166534]" /> : <X className="w-3.5 h-3.5 text-[#991B1B]" />}
                </div>
                <div className="font-black text-[13px] text-[#20252A]">{snap.voltageSpreadMv} mV</div>
                <div className="text-[8.5px] text-[#5E666D]">[MEASURED SENSORS]</div>
              </div>
            </div>

            {/* SLM Engineering Rationale */}
            <div className="p-3 bg-[#FAFBFD] border border-black font-mono text-[10.5px] leading-relaxed text-[#20252A] mb-3">
              <strong className="text-[#005B91] uppercase">PHYSICS SLM SECOND-LIFE EVALUATION: </strong>
              <div className="mt-1 whitespace-pre-wrap">{assessment.slmRationale}</div>
            </div>

            {/* Missing Evidence & Next Assessment Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="p-2 border border-black bg-[#FEF2F2]">
                <div className="font-bold text-[#991B1B] mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-[#991B1B]" />
                  <span>MISSING EVIDENCE TO RESOLVE UNCERTAINTY</span>
                </div>
                <ul className="space-y-1 text-[#B91C1C]">
                  {assessment.missingEvidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span>[?]</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-2 border border-black bg-[#F0FDF4]">
                <div className="font-bold text-[#166534] mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                  <span>RECOMMENDED NEXT QUALIFICATION TESTS</span>
                </div>
                <ul className="space-y-1 text-[#15803D]">
                  {assessment.nextAssessmentSteps.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span>[&rarr;]</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* B. Repurposing Applications Intelligence */}
          <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000]">
            <div className="border-b-2 border-black pb-2 mb-3 flex items-center justify-between font-mono">
              <span className="font-bold text-[11.5px] uppercase text-[#003B5C] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#005B91]" />
                REPURPOSING APPLICATION SUITABILITY & ECONOMIC RESIDUAL VALUE
              </span>
              <span className="text-[10px] text-[#5E666D]">
                {assessment.applications.length} TARGET PATHWAYS
              </span>
            </div>

            <div className="space-y-2.5">
              {assessment.applications.map((app: RepurposingApplication) => (
                <div 
                  key={app.id} 
                  className="p-3 border-2 border-black bg-[#F8FAFC] font-mono shadow-[2px_2px_0px_#000]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black pb-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[12px] text-[#003B5C] uppercase">{app.name}</span>
                      <span className={`px-1.5 py-0.2 text-[9px] font-black border border-black ${
                        app.status === 'OPTIMAL' ? 'bg-[#2E7D32] text-white' : 'bg-[#D97706] text-white'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] text-[#5E666D] font-bold">COMPATIBILITY:</span>
                      <div className="w-20 bg-[#E2E8F0] border border-black h-3.5 relative overflow-hidden">
                        <div 
                          className="h-full bg-[#005B91]" 
                          style={{ width: `${app.suitabilityScore}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[8.5px] font-black text-white">
                          {app.suitabilityScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mb-2">
                    <div className="p-1.5 border border-black bg-white">
                      <div className="text-[#5E666D] text-[8.5px]">C-RATE LIMIT</div>
                      <div className="font-bold text-[#20252A]">{app.cRateRequirement}</div>
                    </div>
                    <div className="p-1.5 border border-black bg-white">
                      <div className="text-[#5E666D] text-[8.5px]">RESIDUAL VALUE</div>
                      <div className="font-black text-[#2E7D32]">${app.economicResidualValueUsd.toLocaleString()} USD</div>
                    </div>
                    <div className="p-1.5 border border-black bg-white">
                      <div className="text-[#5E666D] text-[8.5px]">SECOND-LIFE SPAN</div>
                      <div className="font-bold text-[#003B5C]">{app.projectedLifespanYears} Years</div>
                    </div>
                    <div className="p-1.5 border border-black bg-white">
                      <div className="text-[#5E666D] text-[8.5px]">CERTIFICATIONS</div>
                      <div className="font-bold text-[#20252A] truncate">{app.safetyCertifications.join(', ')}</div>
                    </div>
                  </div>

                  <div className="text-[9.5px] text-[#5E666D]">
                    <strong className="text-[#003B5C]">PREREQUISITES: </strong>
                    {app.prerequisites.join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Digital Battery Passport Identity, QR Code & Traceability */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          {/* A. QR Code & Public Passport Card */}
          <div className="bg-[#00273D] text-white border-2 border-black p-3.5 shadow-[4px_4px_0px_#000]">
            <div className="border-b-2 border-black/80 pb-2 mb-3 flex items-center justify-between font-mono">
              <span className="font-extrabold text-[12px] uppercase text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#38BDF8]" />
                DIGITAL BATTERY PASSPORT QR CODE
              </span>
              <span className="bg-[#003B5C] border border-[#38BDF8] text-[#38BDF8] px-1.5 py-0.2 text-[8.5px] font-bold">
                CIRCULAR IDENTITY
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 bg-[#001726] border-2 border-black mb-3">
              {/* QR Image */}
              <div className="bg-white p-2 border-2 border-black shrink-0">
                {qrCodeData ? (
                  <img 
                    src={qrCodeData} 
                    alt="Digital Battery Passport QR Code" 
                    className="w-28 h-28 object-contain"
                  />
                ) : (
                  <div className="w-28 h-28 flex items-center justify-center font-mono text-[9px] text-black">
                    Generating...
                  </div>
                )}
              </div>

              {/* QR Details */}
              <div className="font-mono text-[10px] space-y-1.5 flex-1 text-white/80">
                <div>
                  <span className="text-white/50 block text-[9px]">PERSISTENT PASSPORT URL:</span>
                  <a 
                    href={passport.publicAccessUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[#38BDF8] font-bold underline break-all text-[9.5px]"
                  >
                    {passport.publicAccessUrl}
                  </a>
                </div>
                <div>
                  <span className="text-white/50 block text-[9px]">ACCESS LEVEL:</span>
                  <span className="text-[#2E7D32] bg-[#002B45] px-1.5 py-0.5 border border-[#38BDF8]/40 font-bold inline-block">
                    PUBLIC READ-ONLY (ZERO-TRUST)
                  </span>
                </div>
                <div className="text-[9px] text-white/60">
                  Sensitive telemetry, customer PII, and technician credentials remain encrypted behind authenticated engineering credentials.
                </div>
              </div>
            </div>

            <div className="flex gap-2 font-mono">
              <button
                onClick={() => setIsPublicModalOpen(true)}
                className="flex-1 bg-[#005B91] hover:bg-[#003B5C] text-white border-2 border-black py-1.5 px-3 font-bold text-[10px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Inspect Public Portal
              </button>
              <button
                onClick={handleExportPassportPdf}
                className="bg-[#2E7D32] hover:bg-[#1E5622] text-white border-2 border-black py-1.5 px-3 font-bold text-[10px] uppercase shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Download Label
              </button>
            </div>
          </div>

          {/* B. Critical Raw Materials & Supply Chain Circularity */}
          <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] font-mono">
            <div className="border-b-2 border-black pb-2 mb-2.5 flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase text-[#003B5C]">
                CRITICAL RAW MATERIALS & RECYCLED CONTENT (EU ANNEX XII)
              </span>
            </div>

            <div className="space-y-2 text-[10px]">
              <div>
                <div className="flex justify-between text-[#5E666D] mb-0.5">
                  <span>NICKEL (Ni) CONTENT</span>
                  <span className="font-bold text-[#20252A]">{passport.criticalRawMaterials.nickelPct}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] border border-black h-2">
                  <div className="h-full bg-[#005B91]" style={{ width: `${passport.criticalRawMaterials.nickelPct * 2}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#5E666D] mb-0.5">
                  <span>LITHIUM (Li) CONTENT</span>
                  <span className="font-bold text-[#20252A]">{passport.criticalRawMaterials.lithiumPct}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] border border-black h-2">
                  <div className="h-full bg-[#38BDF8]" style={{ width: `${passport.criticalRawMaterials.lithiumPct * 5}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#5E666D] mb-0.5">
                  <span>COBALT (Co) CONTENT (ETHICALLY SOURCED)</span>
                  <span className="font-bold text-[#20252A]">{passport.criticalRawMaterials.cobaltPct}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] border border-black h-2">
                  <div className="h-full bg-[#7C3AED]" style={{ width: `${passport.criticalRawMaterials.cobaltPct * 8}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#5E666D] mb-0.5">
                  <span>CERTIFIED RECYCLED ACTIVE MATERIAL</span>
                  <span className="font-black text-[#2E7D32]">{passport.criticalRawMaterials.recycledContentPct}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] border border-black h-2">
                  <div className="h-full bg-[#2E7D32]" style={{ width: `${passport.criticalRawMaterials.recycledContentPct * 2.5}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* C. Full Lifecycle Traceability Timeline */}
          <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] font-mono">
            <div className="border-b-2 border-black pb-2 mb-2.5 flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase text-[#003B5C] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#005B91]" />
                LIFECYCLE TRACEABILITY AUDIT CHAIN
              </span>
              <button
                onClick={() => setIsAddingEvent(!isAddingEvent)}
                className="bg-[#005B91] text-white border border-black px-2 py-0.5 text-[9px] font-bold uppercase cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Append Event</span>
              </button>
            </div>

            {/* Add Event Collapsible Form */}
            {isAddingEvent && (
              <form onSubmit={handleAddLifecycleEvent} className="p-2.5 border-2 border-black bg-[#FAFBFD] mb-3 space-y-2">
                <div className="text-[10px] font-black uppercase text-[#003B5C]">RECORD AUDITABLE LIFECYCLE EVENT</div>
                <input
                  type="text"
                  placeholder="Event title (e.g., 'Completed Module 2 Balance Calibration')"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full p-1 border border-black text-[10px] bg-white"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value as any)}
                    className="p-1 border border-black text-[10px] bg-white"
                  >
                    <option value="INTERVENTION">INTERVENTION</option>
                    <option value="DIAGNOSIS">DIAGNOSIS</option>
                    <option value="SECOND_LIFE">SECOND_LIFE</option>
                    <option value="RECYCLE">RECYCLE</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Actor / Technician ID"
                    value={newEventActor}
                    onChange={(e) => setNewEventActor(e.target.value)}
                    className="p-1 border border-black text-[10px] bg-white"
                    required
                  />
                </div>
                <textarea
                  placeholder="Detailed technical notes and verification results..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  rows={2}
                  className="w-full p-1 border border-black text-[10px] bg-white"
                  required
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingEvent(false)}
                    className="px-2 py-1 text-[9px] border border-black bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-[9px] bg-[#2E7D32] text-white border border-black font-bold cursor-pointer"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Stream */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {passport.lifecycleTimeline.map((item, idx) => (
                <div key={item.id || idx} className="p-2 border border-black bg-[#FAFBFD] text-[10px]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[#003B5C] uppercase">{item.event}</span>
                    <span className="text-[#5E666D] text-[9px]">{item.date}</span>
                  </div>
                  <div className="text-[#20252A] text-[9.5px] leading-relaxed mb-1">{item.description}</div>
                  <div className="flex items-center justify-between text-[8.5px] text-[#5E666D] border-t border-black/10 pt-0.5">
                    <span>ACTOR: {item.actor}</span>
                    <span className="text-[#2E7D32] font-bold">[VERIFIED RECORD]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. Qualified Human Assessor Attestation */}
          <div className="bg-white border-2 border-black p-3.5 shadow-[3px_3px_0px_#000] font-mono">
            <div className="border-b-2 border-black pb-2 mb-2.5">
              <span className="font-bold text-[11px] uppercase text-[#003B5C] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
                QUALIFIED ASSESSOR ATTESTATION & FORMAL SIGN-OFF
              </span>
            </div>

            <div className="space-y-2 text-[10px]">
              <div>
                <label className="text-[9px] text-[#5E666D] font-bold block mb-0.5">LEAD SYSTEM ASSESSOR</label>
                <input
                  type="text"
                  value={assessorName}
                  onChange={(e) => setAssessorName(e.target.value)}
                  className="w-full p-1.5 border border-black text-[10px] bg-[#FAFBFD]"
                />
              </div>

              <div>
                <label className="text-[9px] text-[#5E666D] font-bold block mb-0.5">SAFETY CREDENTIAL & CERTIFICATION</label>
                <input
                  type="text"
                  value={assessorCredential}
                  onChange={(e) => setAssessorCredential(e.target.value)}
                  className="w-full p-1.5 border border-black text-[10px] bg-[#FAFBFD]"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <div className="text-[9px] text-[#5E666D]">
                  {assessment.approvalDate ? (
                    <span className="text-[#2E7D32] font-bold">ATTESTED: {assessment.approvalDate}</span>
                  ) : (
                    <span>AWAITING FORMAL HUMAN ATTESTATION</span>
                  )}
                </div>
                <button
                  onClick={handleAssessorSignoff}
                  className="bg-[#2E7D32] hover:bg-[#1E5622] text-white border border-black px-3 py-1 font-bold text-[10px] uppercase shadow-[1px_1px_0px_#000] cursor-pointer"
                >
                  Sign Attestation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PUBLIC PASSPORT MODAL (Zero-Trust vs Authorized View) */}
      {isPublicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black w-full max-w-2xl max-h-[90vh] flex flex-col font-mono shadow-[8px_8px_0px_#000] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#00273D] text-white border-b-4 border-black p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#38BDF8]" />
                <span className="font-extrabold text-[12px] uppercase tracking-wider">
                  BATTERY PASSPORT PORTAL · {passport.passportId}
                </span>
              </div>
              <button
                onClick={() => setIsPublicModalOpen(false)}
                className="w-6 h-6 bg-[#C62828] text-white border border-black flex items-center justify-center font-bold text-[12px] cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="bg-[#E2E8F0] border-b-2 border-black p-2 flex items-center justify-between text-[10.5px]">
              <span className="font-bold text-[#20252A]">PORTAL ACCESS LEVEL:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPublicViewMode('public')}
                  className={`px-3 py-1 font-bold uppercase border border-black cursor-pointer ${
                    publicViewMode === 'public' ? 'bg-[#005B91] text-white' : 'bg-white text-black'
                  }`}
                >
                  Public View (Recyclers/Buyers)
                </button>
                <button
                  onClick={() => setPublicViewMode('authorized')}
                  className={`px-3 py-1 font-bold uppercase border border-black cursor-pointer ${
                    publicViewMode === 'authorized' ? 'bg-[#00273D] text-[#38BDF8]' : 'bg-white text-black'
                  }`}
                >
                  Authorized Engineering View
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-[#F4F5F6]">
              {publicViewMode === 'public' ? (
                /* Public Safe View */
                <div className="space-y-3">
                  <div className="p-3 bg-[#E0F2FE] border-2 border-[#0284C7] text-[#0369A1] text-[10px]">
                    <strong className="uppercase">PUBLIC TRANSPARENCY VIEW: </strong>
                    Displays certified circularity data, state of health, second-life eligibility, and recycled content under EU Regulation 2023/1542.
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2.5 bg-white border border-black">
                      <div className="text-[9px] text-[#5E666D]">MANUFACTURER</div>
                      <div className="font-bold text-[#003B5C]">{passport.manufacturer}</div>
                    </div>
                    <div className="p-2.5 bg-white border border-black">
                      <div className="text-[9px] text-[#5E666D]">CHEMISTRY</div>
                      <div className="font-bold text-[#005B91]">{passport.chemistry}</div>
                    </div>
                    <div className="p-2.5 bg-white border border-black">
                      <div className="text-[9px] text-[#5E666D]">CURRENT SOH CATEGORY</div>
                      <div className="font-black text-[#2E7D32]">{passport.healthSnapshot.currentSoh}% SOH &middot; {assessment.category}</div>
                    </div>
                    <div className="p-2.5 bg-white border border-black">
                      <div className="text-[9px] text-[#5E666D]">CARBON FOOTPRINT</div>
                      <div className="font-black text-[#20252A]">{passport.carbonFootprintKgCo2PerKWh} kg CO2 eq/kWh</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-black">
                    <div className="font-bold text-[10.5px] uppercase text-[#003B5C] mb-1">
                      SECOND-LIFE ELIGIBILITY ASSESSMENT
                    </div>
                    <div className="text-[10px] text-[#20252A] leading-relaxed">
                      {assessment.slmRationale}
                    </div>
                  </div>
                </div>
              ) : (
                /* Authorized View */
                <div className="space-y-3">
                  <div className="p-3 bg-[#FEF2F2] border-2 border-[#C62828] text-[#991B1B] text-[10px]">
                    <strong className="uppercase">CONFIDENTIAL ENGINEERING VIEW: </strong>
                    Contains proprietary internal resistance logs, cell telemetry, technician identifiers, and ASIL-D safety records.
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[10.5px]">
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[8.5px] text-[#5E666D]">VEHICLE VIN</div>
                      <div className="font-black">{passport.vin}</div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[8.5px] text-[#5E666D]">INTERNAL RESISTANCE</div>
                      <div className="font-black text-[#005B91]">{passport.healthSnapshot.internalResistanceMohm} m&Omega;</div>
                    </div>
                    <div className="p-2 bg-white border border-black">
                      <div className="text-[8.5px] text-[#5E666D]">VOLTAGE IMBALANCE</div>
                      <div className="font-black text-[#C62828]">{snap.voltageSpreadMv} mV</div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-black">
                    <div className="font-bold text-[10px] text-[#003B5C] mb-1 uppercase">AUTHORIZED SERVICE LOGS</div>
                    <div className="space-y-1 text-[9.5px]">
                      {passport.authorizedServiceLog.map((log, i) => (
                        <div key={i} className="p-1 border-b border-black/10 last:border-0">
                          <span className="font-bold text-[#005B91]">{log.date}</span> &middot; {log.serviceType} by <strong>{log.engineer}</strong>: {log.notes}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#E2E8F0] border-t-2 border-black p-3 flex justify-between items-center">
              <span className="text-[10px] text-[#5E666D]">
                URL: <code className="text-[#003B5C] font-bold">{passport.publicAccessUrl}</code>
              </span>
              <button
                onClick={() => setIsPublicModalOpen(false)}
                className="bg-black text-white px-4 py-1.5 font-bold uppercase text-[10.5px] cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
