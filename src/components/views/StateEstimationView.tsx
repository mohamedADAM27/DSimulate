/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - State Estimation Workspace (Screen 05)
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { EngineeringPanel } from '../common/EngineeringPanel';
import { EngineeringLineChart } from '../charts/EngineeringLineChart';
import { EngineeringScatterChart } from '../charts/EngineeringScatterChart';
import { calculateOCV } from '../../services/physicsEngine';
import { Gauge, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const StateEstimationView: React.FC = () => {
  const { batteryPack, simulationHistory } = useBatteryStore();

  // Synthetic estimation history curves
  const socSeries = [
    {
      name: 'EKF State Observer (Est.)',
      color: '#005B91',
      points: simulationHistory.map(p => ({ x: p.time, y: p.packSoc })),
    },
    {
      name: 'Coulomb Counting (Open Loop)',
      color: '#D97706',
      dashArray: '4,2',
      points: simulationHistory.map(p => ({ x: p.time, y: Math.max(0, p.packSoc + Math.sin(p.time * 0.01) * 0.8) })),
    },
    {
      name: 'Sensor Telemetry (Meas.)',
      color: '#2E7D32',
      dashArray: '1,2',
      points: simulationHistory.filter((_, idx) => idx % 4 === 0).map(p => ({ x: p.time, y: p.packSoc + (Math.sin(p.time) * 0.3) })),
    },
  ];

  // Voltage trace
  const voltSeries = [
    {
      name: 'Pack Terminal Voltage (Meas)',
      color: '#0072A8',
      points: simulationHistory.map(p => ({ x: p.time, y: p.packVoltage })),
    },
    {
      name: '2-RC Model Voltage (Est)',
      color: '#C62828',
      dashArray: '3,2',
      points: simulationHistory.map(p => ({ x: p.time, y: p.packVoltage - 0.4 })),
    },
  ];

  // OCV curve points
  const ocvPoints = Array.from({ length: 21 }).map((_, i) => {
    const soc = i * 5; // 0 to 100%
    const ocv = calculateOCV(soc / 100);
    return { x: soc, y: Number(ocv.toFixed(3)) };
  });

  const ocvSeries = [
    {
      name: 'NMC 811 Equilibrium OCV(SOC)',
      color: '#005B91',
      points: ocvPoints,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-2 gap-2 bg-[#F4F5F6]">
      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Global State of Charge (SOC)</div>
            <div className="text-[18px] font-bold text-[#005B91] font-mono-numbers">{batteryPack.avgSoc}%</div>
            <div className="text-[9.5px] text-[#5E666D]">Filter: Dual EKF Observer (±0.4% err)</div>
          </div>
          <Gauge className="w-5 h-5 text-[#005B91]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">State of Energy (SOE)</div>
            <div className="text-[18px] font-bold text-[#20252A] font-mono-numbers">
              {Number(((batteryPack.avgSoc / 100) * batteryPack.measuredCapacityKWh).toFixed(1))} kWh
            </div>
            <div className="text-[9.5px] text-[#5E666D]">Available Traction Energy</div>
          </div>
          <Layers className="w-5 h-5 text-[#0072A8]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">State of Health (SOH)</div>
            <div className="text-[18px] font-bold text-[#2E7D32] font-mono-numbers">{batteryPack.avgSoh}%</div>
            <div className="text-[9.5px] text-[#5E666D]">Capacity Fade: {Number((100 - batteryPack.avgSoh).toFixed(1))}%</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />
        </div>

        <div className="bg-white border border-[#D5D9DD] rounded-[2px] p-2 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#7A8289] font-medium uppercase">Max Voltage Deviation (ΔV)</div>
            <div className="text-[18px] font-bold text-[#D97706] font-mono-numbers">{batteryPack.voltageSpread} mV</div>
            <div className="text-[9.5px] text-[#C62828]">Cell C-017 sag detected (-46mV)</div>
          </div>
          <AlertTriangle className="w-5 h-5 text-[#D97706]" />
        </div>
      </div>

      {/* Main Analysis Split View */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
        {/* Left: SOC Tracking Chart & OCV Curve */}
        <div className="flex flex-col gap-2 overflow-auto">
          <EngineeringPanel title="SOC Estimation History (Transient Drive Cycle)" subtitle="Observer Validation">
            <EngineeringLineChart
              xAxisLabel="Time (seconds)"
              yAxisLabel="State of Charge (%)"
              series={socSeries}
              height={190}
            />
          </EngineeringPanel>

          <EngineeringPanel title="Equilibrium Open Circuit Voltage OCV(SOC)" subtitle="LiNi0.8Mn0.1Co0.1O2">
            <EngineeringLineChart
              xAxisLabel="SOC (%)"
              yAxisLabel="Open Circuit Voltage (V)"
              series={ocvSeries}
              height={170}
              yDomain={[3.0, 4.3]}
            />
          </EngineeringPanel>
        </div>

        {/* Right: Voltage Trace & Cell Distribution Scatter */}
        <div className="flex flex-col gap-2 overflow-auto">
          <EngineeringPanel title="Terminal Voltage Response (2-RC ECM Fit)" subtitle="96S Pack Bus">
            <EngineeringLineChart
              xAxisLabel="Time (seconds)"
              yAxisLabel="Voltage (V)"
              series={voltSeries}
              height={190}
            />
          </EngineeringPanel>

          <EngineeringPanel title="Pack Cell Dispersion & Outlier Map" subtitle="Click node to inspect cell in 3D">
            <EngineeringScatterChart />
          </EngineeringPanel>
        </div>
      </div>
    </div>
  );
};
