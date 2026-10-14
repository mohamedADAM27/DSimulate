/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Screen 1: Vehicle and Battery Selection ("Initialize Battery System")
 */

import React, { useState, useEffect } from 'react';
import { 
  VEHICLE_CATALOG, 
  MANUFACTURERS, 
  VEHICLE_CATEGORIES, 
  getModelsForManufacturer 
} from '../../services/vehicleCatalog';
import { 
  BatterySystemConfig, 
  VehicleCategory, 
  BatteryChemistry, 
  VehicleModelSpec 
} from '../../types/initialization';
import { 
  Car, 
  Bike, 
  Truck, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Edit3, 
  Zap, 
  Layers, 
  SlidersHorizontal 
} from 'lucide-react';

interface Props {
  config: BatterySystemConfig;
  onChange: (updated: BatterySystemConfig) => void;
  onNext: () => void;
  onSkipToWorkspace: () => void;
}

export const ScreenVehicleSelection: React.FC<Props> = ({
  config,
  onChange,
  onNext,
  onSkipToWorkspace,
}) => {
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>(config.manufacturer);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>(config.vehicleCategory);
  const [manualEdit, setManualEdit] = useState<boolean>(config.isCustomManualConfig);

  // Available models for currently chosen manufacturer
  const availableModels = getModelsForManufacturer(selectedManufacturer);

  // Pick initial model if current model does not match manufacturer
  useEffect(() => {
    const models = getModelsForManufacturer(selectedManufacturer);
    if (models.length > 0 && !models.some(m => m.modelName === config.model)) {
      handleSelectModel(models[0]);
    }
  }, [selectedManufacturer]);

  const handleSelectModel = (spec: VehicleModelSpec) => {
    onChange({
      ...config,
      manufacturer: spec.manufacturer,
      model: spec.modelName,
      variant: spec.variant,
      vehicleCategory: spec.category,
      chemistry: spec.chemistry,
      packNominalVoltageV: spec.nominalVoltageV,
      ratedCapacityKWh: spec.ratedCapacityKWh,
      seriesCount: spec.seriesCount,
      parallelCount: spec.parallelCount,
      moduleCount: spec.moduleCount,
      cellsPerModule: spec.cellsPerModule,
      coolingType: spec.coolingType,
      packIdentifier: `PACK-${spec.manufacturer.toUpperCase().slice(0, 4)}-${spec.chemistry}-${spec.seriesCount}S`,
      isCustomManualConfig: false,
    });
    setSelectedCategory(spec.category);
  };

  const getCategoryIcon = (category: VehicleCategory) => {
    switch (category) {
      case 'electric-car': return Car;
      case 'two-wheeler': return Bike;
      case 'commercial-vehicle': return Truck;
      default: return Cpu;
    }
  };

  // Find currently active spec
  const currentSpec = VEHICLE_CATALOG.find(
    v => v.manufacturer === config.manufacturer && v.modelName === config.model
  ) || VEHICLE_CATALOG[0];

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] text-[#20252A] overflow-y-auto">
      {/* Engineering Header */}
      <div className="px-6 py-4 bg-white border-b border-[#D5D9DD] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#005B91] font-semibold bg-[#EBF5FB] px-2 py-0.5 border border-[#B9E0F7]">
                Stage 1 of 4 · Baseline Configuration
              </span>
              <span className="text-xs text-[#5E666D]">·</span>
              <span className="text-xs text-[#5E666D] font-mono-numbers">PHYSICS-INFORMED INITIALIZATION</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#1A1D20] mt-1">
              Initialize Battery System
            </h2>
            <p className="text-xs text-[#5E666D] mt-0.5">
              Select target vehicle platform, chemical look-up tables, and physical topology before establishing telemetry stream.
            </p>
          </div>

          <button
            onClick={onSkipToWorkspace}
            className="self-start md:self-auto text-xs font-medium text-[#005B91] hover:text-[#004773] hover:underline flex items-center gap-1.5 px-3 py-1.5 border border-[#D5D9DD] bg-[#FAFAFA] rounded-[2px] transition-colors"
          >
            <span>Skip Setup (Open 800V Baseline Workspace)</span>
            <span className="font-mono text-[10px]">→</span>
          </button>
        </div>
      </div>

      {/* Engineering Disclaimer */}
      <div className="mx-6 mt-4 p-3 bg-[#FFFBEB] border-l-4 border-[#F59E0B] border border-[#FDE68A] text-xs flex items-start gap-3 rounded-[2px]">
        <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
        <div className="text-[#92400E] leading-relaxed">
          <strong className="font-semibold text-[#78350F]">Engineering Boundary Notice: </strong>
          Manufacturer & model selection defines physical baseline architecture and chemical look-up tables. 
          Selection does not imply an authorized BMS hardware connection without verified physical CAN bus tap or OEM telematics token.
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Category & Manufacturer Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Vehicle Category */}
          <div className="bg-white p-4 border border-[#D5D9DD] rounded-[2px] shadow-2xs">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5E666D] block mb-2.5">
              1. Vehicle Platform Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VEHICLE_CATEGORIES.map(cat => {
                const Icon = getCategoryIcon(cat.id);
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      onChange({ ...config, vehicleCategory: cat.id });
                    }}
                    className={`flex items-start gap-2.5 p-2.5 text-left border rounded-[2px] transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#005B91] bg-[#F0F6FA] text-[#005B91]'
                        : 'border-[#E2E6EA] bg-white hover:border-[#CBD5E1] text-[#334155]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#005B91]' : 'text-[#64748B]'}`} />
                    <div>
                      <div className="text-xs font-semibold leading-tight">{cat.label}</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5 leading-snug line-clamp-1">{cat.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Manufacturer Selection */}
          <div className="bg-white p-4 border border-[#D5D9DD] rounded-[2px] shadow-2xs">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5E666D] block mb-2.5">
              2. Vehicle Manufacturer / OEM
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MANUFACTURERS.map(mfg => {
                const isSelected = selectedManufacturer === mfg;
                return (
                  <button
                    key={mfg}
                    onClick={() => setSelectedManufacturer(mfg)}
                    className={`px-3 py-2 text-xs font-medium text-left border rounded-[2px] transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#005B91] bg-[#005B91] text-white font-semibold shadow-2xs'
                        : 'border-[#D5D9DD] bg-white text-[#334155] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="truncate">{mfg}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Model Selection */}
          <div className="bg-white p-4 border border-[#D5D9DD] rounded-[2px] shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#5E666D]">
                3. Model Architecture ({availableModels.length} Calibrated Models)
              </label>
              <button
                onClick={() => setManualEdit(!manualEdit)}
                className="text-[11px] font-medium text-[#005B91] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{manualEdit ? 'Lock to Verified Preset' : 'Enable Custom Override'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {availableModels.map(model => {
                const isSelected = config.model === model.modelName && !manualEdit;
                return (
                  <div
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className={`p-3 border rounded-[2px] cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#005B91] bg-[#F0F6FA] ring-1 ring-[#005B91]/30'
                        : 'border-[#E2E6EA] bg-white hover:border-[#CBD5E1] hover:bg-[#FBFBFC]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E293B]">{model.modelName}</span>
                        <span className="text-[11px] text-[#64748B]">· {model.variant}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-mono font-medium px-1.5 py-0.5 bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                          {model.chemistry}
                        </span>
                        <span className="text-[10.5px] font-mono font-bold text-[#005B91]">
                          {model.ratedCapacityKWh} kWh
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px] text-[#475569] font-mono-numbers">
                      <div>Bus: <strong className="text-[#0F172A]">{model.nominalVoltageV}V</strong></div>
                      <div>Config: <strong className="text-[#0F172A]">{model.cellConfiguration}</strong></div>
                      <div>Cooling: <strong className="text-[#0F172A] truncate">{model.coolingType}</strong></div>
                      <div>Status: <span className="text-[#16A34A] font-semibold">✓ Verified Spec</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Pack Physical Configuration Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 border border-[#D5D9DD] rounded-[2px] shadow-2xs space-y-4 sticky top-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#64748B]">Target Battery System</span>
                <h3 className="text-base font-bold text-[#0F172A] leading-tight">
                  {config.manufacturer} {config.model}
                </h3>
              </div>
              <div className="px-2 py-1 bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[11px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for Bus</span>
              </div>
            </div>

            {/* Editable or Locked Parameters */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                  Pack Identification Key
                </label>
                <input
                  type="text"
                  value={config.packIdentifier}
                  onChange={e => onChange({ ...config, packIdentifier: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-mono font-medium rounded-[2px] text-[#0F172A] focus:outline-hidden focus:border-[#005B91]"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                  Chassis VIN / Test Bench Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MAT624832N1209XX or BENCH-DYNO-04"
                  value={config.vinOrChassisId}
                  onChange={e => onChange({ ...config, vinOrChassisId: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#CBD5E1] text-xs font-mono rounded-[2px] text-[#0F172A] focus:outline-hidden focus:border-[#005B91]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                    Cell Chemistry
                  </label>
                  <select
                    disabled={!manualEdit}
                    value={config.chemistry}
                    onChange={e => onChange({ ...config, chemistry: e.target.value as BatteryChemistry })}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-mono font-semibold rounded-[2px] disabled:opacity-85 text-[#0F172A]"
                  >
                    <option value="LFP">LFP (LiFePO4)</option>
                    <option value="NMC">NMC (NiMnCo)</option>
                    <option value="NCA">NCA (NiCoAl)</option>
                    <option value="OTHER">Custom Solid State</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                    Cooling Circuit
                  </label>
                  <input
                    type="text"
                    disabled={!manualEdit}
                    value={config.coolingType}
                    onChange={e => onChange({ ...config, coolingType: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs rounded-[2px] disabled:opacity-85 text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                    Pack Nominal Voltage (V)
                  </label>
                  <input
                    type="number"
                    disabled={!manualEdit}
                    value={config.packNominalVoltageV}
                    onChange={e => onChange({ ...config, packNominalVoltageV: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-mono-numbers font-semibold rounded-[2px] text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                    Rated Energy (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!manualEdit}
                    value={config.ratedCapacityKWh}
                    onChange={e => onChange({ ...config, ratedCapacityKWh: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-mono-numbers font-semibold rounded-[2px] text-[#0F172A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                    Series String (S)
                  </label>
                  <input
                    type="number"
                    disabled={!manualEdit}
                    value={config.seriesCount}
                    onChange={e => onChange({ ...config, seriesCount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-mono-numbers rounded-[2px] text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-mono uppercase text-[#64748B] block mb-1">
                    Parallel String (P)
                  </label>
                  <input
                    type="number"
                    disabled={!manualEdit}
                    value={config.parallelCount}
                    onChange={e => onChange({ ...config, parallelCount: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] text-xs font-mono-numbers rounded-[2px] text-[#0F172A]"
                  />
                </div>
              </div>
            </div>

            {/* Spec verification card */}
            <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-[2px] text-[11px] text-[#475569] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span>Calculated Cell Count:</span>
                <strong className="text-[#0F172A]">{config.seriesCount * config.parallelCount} Cells</strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span>Mean Cell Voltage:</span>
                <strong className="text-[#0F172A]">{(config.packNominalVoltageV / Math.max(1, config.seriesCount)).toFixed(2)} V/cell</strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span>Rated Capacity:</span>
                <strong className="text-[#0F172A]">{((config.ratedCapacityKWh * 1000) / Math.max(1, config.packNominalVoltageV)).toFixed(1)} Ah</strong>
              </div>
            </div>

            {/* Next Action Button */}
            <button
              onClick={onNext}
              className="w-full py-2.5 bg-[#005B91] hover:bg-[#004773] text-white font-semibold text-xs rounded-[2px] shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirm Configuration & Select Data Source</span>
              <span className="font-mono text-sm">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
