# DSimulate Simulation Engine

## 1. Time-Domain Transient Solver
The time-domain simulation solver evaluates transient battery response over standard automotive drive cycles:
- **WLTP Class 3**: Mixed urban, suburban, and high-speed highway segments.
- **US06**: High-power aggressive highway profile featuring acceleration peaks up to 3C.
- **City Commute**: Frequent stop-and-start intervals with high regenerative braking recapture.
- **Extreme DC Fast Charge**: High continuous charging currents (350 kW level) causing rapid thermal rise.

### Time Stepping
Integration uses an adaptive Runge-Kutta numerical method with a standard timestep of $\Delta t = 0.5\,\text{s}$ to $1.0\,\text{s}$, logging discrete states at 30-second reporting intervals across a 1,800-second testing window.

## 2. Multi-Cycle Aging Extrapolation Engine
The cycle aging solver calculates long-term capacity fade, resistance growth, and Remaining Useful Life (RUL) projections:
- Evaluates degradation from BOL (Cycle 0) through 2,200 cycles.
- Sets the End-of-Life (EOL) threshold at $80.0\%$ State of Health (SOH).
- Computes 95% Bayesian confidence bounds to provide realistic prognostics without fabricated certainty.

## 3. Real-Time Timeline Controls
- **Transient Mode**: Allows play, pause, step-forward, and scrub across the drive cycle duration.
- **Cycle Aging Mode**: Allows scrubbing across historical cycles (e.g., Cycle 0, 250, 500, 716) and future projections up to 2,000 cycles, with instantaneous synchronization across all 96 cells in 3D.
