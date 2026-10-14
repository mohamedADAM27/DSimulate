# DSimulate Physics Model Specification

## 1. Electrical Model: 2-RC Thevenin Equivalent Circuit
The electrical dynamics of each lithium-ion cell and the aggregated 96S pack are modeled via a 2-RC Thevenin Equivalent Circuit Model (ECM):

$$V_t(t) = V_{oc}(SOC) - I(t) \cdot R_0 - V_{RC1}(t) - V_{RC2}(t)$$

Where:
- $V_{oc}(SOC)$ is the equilibrium open-circuit voltage determined by an empirical 6th-order polynomial calibrated for NMC 811 chemistry.
- $R_0$ is the high-frequency ohmic resistance representing the current collector tabs, electrolyte bulk conductivity, and separator tortuosity ($R_0 \approx 2.14\,\text{m}\Omega$).
- $V_{RC1}$ models the rapid charge-transfer kinetics across the electrode-electrolyte interface:
  $$\frac{dV_{RC1}}{dt} = \frac{I(t) \cdot R_1 - V_{RC1}}{\tau_1}, \quad \tau_1 = R_1 C_1$$
- $V_{RC2}$ models solid-state lithium diffusion polarization within active electrode particles:
  $$\frac{dV_{RC2}}{dt} = \frac{I(t) \cdot R_2 - V_{RC2}}{\tau_2}, \quad \tau_2 = R_2 C_2$$

## 2. Lumped 1D Thermal Model
Each cell's thermal state is governed by energy conservation:

$$m \cdot C_p \cdot \frac{dT}{dt} = \dot{Q}_{gen} - \dot{Q}_{cool} - \dot{Q}_{loss}$$

Where:
- $\dot{Q}_{gen} = I(t)^2 \cdot R_0 + I(t) \cdot T \cdot \frac{\partial V_{oc}}{\partial T}$ combines irreversible Joule dissipation with reversible entropic heat generation.
- $\dot{Q}_{cool} = h_{plate} \cdot A \cdot (T_{cell} - T_{coolant})$ models convective heat flux to the liquid cold plate.
- $\dot{Q}_{loss} = \frac{T_{cell} - T_{amb}}{R_{conv}}$ models natural convection to ambient air.

## 3. Degradation & Aging Kinetics
Capacity fade is modeled through temperature-accelerated Solid Electrolyte Interphase (SEI) growth:

$$\Delta Q_{fade}(N) = \alpha_{sei} \cdot \sqrt{N} \cdot \exp\left(-\frac{E_a}{R}\left(\frac{1}{T} - \frac{1}{T_{ref}}\right)\right) \cdot \left[1 + \beta (C_{rate} - 1)^2\right]$$

Where:
- $E_a = 31.5\,\text{kJ/mol}$ is the activation energy for solvent reduction.
- $N$ is cumulative full equivalent cycles.
- $C_{rate}$ acceleration accounts for lithium plating during high-rate fast-charging.

Ohmic resistance increase follows the passivation thickness:
$$R_0(N) = R_{0,init} \cdot (1 + \gamma \cdot \sqrt{N})$$
