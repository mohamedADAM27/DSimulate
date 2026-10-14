# DSimulate Data Model

## 1. Hierarchy Overview
DSimulate implements an object-oriented battery model organized as:
```
BatteryPack (1)
   └── BatteryModule (8)
          └── BatteryCell (12 per module, 96 total)
```

## 2. Entities & Schema

### BatteryPack
- `id`: string (e.g., `DS-EVBAT-001`)
- `name`: string (`DSimulate EV Traction Pack 800V`)
- `architecture`: string (`800V High-Voltage · 96S Prismatic Array · 8 Modules`)
- `nominalVoltage`: number (768 V)
- `packVoltage`: number (Live bus voltage in V)
- `packCurrent`: number (Live current load in A)
- `nominalCapacityKWh`: number (82.5 kWh)
- `measuredCapacityKWh`: number (75.24 kWh)
- `avgSoc`: number (0.0 - 100.0 %)
- `avgSoh`: number (0.0 - 100.0 %)
- `temperature`: number (Mean core temperature in °C)
- `maxCellTemp`: number (Hotspot temperature in °C)
- `minCellTemp`: number (Coldest cell in °C)
- `voltageSpread`: number (Spread $\Delta V$ in mV)
- `cycleCount`: number (Cumulative cycles)
- `predictedRul`: number (Cycles remaining until 80% SOH)

### BatteryModule
- `id`: string (e.g., `MOD-01` through `MOD-08`)
- `moduleIndex`: number (1 to 8)
- `cellCount`: number (12)
- `avgVoltage`: number (V)
- `voltageSpread`: number (mV)
- `avgTemperature`: number (°C)
- `maxTemperature`: number (°C)
- `avgSoc`: number (%)
- `avgSoh`: number (%)
- `diagnosticState`: 'NORMAL' | 'WARNING' | 'CRITICAL'

### BatteryCell
- `id`: string (e.g., `C-001` through `C-096`)
- `moduleId`: string (e.g., `MOD-03`)
- `position`: `{ gridX, gridY, gridZ }`
- `voltage`: number (V)
- `current`: number (A)
- `temperature`: number (°C)
- `soc`: number (%)
- `soh`: number (%)
- `internalResistance`: number ($R_0$ in m$\Omega$)
- `capacityAh`: number (Ah)
- `nominalCapacityAh`: number (65.0 Ah)
- `degradationIndex`: number (0.0 to 1.0)
- `predictedRul`: number (cycles)
- `diagnosticState`: 'NORMAL' | 'WARNING' | 'CRITICAL'

### DiagnosticEvent
- `id`: string (e.g., `D-003`)
- `objectId`: string (e.g., `C-017` or `MOD-03`)
- `objectType`: 'PACK' | 'MODULE' | 'CELL'
- `parameter`: string (e.g., `Cell Surface Temperature`)
- `observed`: string (`41.7°C`)
- `expected`: string (`35.2°C`)
- `deviation`: string (`+6.5°C`)
- `severity`: 'NORMAL' | 'WARNING' | 'CRITICAL'
- `status`: 'ACTIVE' | 'RESOLVED'
- `timestamp`: string
- `rootCause`: string
