/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Screen 2: Select Data Source
 */

import React from 'react';
import { DataSourceType, BatterySystemConfig } from '../../types/initialization';
import { 
  Network, 
  Binary, 
  CloudLightning, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  ShieldAlert,
  HardDrive
} from 'lucide-react';

interface Props {
  batteryConfig: BatterySystemConfig;
  selectedSource: DataSourceType;
  onSelectSource: (source: DataSourceType) => void;
  onNext: () => void;
  onBack: () => void;
}

interface SourceOption {
  id: DataSourceType;
  title: string;
  tag: string;
  recommended?: boolean;
  requiresHardware: boolean;
  readinessState: 'IMMEDIATELY_USABLE' | 'REQUIRES_ADAPTER' | 'REQUIRES_CREDENTIALS';
  icon: React.ElementType;
  description: string;
  capabilities: string[];
  limitations: string[];
}

export const ScreenDataSourceSelection: React.FC<Props> = ({
  batteryConfig,
  selectedSource,
  onSelectSource,
  onNext,
  onBack,
}) => {
  const SOURCE_OPTIONS: SourceOption[] = [
    {
      id: 'SYNTHETIC',
      title: 'Import or Deterministic Synthetic Data',
      tag: 'Fully Functional · Zero Hardware Required',
      recommended: true,
      requiresHardware: false,
      readinessState: 'IMMEDIATELY_USABLE',
      icon: Sparkles,
      description: 'Generate deterministic, physics-calibrated BMS telemetry streams or import pre-recorded CSV/JSON logs. Accurately reproduces current, voltage, SOC, thermal gradients, and cell anomalies.',
      capabilities: [
        'Complete cell-level resolution (all 96+ individual cell voltages and temperatures)',
        'Deterministic mathematical seed (exact reproducible physics runs)',
        'Injectable anomaly test cases (thermal hotspot, resistance drift, coolant blockage)',
        'Fully calibrated to selected vehicle chemistry and pack voltage',
      ],
      limitations: [
        'Simulated telemetry stream (clearly tagged with SYNTHETIC provenance)',
      ],
    },
    {
      id: 'CAN',
      title: 'CAN / CAN FD Controller Bus',
      tag: 'Physical Bus · 100-500 Hz High Rate',
      requiresHardware: true,
      readinessState: 'REQUIRES_ADAPTER',
      icon: Network,
      description: 'Tap directly into vehicle or test-bench powertrain CAN 2.0B / CAN FD network using an authorized DBC signal database and compatible USB interface.',
      capabilities: [
        'Full raw bus bandwidth (250 kbps, 500 kbps, CAN FD 5 Mbps)',
        'Sub-10ms transmission cycle time for real-time control loops',
        'Load custom DBC file or standard J1939-73 / ISO 11898 mapping',
        'Hardware loopback replayer available for verification when disconnected',
      ],
      limitations: [
        'Requires physical CAN interface (PEAK, Vector, Kvaser, or SocketCAN)',
        'Requires OEM authorization to access encrypted or secured CAN FD frames',
      ],
    },
    {
      id: 'OBD',
      title: 'OBD-II / UDS Diagnostics (ISO 14229)',
      tag: 'Diagnostic Port · Query & DTC Protocol',
      requiresHardware: true,
      readinessState: 'REQUIRES_ADAPTER',
      icon: Binary,
      description: 'Interrogate the vehicle onboard diagnostic port via standard OBD-II PIDs and ISO 14229 Unified Diagnostic Services (UDS).',
      capabilities: [
        'Read Active & Pending Diagnostic Trouble Codes (DTCs)',
        'Query standard SAE J1979 Mode 01 pack voltage and gross SOC',
        'Compatible with standard OBDLink STN1170 and ELM327 interfaces',
      ],
      limitations: [
        'Standard OBD does NOT expose individual cell voltages or module thermistors',
        'Cell-level arrays require proprietary OEM Security Access (Seed-Key level)',
        'Limited polling frequency (typically 5 Hz - 20 Hz)',
      ],
    },
    {
      id: 'OEM_API',
      title: 'OEM Cloud API / Telematics Gateway',
      tag: 'Connected Cloud · Remote Telemetry',
      requiresHardware: false,
      readinessState: 'REQUIRES_CREDENTIALS',
      icon: CloudLightning,
      description: 'Connect directly to authorized OEM cloud telematics platforms (e.g. Tata ZConnect, MG iSMART, Ather Connected Cloud, or Custom Fleet REST/MQTT servers).',
      capabilities: [
        'Remote vehicle monitoring over cellular LTE / eSIM',
        'Pack SOC, charging rate, gross battery pack temperature, and range metrics',
        'Aggregated fleet telemetry and real-time charging status',
      ],
      limitations: [
        'High latency (1s - 30s cloud polling interval)',
        'Cell arrays are stripped from consumer telematics to conserve cellular bandwidth',
        'Requires valid OAuth 2.0 client credentials or manufacturer API token',
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] text-[#20252A] overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#D5D9DD] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#005B91] font-semibold bg-[#EBF5FB] px-2 py-0.5 border border-[#B9E0F7]">
            Stage 2 of 4 · Telemetry Source Selection
          </span>
          <span className="text-xs text-[#5E666D]">·</span>
          <span className="text-xs text-[#5E666D] font-mono-numbers">
            TARGET: {batteryConfig.manufacturer} {batteryConfig.model} ({batteryConfig.packNominalVoltageV}V {batteryConfig.chemistry})
          </span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#1A1D20] mt-1">
          Select Data Source
        </h2>
        <p className="text-xs text-[#5E666D] mt-0.5">
          Choose how battery telemetry will be ingested into the DSimulate digital twin pipeline.
        </p>
      </div>

      <div className="p-6 flex-1 max-w-6xl mx-auto w-full space-y-4">
        {/* Source Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOURCE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = selectedSource === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => onSelectSource(opt.id)}
                className={`flex flex-col p-5 border rounded-[2px] cursor-pointer transition-all relative ${
                  isSelected
                    ? 'border-[#005B91] bg-white ring-2 ring-[#005B91]/30 shadow-xs'
                    : 'border-[#D5D9DD] bg-white hover:border-[#94A3B8] hover:bg-[#FAFAFA]'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-[2px] ${isSelected ? 'bg-[#005B91] text-white' : 'bg-[#F1F5F9] text-[#005B91]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#0F172A]">{opt.title}</h3>
                        {opt.recommended && (
                          <span className="text-[9.5px] font-mono font-bold uppercase bg-[#DCFCE7] text-[#15803D] px-1.5 py-0.5 border border-[#86EFAC]">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] font-mono text-[#64748B] block mt-0.5">{opt.tag}</span>
                    </div>
                  </div>

                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                    isSelected ? 'border-[#005B91] bg-[#005B91]' : 'border-[#CBD5E1]'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#475569] leading-relaxed mb-4">
                  {opt.description}
                </p>

                {/* Capabilities vs Limitations */}
                <div className="mt-auto space-y-2 pt-3 border-t border-[#F1F5F9] text-[11px]">
                  <div className="text-[10px] font-mono uppercase font-semibold text-[#15803D]">
                    Available Capabilities:
                  </div>
                  <ul className="space-y-1">
                    {opt.capabilities.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[#334155]">
                        <CheckCircle2 className="w-3 h-3 text-[#16A34A] shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-[10px] font-mono uppercase font-semibold text-[#9A3412] pt-1">
                    Engineering Boundary:
                  </div>
                  <ul className="space-y-1">
                    {opt.limitations.map((l, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[#64748B]">
                        <AlertCircle className="w-3 h-3 text-[#EA580C] shrink-0 mt-0.5" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected source status bar */}
        <div className="bg-[#F0F6FA] border border-[#B9E0F7] p-4 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#0C4A6E]">
            <HardDrive className="w-4 h-4 text-[#0284C7] shrink-0" />
            <div>
              <span className="font-semibold">Selected Source: </span>
              <span className="font-mono">{SOURCE_OPTIONS.find(s => s.id === selectedSource)?.title}</span>
              <span className="text-[#0369A1] ml-2 font-mono text-[11px]">
                ({selectedSource === 'SYNTHETIC' ? 'Zero Hardware Needed' : 'Hardware Check Stage Next'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#475569] rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={onNext}
              className="px-5 py-2 bg-[#005B91] hover:bg-[#004773] text-white text-xs font-semibold rounded-[2px] shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Configure Connection Parameters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
