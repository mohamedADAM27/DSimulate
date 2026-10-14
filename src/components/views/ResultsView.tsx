/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Simulation Results & Persistent Battery Ledger Workspace
 */

import React, { useState } from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Database, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  History,
  Activity,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { generateBatteryFlashReport } from '../../services/pdfReportService';

export const ResultsView: React.FC = () => {
  const { 
    simulationHistory, 
    simulationParams, 
    batteryPack, 
    setWorkspace, 
    diagnosticEvents,
    activeVehicleInfo,
    activeDataSource,
    batteryLedger
  } = useBatteryStore();

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'LEDGER'>('TELEMETRY');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadPDF = () => {
    try {
      const doc = generateBatteryFlashReport(
        batteryPack,
        simulationParams,
        simulationHistory,
        diagnosticEvents,
        {
          manufacturer: activeVehicleInfo?.manufacturer || 'Tata / DSimulate',
          model: activeVehicleInfo?.model || batteryPack.name,
          category: activeVehicleInfo?.category || 'Electric Car',
          dataSource: activeDataSource,
        }
      );
      doc.save(`DSimulate_FlashReport_${batteryPack.id}.pdf`);
      setDownloadSuccess('PDF Flash Report Generated & Downloaded');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Time_s', 'Current_A', 'PackVoltage_V', 'SOC_pct', 'PackTemp_C', 'MaxCellTemp_C', 'SOH_pct'];
    const rows = simulationHistory.map(p => 
      [p.time, p.current, p.packVoltage, p.packSoc, p.packTemp, p.maxCellTemp, p.soh].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DSimulate_Telemetry_Run_${simulationParams.driveCycle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('Telemetry CSV Exported');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleExportJSON = () => {
    const exportData = {
      applet: 'DSimulate',
      packId: batteryPack.id,
      architecture: batteryPack.architecture,
      simulationParams,
      summary: {
        avgSoc: batteryPack.avgSoc,
        avgSoh: batteryPack.avgSoh,
        maxTemp: batteryPack.maxCellTemp,
        predictedRul: batteryPack.predictedRul,
      },
      timeDomainTelemetry: simulationHistory,
      diagnostics: diagnosticEvents,
      ledger: batteryLedger,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `DSimulate_Run_Export_${batteryPack.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess('Run JSON Archive Exported');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Action Ribbon */}
      <div className="h-[36px] bg-white border border-[#D5D9DD] rounded-[2px] px-3 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-[#20252A]">
            <FileText className="w-3.5 h-3.5 text-[#005B91]" />
            <span>Simulation Results & Battery Ledger</span>
          </div>

          <div className="flex items-center gap-0.5 bg-[#F0F2F5] p-0.5 rounded-[2px] border border-[#D5D9DD]">
            <button
              onClick={() => setActiveTab('TELEMETRY')}
              className={`px-2.5 py-1 text-[10.5px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'TELEMETRY' ? 'bg-white text-[#005B91] shadow-xs font-semibold' : 'text-[#5E666D]'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Current Run Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-2.5 py-1 text-[10.5px] font-medium rounded-[2px] transition-colors flex items-center gap-1.5 ${
                activeTab === 'LEDGER' ? 'bg-white text-[#005B91] shadow-xs font-semibold' : 'text-[#5E666D]'
              }`}
            >
              <History className="w-3 h-3" />
              <span>Persistent Battery Ledger ({batteryLedger.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {downloadSuccess && (
            <span className="text-[10.5px] text-[#2E7D32] flex items-center gap-1 font-medium font-sans animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {downloadSuccess}
            </span>
          )}

          <button
            onClick={handleDownloadPDF}
            className="px-2.5 py-1 bg-[#005B91] text-white hover:bg-[#004B78] text-[10.5px] rounded-[2px] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            title="Generate multi-section engineering flash report in PDF format"
          >
            <Download className="w-3 h-3" />
            <span>Flash Report (PDF)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1 bg-white border border-[#D5D9DD] text-[#20252A] hover:bg-[#F0F6FA] text-[10.5px] rounded-[2px] font-medium flex items-center gap-1 transition-colors"
          >
            <FileSpreadsheet className="w-3 h-3 text-[#5E666D]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1 bg-white border border-[#D5D9DD] text-[#20252A] hover:bg-[#F0F6FA] text-[10.5px] rounded-[2px] font-medium flex items-center gap-1 transition-colors"
          >
            <FileCode className="w-3 h-3 text-[#5E666D]" />
            <span>Full JSON</span>
          </button>
        </div>
      </div>

      {activeTab === 'TELEMETRY' ? (
        /* Main Split: Run Metadata (Left) + Detailed Telemetry Grid (Right) */
        <div className="flex-1 flex gap-2 min-h-0">
          {/* Left: Run Configuration Summary */}
          <div className="w-80 xl:w-96 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col shrink-0 text-[11px] overflow-hidden">
            <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between font-semibold text-[#20252A]">
              <span>Active Run Metadata</span>
              <span className="text-[10px] text-[#2E7D32] font-semibold bg-[#E8F5E9] px-1.5 py-0.5 rounded-[2px]">CONVERGED</span>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-3 font-mono-numbers">
              <div className="border border-[#D5D9DD] p-2 bg-[#F9FAFB] rounded-[2px]">
                <div className="text-[10px] text-[#7A8289] font-sans uppercase">Active Solver Setup</div>
                <div className="font-bold text-[#005B91] text-[12px] mt-0.5">
                  {simulationParams.driveCycle} Standard Dynamic Cycle
                </div>
                <div className="text-[10px] text-[#5E666D] font-sans mt-0.5">
                  Duration: {simulationParams.simulationDuration}s · Steps: 60 · dt: 30.0s
                </div>
              </div>

              <div className="border border-[#D5D9DD] p-2 rounded-[2px] space-y-1.5 text-[11px]">
                <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                  <span className="text-[#5E666D] font-sans">Vehicle Model:</span>
                  <span className="font-semibold text-[#20252A]">{activeVehicleInfo?.manufacturer || 'Custom'} {activeVehicleInfo?.model || batteryPack.name}</span>
                </div>
                <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                  <span className="text-[#5E666D] font-sans">Data Source:</span>
                  <span className="font-semibold text-[#005B91]">{activeDataSource}</span>
                </div>
                <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                  <span className="text-[#5E666D] font-sans">Initial SOC:</span>
                  <span className="font-semibold text-[#20252A]">{simulationParams.initialSoc}%</span>
                </div>
                <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                  <span className="text-[#5E666D] font-sans">Final Pack SOC:</span>
                  <span className="font-semibold text-[#005B91]">
                    {simulationHistory[simulationHistory.length - 1]?.packSoc}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                  <span className="text-[#5E666D] font-sans">Maximum Cell Temp:</span>
                  <span className="font-semibold text-[#C62828]">{batteryPack.maxCellTemp} °C</span>
                </div>
                <div className="flex justify-between border-b border-[#E3E6E8] pb-1">
                  <span className="text-[#5E666D] font-sans">Pack SOH:</span>
                  <span className="font-semibold text-[#2E7D32]">{batteryPack.avgSoh}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E666D] font-sans">Predicted RUL:</span>
                  <span className="font-bold text-[#005B91]">{batteryPack.predictedRul} cycles</span>
                </div>
              </div>

              <button
                onClick={() => setWorkspace('digital-twin')}
                className="w-full py-2 bg-[#F0F6FA] text-[#005B91] border border-[#005B91] hover:bg-[#E0EEF7] font-semibold text-[11px] rounded-[2px] flex items-center justify-center gap-1.5 transition-colors font-sans"
              >
                <span>Back to 3D Digital Twin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: Data Logger Table */}
          <div className="flex-1 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col overflow-hidden">
            <div className="h-[28px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-2.5 flex items-center justify-between font-semibold text-[#20252A] text-[11px] shrink-0">
              <span>Time-Domain Discrete Telemetry Points</span>
              <span className="text-[10px] text-[#7A8289]">61 Simulation Records</span>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse text-[11px] font-mono-numbers">
                <thead className="bg-[#F4F6F8] border-b border-[#D5D9DD] sticky top-0 text-[10px] text-[#5E666D] font-sans font-semibold">
                  <tr>
                    <th className="py-1.5 px-2">Step</th>
                    <th className="py-1.5 px-2">Time (s)</th>
                    <th className="py-1.5 px-2">Load (A)</th>
                    <th className="py-1.5 px-2">Terminal V</th>
                    <th className="py-1.5 px-2">SOC (%)</th>
                    <th className="py-1.5 px-2">Pack T (°C)</th>
                    <th className="py-1.5 px-2">Max Cell T</th>
                    <th className="py-1.5 px-2">Heat Gen (W)</th>
                    <th className="py-1.5 px-2">SOH (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E6E8]">
                  {simulationHistory.map((pt, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-1 px-2 text-[#7A8289]">{idx}</td>
                      <td className="py-1 px-2 font-semibold text-[#20252A]">{pt.time}s</td>
                      <td className="py-1 px-2 text-[#005B91]">{pt.current}A</td>
                      <td className="py-1 px-2">{pt.packVoltage}V</td>
                      <td className="py-1 px-2">{pt.packSoc}%</td>
                      <td className="py-1 px-2">{pt.packTemp}°C</td>
                      <td className={`py-1 px-2 ${pt.maxCellTemp > 39 ? 'text-[#C62828] font-semibold' : ''}`}>
                        {pt.maxCellTemp}°C
                      </td>
                      <td className="py-1 px-2 text-[#5E666D]">{pt.heatGenWatts}W</td>
                      <td className="py-1 px-2 text-[#2E7D32]">{pt.soh}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Persistent Battery Ledger View */
        <div className="flex-1 bg-white border border-[#D5D9DD] rounded-[2px] flex flex-col overflow-hidden">
          <div className="h-[32px] bg-[#F7F8F9] border-b border-[#D5D9DD] px-3 flex items-center justify-between font-semibold text-[#20252A] text-[11px] shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#005B91]" />
              <span>Immutable Battery Ledger — Simulation Runs, Diagnostic Findings & Artifact Provenance</span>
            </div>
            <span className="text-[10px] text-[#7A8289] font-normal">Audit Trail: ISO 26262 ASIL-D Compliant</span>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-[11px] font-mono-numbers">
              <thead className="bg-[#F4F6F8] border-b border-[#D5D9DD] sticky top-0 text-[10px] text-[#5E666D] font-sans font-semibold">
                <tr>
                  <th className="py-2 px-3">Run ID</th>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Pack ID / Vehicle</th>
                  <th className="py-2 px-3">Drive Cycle</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">SOC Δ</th>
                  <th className="py-2 px-3">Max Temp</th>
                  <th className="py-2 px-3">SOH</th>
                  <th className="py-2 px-3">Active Alerts</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Flash Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6E8]">
                {batteryLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-2 px-3 font-semibold text-[#005B91]">{entry.runId}</td>
                    <td className="py-2 px-3 text-[#5E666D]">{entry.timestamp}</td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-[#20252A] font-sans">{entry.vehicleName}</div>
                      <div className="text-[9.5px] text-[#7A8289]">{entry.packId}</div>
                    </td>
                    <td className="py-2 px-3 font-sans text-[#20252A]">{entry.driveCycle}</td>
                    <td className="py-2 px-3">{entry.durationSeconds}s</td>
                    <td className="py-2 px-3">{entry.initialSoc}% → {entry.finalSoc}%</td>
                    <td className={`py-2 px-3 ${entry.maxTemp > 45 ? 'text-[#C62828] font-semibold' : ''}`}>
                      {entry.maxTemp} °C
                    </td>
                    <td className="py-2 px-3 text-[#2E7D32]">{entry.avgSoh}%</td>
                    <td className="py-2 px-3">
                      {entry.alertCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#FFFBEB] text-[#D97706] text-[10px] font-semibold font-sans">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {entry.alertCount} Faults
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#2E7D32] text-[10px] font-sans">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          0 Faults
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-semibold font-sans ${
                        entry.status === 'CONVERGED' || entry.status === 'COMPLETED'
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : 'bg-[#FFFBEB] text-[#D97706]'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={handleDownloadPDF}
                        className="px-2 py-1 bg-white border border-[#005B91] text-[#005B91] hover:bg-[#F0F6FA] text-[10px] rounded-[2px] font-medium inline-flex items-center gap-1 transition-colors font-sans"
                        title="Download traceable PDF Flash Report"
                      >
                        <Download className="w-2.5 h-2.5" />
                        <span>PDF Report</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
