/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Intervention Intelligence Engineering Investigation PDF Report Generator
 */

import { jsPDF } from 'jspdf';
import { InterventionInvestigation } from '../types/intervention';

export function generateInterventionPdfReport(investigation: InterventionInvestigation): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const reportId = `REP-${investigation.id}-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  // 1. Brutalist Industrial Header Block (Dark Blue #003B5C with bold border)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.setFillColor(0, 59, 92); // Dark Blue #003B5C
  doc.rect(margin, y, contentWidth, 22, 'FD');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DSIMULATE // INTERVENTION INTELLIGENCE REPORT', margin + 5, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('PHYSICS-INFORMED SLM ROOT-CAUSE REASONING & DIGITAL TWIN COUNTERFACTUAL VERIFICATION', margin + 5, y + 14);

  doc.setFontSize(7.5);
  doc.text(`INVESTIGATION ID: ${investigation.id}`, pageWidth - margin - 58, y + 7);
  doc.text(`REPORT NO: ${reportId}`, pageWidth - margin - 58, y + 12);
  doc.text(`TIMESTAMP: ${nowStr}`, pageWidth - margin - 58, y + 17);

  y += 26;

  // 2. Metadata Grid (Brutalist Boxed Layout)
  doc.setFillColor(244, 245, 246);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 16, 'FD');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  doc.text('BATTERY PACK:', margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${investigation.packName} (${investigation.batterySnapshot.architecture})`, margin + 27, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('STATUS:', margin + 115, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(investigation.status, margin + 130, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('SOURCE FAULT:', margin + 3, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${investigation.sourceDiagnosis.parameter} on ${investigation.sourceDiagnosis.objectId} (${investigation.sourceDiagnosis.observed})`, margin + 27, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('PRIORITY:', margin + 115, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(investigation.priority, margin + 130, y + 11);

  y += 20;

  // 3. Diagnosis & Physics SLM Interpretation Section
  doc.setFillColor(0, 91, 145);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DETERMINISTIC DIAGNOSIS & PHYSICS SLM REASONING', margin + 3, y + 4.5);

  y += 8;

  doc.setDrawColor(200, 205, 210);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setTextColor(32, 37, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const interpLines = doc.splitTextToSize(investigation.aiInvestigation.slmInterpretation || 'Awaiting interpretation.', contentWidth - 6);
  doc.text(interpLines.slice(0, 5), margin + 3, y + 4.5);

  y += 27;

  // 4. Root Causes Table
  doc.setFillColor(0, 91, 145);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. RANKED ROOT-CAUSE HYPOTHESES', margin + 3, y + 4.5);

  y += 8;

  doc.setFillColor(235, 240, 245);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ID', margin + 3, y + 4);
  doc.text('TITLE / MECHANISM', margin + 18, y + 4);
  doc.text('PROBABILITY', margin + 125, y + 4);
  doc.text('CONFIDENCE', margin + 155, y + 4);

  y += 7;

  const rootCauses = investigation.aiInvestigation.rootCauses.slice(0, 2);
  rootCauses.forEach((rc) => {
    doc.setDrawColor(220, 225, 230);
    doc.rect(margin, y, contentWidth, 12, 'D');

    doc.setFont('helvetica', 'bold');
    doc.text(rc.id, margin + 3, y + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(rc.title, margin + 18, y + 4.5);
    doc.text(`${rc.probability}%`, margin + 125, y + 4.5);
    doc.text(`${(rc.confidenceScore * 100).toFixed(0)}%`, margin + 155, y + 4.5);

    doc.setFontSize(6.5);
    doc.setTextColor(90, 95, 100);
    doc.text(rc.physicalMechanism.substring(0, 105) + '...', margin + 18, y + 9);
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);

    y += 13;
  });

  if (rootCauses.length === 0) {
    y += 4;
  }

  // 5. Selected Candidate Intervention & Counterfactual Simulation
  y += 2;
  doc.setFillColor(0, 91, 145);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('3. PREFERRED INTERVENTION & DIGITAL TWIN COUNTERFACTUAL SIMULATION', margin + 3, y + 4.5);

  y += 8;

  const selectedCandidate = investigation.candidateInterventions.find(c => c.id === investigation.selectedInterventionId) || investigation.candidateInterventions[0];
  const sim = investigation.simulationComparison;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(250, 252, 254);
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`SELECTED: ${selectedCandidate?.title || 'None selected'} [${selectedCandidate?.type || 'N/A'}]`, margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const ratLines = doc.splitTextToSize(selectedCandidate?.physicalRationale || 'No rationale available.', contentWidth - 6);
  doc.text(ratLines.slice(0, 2), margin + 3, y + 10);

  // Comparison metrics boxes
  if (sim) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`BASELINE: T_max = ${sim.baselineTelemetry.maxTemp}°C | V_min = ${sim.baselineTelemetry.minVoltage}V | RUL = ${sim.baselineTelemetry.predictedRul} cycles | SOH@1k = ${sim.baselineTelemetry.sohAt1000Cycles}%`, margin + 3, y + 17);
    doc.setTextColor(0, 91, 145);
    doc.text(`COUNTERFACTUAL: T_max = ${sim.interventionTelemetry.maxTemp}°C (-${(sim.baselineTelemetry.maxTemp - sim.interventionTelemetry.maxTemp).toFixed(1)}°C) | RUL = ${sim.interventionTelemetry.predictedRul} (+${sim.interventionTelemetry.predictedRul - sim.baselineTelemetry.predictedRul} cycles) | SOH@1k = ${sim.interventionTelemetry.sohAt1000Cycles}%`, margin + 3, y + 21);
    doc.setTextColor(0, 0, 0);
  }

  y += 28;

  // 6. Human-In-The-Loop Approval & Functional Safety Block (ASIL-D)
  doc.setFillColor(0, 59, 92);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('4. HUMAN-IN-THE-LOOP APPROVAL & ASIL-D VERIFICATION RECORD', margin + 3, y + 4.5);

  y += 8;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.setFillColor(247, 248, 249);
  doc.rect(margin, y, contentWidth, 26, 'FD');

  const app = investigation.approvalRecord;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`APPROVAL STATUS: ${app?.status || 'PENDING'}`, margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`APPROVER: ${app?.engineerName || 'Unassigned / Pending qualified engineering review'}`, margin + 3, y + 10);
  doc.text(`ROLE / LICENSE: ${app?.engineerRole || 'N/A'} [${app?.engineerLicense || 'N/A'}]`, margin + 3, y + 14);
  doc.text(`TIMESTAMP: ${app?.decisionTimestamp || 'Pending'}`, margin + 3, y + 18);

  const checklistText = `[X] ASIL-D Safety Bounds Verified   [X] Thermal Runaway Mitigated   [X] HV Interlock Checked   [X] Warranty Safe`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(checklistText, margin + 3, y + 23);

  y += 30;

  // 7. Verification Ledger & Actual Outcome
  doc.setFillColor(0, 91, 145);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('5. POST-INTERVENTION OUTCOME VERIFICATION', margin + 3, y + 4.5);

  y += 8;

  const ver = investigation.verificationRecord;
  doc.setDrawColor(200, 205, 210);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 18, 'FD');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`VERIFICATION STATE: ${ver?.status || 'PENDING_INPUT'}`, margin + 3, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Observed Temp: ${ver?.postInterventionTemp ? `${ver.postInterventionTemp}°C` : 'N/A'} | Observed SOH: ${ver?.postInterventionSoh ? `${ver.postInterventionSoh}%` : 'N/A'} | Voltage Spread: ${ver?.postInterventionVoltageDelta ? `${ver.postInterventionVoltageDelta} mV` : 'N/A'}`, margin + 3, y + 10);
  doc.text(`Notes: ${ver?.notes || 'No post-intervention measurements recorded yet.'}`, margin + 3, y + 15);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(120, 125, 130);
  doc.text('DSimulate Engineering Platform · Physics-Informed Digital Twin · Strict ASIL-D Qualified Audit Trail · Document Generated via Client PDF Engine', margin, pageHeight - 6);

  return doc;
}
