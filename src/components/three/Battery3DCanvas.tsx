/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * DSimulate - Three.js 3D EV Battery Pack Digital Twin Viewport
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useBatteryStore } from '../../stores/useBatteryStore';
import { VisualizationMode, BatteryCell } from '../../types/battery';
import { 
  Maximize2, 
  RotateCcw, 
  Layers, 
  Eye, 
  Sliders, 
  Compass, 
  Box, 
  ShieldAlert, 
  ZoomIn, 
  ZoomOut,
  Maximize
} from 'lucide-react';

// Scientific colormaps
function getThermalColor(tempCelsius: number): THREE.Color {
  // 25°C (Cool Blue) -> 33°C (Cyan) -> 37°C (Green) -> 41°C (Amber/Yellow) -> 48°C+ (Crimson)
  const t = Math.max(25, Math.min(48, tempCelsius));
  const norm = (t - 25) / (48 - 25); // 0 to 1

  if (norm < 0.25) {
    const f = norm / 0.25;
    return new THREE.Color().setRGB(0.1 + 0.1 * f, 0.3 + 0.5 * f, 0.85);
  } else if (norm < 0.5) {
    const f = (norm - 0.25) / 0.25;
    return new THREE.Color().setRGB(0.2, 0.8, 0.85 - 0.6 * f);
  } else if (norm < 0.75) {
    const f = (norm - 0.5) / 0.25;
    return new THREE.Color().setRGB(0.2 + 0.75 * f, 0.8 - 0.1 * f, 0.1);
  } else {
    const f = (norm - 0.75) / 0.25;
    return new THREE.Color().setRGB(0.95 + 0.05 * f, 0.7 - 0.5 * f, 0.1 - 0.05 * f);
  }
}

function getSocColor(soc: number): THREE.Color {
  // Red (<20%) -> Amber (20-60%) -> Green (60-100%)
  const s = Math.max(0, Math.min(100, soc)) / 100;
  if (s < 0.3) {
    return new THREE.Color().setRGB(0.85, 0.2, 0.2);
  } else if (s < 0.6) {
    return new THREE.Color().setRGB(0.9, 0.65, 0.15);
  } else {
    return new THREE.Color().setRGB(0.15, 0.65, 0.3);
  }
}

function getSohColor(soh: number): THREE.Color {
  // EOL threshold is 80%
  const s = Math.max(70, Math.min(100, soh));
  if (s <= 80.0) {
    return new THREE.Color().setRGB(0.85, 0.15, 0.15); // Critical EOL
  } else if (s <= 86.0) {
    return new THREE.Color().setRGB(0.9, 0.55, 0.15); // Warning aging
  } else {
    return new THREE.Color().setRGB(0.2, 0.65, 0.35); // Healthy
  }
}

function getVoltageColor(volt: number): THREE.Color {
  const diffMv = Math.abs(volt - 3.824) * 1000;
  if (diffMv > 35) {
    return new THREE.Color().setRGB(0.85, 0.15, 0.15); // >35mV delta
  } else if (diffMv > 15) {
    return new THREE.Color().setRGB(0.9, 0.6, 0.1);
  } else {
    return new THREE.Color().setRGB(0.2, 0.65, 0.35);
  }
}

function getRulColor(rul: number): THREE.Color {
  // <1000 cycles = warning (amber), <800 = critical, >1200 = healthy
  if (rul < 850) {
    return new THREE.Color().setRGB(0.85, 0.15, 0.15);
  } else if (rul < 1100) {
    return new THREE.Color().setRGB(0.9, 0.6, 0.15);
  } else {
    return new THREE.Color().setRGB(0.2, 0.6, 0.35);
  }
}

