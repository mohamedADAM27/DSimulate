/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Thermal Simulation & Hotspot Investigation Digital Twin
 * Visual language faithfully reproducing SIMULIA Physics Results Explorer (TR3D_CASE03_DTLP01)
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Thermometer, 
  Sliders, 
  RotateCcw, 
  Play, 
  Pause, 
  Maximize2, 
  Eye, 
  Layers, 
  Wind, 
  Zap, 
  ShieldAlert,
  ArrowRight,
  Activity,
  GitCompare,
  X,
  Search,
  HelpCircle,
  Share2,
  Plus
} from 'lucide-react';

interface HotspotCellData {
  id: string;
  col: number; // 0..3
  row: number; // 0..4
  name: string;
  baseTempKelvin: number;
  peakTempKelvin: number;
  isTrigger: boolean;
  isAdjacent: boolean;
  contactResistanceOhm: number;
  potentialCause: string;
  sensorChannel?: string;
}

interface CoolingScenario {
  id: string;
  name: string;
  description: string;
  flowVelocity: number;
  fluidType: 'GLYCOL_WATER' | 'DIELECTRIC' | 'FORCED_AIR';
  heatTransferCoeff: number;
  peakHotspotTempC: number;
  severity: 'NORMAL' | 'ELEVATED' | 'CRITICAL' | 'RUNAWAY_DANGER';
  mitigationEffectiveness: string;
}

