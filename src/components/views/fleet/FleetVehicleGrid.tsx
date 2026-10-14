/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Fleet Vehicles & Digital Twin Telemetry Grid
 */

import React, { useState } from 'react';
import { FleetVehicle } from '../../../types/fleetMaintenance';
import { useBatteryStore } from '../../../stores/useBatteryStore';
import { 
  Box, 
  Activity, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Gauge, 
  Zap, 
  Clock, 
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface FleetVehicleGridProps {
  vehicles: FleetVehicle[];
  onSelectVehicleForTwin: (vehicle: FleetVehicle) => void;
}

export const FleetVehicleGrid: React.FC<FleetVehicleGridProps> = ({
  vehicles,
  onSelectVehicleForTwin
}) => {
  const { batteryPack, setWorkspace } = useBatteryStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filtered = vehicles.filter(v => {
    if (filterCategory !== 'ALL' && v.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.id.toLowerCase().includes(q) ||
        v.vehicleName.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q) ||
        v.manufacturer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE_ROUTE':
        return <span className="bg-[#DCFCE7] text-[#166534] border border-[#16A34A] px-1.5 py-0.5 font-mono text-[9px] font-bold">ON ROUTE</span>;
      case 'FAST_CHARGING':
        return <span className="bg-[#EFF6FF] text-[#1D4ED8] border border-[#3B82F6] px-1.5 py-0.5 font-mono text-[9px] font-bold">FAST CHARGING</span>;
      case 'DERATED':
        return <span className="bg-[#FEE2E2] text-[#991B1B] border border-[#DC2626] px-1.5 py-0.5 font-mono text-[9px] font-bold">DERATED (SAFETY)</span>;
      case 'MAINTENANCE_BAY':
        return <span className="bg-[#FEF08A] text-[#854D0E] border border-[#CA8A04] px-1.5 py-0.5 font-mono text-[9px] font-bold">IN SERVICE BAY</span>;
      case 'DEPOT_IDLE':
      default:
        return <span className="bg-[#F3F4F6] text-[#4B5563] border border-[#9CA3AF] px-1.5 py-0.5 font-mono text-[9px] font-bold">DEPOT IDLE</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2 overflow-hidden text-[12px]">
      {/* Controls & Search */}
      <div className="bg-white border-2 border-black p-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search vehicles by ID, Name, Model, or VIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-black py-1 px-2.5 pl-8 text-[11px] font-mono bg-white focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#5E666D] absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-mono text-[#5E666D] text-[10px] uppercase font-bold">Class:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-black py-1 px-1.5 font-mono text-[10.5px] bg-white"
          >
            <option value="ALL">All Categories ({vehicles.length})</option>
            <option value="electric-car">Passenger Cars</option>
            <option value="commercial-vehicle">Commercial E-Buses</option>
            <option value="two-wheeler">Two-Wheelers</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto border-2 border-black bg-white">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="bg-[#005B91] text-white font-mono uppercase text-[9.5px] tracking-wider sticky top-0 z-10 border-b-2 border-black">
            <tr>
              <th className="py-2 px-2.5 border-r border-[#004B78]">Vehicle / VIN</th>
              <th className="py-2 px-2 border-r border-[#004B78]">Status</th>
              <th className="py-2 px-2 border-r border-[#004B78]">Chemistry / Pack</th>
              <th className="py-2 px-2 border-r border-[#004B78] text-right">Pack V</th>
              <th className="py-2 px-2 border-r border-[#004B78] text-right">SOC %</th>
              <th className="py-2 px-2 border-r border-[#004B78] text-right">SOH %</th>
              <th className="py-2 px-2 border-r border-[#004B78] text-right">Max Temp</th>
              <th className="py-2 px-2 border-r border-[#004B78] text-right">ΔV Imbalance</th>
              <th className="py-2 px-2 border-r border-[#004B78] text-right">R_int (mΩ)</th>
              <th className="py-2 px-2 border-r border-[#004B78] text-right">RUL Cycles</th>
              <th className="py-2 px-2 border-r border-[#004B78]">Shift / Util</th>
              <th className="py-2 px-2 border-r border-[#004B78]">Data Freshness</th>
              <th className="py-2 px-2.5 text-center">Digital Twin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] font-mono-numbers">
            {filtered.map(veh => {
              const isActiveTwin = veh.batteryPackId === batteryPack.id || veh.id === 'FLEET-EV-01';
              const isThermalWarning = veh.maxCellTemp >= 40.0;
              const isVoltageWarning = veh.cellImbalanceMv >= 40.0;
              const isSohCritical = veh.avgSoh <= 80.0;

              return (
                <tr 
                  key={veh.id}
                  className={`hover:bg-[#F0F6FA] transition-colors ${
                    isActiveTwin ? 'bg-[#EFF6FF]' : ''
                  }`}
                >
                  <td className="py-2 px-2.5 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[10.5px] bg-[#003B5C] text-white px-1 py-0.2">
                        {veh.id}
                      </span>
                      {isActiveTwin && (
                        <span className="bg-[#38BDF8] text-[#003B5C] text-[8.5px] font-bold px-1 py-0.2 font-mono uppercase">
                          ACTIVE TWIN
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-[11.5px] text-[#20252A] mt-0.5">{veh.vehicleName}</div>
                    <div className="text-[9.5px] text-[#5E666D] font-mono">{veh.vin}</div>
                  </td>

                  <td className="py-2 px-2">
                    {getStatusBadge(veh.routeStatus)}
                  </td>

                  <td className="py-2 px-2 font-sans">
                    <div className="font-bold text-[10.5px] text-[#005B91]">{veh.chemistry}</div>
                    <div className="text-[9.5px] text-[#5E666D] font-mono">{veh.batteryPackId}</div>
                  </td>

                  <td className="py-2 px-2 text-right font-mono font-bold">
                    {veh.packVoltage.toFixed(1)} V
                  </td>

                  <td className="py-2 px-2 text-right font-mono">
                    <span className="font-bold">{veh.avgSoc.toFixed(1)}%</span>
                  </td>

                  <td className="py-2 px-2 text-right font-mono">
                    <span className={`font-bold ${isSohCritical ? 'text-[#DC2626]' : 'text-[#005B91]'}`}>
                      {veh.avgSoh.toFixed(1)}%
                    </span>
                  </td>

                  <td className="py-2 px-2 text-right font-mono">
                    <span className={`font-bold ${isThermalWarning ? 'text-[#DC2626] bg-[#FEE2E2] px-1' : 'text-[#20252A]'}`}>
                      {veh.maxCellTemp.toFixed(1)} °C
                    </span>
                  </td>

                  <td className="py-2 px-2 text-right font-mono">
                    <span className={`font-bold ${isVoltageWarning ? 'text-[#DC2626] bg-[#FEE2E2] px-1' : 'text-[#20252A]'}`}>
                      {veh.cellImbalanceMv.toFixed(1)} mV
                    </span>
                  </td>

                  <td className="py-2 px-2 text-right font-mono">
                    {veh.internalResistanceAvgMOhms.toFixed(2)}
                  </td>

                  <td className="py-2 px-2 text-right font-mono font-bold text-[#005B91]">
                    {veh.predictedRulCycles} cyc
                  </td>

                  <td className="py-2 px-2 font-mono text-[10px]">
                    <div>{veh.currentShift.replace('_', ' ')}</div>
                    <div className="text-[#5E666D]">{veh.utilizationPct}% util · {veh.dailyMileageKm} km/d</div>
                  </td>

                  <td className="py-2 px-2 font-mono text-[9.5px]">
                    <div className="text-[#166534] font-bold">{veh.telemetryFreshnessSeconds}s ago</div>
                    <div className="text-[#5E666D]">{veh.telemetryQuality}</div>
                  </td>

                  <td className="py-2 px-2.5 text-center">
                    <button
                      onClick={() => onSelectVehicleForTwin(veh)}
                      className="px-2.5 py-1 bg-[#005B91] hover:bg-[#003B5C] text-white border border-black font-mono font-bold text-[9.5px] uppercase tracking-wider flex items-center justify-center gap-1 mx-auto shadow-xs"
                    >
                      <Box className="w-3 h-3" />
                      <span>{isActiveTwin ? 'Open 3D Twin' : 'Bind Twin'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
