# DSimulate

**Physics-Informed Battery Digital Twin for Data-Driven State Estimation, Degradation Prognostics, Remaining Useful Life Prediction and Intelligent BMS Diagnostics**

DSimulate is an engineering-grade digital twin workstation for electric vehicle (EV) traction battery packs. It replicates the interaction ergonomics and visual language of industrial engineering simulation environments (compact typography, enterprise blue application chrome, split-pane trees, object inspectors, high-density telemetry, and interactive 3D WebGL assembly inspection).

---

## Key Features

1. **Interactive 3D EV Battery Digital Twin**:
   - Skateboard architecture featuring an aluminum enclosure tray, bottom liquid cold plate, high-voltage junction box, and 8 modules containing 96 prismatic Li-ion cells (NMC 811).
   - Real-time CAD/CAE inspection: Orbit, Pan, Zoom, Exploded view slider, Section clipping planes, Wireframe mode, and Camera presets (Isometric, Top, Front, Side).
   - Interactive Raycasting: Click any cell or module to synchronize the Object Inspector, 3D highlight contours, diagnostics, and degradation charts.

2. **Multi-Layer Engineering Visualization Modes**:
   - `NORMAL`: Engineering CAD shaded finish with color-coded high-voltage terminals and busbars.
   - `THERMAL`: Scientific Turbo/Jet colormap visualizing localized temperature gradients and identifying hot cells (such as Cell C-017 at 41.7°C).
   - `SOC`: State of Charge gradient from depletion to full capacity.
   - `SOH`: State of Health gradient with 80% End-of-Life (EOL) warning levels.
   - `VOLTAGE`: Cell voltage imbalance deviation mapping.
   - `DEGRADATION`: Solid Electrolyte Interphase (SEI) passivation and lithium inventory loss mapping.
   - `RUL`: Remaining Useful Life cycle projections per individual cell.

3. **Physics-Informed Mathematical Engine**:
   - **Electrical**: 2-RC Thevenin Equivalent Circuit Model (ECM) capturing ohmic drop, charge transfer overpotentials, and diffusion relaxation.
   - **Thermal**: 1D lumped node heat diffusion balancing Joule dissipation ($I^2 R_0$), reversible entropic heat ($I T \partial V_{oc}/\partial T$), and cold-plate glycol convection.
   - **Aging**: Empirical Arrhenius-accelerated SEI layer growth ($N^{0.5}$ parabolic law) and internal resistance growth.
   - **Prognostics**: RUL prediction to the 80% SOH EOL threshold with 95% Bayesian confidence intervals.

4. **Deterministic BMS Anomaly Detection Engine**:
   - Evaluates rule checks (cell voltage imbalance, excessive thermal gradients, ohmic resistance anomalies, SOH dispersion).
   - **Click-to-3D Synchronization**: Clicking any diagnostic anomaly row (e.g. `D-003: Cell C-017 Localized Thermal Excursion`) immediately zooms and highlights the affected cell in the 3D twin, switches to the appropriate layer, and opens the root-cause physics breakdown.

5. **Parametric What-If Lab & Comparison Matrix**:
   - Test operational sensitivities: Sub-zero winter cold, desert heat, aggressive highway speeds, and DC fast-charging frequency.
   - Side-by-side trade-off matrix with 5-axis radar spider charts and overlaid life-cycle trajectories.

---

## Technical Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **3D Graphics**: Three.js WebGL rendering engine
- **State Architecture**: Reactive event-driven pub-sub store with zero-lag object synchronization
- **Styling**: Industrial engineering workstation design language (`#005B91` primary enterprise blue, `#F4F5F6` workspace, crisp 1px borders, zero-pill discipline)

---

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── charts/          # Precision SVG line, scatter, and radar charts
│   │   ├── common/          # EngineeringPanel, EngineeringTree, VisualizationLegend
│   │   ├── inspector/       # ObjectInspector telemetry panel
│   │   ├── layout/          # HeaderBar, WorkspaceRibbon, StatusBar
│   │   ├── simulation/      # SimulationTimeline, Cycle Scrubber
│   │   ├── three/           # Battery3DCanvas Three.js viewport
│   │   └── views/           # 12 Workstations (Digital Twin, Diagnostics, What-If, etc.)
│   ├── services/
│   │   ├── batteryData.ts   # Deterministic seeded prototype battery dataset
│   │   └── physicsEngine.ts # 2-RC ECM, thermal diffusion, and Arrhenius degradation
│   ├── stores/
│   │   └── useBatteryStore.ts # Central state synchronization
│   ├── types/
│   │   └── battery.ts       # Typed battery models, telemetry, and diagnostics
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── architecture.md
├── physics-model.md
├── simulation-engine.md
└── data-model.md
```