export const ThermalHotspotInvestigation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    coolantFlowVelocity, 
    coolantFluidType, 
    calculatedHeatTransferCoeff,
    setFluidFlowCoupling 
  } = useBatteryStore();

  // 3D Canvas References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cellMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Interactive Operating Parameters
  const [loadCrate, setLoadCrate] = useState<number>(2.0); // 0.5C to 4.0C
  const [ambientTempC, setAmbientTempC] = useState<number>(22.0); // -10 to 45 °C
  const [resistanceMultiplier, setResistanceMultiplier] = useState<number>(2.2); // 1.0x to 4.0x
  const [coolingEfficiencyH, setCoolingEfficiencyH] = useState<number>(calculatedHeatTransferCoeff || 850);
  const [selectedCellId, setSelectedCellId] = useState<string>('C-11');
  const [tempUnit, setTempUnit] = useState<'KELVIN' | 'CELSIUS'>('KELVIN');
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);
  const [showCellInspector, setShowCellInspector] = useState<boolean>(true);

  // X-Y Plot Timeline Cursor (Time in seconds: 0 to 2000s)
  // Default cursor time at 432s exactly matching reference image
  const [cursorTime, setCursorTime] = useState<number>(432); 
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);

  // Sync coolingEfficiencyH with store when fluid flow changes
  useEffect(() => {
    if (calculatedHeatTransferCoeff) {
      setCoolingEfficiencyH(calculatedHeatTransferCoeff);
    }
  }, [calculatedHeatTransferCoeff]);

  // Orbit camera parameters
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI * 0.28, phi: Math.PI * 0.32, radius: 18 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // 20 Cylindrical Cells in 4x5 array (matching module in reference image)
  const cellGridData: HotspotCellData[] = useMemo(() => {
    const list: HotspotCellData[] = [];
    let count = 1;

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const id = `C-${String(count).padStart(2, '0')}`;
        const isTrigger = id === 'C-11'; // Center-row hotspot trigger cell (Col 2, Row 2)
        const isAdjacent = ['C-10', 'C-12', 'C-07', 'C-15'].includes(id);

        let sensorChannel: string | undefined;
        if (id === 'C-11') sensorChannel = 'TC-01 (Hotspot Trigger Core)';
        else if (id === 'C-12') sensorChannel = 'TC-02 (Right Conduction Neighbor)';
        else if (id === 'C-07') sensorChannel = 'TC-03 (Top Longitudinal Neighbor)';
        else if (id === 'C-20') sensorChannel = 'TC-04 (Module Baseline Far-Field)';

        list.push({
          id,
          col: c,
          row: r,
          name: isTrigger ? 'OriginalCell_With_ThermalRunaway' : (isAdjacent ? `TR_Adjacent_${id}` : `Cell_${id}`),
          baseTempKelvin: 293.15 + ambientTempC - 20,
          peakTempKelvin: isTrigger ? (1050 + (resistanceMultiplier - 2.2) * 50) : (isAdjacent ? 365 : 297),
          isTrigger,
          isAdjacent,
          contactResistanceOhm: isTrigger ? 0.00185 * resistanceMultiplier : 0.00022,
          potentialCause: isTrigger
            ? 'Tab weld ultrasonic delamination (+120% R_contact) & localized coolant recirculation dead-zone'
            : (isAdjacent ? 'Transverse thermal conduction wave through module polymer matrix' : 'Nominal convective boundary'),
          sensorChannel,
        });
        count++;
      }
    }
    return list;
  }, [ambientTempC, resistanceMultiplier]);

  // Calibrated temperature curves matching the screenshot's exact numbers at t=432s
  // Green: 727.491 Kdeg, Cyan (TR_2): 354.75 Kdeg, Pink (TR_3): 328.017 Kdeg, Base: 297.157 Kdeg
  const getSimulatedTemperature = useCallback((curveName: 'trigger' | 'tr2' | 'tr3' | 'tr4' | 'tr5', timeS: number): number => {
    const ambientK = 273.15 + ambientTempC;
    const coolingFactor = Math.max(0.35, coolingEfficiencyH / 850);
    const loadFactor = Math.pow(loadCrate / 2.0, 1.8);
    const resFactor = resistanceMultiplier / 2.2;

    if (curveName === 'trigger') {
      // OriginalCell_With_ThermalRunaway:
      // Rapid spike reaching ~1050K near t=75s, decaying to ~727.491K at t=432s, then asymptotic to ~500K
      if (timeS <= 0) return ambientK;
      if (timeS < 75) {
        return ambientK + (1050 * loadFactor * resFactor - ambientK) * Math.sin((timeS / 75) * (Math.PI / 2));
      } else {
        const peakK = 1050 * loadFactor * resFactor;
        const targetAt432 = 727.491 * loadFactor * resFactor;
        const decayTau = (432 - 75) / Math.log((peakK - 490) / (targetAt432 - 490));
        const val = 490 + (peakK - 490) * Math.exp(-(timeS - 75) / Math.max(50, decayTau * coolingFactor));
        return Math.max(ambientK, val);
      }
    } else if (curveName === 'tr2') {
      // TR_2 (Cyan):
      // Stays around 295-360K until t=720s, then thermal propagation spike up to 1050K, then decays
      if (timeS < 720) {
        const val = ambientK + (354.75 - ambientK) * Math.pow(timeS / 432, 1.35) * loadFactor;
        return val;
      } else if (timeS < 780) {
        const f = (timeS - 720) / 60;
        return 354.75 + (1048 * loadFactor - 354.75) * Math.sin(f * (Math.PI / 2));
      } else {
        return 430 + (1048 * loadFactor - 430) * Math.exp(-(timeS - 780) / (450 * coolingFactor));
      }
    } else if (curveName === 'tr3') {
      // TR_3 (Pink):
      // Slowly heats to 328.017K at t=432s, then triggers around t=680s up to 1045K, then decays
      if (timeS < 680) {
        return ambientK + (328.017 - ambientK) * Math.pow(timeS / 432, 1.25) * loadFactor;
      } else if (timeS < 740) {
        const f = (timeS - 680) / 60;
        return 328.017 + (1042 * loadFactor - 328.017) * Math.sin(f * (Math.PI / 2));
      } else {
        return 410 + (1042 * loadFactor - 410) * Math.exp(-(timeS - 740) / (420 * coolingFactor));
      }
    } else if (curveName === 'tr4') {
      // TR_4 (Magenta):
      // Conduction delay until t=1340s, then spikes
      if (timeS < 1340) {
        return ambientK + (305 - ambientK) * Math.pow(timeS / 432, 1.1) * loadFactor;
      } else if (timeS < 1400) {
        const f = (timeS - 1340) / 60;
        return 305 + (1040 * loadFactor - 305) * Math.sin(f * (Math.PI / 2));
      } else {
        return 420 + (1040 * loadFactor - 420) * Math.exp(-(timeS - 1400) / (380 * coolingFactor));
      }
    } else {
      // TR_5 (Navy / Base cell):
      // Conduction delay until t=1550s, then spikes
      if (timeS < 1550) {
        return ambientK + (297.157 - ambientK) * Math.pow(timeS / 432, 1.0) * loadFactor;
      } else if (timeS < 1610) {
        const f = (timeS - 1550) / 60;
        return 297.157 + (1030 * loadFactor - 297.157) * Math.sin(f * (Math.PI / 2));
      } else {
        return 430 + (1030 * loadFactor - 430) * Math.exp(-(timeS - 1610) / (350 * coolingFactor));
      }
    }
  }, [ambientTempC, coolingEfficiencyH, loadCrate, resistanceMultiplier]);

  // Formatter for Kelvin / Celsius
  const formatTemp = useCallback((k: number): string => {
    if (tempUnit === 'CELSIUS') {
      return `${(k - 273.15).toFixed(1)}°C`;
    }
    return `${k.toFixed(1)} K`;
  }, [tempUnit]);

  // Exact values at current cursor time
  const currentTriggerK = getSimulatedTemperature('trigger', cursorTime);
  const currentTr2K = getSimulatedTemperature('tr2', cursorTime);
  const currentTr3K = getSimulatedTemperature('tr3', cursorTime);
  const currentTr4K = getSimulatedTemperature('tr4', cursorTime);
  const currentTr5K = getSimulatedTemperature('tr5', cursorTime);

  const deltaTK = currentTriggerK - currentTr5K;
  const isCritical = (currentTriggerK - 273.15) > 60.0;
  const isRunawayRisk = (currentTriggerK - 273.15) > 85.0;

  // Selected cell object
  const activeSelectedCell = useMemo(() => {
    return cellGridData.find(c => c.id === selectedCellId) || cellGridData.find(c => c.isTrigger)!;
  }, [selectedCellId, cellGridData]);

  const selectedCellSimTempK = useMemo(() => {
    if (activeSelectedCell.isTrigger) return currentTriggerK;
    if (activeSelectedCell.id === 'C-12') return currentTr2K;
    if (activeSelectedCell.id === 'C-07') return currentTr3K;
    if (activeSelectedCell.id === 'C-15') return currentTr4K;
    return currentTr5K;
  }, [activeSelectedCell, currentTriggerK, currentTr2K, currentTr3K, currentTr4K, currentTr5K]);

  const selectedCellSimTempC = selectedCellSimTempK - 273.15;

  // Real Sensor TC Measurement (clearly distinguished with simulated instrument noise + lag)
  const realSensorMeasurementC = useMemo(() => {
    const noise = Math.sin(cursorTime * 0.05 + activeSelectedCell.col * 2.1) * 0.35;
    return Number((selectedCellSimTempC + noise - 0.25).toFixed(1));
  }, [selectedCellSimTempC, cursorTime, activeSelectedCell]);

  // Timeline animation playback
  useEffect(() => {
    let animId: any;
    if (isSimPlaying) {
      animId = setInterval(() => {
        setCursorTime(t => (t >= 2000 ? 0 : t + 10));
      }, 70);
    }
    return () => clearInterval(animId);
  }, [isSimPlaying]);

  // Camera Position Helper
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(
      cameraTargetRef.current.x + x,
      cameraTargetRef.current.y + y,
      cameraTargetRef.current.z + z
    );
    cameraRef.current.lookAt(cameraTargetRef.current);
  }, []);

  // Scientific colormap helper (Blue 293K -> Cyan -> Green -> Yellow -> Red -> Magenta 1050K)
  const getScientificHeatColor = (tempK: number): THREE.Color => {
    const minK = 293.0;
    const maxK = 1050.0;
    const norm = Math.max(0, Math.min(1, (tempK - minK) / (maxK - minK)));

    const col = new THREE.Color();
    if (norm < 0.2) {
      // Deep blue to cyan
      col.setRGB(0.05 + 0.1 * (norm / 0.2), 0.2 + 0.6 * (norm / 0.2), 0.9);
    } else if (norm < 0.45) {
      // Cyan to green
      const f = (norm - 0.2) / 0.25;
      col.setRGB(0.1 + 0.1 * f, 0.85, 0.9 - 0.7 * f);
    } else if (norm < 0.7) {
      // Green to yellow-orange
      const f = (norm - 0.45) / 0.25;
      col.setRGB(0.2 + 0.75 * f, 0.85 - 0.15 * f, 0.1);
    } else {
      // Yellow to incandescent red/magenta
      const f = (norm - 0.7) / 0.3;
      col.setRGB(0.95 + 0.05 * f, 0.7 - 0.6 * f, 0.1 + 0.5 * f);
    }
    return col;
  };

  // Build Three.js 3D Module Scene matching reference screenshot
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181B1E); // Deep engineering dark slate
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Lighting matching SIMULIA results explorer studio
    const dirLight1 = new THREE.DirectionalLight(0xFFFFFF, 1.4);
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x7DD3FC, 0.8);
    dirLight2.position.set(-20, 15, -20);
    scene.add(dirLight2);

    scene.add(new THREE.AmbientLight(0x334155, 1.3));

    // Outer Translucent Blue Module Enclosure (Matching the reference screenshot exactly)
    const casingGeo = new THREE.BoxGeometry(6.6, 5.2, 8.2);
    const casingMat = new THREE.MeshPhysicalMaterial({
      color: 0x00477A, // Translucent blue
      transparent: true,
      opacity: 0.38,
      roughness: 0.2,
      metalness: 0.15,
      transmission: 0.5,
      ior: 1.3,
      depthWrite: false,
    });
    const casingMesh = new THREE.Mesh(casingGeo, casingMat);
    casingMesh.position.set(0, 0, 0);
    scene.add(casingMesh);

    // Build Cylindrical Cells inside the casing (4 cols x 5 rows)
    const cellRadius = 0.56;
    const cellHeight = 4.8;
    const cellGeo = new THREE.CylinderGeometry(cellRadius, cellRadius, cellHeight, 32);

    cellMeshesRef.current.clear();

    cellGridData.forEach((cell) => {
      // Physical coordinates inside the 4x5 block
      const posX = (cell.col - 1.5) * 1.45;
      const posZ = (cell.row - 2.0) * 1.5;

      const cellMat = new THREE.MeshStandardMaterial({
        color: 0x1E3A8A, // Initial cool blue
        roughness: 0.3,
        metalness: 0.5,
      });

      const cellMesh = new THREE.Mesh(cellGeo, cellMat);
      cellMesh.position.set(posX, 0, posZ);
      cellMesh.userData = { id: cell.id, cellData: cell };

      scene.add(cellMesh);
      cellMeshesRef.current.set(cell.id, cellMesh);
    });

    // Render loop
    let animId: number;
    const render = () => {
      animId = requestAnimationFrame(render);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    render();

    // Resize observer
    const handleResize = () => {
      if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [updateCameraPosition, cellGridData]);

  // Update cell 3D colors dynamically based on cursor time temperature
  useEffect(() => {
    cellMeshesRef.current.forEach((mesh, id) => {
      let cellTempK: number;
      if (id === 'C-11') cellTempK = currentTriggerK;
      else if (id === 'C-12') cellTempK = currentTr2K;
      else if (id === 'C-07') cellTempK = currentTr3K;
      else if (id === 'C-15') cellTempK = currentTr4K;
      else cellTempK = currentTr5K;

      const heatColor = getScientificHeatColor(cellTempK);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color.copy(heatColor);

        // Highlight hotspot and selected cell with emissive glow
        if (id === 'C-11') {
          mat.emissive.copy(heatColor).multiplyScalar(0.45);
        } else if (id === selectedCellId) {
          mat.emissive.setRGB(0.2, 0.45, 0.9);
        } else {
          mat.emissive.setRGB(0, 0, 0);
        }
      }
    });
  }, [currentTriggerK, currentTr2K, currentTr3K, currentTr4K, currentTr5K, selectedCellId]);

  // Mouse orbit dragging on 3D canvas
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
    updateCameraPosition();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngleRef.current.radius = Math.max(
      8,
      Math.min(38, cameraAngleRef.current.radius + e.deltaY * 0.02)
    );
    updateCameraPosition();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const meshes = Array.from(cellMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.id) {
        setSelectedCellId(hit.userData.id);
        setShowCellInspector(true);
      }
    }
  };

  // Generate Temperature Curves for the X-Y Plots Viewer (0 to 2000s)
  const plotTimePoints = useMemo(() => {
    const pts = [];
    for (let t = 0; t <= 2000; t += 20) {
      pts.push(t);
    }
    return pts;
  }, []);

  const curveData = useMemo(() => {
    return {
      trigger: plotTimePoints.map(t => ({ x: t, y: getSimulatedTemperature('trigger', t) })),
      tr2: plotTimePoints.map(t => ({ x: t, y: getSimulatedTemperature('tr2', t) })),
      tr3: plotTimePoints.map(t => ({ x: t, y: getSimulatedTemperature('tr3', t) })),
      tr4: plotTimePoints.map(t => ({ x: t, y: getSimulatedTemperature('tr4', t) })),
      tr5: plotTimePoints.map(t => ({ x: t, y: getSimulatedTemperature('tr5', t) })),
    };
  }, [plotTimePoints, getSimulatedTemperature]);

  // Coordinate scales for the SVG X-Y Plots Viewer
  const svgWidth = 490;
  const svgHeight = 310;
  const pad = { top: 25, right: 30, bottom: 40, left: 55 };
  const graphW = svgWidth - pad.left - pad.right;
  const graphH = svgHeight - pad.top - pad.bottom;

  const minPlotT = 250.0;
  const maxPlotT = 1100.0;
  const minTime = 0.0;
  const maxTime = 2000.0;

  const scaleX = (t: number) => pad.left + (t / maxTime) * graphW;
  const scaleY = (tempK: number) => pad.top + graphH - ((tempK - minPlotT) / (maxPlotT - minPlotT)) * graphH;
  const cursorX = scaleX(cursorTime);

  // Handle clicking on the X-Y plot to scrub the vertical cursor line
  const handlePlotClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clampedX = Math.max(pad.left, Math.min(pad.left + graphW, clickX));
    const newTime = Math.round(((clampedX - pad.left) / graphW) * maxTime);
    setCursorTime(newTime);
  };

  // 4 Realistic Cooling Management Scenarios for Side-by-Side Comparison
  const coolingScenarios: CoolingScenario[] = useMemo(() => [
    {
      id: 'SCENARIO_1_STAGNANT',
      name: 'Degraded / Low Flow (Natural Convection)',
      description: 'Cooling pump failure; passive natural air circulation only.',
      flowVelocity: 0.2,
      fluidType: 'FORCED_AIR',
      heatTransferCoeff: 65,
      peakHotspotTempC: 135.4,
      severity: 'RUNAWAY_DANGER',
      mitigationEffectiveness: 'Insufficient · High risk of thermal runaway propagation',
    },
    {
      id: 'SCENARIO_2_NOMINAL',
      name: 'Nominal Active Water-Glycol (Design Point)',
      description: 'Standard 50/50 Water-Glycol mixture at 2.15 m/s through cold plate manifold.',
      flowVelocity: 2.15,
      fluidType: 'GLYCOL_WATER',
      heatTransferCoeff: 850,
      peakHotspotTempC: 48.6,
      severity: 'ELEVATED',
      mitigationEffectiveness: 'Managed · Safe margin for moderate drive cycles',
    },
    {
      id: 'SCENARIO_3_BOOST',
      name: 'High-Velocity Active Chiller Boost',
      description: 'Pump ramped to 3.8 m/s with chilled coolant feed (15°C) to suppress localized hot spots.',
      flowVelocity: 3.8,
      fluidType: 'GLYCOL_WATER',
      heatTransferCoeff: 1480,
      peakHotspotTempC: 36.2,
      severity: 'NORMAL',
      mitigationEffectiveness: 'Optimal · Rapid -12.4°C hotspot reduction within 90s',
    },
    {
      id: 'SCENARIO_4_IMMERSION',
      name: 'Direct Dielectric Fluid Immersion',
      description: 'Full cell-level submersion in engineered dielectric hydrocarbon liquid.',
      flowVelocity: 1.8,
      fluidType: 'DIELECTRIC',
      heatTransferCoeff: 1920,
      peakHotspotTempC: 31.8,
      severity: 'NORMAL',
      mitigationEffectiveness: 'Superior · Isothermal cross-module gradient (ΔT < 1.5°C)',
    },
  ], []);

  const handleApplyScenario = (scenario: CoolingScenario) => {
    setCoolingEfficiencyH(scenario.heatTransferCoeff);
    setFluidFlowCoupling(scenario.flowVelocity, scenario.fluidType, 20.0);
    setShowScenarioModal(false);
  };

  return (
    <div className={`flex flex-col h-full bg-[#1A1D20] text-white select-none overflow-hidden relative ${className}`}>
      {/* 1. Header Toolbar matching SIMULIA Physics Results Explorer */}
      <div className="h-[38px] bg-[#005B91] border-b border-[#004773] px-3 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-white font-medium font-mono-numbers tracking-wide">
            TR3D_CASE03_DTLP01 · Hotspot & Thermal Propagation Analysis
          </span>
        </div>

        {/* Search Input bar matching screenshot */}
        <div className="hidden md:flex items-center bg-white/15 border border-white/30 rounded-[2px] px-2 py-0.5 w-64 text-white placeholder-white/60 text-[11px]">
          <input 
            type="text" 
            placeholder="Search simulation entities..." 
            className="bg-transparent border-none outline-none text-white w-full text-[11px] placeholder-white/50"
            defaultValue=""
          />
          <Search className="w-3.5 h-3.5 text-white/70 ml-1" />
        </div>

        <div className="flex items-center gap-2">
          {/* Unit Toggle */}
          <div className="flex items-center gap-0.5 bg-[#004B78] p-0.5 rounded-[2px] border border-white/20 text-[10.5px]">
            <button
              onClick={() => setTempUnit('KELVIN')}
              className={`px-2 py-0.5 font-medium rounded-[2px] transition-colors ${
                tempUnit === 'KELVIN' ? 'bg-[#0072A8] text-white font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              Kelvin (Kdeg)
            </button>
            <button
              onClick={() => setTempUnit('CELSIUS')}
              className={`px-2 py-0.5 font-medium rounded-[2px] transition-colors ${
                tempUnit === 'CELSIUS' ? 'bg-[#0072A8] text-white font-semibold' : 'text-white/70 hover:text-white'
              }`}
            >
              Celsius (°C)
            </button>
          </div>

          <button
            onClick={() => setShowScenarioModal(true)}
            className="px-2 py-1 bg-[#004B78] hover:bg-[#003B5C] rounded-[2px] text-[10.5px] font-semibold flex items-center gap-1 border border-white/20 text-white"
            title="Compare Cooling Scenarios"
          >
            <GitCompare className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Scenarios</span>
          </button>

          <button
            onClick={() => setIsSimPlaying(!isSimPlaying)}
            className={`px-2 py-1 rounded-[2px] text-[10.5px] font-semibold flex items-center gap-1 border transition-colors ${
              isSimPlaying ? 'bg-[#D97706] text-white border-[#F59E0B]' : 'bg-[#004B78] hover:bg-[#003B5C] text-white border-white/20'
            }`}
          >
            {isSimPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimPlaying ? 'Pause Run' : 'Play Timeline'}</span>
          </button>

          <button
            onClick={() => {
              setCursorTime(432);
              setIsSimPlaying(false);
              setLoadCrate(2.0);
              setAmbientTempC(22.0);
              setResistanceMultiplier(2.2);
              cameraAngleRef.current = { theta: Math.PI * 0.28, phi: Math.PI * 0.32, radius: 18 };
              updateCameraPosition();
            }}
            className="p-1 bg-[#004B78] hover:bg-[#003B5C] rounded-[2px] text-white/90 border border-white/20"
            title="Reset Simulation View & Parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 ml-2 text-white/80">
            <Share2 className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
            <HelpCircle className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
          </div>
        </div>
      </div>

      {/* 2. Main Workstation Body: X-Y Plots Viewer (Left) + 3D Battery Module Viewport (Right) */}
      <div className="flex-1 flex gap-[2px] bg-[#2D3238] min-h-0 relative">
        {/* LEFT PANEL: "X-Y Plots Viewer" Window (Faithfully styled like the uploaded screenshot) */}
        <div className="w-[500px] xl:w-[540px] bg-[#E8ECEF] text-[#20252A] border-r border-[#CBD5E1] flex flex-col shrink-0 select-none shadow-md">

          {/* Interactive Cartesian Plot matching reference image */}
          <div className="p-2.5 flex-1 flex flex-col justify-between bg-white overflow-hidden relative">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto cursor-crosshair select-none"
              onClick={handlePlotClick}
            >
              {/* Plot Background Grid */}
              <rect x={pad.left} y={pad.top} width={graphW} height={graphH} fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />

              {/* Horizontal Grid lines (Temperature K) */}
              {[400, 600, 800, 1000].map((tK) => {
                const y = scaleY(tK);
                return (
                  <g key={tK}>
                    <line x1={pad.left} y1={y} x2={pad.left + graphW} y2={y} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3,3" />
                    <text x={pad.left - 6} y={y + 3} textAnchor="end" className="text-[9.5px] fill-[#475569] font-mono">
                      {tempUnit === 'KELVIN' ? (tK / 1000).toFixed(1) : `${(tK - 273.15).toFixed(0)}°`}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Grid lines (Time s) */}
              {[0, 500, 1000, 1500, 2000].map((sec) => {
                const x = scaleX(sec);
                return (
                  <g key={sec}>
                    <line x1={x} y1={pad.top} x2={x} y2={pad.top + graphH} stroke="#CBD5E1" strokeWidth="1" />
                    <text x={x} y={pad.top + graphH + 15} textAnchor="middle" className="text-[9.5px] fill-[#475569] font-mono">
                      {(sec / 1000).toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Multi-Cell Temperature Trajectory Curves */}
              {/* Curve 1: Trigger Hotspot Cell (Green) */}
              <polyline
                fill="none"
                stroke="#15803D"
                strokeWidth="2.2"
                points={curveData.trigger.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ')}
              />

              {/* Curve 2: TR_2 (Cyan) */}
              <polyline
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.0"
                points={curveData.tr2.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ')}
              />

              {/* Curve 3: TR_3 (Pink) */}
              <polyline
                fill="none"
                stroke="#EC4899"
                strokeWidth="2.0"
                points={curveData.tr3.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ')}
              />

              {/* Curve 4: TR_4 (Magenta) */}
              <polyline
                fill="none"
                stroke="#A855F7"
                strokeWidth="1.8"
                points={curveData.tr4.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ')}
              />

              {/* Curve 5: TR_5 (Navy) */}
              <polyline
                fill="none"
                stroke="#1E3A8A"
                strokeWidth="1.8"
                points={curveData.tr5.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' ')}
              />

              {/* Dynamic Orange Vertical Cursor (Exactly matching the reference image) */}
              <line
                x1={cursorX}
                y1={pad.top}
                x2={cursorX}
                y2={pad.top + graphH}
                stroke="#EA580C"
                strokeWidth="2.0"
              />

              {/* Callout tags on cursor line showing cell temperatures at this exact time */}
              {/* Tag 1: Trigger Hotspot Cell (727.491 Kdeg at t=432s) */}
              <g transform={`translate(${Math.min(svgWidth - 110, cursorX + 6)}, ${scaleY(currentTriggerK) - 4})`}>
                <rect x="0" y="-12" width="100" height="15" fill="#FEF3C7" stroke="#F59E0B" rx="1.5" />
                <text x="4" y="-2" className="text-[8.5px] font-bold fill-[#92400E] font-mono">
                  {currentTriggerK.toFixed(3)} Kdeg
                </text>
              </g>

              {/* Tag 2: TR_2 (354.75 Kdeg at t=432s) */}
              <g transform={`translate(${Math.min(svgWidth - 110, cursorX + 6)}, ${scaleY(currentTr2K) - 4})`}>
                <rect x="0" y="-12" width="95" height="15" fill="#E0F2FE" stroke="#0284C7" rx="1.5" />
                <text x="4" y="-2" className="text-[8.5px] font-bold fill-[#0369A1] font-mono">
                  {currentTr2K.toFixed(2)} Kdeg
                </text>
              </g>

              {/* Tag 3: TR_3 (328.017 Kdeg at t=432s) */}
              <g transform={`translate(${Math.min(svgWidth - 110, cursorX + 6)}, ${scaleY(currentTr3K) - 4})`}>
                <rect x="0" y="-12" width="95" height="15" fill="#FCE7F3" stroke="#DB2777" rx="1.5" />
                <text x="4" y="-2" className="text-[8.5px] font-bold fill-[#9D174D] font-mono">
                  {currentTr3K.toFixed(3)} Kdeg
                </text>
              </g>

              {/* Tag 4: Baseline Cell (297.157 Kdeg at t=432s) */}
              <g transform={`translate(${Math.min(svgWidth - 110, cursorX + 6)}, ${scaleY(currentTr5K) + 12})`}>
                <rect x="0" y="-12" width="95" height="15" fill="#F1F5F9" stroke="#64748B" rx="1.5" />
                <text x="4" y="-2" className="text-[8.5px] font-bold fill-[#334155] font-mono">
                  {currentTr5K.toFixed(3)} Kdeg
                </text>
              </g>

              {/* Cursor Time Label */}
              <text x={cursorX} y={pad.top + graphH + 28} textAnchor="middle" className="text-[9px] font-bold fill-[#EA580C] font-mono">
                u = {cursorTime} s
              </text>

              {/* Axis Titles matching screenshot */}
              <text x={pad.left + graphW / 2} y={svgHeight - 4} textAnchor="middle" className="text-[9.5px] font-semibold fill-[#334155]">
                Time (s) [x1.E3]
              </text>
              <text transform="rotate(-90)" x={-(pad.top + graphH / 2)} y={13} textAnchor="middle" className="text-[9.5px] font-semibold fill-[#334155]">
                Temperature ({tempUnit === 'KELVIN' ? 'Kdeg' : '°C'}) [x1.E3]
              </text>
            </svg>


          </div>
        </div>

        {/* RIGHT PANEL: 3D Battery Module & Hotspot Visualizer (Matching reference image) */}
        <div 
          className="flex-1 relative bg-[#1E2226] overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        >
          {/* Viewport Subtitle Bar */}
          <div className="absolute top-0 left-0 right-0 h-[24px] bg-[#14171A]/85 border-b border-[#334155] px-3 flex items-center justify-between text-[10px] text-[#94A3B8] font-mono-numbers z-10 pointer-events-none">
            <span>Module View: 20-Cell Prismatic Housing (4x5 Matrix) · Click cell to inspect</span>
            <span className="text-[#38BDF8]">TR3D_CASE03_DTLP01 | HT / Frame 881</span>
          </div>

          <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

          {/* Real-Time Hotspot Detection Alert Badge */}
          <div className="absolute top-8 left-3 bg-[#1A1D20]/95 border border-[#EF4444] p-2.5 rounded-[2px] text-[10.5px] font-mono-numbers z-10 shadow-lg max-w-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#EF4444] font-bold tracking-wider text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping inline-block" />
              HOTSPOT DETECTED
            </div>
            <div className="text-[#D1D5DB] flex justify-between">
              <span>Location:</span>
              <span className="font-semibold text-white">Cell C-11 (Trigger Core)</span>
            </div>
            <div className="text-[#D1D5DB] flex justify-between">
              <span>Peak Temperature:</span>
              <span className="text-[#EF4444] font-bold">{formatTemp(currentTriggerK)} ({(currentTriggerK - 273.15).toFixed(1)}°C)</span>
            </div>
            <div className="text-[#D1D5DB] flex justify-between">
              <span>Local Gradient:</span>
              <span className="text-[#F59E0B] font-bold">{(deltaTK / 4.2).toFixed(1)}°C/cm</span>
            </div>
            <div className="text-[#D1D5DB] flex justify-between">
              <span>Severity:</span>
              <span className="text-[#EF4444] font-bold uppercase">{isRunawayRisk ? 'RUNAWAY RISK' : isCritical ? 'CRITICAL' : 'WARNING'}</span>
            </div>
          </div>



          {/* Interactive Cell Inspector Overlay (Clearly distinguishing Simulated Model vs Real Sensor) */}
          {showCellInspector && (
            <div className="absolute top-8 right-20 bg-[#1A1D20]/95 border border-[#38BDF8] p-3 rounded-[2px] text-[10.5px] z-20 shadow-xl max-w-[270px] space-y-1.5">
              <div className="flex items-center justify-between border-b border-[#334155] pb-1">
                <span className="font-bold text-[#38BDF8] flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Cell Inspector: {activeSelectedCell.id}</span>
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowCellInspector(false); }}
                  className="text-[#94A3B8] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Real Sensor vs Simulated Model Distinction */}
              <div className="bg-[#14171A] p-2 rounded-[2px] border border-[#334155] space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#94A3B8]">Simulated FEA Model:</span>
                  <strong className="text-white font-mono">{formatTemp(selectedCellSimTempK)} ({selectedCellSimTempC.toFixed(1)}°C)</strong>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#38BDF8] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
                    <span>Real Thermocouple:</span>
                  </span>
                  <strong className="text-[#38BDF8] font-mono">{realSensorMeasurementC} °C</strong>
                </div>
                <div className="flex justify-between items-center text-[9px] text-[#64748B]">
                  <span>Telemetry Residual:</span>
                  <span className="font-mono text-[#CBD5E1]">Δ = {(selectedCellSimTempC - realSensorMeasurementC).toFixed(2)} °C</span>
                </div>
              </div>

              <div className="space-y-0.5 text-[9.5px] text-[#94A3B8] font-mono">
                <div className="flex justify-between">
                  <span>Contact Resistance:</span>
                  <span className="text-white">{(activeSelectedCell.contactResistanceOhm * 1000).toFixed(2)} mΩ</span>
                </div>
                <div className="flex justify-between">
                  <span>Joule Heat:</span>
                  <span className="text-white">{Math.round(Math.pow(loadCrate * 65, 2) * activeSelectedCell.contactResistanceOhm)} W</span>
                </div>
                <div className="flex justify-between">
                  <span>Convective Heat Flux:</span>
                  <span className="text-white">{Math.round(coolingEfficiencyH * (selectedCellSimTempC - ambientTempC))} W/m²</span>
                </div>
                <div className="flex justify-between">
                  <span>Sensor Channel:</span>
                  <span className="text-[#38BDF8]">{activeSelectedCell.sensorChannel || 'Uninstrumented (Simulated)'}</span>
                </div>
              </div>

              <div className="text-[8.5px] text-[#CBD5E1] bg-[#242A30] p-1.5 rounded-[1px] font-sans">
                <strong>Status:</strong> {activeSelectedCell.isTrigger 
                  ? 'Trigger Hotspot cell due to tab joint degradation.' 
                  : (activeSelectedCell.isAdjacent ? 'Adjacent conduction boundary victim cell.' : 'Nominal convective equilibrium cell.')}
              </div>
            </div>
          )}

          {/* Scientific Colorbar Scale matching screenshot exactly */}
          <div className="absolute bottom-6 right-4 bg-[#14171A]/90 border border-[#334155] p-2 rounded-[2px] text-[9px] font-mono-numbers z-10 pointer-events-none flex items-center gap-2">
            {/* Color Gradient Strip */}
            <div 
              className="w-3.5 h-48 rounded-[1px] border border-white/20"
              style={{
                background: 'linear-gradient(to top, #0A2540 0%, #06B6D4 18%, #10B981 38%, #F59E0B 62%, #DC2626 82%, #FF00FF 100%)'
              }}
            />
            {/* Numerical Graduation Ticks */}
            <div className="flex flex-col justify-between h-48 text-[8.5px] text-[#94A3B8] font-mono">
              <span className="text-[#F43F5E] font-bold">1.95e+3 ({formatTemp(1050)})</span>
              <span>1.78e+3</span>
              <span>1.61e+3</span>
              <span>1.44e+3</span>
              <span>1.27e+3</span>
              <span>1.1e+3</span>
              <span>926</span>
              <span>755</span>
              <span>585</span>
              <span>414</span>
              <span className="text-[#38BDF8] font-bold">293 ({formatTemp(293)})</span>
            </div>
          </div>

          {/* Authentic 3DS Coordinate Triad Gizmo in bottom-right matching screenshot */}
          <div className="absolute bottom-3 right-2 text-[8.5px] text-[#94A3B8] font-mono pointer-events-none flex flex-col items-end">
            <span className="text-[8px] text-[#64748B]">TR3D_CASE03_DTLP01</span>
            <span className="text-[8px] text-[#38BDF8]">HT / Frame 881</span>
            <div className="w-10 h-10 mt-1 flex items-center justify-center relative">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <line x1="20" y1="20" x2="36" y2="14" stroke="#EF4444" strokeWidth="2" />
                <line x1="20" y1="20" x2="20" y2="4" stroke="#10B981" strokeWidth="2" />
                <line x1="20" y1="20" x2="6" y2="30" stroke="#3B82F6" strokeWidth="2" />
                <circle cx="20" cy="20" r="3" fill="#E2E8F0" />
                <text x="36" y="12" fill="#EF4444" fontSize="7" fontWeight="bold">X</text>
                <text x="22" y="6" fill="#10B981" fontSize="7" fontWeight="bold">Y</text>
                <text x="4" y="34" fill="#3B82F6" fontSize="7" fontWeight="bold">Z</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Hotspot Investigation & Parameter Control Drawer */}
      <div className="bg-[#181B1E] border-t border-[#334155] p-2.5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
            <span>Thermal Hotspot Root-Cause Investigation & Mitigation Console</span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-[#94A3B8] font-mono">
            <span>Coupled CFD Convection: <strong>{coolingEfficiencyH} W/(m²·K)</strong></span>
            <span>·</span>
            <span>Fluid: <strong>{coolantFluidType.replace('_', ' ')}</strong></span>
            <span>·</span>
            <span>Velocity: <strong>{coolantFlowVelocity.toFixed(2)} m/s</strong></span>
          </div>
        </div>

        {/* 4 Interactive Parameter Columns */}
        <div className="grid grid-cols-4 gap-3 bg-[#1F2429] p-2 rounded-[2px] border border-[#334155] text-[10.5px]">
          {/* Col 1: Discharge Load */}
          <div>
            <div className="flex justify-between mb-1 font-sans text-[#A0AEC0]">
              <span>Operating Load Current</span>
              <strong className="text-white font-mono">{loadCrate.toFixed(1)} C ({loadCrate * 65} A)</strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={loadCrate}
              onChange={(e) => setLoadCrate(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-[#38BDF8] bg-[#334155] cursor-pointer"
            />
            <span className="text-[9px] text-[#64748B]">Joule Dissipation: I²R ~ {Math.round(Math.pow(loadCrate * 65, 2) * 0.00185 * resistanceMultiplier)} W</span>
          </div>

          {/* Col 2: Ambient Temperature */}
          <div>
            <div className="flex justify-between mb-1 font-sans text-[#A0AEC0]">
              <span>Ambient Temperature</span>
              <strong className="text-white font-mono">{ambientTempC.toFixed(0)} °C</strong>
            </div>
            <input
              type="range"
              min="-10"
              max="45"
              step="1"
              value={ambientTempC}
              onChange={(e) => setAmbientTempC(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-[#38BDF8] bg-[#334155] cursor-pointer"
            />
            <span className="text-[9px] text-[#64748B]">Boundary Condition T_amb</span>
          </div>

          {/* Col 3: Coolant Convection Coupling */}
          <div>
            <div className="flex justify-between mb-1 font-sans text-[#A0AEC0]">
              <span>Cooling Convection (h)</span>
              <strong className="text-[#38BDF8] font-mono">{coolingEfficiencyH} W/(m²·K)</strong>
            </div>
            <input
              type="range"
              min="150"
              max="2400"
              step="50"
              value={coolingEfficiencyH}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCoolingEfficiencyH(val);
                // Also update the store fluid flow coupling
                setFluidFlowCoupling(coolantFlowVelocity, coolantFluidType);
              }}
              className="w-full h-1.5 accent-[#38BDF8] bg-[#334155] cursor-pointer"
            />
            <span className="text-[9px] text-[#64748B]">Governed by CFD Fluid Flow model</span>
          </div>

          {/* Col 4: Cell Resistance Degradation */}
          <div>
            <div className="flex justify-between mb-1 font-sans text-[#A0AEC0]">
              <span>Tab Weld Anomaly Factor</span>
              <strong className="text-[#F59E0B] font-mono">{resistanceMultiplier.toFixed(1)}x R_nominal</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={resistanceMultiplier}
              onChange={(e) => setResistanceMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-[#F59E0B] bg-[#334155] cursor-pointer"
            />
            <span className="text-[9px] text-[#64748B]">Simulates weld fatigue & contact drift</span>
          </div>
        </div>

        {/* Corrective Action Recommendations & Physics Diagnosis */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[#1F2429] border border-[#334155] p-2 rounded-[2px] font-sans">
            <span className="font-semibold text-[#38BDF8] block mb-0.5">Identified Potential Causes:</span>
            <div className="text-[#CBD5E1] space-y-0.5 leading-relaxed">
              · <strong>Cell C-11:</strong> Ultrasonic tab weld delamination (+{(resistanceMultiplier * 100 - 100).toFixed(0)}% contact resistance elevation) generating concentrated Joule heating.<br />
              · <strong>Adjacent C-12 & C-07:</strong> Secondary transverse conduction through module polymer separator matrix.<br />
              · <strong>Cooling Limitation:</strong> Boundary layer heat transfer coefficient ({coolingEfficiencyH} W/m²K) requires augmentation.
            </div>
          </div>

          <div className="bg-[#1F2429] border border-[#334155] p-2 rounded-[2px] font-sans">
            <span className="font-semibold text-[#4ADE80] block mb-0.5">Recommended Engineering Mitigations:</span>
            <div className="text-[#CBD5E1] space-y-0.5 leading-relaxed">
              1. <strong>Ramp Coolant Velocity:</strong> Increase fluid flow rate to &ge; 3.0 m/s in the CFD Cooling module to raise h &ge; 1,400 W/m²K (lowers peak hotspot by -72°C).<br />
              2. <strong>BMS Current Derating:</strong> Constrain continuous pack discharge to &le; 1.4C when ambient temperature &gt; 35°C.<br />
              3. <strong>Cell Service Action:</strong> Queue Cell C-11 tab joint impedance test during next service window.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cooling Scenario Comparison Modal */}
      {showScenarioModal && (
        <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1E2226] border border-[#38BDF8] rounded-[3px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col text-[11px]">
            <div className="h-[36px] bg-[#005B91] px-3 flex items-center justify-between text-white font-semibold">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-[#38BDF8]" />
                <span>Thermal Cooling Scenario Comparison & Mitigation Evaluation</span>
              </div>
              <button 
                onClick={() => setShowScenarioModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-[80vh]">
              <div className="text-[#94A3B8] text-[10.5px]">
                Compare the cooling effectiveness, heat transfer coefficients, and resulting hotspot temperatures across 4 operational configurations. Click <strong>Apply Scenario</strong> to immediately recalculate the active digital twin simulation.
              </div>

              <div className="space-y-2.5">
                {coolingScenarios.map((scen) => (
                  <div 
                    key={scen.id} 
                    className="bg-[#242A30] border border-[#404850] p-3 rounded-[2px] flex items-center justify-between hover:border-[#38BDF8] transition-colors"
                  >
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-[12px]">{scen.name}</strong>
                        <span className={`px-1.5 py-0.2 rounded-[2px] text-[9.5px] font-bold font-mono ${
                          scen.severity === 'NORMAL' ? 'bg-[#10B981]/20 text-[#4ADE80] border border-[#10B981]/40' :
                          (scen.severity === 'ELEVATED' ? 'bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40' :
                          'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/40')
                        }`}>
                          {scen.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#A0AEC0]">{scen.description}</p>
                      <div className="flex items-center gap-4 text-[9.5px] font-mono text-[#CBD5E1]">
                        <span>Fluid: <strong>{scen.fluidType.replace('_', ' ')}</strong></span>
                        <span>Velocity: <strong>{scen.flowVelocity} m/s</strong></span>
                        <span>Coeff h: <strong>{scen.heatTransferCoeff} W/m²K</strong></span>
                        <span>Peak Hotspot: <strong className={scen.peakHotspotTempC > 60 ? 'text-[#F87171]' : 'text-[#4ADE80]'}>{scen.peakHotspotTempC} °C</strong></span>
                      </div>
                      <div className="text-[9px] text-[#38BDF8] italic">
                        {scen.mitigationEffectiveness}
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplyScenario(scen)}
                      className="px-3 py-1.5 bg-[#0072A8] hover:bg-[#005B91] text-white font-semibold rounded-[2px] text-[10.5px] transition-colors shrink-0 shadow-sm"
                    >
                      Apply Scenario
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
