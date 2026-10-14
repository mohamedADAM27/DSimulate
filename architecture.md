# DSimulate System Architecture

## 1. Architectural Philosophy
DSimulate is structured as a closed-loop engineering digital twin environment. The architecture is intentionally partitioned into distinct layers that separate physical telemetry, electro-thermal solvers, state estimators, central state orchestration, and CAD/CAE presentation surfaces.

```
+-------------------------------------------------------------+
|                     PRESENTATION LAYER                      |
|  - 3D WebGL Battery Viewport (Three.js CAD Mesh)            |
|  - Engineering Tree Hierarchy (Pack -> Module -> Cell)      |
|  - Real-time Object Telemetry Inspector                     |
|  - Multi-Channel Time-Domain Charts & Radar Matrix          |
+-------------------------------------------------------------+
                              ^
                              | (Reactive Event Subscription)
+-------------------------------------------------------------+
|                  CENTRAL STATE SYNCHRONIZER                 |
|  - Selected Object Pointer (Pack, Module ID, Cell ID)       |
|  - Active Layer Mode (Normal, Thermal, SOC, SOH, RUL)       |
|  - Simulation Time-Domain & Lifecycle Aging Cursor          |
|  - BMS Anomaly Dispatcher & Synchronization Hooks           |
+-------------------------------------------------------------+
                              ^
                              | (Updates Digital Twin State)
+-------------------------------------------------------------+
|               PHYSICS-INFORMED & PROGNOSTICS CORE           |
|  - 2-RC Thevenin Equivalent Circuit Model (ECM)             |
|  - Lumped 1D Heat Diffusion & Cold Plate Thermal Flux       |
|  - Parabolic Arrhenius Solid Electrolyte Interphase (SEI)   |
|  - Deterministic BMS Rule Evaluation Engine                 |
+-------------------------------------------------------------+
                              ^
                              | (Input Vector)
+-------------------------------------------------------------+
|                    DATA & TELEMETRY LAYER                   |
|  - Deterministic Seeded Prototype Dataset (NMC 811)         |
|  - Drive Cycle Profiles (WLTP, US06, City, Fast Charge)     |
+-------------------------------------------------------------+
```

## 2. Object Synchronization Protocol
The core UX tenet of DSimulate is strict bi-directional object synchronization:
1. **Tree Selection**: Clicking a component in the left Product Structure Tree sets the active pointer, updates the right Property Inspector, and adjusts the 3D focus.
2. **3D Raycasting**: Clicking a cell directly inside the WebGL canvas retrieves `cellMesh.userData.cellId`, updating the tree node and property inspector.
3. **BMS Diagnostic Linking**: Selecting an active diagnostic event (e.g. `D-003`) immediately activates the target object (`Cell C-017`), shifts the viewport to `THERMAL` mode, and highlights the physical element.