export const Battery3DCanvas: React.FC<{
  className?: string;
  showControls?: boolean;
}> = ({ className = 'w-full h-full', showControls = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    batteryPack,
    selectedObjectType,
    selectedModuleId,
    selectedCellId,
    visualizationMode,
    explodeProgress,
    sectionCutActive,
    wireframeActive,
    isolatedObjectId,
    cameraPreset,
    selectObject,
    setVisualizationMode,
    setExplodeProgress,
    toggleSectionCut,
    toggleWireframe,
    setIsolate,
    setCameraPreset,
  } = useBatteryStore();

  const [hoveredCell, setHoveredCell] = useState<BatteryCell | null>(null);

  // References to keep Three.js scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cellMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const moduleGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const packEnclosureRef = useRef<THREE.Group | null>(null);
  const coolingPlateRef = useRef<THREE.Mesh | null>(null);
  const selectionOutlineRef = useRef<THREE.LineSegments | null>(null);

  // Orbit controls state
  const isDraggingRef = useRef(false);
  const dragButtonRef = useRef(0); // 0: left (rotate), 2: right (pan)
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraSphericalRef = useRef({ radius: 36, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
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

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF0F3F6); // Industrial light-gray engineering viewport
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Studio Key, Fill, and Rim Lighting calibrated for engineering workstation
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.15);
    keyLight.position.set(25, 40, 20);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xDCE4EC, 0.65);
    fillLight.position.set(-25, 20, -20);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x90A0B0, 0.7);
    scene.add(hemiLight);

    // Engineering ground grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x8FA4B5, 0xD4DCE2);
    gridHelper.position.y = -2.6;
    scene.add(gridHelper);

    // Build procedural EV Battery Pack
    buildProceduralBatteryPack(scene);

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Window resize handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [updateCameraPosition]);

  // Construct Procedural EV Battery Model (Tray, 8 Modules, 96 Cells, Busbars, Cooling)
  const buildProceduralBatteryPack = (scene: THREE.Scene) => {
    cellMeshesRef.current.clear();
    moduleGroupsRef.current.clear();

    const packGroup = new THREE.Group();
    packEnclosureRef.current = packGroup;
    scene.add(packGroup);

    // 1. Lower Aluminum Tray (Battery Enclosure)
    const trayGeo = new THREE.BoxGeometry(26, 0.8, 14);
    const trayMat = new THREE.MeshStandardMaterial({
      color: 0xCED7DF,
      roughness: 0.45,
      metalness: 0.6,
    });
    const trayMesh = new THREE.Mesh(trayGeo, trayMat);
    trayMesh.position.y = -1.2;
    trayMesh.receiveShadow = true;
    packGroup.add(trayMesh);

    // 2. Liquid Cooling Cold Plate (Underneath modules)
    const coolingGeo = new THREE.BoxGeometry(24.5, 0.35, 12.8);
    const coolingMat = new THREE.MeshStandardMaterial({
      color: 0x0072A8,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.9,
    });
    const coolingPlate = new THREE.Mesh(coolingGeo, coolingMat);
    coolingPlate.position.y = -0.65;
    coolingPlateRef.current = coolingPlate;
    packGroup.add(coolingPlate);

    // 3. Modules and Cells
    const cellGeometry = new THREE.BoxGeometry(0.85, 2.4, 0.85); // Prismatic cell geometry
    const busbarGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.2);

    batteryPack.modules.forEach((mod) => {
      const moduleGroup = new THREE.Group();
      moduleGroup.name = mod.id;
      moduleGroupsRef.current.set(mod.id, moduleGroup);

      // Module coordinates in 2x4 pack array
      const mIdx = mod.moduleIndex - 1; // 0 to 7
      const modCol = mIdx % 4;          // 0, 1, 2, 3
      const modRow = Math.floor(mIdx / 4); // 0 or 1

      const baseModX = (modCol - 1.5) * 5.8;
      const baseModZ = (modRow - 0.5) * 5.8;

      moduleGroup.position.set(baseModX, 0, baseModZ);

      // Module Enclosure Frame (Side Compression Plates)
      const frameGeo = new THREE.BoxGeometry(5.2, 2.5, 3.8);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x485868,
        roughness: 0.5,
        metalness: 0.3,
        transparent: true,
        opacity: 0.22,
        wireframe: false,
      });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.set(0, 0.05, 0);
      moduleGroup.add(frameMesh);

      // Add Cells inside Module (4 columns x 3 rows = 12 cells per module)
      mod.cells.forEach((cell) => {
        const cIdx = cell.cellIndex - 1;
        const cCol = cIdx % 4; // 0..3
        const cRow = Math.floor(cIdx / 4); // 0..2

        const cellX = (cCol - 1.5) * 1.15;
        const cellZ = (cRow - 1.0) * 1.15;

        // Base cell material
        const cellMat = new THREE.MeshStandardMaterial({
          color: 0x8DA4B8, // Standard engineering blue-gray
          roughness: 0.35,
          metalness: 0.55,
        });

        const cellMesh = new THREE.Mesh(cellGeometry, cellMat);
        cellMesh.position.set(cellX, 0.05, cellZ);
        cellMesh.castShadow = true;
        cellMesh.receiveShadow = true;

        // Attach custom engineering metadata to mesh for picking
        cellMesh.userData = {
          cellId: cell.id,
          moduleId: mod.id,
          cellData: cell,
        };

        moduleGroup.add(cellMesh);
        cellMeshesRef.current.set(cell.id, cellMesh);

        // Terminal Busbars on top (+ and - interlinks)
        const busbarMat = new THREE.MeshStandardMaterial({
          color: (cell.cellIndex % 2 === 0) ? 0xE67E22 : 0x2980B9, // Copper orange / nickel terminal
          metalness: 0.8,
          roughness: 0.2,
        });
        const busbarMesh = new THREE.Mesh(busbarGeometry, busbarMat);
        busbarMesh.position.set(cellX, 1.3, cellZ);
        moduleGroup.add(busbarMesh);
      });

      packGroup.add(moduleGroup);
    });

    // 4. High-Voltage Junction Box / Contactors (Front end)
    const hvBoxGeo = new THREE.BoxGeometry(4.5, 1.6, 2.2);
    const hvBoxMat = new THREE.MeshStandardMaterial({
      color: 0x1E2730,
      roughness: 0.3,
      metalness: 0.8,
    });
    const hvBox = new THREE.Mesh(hvBoxGeo, hvBoxMat);
    hvBox.position.set(-11.0, 0.1, 0);
    packGroup.add(hvBox);

    // Orange high-voltage cables
    const cableGeo = new THREE.CylinderGeometry(0.18, 0.18, 6.0, 16);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0xF37021, roughness: 0.4 });
    const cablePos = new THREE.Mesh(cableGeo, cableMat);
    cablePos.rotation.z = Math.PI / 2;
    cablePos.position.set(-8.2, 0.4, 0.4);
    packGroup.add(cablePos);

    const cableNeg = new THREE.Mesh(cableGeo, cableMat);
    cableNeg.rotation.z = Math.PI / 2;
    cableNeg.position.set(-8.2, 0.4, -0.4);
    packGroup.add(cableNeg);

    // Selection highlight helper
    const outlineGeo = new THREE.BoxGeometry(0.95, 2.5, 0.95);
    const outlineEdges = new THREE.EdgesGeometry(outlineGeo);
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x00A8FF, linewidth: 2 });
    const selectionOutline = new THREE.LineSegments(outlineEdges, outlineMat);
    selectionOutline.visible = false;
    scene.add(selectionOutline);
    selectionOutlineRef.current = selectionOutline;
  };

  // Update Visual Colors based on Visualization Mode
  useEffect(() => {
    cellMeshesRef.current.forEach((mesh, cellId) => {
      // Find matching live cell in state
      let currentCell: BatteryCell | undefined;
      for (const m of batteryPack.modules) {
        currentCell = m.cells.find(c => c.id === cellId);
        if (currentCell) break;
      }

      if (!currentCell) return;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;

      // Check isolation
      if (isolatedObjectId && isolatedObjectId !== currentCell.id && isolatedObjectId !== currentCell.moduleId) {
        mat.transparent = true;
        mat.opacity = 0.15;
        return;
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
      }

      // Check wireframe
      mat.wireframe = wireframeActive;

      // Apply Colormap based on active mode
      switch (visualizationMode) {
        case 'THERMAL':
          mat.color = getThermalColor(currentCell.temperature);
          break;
        case 'SOC':
          mat.color = getSocColor(currentCell.soc);
          break;
        case 'SOH':
          mat.color = getSohColor(currentCell.soh);
          break;
        case 'VOLTAGE':
          mat.color = getVoltageColor(currentCell.voltage);
          break;
        case 'RUL':
          mat.color = getRulColor(currentCell.predictedRul);
          break;
        case 'DEGRADATION':
          // Gradient from healthy dark blue/green to faded amber
          mat.color = new THREE.Color().setHSL(0.35 - currentCell.degradationIndex * 0.35, 0.75, 0.45);
          break;
        case 'NORMAL':
        default:
          // Normal CAD metal styling
          if (currentCell.id === 'C-017' && currentCell.diagnosticState === 'WARNING') {
            // Subtle amber warning on anomaly cell
            mat.color = new THREE.Color(0xF59E0B);
          } else {
            mat.color = new THREE.Color(0x8DA4B8);
          }
          break;
      }

      // If selected, boost emissive intensity
      if (selectedCellId === cellId) {
        mat.emissive = new THREE.Color(0x005B91);
        mat.emissiveIntensity = 0.4;
      } else if (selectedModuleId === currentCell.moduleId && !selectedCellId) {
        mat.emissive = new THREE.Color(0x0072A8);
        mat.emissiveIntensity = 0.2;
      } else {
        mat.emissive = new THREE.Color(0x000000);
        mat.emissiveIntensity = 0;
      }
    });

    // Update selection outline position
    if (selectionOutlineRef.current && selectedCellId) {
      const selectedMesh = cellMeshesRef.current.get(selectedCellId);
      if (selectedMesh) {
        const worldPos = new THREE.Vector3();
        selectedMesh.getWorldPosition(worldPos);
        selectionOutlineRef.current.position.copy(worldPos);
        selectionOutlineRef.current.visible = true;
      }
    } else if (selectionOutlineRef.current) {
      selectionOutlineRef.current.visible = false;
    }
  }, [
    batteryPack,
    visualizationMode,
    selectedCellId,
    selectedModuleId,
    isolatedObjectId,
    wireframeActive,
  ]);

  // Handle Explode View Transition
  useEffect(() => {
    moduleGroupsRef.current.forEach((modGroup, modId) => {
      const mIdx = parseInt(modId.replace('MOD-0', '')) - 1;
      const modCol = mIdx % 4;
      const modRow = Math.floor(mIdx / 4);

      const baseModX = (modCol - 1.5) * 5.8;
      const baseModZ = (modRow - 0.5) * 5.8;

      // Expand outward based on explodeProgress
      const expandX = (modCol - 1.5) * 2.8 * explodeProgress;
      const expandZ = (modRow - 0.5) * 3.5 * explodeProgress;
      const liftY = 1.2 * explodeProgress;

      modGroup.position.set(baseModX + expandX, liftY, baseModZ + expandZ);
    });

    if (coolingPlateRef.current) {
      coolingPlateRef.current.position.y = -0.65 - 2.5 * explodeProgress;
    }
  }, [explodeProgress]);

  // Handle Section Cut Clipping
  useEffect(() => {
    if (!rendererRef.current) return;
    if (sectionCutActive) {
      const localPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.5);
      rendererRef.current.clippingPlanes = [localPlane];
      rendererRef.current.localClippingEnabled = true;
    } else {
      rendererRef.current.clippingPlanes = [];
      rendererRef.current.localClippingEnabled = false;
    }
  }, [sectionCutActive]);

  // Handle Camera Presets
  useEffect(() => {
    if (!cameraPreset) return;
    const { current: sph } = cameraSphericalRef;

    switch (cameraPreset) {
      case 'ISO':
        sph.radius = 36;
        sph.theta = Math.PI / 4;
        sph.phi = Math.PI / 3.2;
        break;
      case 'TOP':
        sph.radius = 32;
        sph.theta = 0;
        sph.phi = 0.05; // Almost straight top down
        break;
      case 'FRONT':
        sph.radius = 34;
        sph.theta = 0;
        sph.phi = Math.PI / 2;
        break;
      case 'SIDE':
        sph.radius = 34;
        sph.theta = Math.PI / 2;
        sph.phi = Math.PI / 2;
        break;
    }

    cameraTargetRef.current.set(0, 0, 0);
    updateCameraPosition();
    setCameraPreset(null);
  }, [cameraPreset, updateCameraPosition, setCameraPreset]);

  // Mouse Interaction (Orbit, Pan, Zoom, Object Raycasting)
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Orbit / Pan
    if (isDraggingRef.current) {
      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (dragButtonRef.current === 0) {
        // Rotate (Left drag)
        cameraSphericalRef.current.theta -= deltaX * 0.008;
        cameraSphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI / 2 - 0.02, cameraSphericalRef.current.phi - deltaY * 0.008)
        );
      } else if (dragButtonRef.current === 2) {
        // Pan (Right drag)
        const panSpeed = 0.03;
        cameraTargetRef.current.x -= deltaX * panSpeed;
        cameraTargetRef.current.z += deltaY * panSpeed;
      }
      updateCameraPosition();
      return;
    }

    // 2. Raycasting Hover
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const cellMeshes = Array.from(cellMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(cellMeshes, false);

    if (intersects.length > 0) {
      const hitCell = intersects[0].object.userData.cellData as BatteryCell;
      setHoveredCell(hitCell || null);
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraSphericalRef.current.radius = Math.max(
      10,
      Math.min(75, cameraSphericalRef.current.radius + e.deltaY * 0.03)
    );
    updateCameraPosition();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const cellMeshes = Array.from(cellMeshesRef.current.values());
    const intersects = raycaster.intersectObjects(cellMeshes, false);

    if (intersects.length > 0) {
      const hitCell = intersects[0].object.userData.cellData as BatteryCell;
      if (hitCell) {
        selectObject('CELL', hitCell.id);
      }
    }
  };

  const resetCamera = () => {
    cameraSphericalRef.current = { radius: 36, theta: Math.PI / 4, phi: Math.PI / 3.2 };
    cameraTargetRef.current.set(0, 0, 0);
    updateCameraPosition();
  };

  const zoomIn = () => {
    cameraSphericalRef.current.radius = Math.max(10, cameraSphericalRef.current.radius - 5);
    updateCameraPosition();
  };

  const zoomOut = () => {
    cameraSphericalRef.current.radius = Math.min(75, cameraSphericalRef.current.radius + 5);
    updateCameraPosition();
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative select-none overflow-hidden bg-[#EDF1F5] ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Floating Hover Telemetry Card */}
      {hoveredCell && (
        <div className="absolute top-3 left-3 bg-white/95 border border-[#D5D9DD] shadow-sm px-2.5 py-1.5 rounded-[2px] pointer-events-none z-10 text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold text-[#005B91]">
            <span>{hoveredCell.id}</span>
            <span className="text-[#7A8289]">·</span>
            <span className="text-[#5E666D]">{hoveredCell.moduleId}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 font-mono-numbers text-[10.5px] text-[#20252A]">
            <div>Temp: <span className="font-semibold">{hoveredCell.temperature}°C</span></div>
            <div>Volt: <span className="font-semibold">{hoveredCell.voltage}V</span></div>
            <div>SOC: <span className="font-semibold">{hoveredCell.soc}%</span></div>
            <div>SOH: <span className="font-semibold">{hoveredCell.soh}%</span></div>
          </div>
        </div>
      )}

      {/* 3D Viewport Engineering Orientation Compass */}
      <div className="absolute top-3 right-3 bg-white/90 border border-[#D5D9DD] px-2 py-1 rounded-[2px] flex items-center gap-2 text-[10px] text-[#5E666D] font-mono-numbers shadow-xs">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block"></span>X: Lat</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block"></span>Y: Vert</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>Z: Long</span>
      </div>

      {/* Compact Engineering Viewport Toolbar */}
      {showControls && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 border border-[#D5D9DD] shadow-sm px-2 py-1 rounded-[3px] flex items-center gap-1.5 z-10 text-[11px] text-[#20252A]">
          {/* Visualization Modes */}
          <div className="flex items-center gap-0.5 border-r border-[#D5D9DD] pr-1.5">
            <span className="text-[10px] text-[#7A8289] font-medium mr-1 uppercase">Layer:</span>
            {(['NORMAL', 'THERMAL', 'SOC', 'SOH', 'VOLTAGE', 'RUL'] as VisualizationMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setVisualizationMode(mode)}
                className={`px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  visualizationMode === mode
                    ? 'bg-[#005B91] text-white'
                    : 'text-[#5E666D] hover:bg-[#EAEFF4] hover:text-[#20252A]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Explode View Slider */}
          <div className="flex items-center gap-1.5 border-r border-[#D5D9DD] pr-1.5">
            <span className="text-[10px] text-[#7A8289] uppercase">Explode:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={explodeProgress}
              onChange={(e) => setExplodeProgress(parseFloat(e.target.value))}
              className="w-14 h-1 accent-[#005B91] cursor-pointer"
            />
          </div>

          {/* Camera Angles */}
          <div className="flex items-center gap-0.5 border-r border-[#D5D9DD] pr-1.5">
            <button
              onClick={() => setCameraPreset('ISO')}
              title="Isometric View"
              className="px-1 py-0.5 text-[10px] text-[#5E666D] hover:bg-[#EAEFF4]"
            >
              ISO
            </button>
            <button
              onClick={() => setCameraPreset('TOP')}
              title="Top View"
              className="px-1 py-0.5 text-[10px] text-[#5E666D] hover:bg-[#EAEFF4]"
            >
              TOP
            </button>
            <button
              onClick={() => setCameraPreset('FRONT')}
              title="Front View"
              className="px-1 py-0.5 text-[10px] text-[#5E666D] hover:bg-[#EAEFF4]"
            >
              FRONT
            </button>
            <button
              onClick={() => setCameraPreset('SIDE')}
              title="Side View"
              className="px-1 py-0.5 text-[10px] text-[#5E666D] hover:bg-[#EAEFF4]"
            >
              SIDE
            </button>
          </div>

          {/* Tools & Toggles */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSectionCut}
              className={`p-1 rounded-[2px] transition-colors ${
                sectionCutActive ? 'bg-[#DCECF6] text-[#0072A8]' : 'text-[#5E666D] hover:bg-[#EAEFF4]'
              }`}
              title="Section Cut Plane"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleWireframe}
              className={`p-1 rounded-[2px] transition-colors ${
                wireframeActive ? 'bg-[#DCECF6] text-[#0072A8]' : 'text-[#5E666D] hover:bg-[#EAEFF4]'
              }`}
              title="Wireframe View"
            >
              <Box className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={zoomIn}
              className="p-1 text-[#5E666D] hover:bg-[#EAEFF4] rounded-[2px]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={zoomOut}
              className="p-1 text-[#5E666D] hover:bg-[#EAEFF4] rounded-[2px]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={resetCamera}
              className="p-1 text-[#5E666D] hover:bg-[#EAEFF4] rounded-[2px]"
              title="Fit & Reset Camera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
