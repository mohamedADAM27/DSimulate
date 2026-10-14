/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Cell Pack Cooling & Fluid Flow Simulation Digital Twin
 * Grounded in SIMULIA Physics Results Explorer (PKE4_CellPackCooling.A.1)
 * Evaluates convective cooling distribution and heat transfer effectiveness.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Wind, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Activity, 
  Droplets,
  BarChart2,
  Gauge,
  Thermometer,
  ShieldAlert,
  Info,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export type FlowFieldMode = 'VELOCITY' | 'TEMPERATURE' | 'EFFECTIVENESS' | 'PRESSURE';
export type CoolantType = 'GLYCOL_WATER' | 'DIELECTRIC' | 'FORCED_AIR';

export interface CoolingEvaluation {
  inletVelocity: number;      // m/s
  volumetricFlowRateLpm: number; // L/min
  massFlowRate: number;       // kg/s
  reynoldsNumber: number;     // dimensionless
  flowRegime: 'LAMINAR' | 'TRANSITIONAL' | 'TURBULENT';
  totalHeatRemovedKw: number; // kW
  maxCellTemp: number;        // °C
  minCellTemp: number;        // °C
  tempSpreadDeltaT: number;   // °C
  coolingEffectivenessPct: number; // %
  pressureDropKpa: number;    // kPa
  pumpingPowerWatts: number;  // W
  avgHeatTransferCoeff: number; // W/(m²·K)
}

