/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Multi-Brand Battery Connection & Initialization Workflow Coordinator
 */

import React, { useState } from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  BatterySystemConfig, 
  DataSourceType, 
  SyntheticConfiguration, 
  CanConfiguration, 
  ObdConfiguration, 
  OemApiConfiguration 
} from '../../types/initialization';
import { ScreenVehicleSelection } from './ScreenVehicleSelection';
import { ScreenDataSourceSelection } from './ScreenDataSourceSelection';
import { ScreenConnectionConfig } from './ScreenConnectionConfig';
import { ScreenDataPipeline } from './ScreenDataPipeline';
import { BatteryPack, DiagnosticEvent } from '../../types/battery';
import { 
  Box, 
  Layers, 
  CheckCircle2, 
  Sliders, 
  Activity, 
  ArrowRight, 
  X,
  ShieldAlert
} from 'lucide-react';

interface Props {
  onClose?: () => void;
}

export const BatteryInitializationWorkflow: React.FC<Props> = ({ onClose }) => {
  const { 
    setInitializedBatteryPack, 
    setIsInitializingBattery,
    activeVehicleInfo,
    activeDataSource
  } = useBatteryStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Configuration state
  const [batteryConfig, setBatteryConfig] = useState<BatterySystemConfig>({
    vehicleCategory: 'electric-car',
    manufacturer: 'Tata Motors',
    model: 'Nexon EV Long Range',
    variant: 'Empowered+ LR (40.5 kWh)',
    vinOrChassisId: 'MAT624832N1209XX',
    packIdentifier: 'PACK-TATA-LFP-100S',
    chemistry: 'LFP',
    packNominalVoltageV: 320,
    ratedCapacityKWh: 40.5,
    seriesCount: 100,
    parallelCount: 1,
    moduleCount: 8,
    cellsPerModule: 12,
    coolingType: 'Active Liquid Glycol',
    isCustomManualConfig: false,
  });

  const [dataSource, setDataSource] = useState<DataSourceType>('SYNTHETIC');

  const [syntheticConfig, setSyntheticConfig] = useState<SyntheticConfiguration>({
    chemistry: 'LFP',
    packVoltageV: 320,
    ratedCapacityKWh: 40.5,
    initialSocPct: 82.5,
    ambientTempC: 22.0,
    operatingLoad: 'WLTP_HIGHWAY',
    scenario: 'C017_THERMAL_EXCURSION',
    sampleRateHz: 100,
    seed: 716,
  });

  const [canConfig, setCanConfig] = useState<CanConfiguration>({
    interfaceName: 'PEAK_PCAN_USB',
    bitrateKbps: 500,
    canFdEnabled: true,
    fdDataBitrateKbps: 5000,
    terminatingResistor120Ohm: true,
    listenOnlyMode: false,
    dbcPreset: 'J1939_BMS_Standard',
    replayerMode: true,
  });

  const [obdConfig, setObdConfig] = useState<ObdConfiguration>({
    interfaceType: 'OBDLINK_EX',
    protocol: 'ISO_14229_UDS',
    baudRate: 500000,
    udsSecurityAccess: true,
    pollingFrequencyHz: 5,
    readDtcs: true,
    readCellVoltages: true,
  });

  const [oemApiConfig, setOemApiConfig] = useState<OemApiConfiguration>({
    provider: 'TATA_ZCONNECT',
    endpointUrl: 'https://api.connected.tatamotors.com/v2/telematics/bms',
    clientId: 'TATA_FLEET_DEV_90412',
    apiSecret: 'sec_bms_auth_9814a0',
    cloudRegion: 'ap-south-1 (Mumbai)',
    pollIntervalSec: 5,
    authenticated: true,
  });

  // Finish pipeline and push to store
  const handlePipelineComplete = (pack: BatteryPack, diagnostics: DiagnosticEvent[]) => {
    setInitializedBatteryPack(
      pack,
      diagnostics,
      {
        manufacturer: batteryConfig.manufacturer,
        model: batteryConfig.model,
        category: batteryConfig.vehicleCategory,
        chemistry: batteryConfig.chemistry,
        packId: batteryConfig.packIdentifier,
        verified: !batteryConfig.isCustomManualConfig,
      },
      dataSource
    );

    if (onClose) {
      onClose();
    }
  };

  const handleSkipToWorkspace = () => {
    setIsInitializingBattery(false);
    if (onClose) {
      onClose();
    }
  };

  const STEPS = [
    { number: 1, title: 'Vehicle & Battery Setup', desc: 'Platform & Chemistry' },
    { number: 2, title: 'Data Source Selection', desc: 'CAN / OBD / API / Synthetic' },
    { number: 3, title: 'Connection Configuration', desc: 'Bitrate & Load Scenarios' },
    { number: 4, title: 'Data Processing Pipeline', desc: '8-Stage Live Execution' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#F4F5F6] select-none">
      {/* Top Application Ribbon */}
      <div className="h-[46px] bg-[#005B91] text-white flex items-center justify-between px-4 border-b border-[#004773] shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-bold tracking-tight text-[15px] flex items-center gap-2">
            <span>DSimulate</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-white/15 border border-white/20 rounded-[2px]">
              Multi-Brand Battery Connection Layer
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/20 hidden sm:block"></div>

          <div className="text-xs text-white/80 hidden md:block">
            Step {currentStep} of 4: <strong className="text-white">{STEPS[currentStep - 1].title}</strong>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSkipToWorkspace}
            className="text-xs text-white/90 hover:text-white hover:bg-white/10 px-3 py-1 border border-white/25 rounded-[2px] transition-colors cursor-pointer"
          >
            Open Existing Workspace
          </button>
        </div>
      </div>

      {/* Engineering Step Navigation Bar */}
      <div className="h-[42px] bg-white border-b border-[#D5D9DD] px-4 flex items-center justify-between shrink-0 overflow-x-auto text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          {STEPS.map((step) => {
            const isActive = currentStep === step.number;
            const isDone = currentStep > step.number;

            return (
              <React.Fragment key={step.number}>
                <button
                  onClick={() => {
                    // Only allow clicking back or current
                    if (step.number < currentStep) {
                      setCurrentStep(step.number as any);
                    }
                  }}
                  disabled={step.number > currentStep}
                  className={`flex items-center gap-2 px-3 py-1 rounded-[2px] transition-all text-left ${
                    isActive
                      ? 'bg-[#005B91] text-white font-semibold shadow-2xs'
                      : isDone
                      ? 'text-[#005B91] hover:bg-[#F0F6FA] cursor-pointer'
                      : 'text-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white text-[#005B91]' : isDone ? 'bg-[#EBF5FB] text-[#005B91]' : 'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}>
                    {isDone ? '✓' : step.number}
                  </div>
                  <div className="hidden sm:block">
                    <div className="leading-tight text-[11px]">{step.title}</div>
                  </div>
                </button>

                {step.number < 4 && (
                  <span className="text-[#CBD5E1] font-mono text-[10px] px-1">›</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono-numbers text-[#64748B]">
          <span>TARGET: <strong className="text-[#0F172A]">{batteryConfig.model}</strong></span>
          <span>·</span>
          <span>CHEM: <strong className="text-[#0F172A]">{batteryConfig.chemistry}</strong></span>
          <span>·</span>
          <span>BUS: <strong className="text-[#0F172A]">{batteryConfig.packNominalVoltageV}V</strong></span>
        </div>
      </div>

      {/* Active Screen Canvas */}
      <div className="flex-1 overflow-hidden relative">
        {currentStep === 1 && (
          <ScreenVehicleSelection
            config={batteryConfig}
            onChange={setBatteryConfig}
            onNext={() => setCurrentStep(2)}
            onSkipToWorkspace={handleSkipToWorkspace}
          />
        )}

        {currentStep === 2 && (
          <ScreenDataSourceSelection
            batteryConfig={batteryConfig}
            selectedSource={dataSource}
            onSelectSource={setDataSource}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <ScreenConnectionConfig
            batteryConfig={batteryConfig}
            dataSource={dataSource}
            syntheticConfig={syntheticConfig}
            canConfig={canConfig}
            obdConfig={obdConfig}
            oemApiConfig={oemApiConfig}
            onUpdateSynthetic={setSyntheticConfig}
            onUpdateCan={setCanConfig}
            onUpdateObd={setObdConfig}
            onUpdateOemApi={setOemApiConfig}
            onStartInitialization={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <ScreenDataPipeline
            batteryConfig={batteryConfig}
            dataSource={dataSource}
            syntheticConfig={syntheticConfig}
            canConfig={canConfig}
            obdConfig={obdConfig}
            oemApiConfig={oemApiConfig}
            onPipelineComplete={handlePipelineComplete}
            onRestart={() => setCurrentStep(1)}
          />
        )}
      </div>
    </div>
  );
};
