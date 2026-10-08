'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AgentEntity } from '@/domain/company';

interface CompanyScene2DProps {
  agents: AgentEntity[];
  selectedAgent: AgentEntity | null;
  onSelectAgent: (agent: AgentEntity) => void;
}

// 2D Office Layout Coordinates (X, Y on 2D plane)
const OFFICE_COORDINATES: Record<string, [number, number]> = {
  human_director: [0, 140], // Top Center (Executive Command)
  commercial: [-220, 90], // Top Left
  analyst: [-220, -20], // Mid Left
  product: [-220, -130], // Bottom Left
  coder: [-60, -20], // Center Left (Engineering)
  qa: [80, -20], // Center Right (Quality)
  devops: [220, 90], // Top Right (Cloud & Server Racks)
  support: [220, -20], // Mid Right
  finance: [0, -140], // Bottom Center
};

export function CompanyScene2D({ agents, selectedAgent, onSelectAgent }: CompanyScene2DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectionBoxRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    const frustumSize = 460;

    // --- Scene Setup: Pantone 2026 White (Cloud Dancer #F0EEE9) ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#F0EEE9');

    // --- 2D Orthographic Camera ---
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -100,
      100
    );
    cameraRef.current = camera;
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Load Color 8-Bit Anime Spritesheet with Pixelated filtering
    const textureLoader = new THREE.TextureLoader();
    const spriteSheet = textureLoader.load('/anime_8bit_color.png');
    spriteSheet.magFilter = THREE.NearestFilter;
    spriteSheet.minFilter = THREE.NearestFilter;

    // --- 1. Floor & Department Tiles (Pantone 2026 Cloud Dancer Off-White Grid) ---
    const floorGroup = new THREE.Group();
    scene.add(floorGroup);

    // Floor base in #F0EEE9
    const baseGeo = new THREE.PlaneGeometry(800, 560);
    const baseMat = new THREE.MeshBasicMaterial({ color: '#F0EEE9' });
    const floorMesh = new THREE.Mesh(baseGeo, baseMat);
    floorMesh.position.z = -2;
    floorGroup.add(floorMesh);

    // 2D Pixel Grid Lines (Warm subtle retro tile seams)
    const gridTexCanvas = document.createElement('canvas');
    gridTexCanvas.width = 32;
    gridTexCanvas.height = 32;
    const gctx = gridTexCanvas.getContext('2d');
    if (gctx) {
      gctx.fillStyle = '#F0EEE9';
      gctx.fillRect(0, 0, 32, 32);
      gctx.strokeStyle = '#E3DFD5';
      gctx.lineWidth = 1;
      gctx.strokeRect(0, 0, 32, 32);
    }
    const gridTexture = new THREE.CanvasTexture(gridTexCanvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(25, 17.5);
    gridTexture.magFilter = THREE.NearestFilter;
    const gridMat = new THREE.MeshBasicMaterial({ map: gridTexture, transparent: true, opacity: 0.8 });
    const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(800, 560), gridMat);
    gridPlane.position.z = -1.9;
    floorGroup.add(gridPlane);

    // Department Room Carpets / Zones in Retro 8-Bit Colors
    const zones = [
      { name: 'EXECUTIVE COMMAND', x: 0, y: 140, w: 180, h: 90, color: '#E0F2FE', border: '#0284C7' },
      { name: 'SALES & CRM', x: -220, y: 90, w: 150, h: 80, color: '#DCFCE7', border: '#16A34A' },
      { name: 'ANALYSIS & REQ', x: -220, y: -20, w: 150, h: 80, color: '#E0E7FF', border: '#4F46E5' },
      { name: 'PRODUCT & UX', x: -220, y: -130, w: 150, h: 80, color: '#FCE7F3', border: '#DB2777' },
      { name: 'ENGINEERING CORE', x: -60, y: -20, w: 140, h: 80, color: '#FEF3C7', border: '#D97706' },
      { name: 'QA & SECURITY', x: 80, y: -20, w: 140, h: 80, color: '#FEE2E2', border: '#DC2626' },
      { name: 'CLOUD & DEVOPS', x: 220, y: 90, w: 150, h: 80, color: '#F3E8FF', border: '#7C3AED' },
      { name: 'SUPPORT & SLA', x: 220, y: -20, w: 150, h: 80, color: '#CFFAFE', border: '#0891B2' },
      { name: 'FINANCE & OPS', x: 0, y: -140, w: 180, h: 80, color: '#FEF9C3', border: '#CA8A04' },
    ];

    zones.forEach((z) => {
      // Zone Carpet
      const carpetGeo = new THREE.PlaneGeometry(z.w, z.h);
      const carpetMat = new THREE.MeshBasicMaterial({ color: z.color });
      const carpet = new THREE.Mesh(carpetGeo, carpetMat);
      carpet.position.set(z.x, z.y, -1.8);
      floorGroup.add(carpet);

      // Pixel Border around zone
      const edges = new THREE.EdgesGeometry(carpetGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: z.border, linewidth: 2 });
      const borderLines = new THREE.LineSegments(edges, lineMat);
      borderLines.position.set(z.x, z.y, -1.75);
      floorGroup.add(borderLines);

      // Zone Label
      const zCanvas = document.createElement('canvas');
      zCanvas.width = 160;
      zCanvas.height = 24;
      const zctx = zCanvas.getContext('2d');
      if (zctx) {
        zctx.fillStyle = z.border;
        zctx.font = 'bold 12px "Courier New", monospace';
        zctx.fillText(z.name, 4, 16);
      }
      const zTex = new THREE.CanvasTexture(zCanvas);
      zTex.magFilter = THREE.NearestFilter;
      const zSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true }));
      zSprite.position.set(z.x - z.w / 2 + 36, z.y + z.h / 2 - 8, -1.7);
      zSprite.scale.set(60, 10, 1);
      floorGroup.add(zSprite);
    });

    // --- 2. Animated 2D Data Conduit Cables (Pipeline Flow) ---
    // Commercial -> Analyst -> Product -> Coder -> QA -> DevOps -> Human Gate -> Support & Finance
    const pipelinePoints = [
      new THREE.Vector2(-220, 90),
      new THREE.Vector2(-220, -20),
      new THREE.Vector2(-220, -130),
      new THREE.Vector2(-60, -20),
      new THREE.Vector2(80, -20),
      new THREE.Vector2(220, 90),
      new THREE.Vector2(0, 140), // Human Gate
      new THREE.Vector2(220, -20),
      new THREE.Vector2(0, -140),
    ];

    const pipeGeo = new THREE.BufferGeometry().setFromPoints(pipelinePoints);
    const pipeMat = new THREE.LineDashedMaterial({
      color: '#1E293B',
      dashSize: 6,
      gapSize: 4,
      linewidth: 2,
    });
    const pipelineLine = new THREE.Line(pipeGeo, pipeMat);
    pipelineLine.computeLineDistances();
    pipelineLine.position.z = -1.6;
    scene.add(pipelineLine);

    // Floating 2D Data Bits (Packets) travelling on the line
    const dataBitGeo = new THREE.PlaneGeometry(6, 6);
    const dataBitMat = new THREE.MeshBasicMaterial({ color: '#2563EB' });
    const packetGroup = new THREE.Group();
    scene.add(packetGroup);

    const packets: { mesh: THREE.Mesh; segIndex: number; t: number; speed: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(dataBitGeo, dataBitMat);
      packetGroup.add(p);
      packets.push({
        mesh: p,
        segIndex: i % (pipelinePoints.length - 1),
        t: Math.random(),
        speed: 0.008 + Math.random() * 0.004,
      });
    }

    // --- 3. 2D Selection Box (Animated 8-bit Corner Brackets) ---
    const selGroup = new THREE.Group();
    selGroup.visible = false;
    scene.add(selGroup);
    selectionBoxRef.current = selGroup;

    const bMat = new THREE.LineBasicMaterial({ color: '#000000', linewidth: 3 });
    const bGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector2(-35, 30),
      new THREE.Vector2(-35, 35),
      new THREE.Vector2(-30, 35),

      new THREE.Vector2(30, 35),
      new THREE.Vector2(35, 35),
      new THREE.Vector2(35, 30),

      new THREE.Vector2(35, -30),
      new THREE.Vector2(35, -35),
      new THREE.Vector2(30, -35),

      new THREE.Vector2(-30, -35),
      new THREE.Vector2(-35, -35),
      new THREE.Vector2(-35, -30),
    ]);
    const selLines = new THREE.LineSegments(bGeo, bMat);
    selGroup.add(selLines);

    // --- 4. Workstations & 2D Pixel Characters ---
    const agentGroups = new Map<string, THREE.Group>();
    agentGroupsRef.current = agentGroups;

    // Sprite row mapping for characters (5 rows in anime_8bit_color.png: 0=Coder, 1=Analyst, 2=QA, 3=DevOps, 4=Manager)
    const ROLE_ROW_MAP: Record<string, number> = {
      human_director: 4,
      commercial: 1,
      analyst: 1,
      product: 2,
      coder: 0,
      qa: 2,
      devops: 3,
      support: 0,
      finance: 4,
    };

    agents.forEach((agent) => {
      const group = new THREE.Group();
      const coords = OFFICE_COORDINATES[agent.role] || [0, 0];
      group.position.set(coords[0], coords[1], 0);
      group.userData = { agentId: agent.id, agent };

      // A. Pixel Desk (Wood / Tech desk in 2D)
      const isHuman = agent.role === 'human_director';
      const deskW = isHuman ? 75 : 55;
      const deskH = 26;

      const deskCanvas = document.createElement('canvas');
      deskCanvas.width = 64;
      deskCanvas.height = 32;
      const dctx = deskCanvas.getContext('2d');
      if (dctx) {
        dctx.imageSmoothingEnabled = false;
        // Desk surface
        dctx.fillStyle = isHuman ? '#3B2F2F' : '#4B5563';
        dctx.fillRect(0, 0, 64, 32);
        // Desk edge
        dctx.fillStyle = isHuman ? '#2A1F1F' : '#374151';
        dctx.fillRect(0, 24, 64, 8);
        // Desk border
        dctx.strokeStyle = '#111827';
        dctx.lineWidth = 2;
        dctx.strokeRect(0, 0, 64, 32);
        // Mini CRT Computer on desk
        dctx.fillStyle = '#E5E7EB';
        dctx.fillRect(20, 4, 24, 18);
        dctx.fillStyle = agent.status === 'working' ? '#10B981' : agent.status === 'waiting_approval' ? '#F59E0B' : '#3B82F6';
        dctx.fillRect(22, 6, 20, 12);
      }
      const deskTex = new THREE.CanvasTexture(deskCanvas);
      deskTex.magFilter = THREE.NearestFilter;
      const deskMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(deskW, deskH),
        new THREE.MeshBasicMaterial({ map: deskTex, transparent: true })
      );
      deskMesh.position.set(0, -10, 0);
      group.add(deskMesh);

      // B. 2D Anime Pixel Character Avatar (Sprite UV Crop from anime_8bit_color.png)
      const rowIndex = ROLE_ROW_MAP[agent.role] ?? 0;
      // 5 rows total, 8 columns
      const rowStep = 1 / 5;
      const colStep = 1 / 8;
      // Use column 0 for idle front-facing pose
      const charTex = spriteSheet.clone();
      charTex.magFilter = THREE.NearestFilter;
      charTex.repeat.set(colStep, rowStep);
      charTex.offset.set(0, 1 - (rowIndex + 1) * rowStep);

      const charMat = new THREE.SpriteMaterial({ map: charTex, transparent: true });
      const charSprite = new THREE.Sprite(charMat);
      charSprite.position.set(0, 14, 0.5);
      charSprite.scale.set(40, 40, 1);
      charSprite.name = 'charSprite';
      group.add(charSprite);

      // C. Floating 8-Bit Pixel Status Badge
      const statusCanvas = document.createElement('canvas');
      statusCanvas.width = 160;
      statusCanvas.height = 40;
      const sctx = statusCanvas.getContext('2d');
      if (sctx) {
        sctx.imageSmoothingEnabled = false;
        // 8-bit black border with white background
        sctx.fillStyle = '#111827';
        sctx.fillRect(0, 0, 160, 40);
        sctx.fillStyle = '#F0EEE9';
        sctx.fillRect(2, 2, 156, 36);

        // Name
        sctx.fillStyle = '#111827';
        sctx.font = 'bold 13px "Courier New", monospace';
        sctx.textAlign = 'center';
        sctx.fillText(agent.name.toUpperCase(), 80, 18);

        // Status pill
        sctx.fillStyle =
          agent.status === 'waiting_approval'
            ? '#DC2626'
            : agent.status === 'working'
            ? '#059669'
            : '#4B5563';
        sctx.font = 'bold 10px "Courier New", monospace';
        const stText =
          agent.status === 'waiting_approval'
            ? '[! GATE REQ !]'
            : agent.status === 'working'
            ? '[ATIVO]'
            : '[OCIOSO]';
        sctx.fillText(stText, 80, 31);
      }
      const statusTex = new THREE.CanvasTexture(statusCanvas);
      statusTex.magFilter = THREE.NearestFilter;
      const statusSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: statusTex, transparent: true }));
      statusSprite.position.set(0, 42, 0.6);
      statusSprite.scale.set(50, 13, 1);
      group.add(statusSprite);

      scene.add(group);
      agentGroups.set(agent.id, group);
    });

    // --- 5. Mouse Interaction: Pan, Zoom & Raycasting ---
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;

      const scale = (camera.right - camera.left) / width;
      camera.position.x -= dx * scale;
      camera.position.y += dy * scale;

      // Clamp panning boundaries
      camera.position.x = Math.max(-250, Math.min(250, camera.position.x));
      camera.position.y = Math.max(-200, Math.min(200, camera.position.y));

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      const newWidth = (camera.right - camera.left) * zoomFactor;
      const newHeight = (camera.top - camera.bottom) * zoomFactor;

      if (newWidth > 200 && newWidth < 1200) {
        camera.left = -newWidth / 2;
        camera.right = newWidth / 2;
        camera.top = newHeight / 2;
        camera.bottom = -newHeight / 2;
        camera.updateProjectionMatrix();
      }
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const objectsToTest: THREE.Object3D[] = [];
      agentGroups.forEach((grp) => objectsToTest.push(...grp.children));

      const hits = raycaster.intersectObjects(objectsToTest, true);
      if (hits.length > 0) {
        let curr: THREE.Object3D | null = hits[0].object;
        while (curr && !curr.userData.agentId) {
          curr = curr.parent;
        }
        if (curr && curr.userData.agent) {
          onSelectAgent(curr.userData.agent);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('click', onClick);

    // Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const asp = w / h;
      camera.left = (-frustumSize * asp) / 2;
      camera.right = (frustumSize * asp) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 6. Animation Loop (60fps Pixel Retro Bobbing & Data Packets) ---
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate packet movements along conveyor
      packets.forEach((p) => {
        p.t += p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.segIndex = (p.segIndex + 1) % (pipelinePoints.length - 1);
        }
        const p1 = pipelinePoints[p.segIndex];
        const p2 = pipelinePoints[p.segIndex + 1];
        p.mesh.position.x = THREE.MathUtils.lerp(p1.x, p2.x, p.t);
        p.mesh.position.y = THREE.MathUtils.lerp(p1.y, p2.y, p.t);
      });

      // Subtle 8-bit breathing / typing bob for characters
      agentGroups.forEach((group, id) => {
        const char = group.getObjectByName('charSprite');
        if (char) {
          // Discrete 8-bit stepped vertical bob
          const stepBob = Math.floor(Math.sin(elapsed * 4 + Number(id.charCodeAt(id.length - 1))) * 2);
          char.position.y = 14 + stepBob;
        }
      });

      // Selection reticle pulsing
      if (selGroup.visible) {
        const selPulse = 1 + Math.sin(elapsed * 6) * 0.05;
        selGroup.scale.set(selPulse, selPulse, 1);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('click', onClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [agents, onSelectAgent]);

  // Update selection box on selected agent change
  useEffect(() => {
    if (!selectionBoxRef.current) return;
    if (selectedAgent) {
      const coords = OFFICE_COORDINATES[selectedAgent.role] || [0, 0];
      selectionBoxRef.current.position.set(coords[0], coords[1] + 10, 0.7);
      selectionBoxRef.current.visible = true;
    } else {
      selectionBoxRef.current.visible = false;
    }
  }, [selectedAgent]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-crosshair select-none overflow-hidden"
      style={{ backgroundColor: '#F0EEE9' }}
    />
  );
}