export const CellPackCfdSimulation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    coolantFlowVelocity: storeVelocity,
    coolantFluidType: storeFluidType,
    calculatedHeatTransferCoeff,
    setFluidFlowCoupling 
  } = useBatteryStore();

  // Dual split-viewport canvas references
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const leftSceneRef = useRef<THREE.Scene | null>(null);
  const leftCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const leftRendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const rightSceneRef = useRef<THREE.Scene | null>(null);
  const rightCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rightRendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Shared 3D cell and streamline meshes
  const leftCellsRef = useRef<THREE.Mesh[]>([]);
  const rightCellsRef = useRef<THREE.Mesh[]>([]);
  const leftStreamlinesRef = useRef<THREE.Group | null>(null);
  const rightStreamlinesRef = useRef<THREE.Group | null>(null);

  // Dynamic particle systems for directional fluid flow animation
  const leftParticlesRef = useRef<THREE.Points | null>(null);
  const rightParticlesRef = useRef<THREE.Points | null>(null);
  const particleSeedsRef = useRef<{ initialX: number; initialZ: number; currentProgress: number; speedMultiplier: number }[]>([]);

  // Simulation Controls & Parameters
  const [flowFieldMode, setFlowFieldMode] = useState<FlowFieldMode>('VELOCITY');
  const [coolantType, setCoolantType] = useState<CoolantType>(storeFluidType || 'GLYCOL_WATER');
  const [inletVelocity, setInletVelocity] = useState<number>(storeVelocity || 2.15); // m/s
  const [inletTempC, setInletTempC] = useState<number>(20.0); // °C
  const [channelGapMm, setChannelGapMm] = useState<number>(3.5); // mm
  const [hydraulicDiamMm, setHydraulicDiamMm] = useState<number>(18.0); // mm
  const [currentFrame, setCurrentFrame] = useState<number>(7);     // Frame 7 ( 14:00 )
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedCellId, setSelectedCellId] = useState<string>('C-01');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Camera orbit controls for left 3D canvas
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI * 0.35, phi: Math.PI * 0.32, radius: 24 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Sync parameters to store whenever velocity, fluidType, inletTemp, or geometry changes
  useEffect(() => {
    setFluidFlowCoupling(inletVelocity, coolantType, inletTempC, hydraulicDiamMm, channelGapMm);
  }, [inletVelocity, coolantType, inletTempC, hydraulicDiamMm, channelGapMm, setFluidFlowCoupling]);

  // Staggered cylindrical cells configuration (21 cells in hexagonal pitch matching reference)
  const cellPositions = useMemo(() => [
    { id: 'C-01', x: 2.4, z: 3.2, distFromInlet: 0.0, isStagnationPoint: true }, // Direct stagnation impact
    { id: 'C-02', x: 2.4, z: 1.6, distFromInlet: 1.6, isStagnationPoint: false },
    { id: 'C-03', x: 2.4, z: 0.0, distFromInlet: 3.2, isStagnationPoint: false },
    { id: 'C-04', x: 2.4, z: -1.6, distFromInlet: 4.8, isStagnationPoint: false },
    { id: 'C-05', x: 2.4, z: -3.2, distFromInlet: 6.4, isStagnationPoint: false },

    { id: 'C-06', x: 1.2, z: 2.4, distFromInlet: 1.4, isStagnationPoint: false },
    { id: 'C-07', x: 1.2, z: 0.8, distFromInlet: 2.8, isStagnationPoint: false },
    { id: 'C-08', x: 1.2, z: -0.8, distFromInlet: 4.4, isStagnationPoint: false },
    { id: 'C-09', x: 1.2, z: -2.4, distFromInlet: 5.8, isStagnationPoint: false },

    { id: 'C-10', x: 0.0, z: 3.2, distFromInlet: 2.6, isStagnationPoint: false },
    { id: 'C-11', x: 0.0, z: 1.6, distFromInlet: 3.8, isStagnationPoint: false },
    { id: 'C-12', x: 0.0, z: 0.0, distFromInlet: 5.0, isStagnationPoint: false },
    { id: 'C-13', x: 0.0, z: -1.6, distFromInlet: 6.2, isStagnationPoint: false },
    { id: 'C-14', x: 0.0, z: -3.2, distFromInlet: 7.4, isStagnationPoint: false },

    { id: 'C-15', x: -1.2, z: 2.4, distFromInlet: 3.8, isStagnationPoint: false },
    { id: 'C-16', x: -1.2, z: 0.8, distFromInlet: 4.9, isStagnationPoint: false },
    { id: 'C-17', x: -1.2, z: -0.8, distFromInlet: 6.1, isStagnationPoint: false },
    { id: 'C-18', x: -1.2, z: -2.4, distFromInlet: 7.5, isStagnationPoint: false },

    { id: 'C-19', x: -2.4, z: 1.6, distFromInlet: 5.2, isStagnationPoint: false },
    { id: 'C-20', x: -2.4, z: 0.0, distFromInlet: 6.5, isStagnationPoint: false },
    { id: 'C-21', x: -2.4, z: -1.6, distFromInlet: 7.8, isStagnationPoint: false },
  ], []);

  // Quantitative Fluid-Flow & Cooling Effectiveness Calculation
  const metrics: CoolingEvaluation = useMemo(() => {
    // Thermal physical properties based on fluid
    const density = coolantType === 'GLYCOL_WATER' ? 1060 : (coolantType === 'DIELECTRIC' ? 820 : 1.18); // kg/m3
    const viscosity = coolantType === 'GLYCOL_WATER' ? 0.0032 : (coolantType === 'DIELECTRIC' ? 0.0065 : 0.0000185); // Pa·s
    const conductivity = coolantType === 'GLYCOL_WATER' ? 0.42 : (coolantType === 'DIELECTRIC' ? 0.14 : 0.026); // W/(m·K)
    const specificHeat = coolantType === 'GLYCOL_WATER' ? 3500 : (coolantType === 'DIELECTRIC' ? 1950 : 1005); // J/(kg·K)

    // Flow geometry
    const Dh = hydraulicDiamMm / 1000; // m
    const ductWidth = 0.18; // m
    const ductArea = ductWidth * (channelGapMm / 1000); // m2

    // Temporal frame development multiplier (Frame 1 = initial pump ramp 0.6x, Frame 15 = fully developed 1.05x)
    const frameFactor = 0.6 + (currentFrame / 15) * 0.45;
    const effectiveVelocity = inletVelocity * frameFactor;

    // Volumetric and mass flow
    const volumetricFlowRateLpm = Number((effectiveVelocity * ductArea * 60000).toFixed(1));
    const massFlowRate = Number((density * ductArea * effectiveVelocity).toFixed(2));
    
    // Reynolds number & Regime
    const reynoldsNumber = Math.round((density * effectiveVelocity * Dh) / viscosity);
    const flowRegime: 'LAMINAR' | 'TRANSITIONAL' | 'TURBULENT' = 
      reynoldsNumber < 2300 ? 'LAMINAR' : (reynoldsNumber < 4000 ? 'TRANSITIONAL' : 'TURBULENT');

    // Prandtl number
    const Pr = (viscosity * specificHeat) / conductivity;

    // Zukauskas convective heat transfer correlation for cylinder cross-flow banks
    const cConst = reynoldsNumber >= 1000 ? 0.35 : 0.51;
    const mExp = reynoldsNumber >= 1000 ? 0.60 : 0.50;
    const Nu = cConst * Math.pow(Math.max(80, reynoldsNumber), mExp) * Math.pow(Math.max(0.7, Pr), 0.36);
    const baseH = Math.round((Nu * conductivity) / Dh);

    // Temperature distribution
    const minCellTemp = Number((inletTempC + 4.8 / Math.max(0.4, effectiveVelocity * 0.85)).toFixed(1)); // Lead cell
    const maxCellTemp = Number((minCellTemp + 6.4 / Math.sqrt(effectiveVelocity)).toFixed(1));    // Downstream wake cell
    const tempSpreadDeltaT = Number((maxCellTemp - minCellTemp).toFixed(1));

    // Effectiveness: Ratio of actual convective dissipation vs ideal isothermal dissipation
    const coolingEffectivenessPct = Number(Math.max(52, Math.min(98, 95.0 - (tempSpreadDeltaT * 2.6))).toFixed(1));
    const totalHeatRemovedKw = Number((4.18 * Math.pow(effectiveVelocity, 0.48) * (baseH / 850)).toFixed(2));

    // Hydraulic pressure drop (Zukauskas correlation)
    const frictionFactor = 0.25 * Math.pow(Math.max(200, reynoldsNumber), -0.22);
    const dynamicPressure = 0.5 * density * Math.pow(effectiveVelocity, 2);
    const numRows = 5;
    const pressureDropKpa = Number(((numRows * frictionFactor * dynamicPressure) / 1000).toFixed(2));
    const pumpingPowerWatts = Math.round((pressureDropKpa * 1000 * (volumetricFlowRateLpm / 60000)) / 0.65); // 65% pump efficiency

    return {
      inletVelocity: Number(effectiveVelocity.toFixed(2)),
      volumetricFlowRateLpm,
      massFlowRate,
      reynoldsNumber,
      flowRegime,
      totalHeatRemovedKw,
      maxCellTemp,
      minCellTemp,
      tempSpreadDeltaT,
      coolingEffectivenessPct,
      pressureDropKpa,
      pumpingPowerWatts,
      avgHeatTransferCoeff: baseH,
    };
  }, [inletVelocity, coolantType, inletTempC, channelGapMm, hydraulicDiamMm, currentFrame]);

  // Selected cell telemetry breakdown
  const activeCellObj = useMemo(() => {
    return cellPositions.find(c => c.id === selectedCellId) || cellPositions[0];
  }, [selectedCellId, cellPositions]);

  const selectedCellMetrics = useMemo(() => {
    const normDist = activeCellObj.distFromInlet / 7.8;
    const localTemp = Number((metrics.minCellTemp + normDist * metrics.tempSpreadDeltaT).toFixed(1));
    const isStagnation = activeCellObj.isStagnationPoint;
    const localVel = isStagnation 
      ? metrics.inletVelocity * 1.35 // Acceleration around stagnation curve
      : metrics.inletVelocity * (0.85 + (1 - normDist) * 0.3);
    const localH = Math.round(metrics.avgHeatTransferCoeff * (isStagnation ? 1.25 : (1.1 - normDist * 0.25)));
    const heatFluxWm2 = Math.round(localH * (localTemp - inletTempC));
    const localRe = Math.round(metrics.reynoldsNumber * (localVel / metrics.inletVelocity));

    return {
      id: activeCellObj.id,
      localTemp,
      localVel: Number(localVel.toFixed(2)),
      localH,
      heatFluxWm2,
      localRe,
      isStagnation,
      flowFeature: isStagnation 
        ? 'Direct intake impingement & boundary layer thinning' 
        : (normDist < 0.4 ? 'Accelerated interstitial throat flow' : 'Vortex shedding wake recirculation zone'),
    };
  }, [activeCellObj, metrics, inletTempC]);

  // Camera Position Helper
  const updateLeftCameraPosition = useCallback(() => {
    if (!leftCameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    leftCameraRef.current.position.set(
      cameraTargetRef.current.x + x,
      cameraTargetRef.current.y + y,
      cameraTargetRef.current.z + z
    );
    leftCameraRef.current.lookAt(cameraTargetRef.current);
  }, []);

  // CFD Streamline Ribbons Generation Function
  const createStreamlineGroup = useCallback((is2D: boolean = false) => {
    const group = new THREE.Group();
    const lineCount = 38;
    const inletX = 2.4;
    const inletZ = 7.5;
    const cornerCellPos = new THREE.Vector2(2.4, 3.2);
    const cylinderRadius = 0.72;

    for (let i = 0; i < lineCount; i++) {
      const offset = (i / (lineCount - 1) - 0.5) * 1.6;
      const points: THREE.Vector3[] = [];
      const steps = 60;

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const startX = inletX + offset;
        const currentZ = inletZ - t * 11.5;

        // Fluid flow bifurcation around the cylinder
        const dx = startX - cornerCellPos.x;
        const dz = currentZ - cornerCellPos.y;
        const dist = Math.sqrt(dx * dx + dz * dz);

        let finalX = startX;
        let finalZ = currentZ;

        if (dist < cylinderRadius * 2.8) {
          const deflection = (cylinderRadius * 1.3) / Math.max(0.5, dist);
          finalX += (dx >= 0 ? 1 : -1) * deflection * (1 - dist / (cylinderRadius * 2.8));
        }

        const wave = Math.sin(t * 14 + i * 0.4) * 0.08 * (1 - t);
        finalX += wave;

        const yLevel = is2D ? 0.05 : -1.8 + Math.sin(t * Math.PI) * 0.4;
        points.push(new THREE.Vector3(finalX, yLevel, finalZ));
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 45, is2D ? 0.035 : 0.03, 6, false);

      // Colormap representing velocity stream
      const normSpeed = Math.sin((i / lineCount) * Math.PI);
      const color = new THREE.Color();
      if (normSpeed > 0.6) {
        color.setRGB(0.95, 0.85, 0.1); // High velocity jet (Yellow)
      } else if (normSpeed > 0.3) {
        color.setRGB(0.2, 0.85, 0.3); // Medium convective velocity (Green)
      } else {
        color.setRGB(0.1, 0.5, 0.85); // Recirculating wake (Cyan/Blue)
      }

      const tubeMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.75,
      });

      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(mesh);
    }

    // Cooling Intake Nozzle Structure
    const ductGeo = new THREE.BoxGeometry(2.0, is2D ? 0.1 : 1.2, 2.8);
    const ductMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      metalness: 0.7,
      roughness: 0.3,
      wireframe: true,
    });
    const ductMesh = new THREE.Mesh(ductGeo, ductMat);
    ductMesh.position.set(inletX, is2D ? 0.05 : -1.8, 6.2);
    group.add(ductMesh);

    return group;
  }, []);

  // Directional Particle System Creator (for high-fidelity flow visual animation)
  const createParticleSystem = useCallback((is2D: boolean = false) => {
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Initialize particle seeds
    if (particleSeedsRef.current.length === 0) {
      for (let i = 0; i < particleCount; i++) {
        particleSeedsRef.current.push({
          initialX: 2.4 + (Math.random() - 0.5) * 1.7,
          initialZ: 7.5 - Math.random() * 11.5,
          currentProgress: Math.random(),
          speedMultiplier: 0.8 + Math.random() * 0.4,
        });
      }
    }

    for (let i = 0; i < particleCount; i++) {
      const p = particleSeedsRef.current[i];
      positions[i * 3] = p.initialX;
      positions[i * 3 + 1] = is2D ? 0.12 : -1.6;
      positions[i * 3 + 2] = p.initialZ;

      // Color from bright cyan to yellow
      colors[i * 3] = 0.2 + 0.7 * (1 - p.currentProgress);
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.9 * p.currentProgress;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: is2D ? 0.18 : 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }, []);

  // Build Scene Models for both viewports
  const populateScene = useCallback((
    scene: THREE.Scene, 
    is2D: boolean, 
    cellRefList: React.MutableRefObject<THREE.Mesh[]>,
    particlesRef: React.MutableRefObject<THREE.Points | null>
  ) => {
    cellRefList.current = [];

    const cellRadius = 0.58;
    const cellHeight = is2D ? 0.2 : 4.4;
    const cellGeo = new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 32);
    const capGeo = new THREE.CylinderGeometry(cellRadius * 0.95, cellRadius * 0.95, 0.25, 32);
    const terminalGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 24);

    cellPositions.forEach((cp) => {
      // Cell body: Translucent glass-metallic styling matching reference screenshot
      const cellMat = new THREE.MeshStandardMaterial({
        color: 0xDCE3EA,
        metalness: 0.65,
        roughness: 0.25,
        transparent: true,
        opacity: is2D ? 0.95 : 0.45,
      });

      const cellMesh = new THREE.Mesh(cellGeo, cellMat);
      cellMesh.position.set(cp.x, is2D ? 0 : 0, cp.z);
      cellMesh.userData = { id: cp.id, distFromInlet: cp.distFromInlet, isStagnationPoint: cp.isStagnationPoint };
      scene.add(cellMesh);
      cellRefList.current.push(cellMesh);

      // Top cap and terminal ring
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x94A3B8,
        metalness: 0.8,
        roughness: 0.2,
      });

      const topCap = new THREE.Mesh(capGeo, ringMat);
      topCap.position.set(cp.x, is2D ? 0.12 : cellHeight / 2 + 0.1, cp.z);
      scene.add(topCap);

      const terminal = new THREE.Mesh(terminalGeo, new THREE.MeshStandardMaterial({ color: 0xF59E0B }));
      terminal.position.set(cp.x, is2D ? 0.2 : cellHeight / 2 + 0.25, cp.z);
      scene.add(terminal);
    });

    const streamlines = createStreamlineGroup(is2D);
    scene.add(streamlines);
    if (is2D) {
      rightStreamlinesRef.current = streamlines;
    } else {
      leftStreamlinesRef.current = streamlines;
    }

    // Directional flowing particle cloud
    const particles = createParticleSystem(is2D);
    scene.add(particles);
    particlesRef.current = particles;

    const grid = new THREE.GridHelper(20, 20, 0x475569, 0x334155);
    grid.position.y = is2D ? -0.2 : -2.3;
    scene.add(grid);
  }, [cellPositions, createParticleSystem, createStreamlineGroup]);

  // Initialize Left (3D Perspective) & Right (2D Orthographic) Viewports
  useEffect(() => {
    if (!leftCanvasRef.current || !rightCanvasRef.current) return;

    const leftWidth = leftCanvasRef.current.clientWidth;
    const leftHeight = leftCanvasRef.current.clientHeight;
    const rightWidth = rightCanvasRef.current.clientWidth;
    const rightHeight = rightCanvasRef.current.clientHeight;

    // --- 1. LEFT 3D PERSPECTIVE SCENE ---
    const leftScene = new THREE.Scene();
    leftScene.background = new THREE.Color(0x272B30); // Engineering dark slate from reference screenshot
    leftSceneRef.current = leftScene;

    const leftCamera = new THREE.PerspectiveCamera(35, leftWidth / leftHeight, 0.1, 1000);
    leftCameraRef.current = leftCamera;
    updateLeftCameraPosition();

    const leftRenderer = new THREE.WebGLRenderer({
      canvas: leftCanvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    leftRenderer.setSize(leftWidth, leftHeight);
    leftRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    leftRendererRef.current = leftRenderer;

    const leftKeyLight = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    leftKeyLight.position.set(15, 25, 15);
    leftScene.add(leftKeyLight);

    const leftFillLight = new THREE.DirectionalLight(0x94A3B8, 0.8);
    leftFillLight.position.set(-15, 10, -15);
    leftScene.add(leftFillLight);
    leftScene.add(new THREE.AmbientLight(0x404040, 1.2));

    populateScene(leftScene, false, leftCellsRef, leftParticlesRef);

    // --- 2. RIGHT 2D ORTHOGRAPHIC SCENE ---
    const rightScene = new THREE.Scene();
    rightScene.background = new THREE.Color(0x272B30);
    rightSceneRef.current = rightScene;

    const aspect = rightWidth / rightHeight;
    const frustumSize = 13.5;
    const rightCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    rightCamera.position.set(0, 18, 0);
    rightCamera.lookAt(0, 0, 0);
    rightCamera.rotation.z = Math.PI;
    rightCameraRef.current = rightCamera;

    const rightRenderer = new THREE.WebGLRenderer({
      canvas: rightCanvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    rightRenderer.setSize(rightWidth, rightHeight);
    rightRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rightRendererRef.current = rightRenderer;

    const rightLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
    rightLight.position.set(0, 20, 0);
    rightScene.add(rightLight);
    rightScene.add(new THREE.AmbientLight(0x606060, 1.5));

    populateScene(rightScene, true, rightCellsRef, rightParticlesRef);

    // --- 3. DYNAMIC CFD FLOW & PARTICLE ANIMATION LOOP ---
    let animId: number;
    let clock = new THREE.Clock();

    const render = () => {
      animId = requestAnimationFrame(render);
      const delta = clock.getDelta();

      // Advance particles along flow direction if playing!
      if (isPlaying) {
        const velSpeed = inletVelocity * 2.8;

        [leftParticlesRef.current, rightParticlesRef.current].forEach((pts, pIdx) => {
          if (!pts) return;
          const posAttr = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
          if (!posAttr) return;

          const count = particleSeedsRef.current.length;
          for (let i = 0; i < count; i++) {
            const seed = particleSeedsRef.current[i];
            seed.currentProgress += delta * (velSpeed * 0.12 * seed.speedMultiplier);
            if (seed.currentProgress >= 1.0) {
              seed.currentProgress = 0;
            }

            // Calculate instantaneous particle trajectory past cylindrical array
            const inletZ = 7.5;
            const outletZ = -4.5;
            const curZ = inletZ - seed.currentProgress * (inletZ - outletZ);
            
            // Deflection calculation
            let curX = seed.initialX;
            const cornerX = 2.4;
            const cornerZ = 3.2;
            const dist = Math.hypot(curX - cornerX, curZ - cornerZ);
            if (dist < 1.8) {
              curX += (curX >= cornerX ? 1 : -1) * (1.8 - dist) * 0.65;
            }

            posAttr.setXYZ(i, curX, pIdx === 1 ? 0.12 : -1.6, curZ);
          }
          posAttr.needsUpdate = true;
        });

        // Pulsing streamline subtle oscillation
        if (leftStreamlinesRef.current && rightStreamlinesRef.current) {
          const shift = Math.sin(clock.getElapsedTime() * inletVelocity * 2) * 0.04;
          leftStreamlinesRef.current.position.z = shift;
          rightStreamlinesRef.current.position.z = shift;
        }
      }

      if (leftRendererRef.current && leftSceneRef.current && leftCameraRef.current) {
        leftRendererRef.current.render(leftSceneRef.current, leftCameraRef.current);
      }
      if (rightRendererRef.current && rightSceneRef.current && rightCameraRef.current) {
        rightRendererRef.current.render(rightSceneRef.current, rightCameraRef.current);
      }
    };
    render();

    const handleResize = () => {
      if (!leftCanvasRef.current || !rightCanvasRef.current) return;

      const lw = leftCanvasRef.current.clientWidth;
      const lh = leftCanvasRef.current.clientHeight;
      if (leftCameraRef.current && leftRendererRef.current) {
        leftCameraRef.current.aspect = lw / lh;
        leftCameraRef.current.updateProjectionMatrix();
        leftRendererRef.current.setSize(lw, lh);
      }

      const rw = rightCanvasRef.current.clientWidth;
      const rh = rightCanvasRef.current.clientHeight;
      if (rightCameraRef.current && rightRendererRef.current) {
        const rAspect = rw / rh;
        rightCameraRef.current.left = (-frustumSize * rAspect) / 2;
        rightCameraRef.current.right = (frustumSize * rAspect) / 2;
        rightCameraRef.current.top = frustumSize / 2;
        rightCameraRef.current.bottom = -frustumSize / 2;
        rightCameraRef.current.updateProjectionMatrix();
        rightRendererRef.current.setSize(rw, rh);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      leftRenderer.dispose();
      rightRenderer.dispose();
    };
  }, [updateLeftCameraPosition, inletVelocity, isPlaying, populateScene]);

  // Update cell colors according to active Flow Field Mode & selected cell highlight
  useEffect(() => {
    const updateCellShading = (cellList: THREE.Mesh[], is2D: boolean) => {
      cellList.forEach((mesh) => {
        const id = mesh.userData.id;
        const dist = mesh.userData.distFromInlet;
        const normDist = dist / 7.8; // 0 (lead cell) to 1 (far corner)
        const isSelected = id === selectedCellId;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;

        if (flowFieldMode === 'TEMPERATURE') {
          // Temperature distribution: Leading cell is chilled (Cyan) -> Downstream cell is warmer (Amber/Red)
          const heatCol = new THREE.Color();
          heatCol.setHSL(0.55 - normDist * 0.45, 0.85, 0.45);
          mat.color.copy(heatCol);
          mat.emissive.copy(heatCol).multiplyScalar(isSelected ? 0.5 : 0.2);
          mat.opacity = is2D ? 0.95 : 0.65;
        } else if (flowFieldMode === 'EFFECTIVENESS') {
          // Heat transfer coefficient / effectiveness: Leading cell has highest Nu (Green/Cyan) -> Wake has lower Nu
          const effCol = new THREE.Color();
          effCol.setHSL(0.35 * (1 - normDist), 0.85, 0.5);
          mat.color.copy(effCol);
          mat.emissive.copy(effCol).multiplyScalar(isSelected ? 0.45 : 0.15);
          mat.opacity = is2D ? 0.95 : 0.6;
        } else if (flowFieldMode === 'PRESSURE') {
          // Pressure distribution: Upstream high stagnation pressure (Red/Orange) to downstream drop (Blue)
          const pCol = new THREE.Color();
          pCol.setHSL(0.02 + normDist * 0.6, 0.85, 0.45);
          mat.color.copy(pCol);
          mat.emissive.copy(pCol).multiplyScalar(isSelected ? 0.45 : 0.15);
          mat.opacity = is2D ? 0.95 : 0.6;
        } else {
          // Standard VELOCITY mode: Glassy metallic finish matching screenshot
          if (isSelected) {
            mat.color.setRGB(0.0, 0.5, 0.85);
            mat.emissive.setRGB(0.0, 0.35, 0.6);
            mat.emissiveIntensity = 0.5;
            mat.opacity = is2D ? 1.0 : 0.85;
          } else {
            mat.color.setRGB(0.82, 0.88, 0.92);
            mat.emissive.setRGB(0, 0, 0);
            mat.emissiveIntensity = 0;
            mat.opacity = is2D ? 0.92 : 0.45;
          }
        }
      });
    };

    updateCellShading(leftCellsRef.current, false);
    updateCellShading(rightCellsRef.current, true);
  }, [flowFieldMode, selectedCellId]);

  // Raycasting for interactive cell selection on left 3D canvas
  const handleLeftCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!leftCanvasRef.current || !leftCameraRef.current || !leftSceneRef.current) return;
    const rect = leftCanvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, leftCameraRef.current);
    const intersects = raycaster.intersectObjects(leftCellsRef.current, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.id) {
        setSelectedCellId(hit.userData.id);
      }
    }
  };

  // Raycasting for interactive cell selection on right 2D canvas
  const handleRightCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rightCanvasRef.current || !rightCameraRef.current || !rightSceneRef.current) return;
    const rect = rightCanvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, rightCameraRef.current);
    const intersects = raycaster.intersectObjects(rightCellsRef.current, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.id) {
        setSelectedCellId(hit.userData.id);
      }
    }
  };

  // Mouse orbit dragging on left 3D canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleRef.current.theta -= deltaX * 0.008;
    cameraAngleRef.current.phi = Math.max(
      0.08,
      Math.min(Math.PI / 2 - 0.05, cameraAngleRef.current.phi - deltaY * 0.008)
    );
    updateLeftCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngleRef.current.radius = Math.max(
      10,
      Math.min(45, cameraAngleRef.current.radius + e.deltaY * 0.03)
    );
    updateLeftCameraPosition();
  };

  // Full reset function for fluid flow simulation
  const handleFullReset = () => {
    setInletVelocity(2.15);
    setCoolantType('GLYCOL_WATER');
    setInletTempC(20.0);
    setChannelGapMm(3.5);
    setHydraulicDiamMm(18.0);
    setCurrentFrame(7);
    setSelectedCellId('C-01');
    setIsPlaying(true);
    cameraAngleRef.current = { theta: Math.PI * 0.35, phi: Math.PI * 0.32, radius: 24 };
    updateLeftCameraPosition();
  };

  return (
    <div className={`flex flex-col h-full bg-[#1A1D20] text-white select-none border border-[#404850] rounded-[2px] overflow-hidden ${className}`}>
      {/* 1. Header Bar matching SIMULIA / 3DEXPERIENCE Physics Results Explorer */}
      <div className="h-[34px] bg-[#005B91] border-b border-[#004773] px-3 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-wide flex items-center gap-1.5 text-[12px]">
            <Wind className="w-4 h-4 text-[#7DD3FC]" />
            <span>PKE4_CellPackCooling.A.1</span>
          </span>
          <span className="text-white/40">|</span>
          <span className="text-[11px] text-white/90 font-mono-numbers">
            Result Of Flow Analysis Case.1 | Steady-State Step.1 | {flowFieldMode}.T | Frame: {currentFrame} ( 14:00 )
          </span>
        </div>

        {/* View Mode Field Selector & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-[#004B78] p-0.5 rounded-[2px] border border-white/20 text-[10.5px]">
            <button
              onClick={() => setFlowFieldMode('VELOCITY')}
              className={`px-2 py-0.5 font-medium rounded-[2px] transition-colors ${
                flowFieldMode === 'VELOCITY' ? 'bg-[#0072A8] text-white font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              Velocity.T
            </button>
            <button
              onClick={() => setFlowFieldMode('TEMPERATURE')}
              className={`px-2 py-0.5 font-medium rounded-[2px] transition-colors ${
                flowFieldMode === 'TEMPERATURE' ? 'bg-[#0072A8] text-white font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              Temperature.T
            </button>
            <button
              onClick={() => setFlowFieldMode('EFFECTIVENESS')}
              className={`px-2 py-0.5 font-medium rounded-[2px] transition-colors ${
                flowFieldMode === 'EFFECTIVENESS' ? 'bg-[#0072A8] text-white font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              HeatFlux.h
            </button>
            <button
              onClick={() => setFlowFieldMode('PRESSURE')}
              className={`px-2 py-0.5 font-medium rounded-[2px] transition-colors ${
                flowFieldMode === 'PRESSURE' ? 'bg-[#0072A8] text-white font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              Pressure.P
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1 rounded-[2px] border transition-colors ${
              isPlaying ? 'bg-[#D97706] text-white border-[#F59E0B]' : 'bg-[#004B78] hover:bg-[#003B5C] text-white/90 border-white/20'
            }`}
            title={isPlaying ? 'Pause Flow Simulation' : 'Resume Flow Simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleFullReset}
            className="p-1 bg-[#004B78] hover:bg-[#003B5C] rounded-[2px] text-white/90 border border-white/20"
            title="Reset Simulation to Nominal Design Point"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowConfigModal(!showConfigModal)}
            className={`px-2 py-1 rounded-[2px] text-[10.5px] font-semibold flex items-center gap-1 border transition-colors ${
              showConfigModal ? 'bg-[#0072A8] text-white border-white/40' : 'bg-[#004B78] hover:bg-[#003B5C] text-white/90 border-white/20'
            }`}
            title="CFD Channel Geometry & Boundary Parameters"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Fluid Config</span>
          </button>
        </div>
      </div>

      {/* 2. Dual Split Viewports (3D Isometric Left + 2D Top-Down Right) */}
      <div className="flex-1 grid grid-cols-2 gap-[1px] bg-[#404850] min-h-0 relative">
        {/* LEFT VIEWPORT: 3D Isometric View */}
        <div 
          className="relative w-full h-full bg-[#272B30] overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleLeftCanvasClick}
        >
          {/* Subheader Title Banner matching reference image */}
          <div className="absolute top-0 left-0 right-0 h-[22px] bg-[#1E2226]/90 border-b border-[#404850] px-2.5 flex items-center justify-between text-[10px] text-[#A0AEC0] font-mono-numbers z-10 pointer-events-none">
            <span>Result Of Flow Analysis Case.1 | Steady-State Step.1 | {flowFieldMode}.T | Frame: {currentFrame} ( 14:00 )</span>
            <span className="text-[#38BDF8]">3D Isometric CFD View · Click cell to inspect</span>
          </div>

          <canvas ref={leftCanvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

          {/* Left Viewport Overlay Telemetry */}
          <div className="absolute bottom-3 left-3 bg-[#1A1D20]/95 border border-[#404850] p-2 rounded-[2px] text-[10.5px] font-mono-numbers z-10 pointer-events-none space-y-1 shadow-md">
            <div className="text-[10px] text-[#A0AEC0] uppercase font-sans font-semibold">Boundary Inlet Velocity</div>
            <div className="text-[#FBBF24] text-[13px] font-bold">{metrics.inletVelocity.toFixed(2)} m/s</div>
            <div className="text-[#94A3B8] text-[9.5px]">Mass Flow: {metrics.massFlowRate} kg/s · Q: {metrics.volumetricFlowRateLpm} L/min</div>
            <div className="text-[9px] text-[#38BDF8]">
              Regime: {metrics.flowRegime} (Re = {metrics.reynoldsNumber.toLocaleString()})
            </div>
          </div>

          {/* Interactive Selected Cell Float Card */}
          <div className="absolute top-8 left-3 bg-[#1A1D20]/95 border border-[#38BDF8] p-2.5 rounded-[2px] text-[10.5px] z-10 shadow-lg pointer-events-none space-y-1 max-w-[240px]">
            <div className="flex items-center justify-between font-bold text-[#38BDF8]">
              <span>Selected: {selectedCellMetrics.id}</span>
              <span className="text-[9.5px] text-[#A0AEC0] font-mono font-normal">
                {selectedCellMetrics.isStagnation ? 'Lead Inflow' : 'Matrix'}
              </span>
            </div>
            <div className="text-white text-[12px] font-mono font-semibold">
              Temp: {selectedCellMetrics.localTemp} °C · Vel: {selectedCellMetrics.localVel} m/s
            </div>
            <div className="text-[9px] text-[#CBD5E1] font-mono">
              h: {selectedCellMetrics.localH} W/m²K · q'': {selectedCellMetrics.heatFluxWm2} W/m²
            </div>
            <div className="text-[8.5px] text-[#94A3B8] font-sans italic border-t border-[#334155] pt-0.5">
              {selectedCellMetrics.flowFeature}
            </div>
          </div>

          <div className="absolute bottom-3 right-3 text-[9.5px] text-[#94A3B8] font-mono-numbers pointer-events-none bg-[#1A1D20]/80 px-2 py-0.5 rounded-[2px] border border-[#404850]">
            Isometric (X-Y-Z)
          </div>
        </div>

        {/* RIGHT VIEWPORT: 2D Orthographic Top-Down View */}
        <div 
          className="relative w-full h-full bg-[#272B30] overflow-hidden"
          onClick={handleRightCanvasClick}
        >
          {/* Subheader Title Banner matching reference image */}
          <div className="absolute top-0 left-0 right-0 h-[22px] bg-[#1E2226]/90 border-b border-[#404850] px-2.5 flex items-center justify-between text-[10px] text-[#A0AEC0] font-mono-numbers z-10 pointer-events-none">
            <span>Result Of Flow Analysis Case.1 | Steady-State Step.1 | {flowFieldMode}.T | Frame: {currentFrame} ( 14:00 )</span>
            <span className="text-[#38BDF8]">2D Top-Down Cross Section · Click cell</span>
          </div>

          <canvas ref={rightCanvasRef} className="w-full h-full block cursor-pointer" />

          {/* Right Viewport Colormap Legend */}
          <div className="absolute bottom-3 left-3 bg-[#1A1D20]/95 border border-[#404850] p-2 rounded-[2px] text-[10px] font-mono-numbers z-10 pointer-events-none shadow-md">
            <div className="text-[#A0AEC0] uppercase mb-1">
              {flowFieldMode === 'VELOCITY' && 'CFD Velocity Field (m/s)'}
              {flowFieldMode === 'TEMPERATURE' && 'Cell Surface Temp (°C)'}
              {flowFieldMode === 'EFFECTIVENESS' && 'Convective h [W/(m²·K)]'}
              {flowFieldMode === 'PRESSURE' && 'Hydraulic Pressure (kPa)'}
            </div>
            <div 
              className="h-2 w-44 rounded-[1px] border border-white/10"
              style={{
                background: flowFieldMode === 'TEMPERATURE'
                  ? 'linear-gradient(to right, #0284C7 0%, #10B981 40%, #F59E0B 80%, #DC2626 100%)'
                  : (flowFieldMode === 'PRESSURE'
                    ? 'linear-gradient(to right, #DC2626 0%, #F59E0B 35%, #10B981 70%, #0284C7 100%)'
                    : 'linear-gradient(to right, #1E3A8A 0%, #06B6D4 30%, #10B981 60%, #F59E0B 85%, #DC2626 100%)')
              }}
            />
            <div className="flex justify-between text-[8.5px] text-[#94A3B8] mt-0.5">
              <span>
                {flowFieldMode === 'TEMPERATURE' ? `${metrics.minCellTemp}°` : (flowFieldMode === 'PRESSURE' ? '104.2' : '0.2')}
              </span>
              <span>
                {flowFieldMode === 'TEMPERATURE' ? `${((metrics.minCellTemp + metrics.maxCellTemp)/2).toFixed(1)}°` : (flowFieldMode === 'PRESSURE' ? '102.5' : `${(metrics.inletVelocity * 0.9).toFixed(1)}`)}
              </span>
              <span>
                {flowFieldMode === 'TEMPERATURE' ? `${metrics.maxCellTemp}°` : (flowFieldMode === 'PRESSURE' ? '101.3' : `${(metrics.inletVelocity * 1.5).toFixed(1)}+`)}
              </span>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 text-[9.5px] text-[#94A3B8] font-mono-numbers pointer-events-none bg-[#1A1D20]/80 px-2 py-0.5 rounded-[2px] border border-[#404850]">
            Top-Down (X-Z)
          </div>
        </div>
      </div>

      {/* 3. Fluid Flow Configuration Drawer Modal */}
      {showConfigModal && (
        <div className="absolute inset-x-4 top-12 z-30 bg-[#1E2226]/98 border border-[#38BDF8] p-3 rounded-[3px] shadow-2xl text-[11px] font-sans">
          <div className="flex items-center justify-between border-b border-[#404850] pb-2 mb-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <Sliders className="w-4 h-4 text-[#38BDF8]" />
              <span>CFD Fluid Flow & Channel Geometry Configuration</span>
            </div>
            <button 
              onClick={() => setShowConfigModal(false)}
              className="text-[#94A3B8] hover:text-white text-xs px-2 py-0.5 rounded-[2px] bg-[#334155]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-[#CBD5E1] text-[10px] block mb-1">Coolant Fluid Selection</label>
              <select
                value={coolantType}
                onChange={(e) => setCoolantType(e.target.value as CoolantType)}
                className="w-full bg-[#272B30] border border-[#404850] text-[11px] text-white px-2 py-1 rounded-[2px]"
              >
                <option value="GLYCOL_WATER">Water-Glycol 50/50 (ρ=1060, μ=3.2 mPa·s)</option>
                <option value="DIELECTRIC">Dielectric Immersion (ρ=820, μ=6.5 mPa·s)</option>
                <option value="FORCED_AIR">Forced Air (ρ=1.18, μ=0.0185 mPa·s)</option>
              </select>
              <span className="text-[9px] text-[#94A3B8] block mt-1">Directly updates Reynolds and Prandtl numbers</span>
            </div>

            <div>
              <div className="flex justify-between text-[#CBD5E1] text-[10px] mb-1">
                <span>Inlet Temperature</span>
                <strong className="text-[#38BDF8] font-mono">{inletTempC.toFixed(1)} °C</strong>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="0.5"
                value={inletTempC}
                onChange={(e) => setInletTempC(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#38BDF8] bg-[#334155] cursor-pointer"
              />
              <span className="text-[9px] text-[#94A3B8] block mt-1">Chiller loop feed temperature</span>
            </div>

            <div>
              <div className="flex justify-between text-[#CBD5E1] text-[10px] mb-1">
                <span>Channel Gap (W_gap)</span>
                <strong className="text-[#38BDF8] font-mono">{channelGapMm.toFixed(1)} mm</strong>
              </div>
              <input
                type="range"
                min="2.0"
                max="6.0"
                step="0.2"
                value={channelGapMm}
                onChange={(e) => setChannelGapMm(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#38BDF8] bg-[#334155] cursor-pointer"
              />
              <span className="text-[9px] text-[#94A3B8] block mt-1">Interstitial distance between cell walls</span>
            </div>

            <div>
              <div className="flex justify-between text-[#CBD5E1] text-[10px] mb-1">
                <span>Hydraulic Diameter (D_h)</span>
                <strong className="text-[#38BDF8] font-mono">{hydraulicDiamMm.toFixed(1)} mm</strong>
              </div>
              <input
                type="range"
                min="10"
                max="26"
                step="0.5"
                value={hydraulicDiamMm}
                onChange={(e) => setHydraulicDiamMm(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#38BDF8] bg-[#334155] cursor-pointer"
              />
              <span className="text-[9px] text-[#94A3B8] block mt-1">Governs Nusselt correlation scaling</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bottom Comprehensive Cooling Distribution & Effectiveness Scorecard */}
      <div className="h-[80px] bg-[#1E2226] border-t border-[#404850] px-3 py-1 flex items-center justify-between text-[11px] shrink-0 font-mono-numbers">
        {/* Left Parameter Controls */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#94A3B8] uppercase font-sans">Inlet Flow Velocity</span>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="range"
                min="0.5"
                max="4.5"
                step="0.1"
                value={inletVelocity}
                onChange={(e) => setInletVelocity(parseFloat(e.target.value))}
                className="w-28 h-1.5 accent-[#38BDF8] bg-[#334155] cursor-pointer"
              />
              <span className="font-bold text-[#38BDF8]">{inletVelocity.toFixed(1)} m/s</span>
            </div>
            <span className="text-[9px] text-[#64748B] font-sans">Q = {metrics.volumetricFlowRateLpm} L/min</span>
          </div>

          <div className="h-9 w-[1px] bg-[#404850]"></div>

          <div className="flex flex-col">
            <span className="text-[10px] text-[#94A3B8] uppercase font-sans">Cooling Fluid Type</span>
            <select
              value={coolantType}
              onChange={(e) => setCoolantType(e.target.value as CoolantType)}
              className="bg-[#272B30] border border-[#404850] text-[10.5px] text-white px-2 py-0.5 rounded-[2px] mt-0.5 focus:outline-hidden"
            >
              <option value="GLYCOL_WATER">Water-Glycol (50/50)</option>
              <option value="DIELECTRIC">Dielectric Immersion</option>
              <option value="FORCED_AIR">Forced Air Convection</option>
            </select>
            <span className="text-[9px] text-[#64748B] font-sans">T_in: {inletTempC.toFixed(0)}°C · Gap: {channelGapMm}mm</span>
          </div>
        </div>

        {/* Center Cooling Effectiveness & Thermal Performance Metrics */}
        <div className="flex items-center gap-5 text-[10.5px]">
          <div className="text-center">
            <span className="text-[9.5px] text-[#94A3B8] block font-sans">Cooling Effectiveness:</span>
            <strong className="text-[#38BDF8] text-[14px] font-bold">
              {metrics.coolingEffectivenessPct}%
            </strong>
          </div>

          <div className="text-center">
            <span className="text-[9.5px] text-[#94A3B8] block font-sans">Heat Dissipation:</span>
            <strong className="text-[#4ADE80] text-[13px] font-bold">
              {metrics.totalHeatRemovedKw} kW
            </strong>
          </div>

          <div className="text-center">
            <span className="text-[9.5px] text-[#94A3B8] block font-sans">Pack Thermal Spread (ΔT):</span>
            <strong className={`text-[13px] font-bold ${metrics.tempSpreadDeltaT > 5.0 ? 'text-[#F59E0B]' : 'text-white'}`}>
              {metrics.tempSpreadDeltaT} °C
            </strong>
          </div>

          <div className="text-center">
            <span className="text-[9.5px] text-[#94A3B8] block font-sans">Convective Coeff (h):</span>
            <strong className="text-white text-[13px]">
              {metrics.avgHeatTransferCoeff} W/(m²·K)
            </strong>
          </div>

          <div className="text-center">
            <span className="text-[9.5px] text-[#94A3B8] block font-sans">Pressure Drop (ΔP):</span>
            <strong className="text-[#A0AEC0] text-[13px]">
              {metrics.pressureDropKpa} kPa ({metrics.pumpingPowerWatts}W)
            </strong>
          </div>
        </div>

        {/* Right Frame Stepper & Approximation Note */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#A0AEC0]">Frame:</span>
            <div className="flex items-center gap-1 bg-[#272B30] px-2 py-0.5 rounded-[2px] border border-[#404850]">
              <button 
                onClick={() => setCurrentFrame(f => Math.max(1, f - 1))}
                className="text-[#94A3B8] hover:text-white px-1"
                title="Previous Frame"
              >
                ◀
              </button>
              <span className="text-[#38BDF8] font-bold px-1.5">{currentFrame} / 15</span>
              <button 
                onClick={() => setCurrentFrame(f => Math.min(15, f + 1))}
                className="text-[#94A3B8] hover:text-white px-1"
                title="Next Frame"
              >
                ▶
              </button>
            </div>
          </div>
          <span className="text-[8.5px] text-[#64748B] font-sans">
            *Zukauskas cylinder-bank crossflow model (Quasi-3D CFD approximation)
          </span>
        </div>
      </div>
    </div>
  );
};
