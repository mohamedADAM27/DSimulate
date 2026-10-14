/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Scientific Colormap Legend
 */

import React from 'react';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { VisualizationMode } from '../../types/battery';

export const VisualizationLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { visualizationMode } = useBatteryStore();

  const getLegendConfig = (mode: VisualizationMode) => {
    switch (mode) {
      case 'THERMAL':
        return {
          title: 'Surface Temperature (°C)',
          gradient: 'linear-gradient(to right, #1E3A8A 0%, #06B6D4 25%, #10B981 50%, #F59E0B 75%, #DC2626 100%)',
          ticks: ['25.0', '31.0', '37.0', '42.0', '48.0+'],
          unit: '°C',
        };
      case 'SOC':
        return {
          title: 'State of Charge (SOC)',
          gradient: 'linear-gradient(to right, #DC2626 0%, #F59E0B 40%, #10B981 80%, #047857 100%)',
          ticks: ['0%', '25%', '50%', '75%', '100%'],
          unit: '%',
        };
      case 'SOH':
        return {
          title: 'State of Health (SOH) [EOL = 80%]',
          gradient: 'linear-gradient(to right, #DC2626 0%, #D97706 40%, #10B981 70%, #059669 100%)',
          ticks: ['70%', '80% (EOL)', '87%', '93%', '100%'],
          unit: '%',
        };
      case 'VOLTAGE':
        return {
          title: 'Cell Voltage Balance (ΔV from Mean)',
          gradient: 'linear-gradient(to right, #DC2626 0%, #F59E0B 35%, #10B981 50%, #F59E0B 65%, #DC2626 100%)',
          ticks: ['-45mV', '-15mV', '0mV (Bal)', '+15mV', '+45mV'],
          unit: 'mV',
        };
      case 'RUL':
        return {
          title: 'Remaining Useful Life (RUL)',
          gradient: 'linear-gradient(to right, #DC2626 0%, #D97706 35%, #0284C7 70%, #059669 100%)',
          ticks: ['<750', '950', '1150', '1350', '1500+'],
          unit: 'cycles',
        };
      case 'DEGRADATION':
        return {
          title: 'Degradation Index (Capacity Loss + SEI Growth)',
          gradient: 'linear-gradient(to right, #059669 0%, #0284C7 40%, #F59E0B 75%, #DC2626 100%)',
          ticks: ['0.00', '0.05', '0.10', '0.15', '0.25+'],
          unit: 'index',
        };
      case 'NORMAL':
      default:
        return null;
    }
  };

  const config = getLegendConfig(visualizationMode);
  if (!config) return null;

  return (
    <div className={`bg-white/95 border border-[#D5D9DD] px-3 py-1.5 rounded-[2px] shadow-xs text-[10.5px] select-none ${className}`}>
      <div className="flex items-center justify-between text-[#20252A] font-medium mb-1">
        <span>{config.title}</span>
        <span className="text-[#7A8289] font-mono-numbers">{config.unit}</span>
      </div>

      {/* Gradient Bar */}
      <div 
        className="h-2 w-full rounded-[1px] border border-black/10"
        style={{ background: config.gradient }}
      />

      {/* Numerical Ticks */}
      <div className="flex justify-between text-[9.5px] text-[#5E666D] font-mono-numbers mt-1">
        {config.ticks.map((tick, i) => (
          <span key={i}>{tick}</span>
        ))}
      </div>
    </div>
  );
};
