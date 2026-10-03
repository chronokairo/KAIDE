'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AgentEntity } from '@/domain/company';

interface PokemonOfficeSceneProps {
  agents: AgentEntity[];
  selectedAgent: AgentEntity | null;
  onSelectAgent: (agent: AgentEntity) => void;
}

// 3D Grid Positions for the Office Workstations (X, Z coordinates on the floor plane)
const AGENT_COORDINATES: Record<string, [number, number]> = {
  human_director: [0, -6], // Executive Center (Director / CTO)
  commercial: [-7, -3], // Sales & Lead Reception
  analyst: [-7, 2], // Requirements & Architecture
  product: [-7, 6], // Product Design & UX
  coder: [-2, 1], // Engineering Core Desk
  qa: [3, 1], // QA & Adversarial Testing Desk
  devops: [7, -4], // Cloud & Server Operations
  support: [7, 2], // Customer Support & SLA
  finance: [1, 6], // Finance & Admin Desk
};

// Role Accent Colors for 3D Stylized Low-Poly Characters
const ROLE_COLORS: Record<string, { jacket: string; hair: string; accent: string }> = {
  human_director: { jacket: '#0F766E', hair: '#1E293B', accent: '#F59E0B' }, // Deep Teal / Executive
  commercial: { jacket: '#0EA5E9', hair: '#78350F', accent: '#38BDF8' }, // Sky Blue
  analyst: { jacket: '#4F46E5', hair: '#312E81', accent: '#818CF8' }, // Indigo
  product: { jacket: '#DB2777', hair: '#831843', accent: '#F472B6' }, // Rose Pink
  coder: { jacket: '#EA580C', hair: '#1E293B', accent: '#FB923C' }, // Engineering Orange
  qa: { jacket: '#DC2626', hair: '#991B1B', accent: '#F87171' }, // Crimson / Alert
  devops: { jacket: '#7C3AED', hair: '#4C1D95', accent: '#A78BFA' }, // Violet / Infra
  support: { jacket: '#0891B2', hair: '#155E75', accent: '#22D3EE' }, // Cyan
  finance: { jacket: '#059669', hair: '#064E3B', accent: '#34D399' }, // Emerald
};

interface AgentAnimState {
  agentId: string;
  role: string;
  status: string;
  characterGroup: THREE.Group;
  headMesh: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  screenMesh: THREE.Mesh;
  beaconGroup: THREE.Group;
  beaconDiamond: THREE.Mesh;
  beaconRing: THREE.Mesh;
  seed: number;
}

export function PokemonOfficeScene({ agents, selectedAgent, onSelectAgent }: PokemonOfficeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animStatesRef = useRef<Map<string, AgentAnimState>>(new Map());
  const selectedHaloRef = useRef<THREE.Mesh | null>(null);
  const agentsRef = useRef<AgentEntity[]>(agents);
  agentsRef.current = agents;

  const onSelectAgentRef = useRef(onSelectAgent);
  onSelectAgentRef.current = onSelectAgent;

  // --- 1. Master Scene Mount & Static World Initialization ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    const frustumSize = 24;

    // --- Scene & Atmosphere (Pantone 2026 Cloud Dancer #F0EEE9) ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#F0EEE9');
    scene.fog = new THREE.FogExp2('#F0EEE9', 0.012);

    // --- Orthographic Isometric Camera ---
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    cameraRef.current = camera;
    camera.position.set(16, 20, 16);
    camera.lookAt(0, 0, 0);

    // --- WebGL Renderer with Soft Contact Shadows ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Soft Warm Lighting (Pantone Cloud Dancer Daylight) ---
    const ambientLight = new THREE.AmbientLight('#FFFDF8', 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFF7E6', 1.05);
    sunLight.position.set(15, 25, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -16;
    sunLight.shadow.camera.right = 16;
    sunLight.shadow.camera.top = 16;
    sunLight.shadow.camera.bottom = -16;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#E0F2FE', 0.45);
    fillLight.position.set(-15, 12, -10);
    scene.add(fillLight);

    // --- Static Office Architecture ---
    const officeGroup = new THREE.Group();
    scene.add(officeGroup);

    // Checkerboard floor tiles in Pantone Cloud Dancer tones (#F0EEE9 and #E8E5DF)
    const tileGeo = new THREE.BoxGeometry(1.92, 0.2, 1.92);
    const tileMatA = new THREE.MeshStandardMaterial({ color: '#F0EEE9', roughness: 0.9 });
    const tileMatB = new THREE.MeshStandardMaterial({ color: '#E8E5DF', roughness: 0.9 });

    for (let x = -6; x <= 6; x++) {
      for (let z = -5; z <= 5; z++) {
        const isAlt = (Math.abs(x) + Math.abs(z)) % 2 === 1;
        const tile = new THREE.Mesh(tileGeo, isAlt ? tileMatB : tileMatA);
        tile.position.set(x * 2, -0.1, z * 2);
        tile.receiveShadow = true;
        officeGroup.add(tile);
      }
    }

    // Low-poly Office Walls (North and West)
    const wallMat = new THREE.MeshStandardMaterial({ color: '#DFDBD3', roughness: 0.85 });

    const northWall = new THREE.Mesh(new THREE.BoxGeometry(26, 2.5, 0.4), wallMat);
    northWall.position.set(0, 1.25, -11.2);
    northWall.receiveShadow = true;
    northWall.castShadow = true;
    officeGroup.add(northWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 22), wallMat);
    westWall.position.set(-13.2, 1.25, 0);
    westWall.receiveShadow = true;
    westWall.castShadow = true;
    officeGroup.add(westWall);

    // Decorative Whiteboard with Post-it Notes
    const wb = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.4, 0.1),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4 })
    );
    wb.position.set(0, 1.4, -10.95);
    officeGroup.add(wb);

    const postItColors = ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5'];
    postItColors.forEach((color, i) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.02), new THREE.MeshBasicMaterial({ color }));
      p.position.set(-1.8 + i * 0.9, 1.4, -10.88);
      officeGroup.add(p);
    });

    // Potted Bonsai Plants in Corners
    const plantCoords = [
      [-12, -9.5],
      [11, -9.5],
      [-12, 9.5],
      [11, 9.5],
    ];
    const potGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.6, 12);
    const potMat = new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.7 });
    const leafGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const leafMat = new THREE.MeshStandardMaterial({ color: '#15803D', roughness: 0.8 });

    plantCoords.forEach(([px, pz]) => {
      const plantGroup = new THREE.Group();
      plantGroup.position.set(px, 0.3, pz);

      const pot = new THREE.Mesh(potGeo, potMat);
      pot.castShadow = true;
      pot.receiveShadow = true;
      plantGroup.add(pot);

      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 0.75;
      leaf.castShadow = true;
      plantGroup.add(leaf);

      officeGroup.add(plantGroup);
    });

    // Low-poly Server Rack in DevOps corner
    const rackGeo = new THREE.BoxGeometry(1.6, 2.2, 0.9);
    const rackMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.5 });
    const serverRack = new THREE.Mesh(rackGeo, rackMat);
    serverRack.position.set(9.5, 1.1, -8);
    serverRack.castShadow = true;
    serverRack.receiveShadow = true;
    officeGroup.add(serverRack);

    // Blinking Server LEDs
    const leds: THREE.Mesh[] = [];
    for (let r = 0; r < 4; r++) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.02),
        new THREE.MeshBasicMaterial({ color: r === 0 ? '#10B981' : '#38BDF8' })
      );
      led.position.set(9.1 + (r % 2) * 0.4, 0.6 + r * 0.4, -7.54);
      officeGroup.add(led);
      leds.push(led);
    }

    // Selection Halo Ring on Ground
    const haloGeo = new THREE.RingGeometry(1.1, 1.25, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: '#2563EB', side: THREE.DoubleSide });
    const selectedHalo = new THREE.Mesh(haloGeo, haloMat);
    selectedHalo.rotation.x = -Math.PI / 2;
    selectedHalo.position.y = 0.02;
    selectedHalo.visible = false;
    scene.add(selectedHalo);
    selectedHaloRef.current = selectedHalo;

    // --- 2. Pure 3D Workstations Setup (Zero Sprites) ---
    const deskGeo = new THREE.BoxGeometry(2.4, 0.85, 1.3);
    const deskMat = new THREE.MeshStandardMaterial({ color: '#D6CEBD', roughness: 0.6 });
    const execDeskMat = new THREE.MeshStandardMaterial({ color: '#4A3728', roughness: 0.4 });
    const monBase = new THREE.BoxGeometry(0.6, 0.45, 0.08);
    const monScreen = new THREE.BoxGeometry(0.54, 0.39, 0.02);

    // Ergonomic Chair Reusable Geometries
    const chairSeatGeo = new THREE.BoxGeometry(0.85, 0.12, 0.8);
    const chairBackGeo = new THREE.BoxGeometry(0.8, 0.85, 0.1);
    const chairPoleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8);
    const chairBaseGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.06, 12);
    const chairMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });
    const chairPoleMat = new THREE.MeshStandardMaterial({ color: '#94A3B8', metalness: 0.6, roughness: 0.3 });

    // Stylized Low-Poly Humanoid Geometries
    const torsoGeo = new THREE.BoxGeometry(0.68, 0.72, 0.42);
    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const hairGeo = new THREE.BoxGeometry(0.6, 0.22, 0.58);
    const armGeo = new THREE.BoxGeometry(0.16, 0.16, 0.52);
    const headsetGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8);
    const skinMat = new THREE.MeshStandardMaterial({ color: '#FCE7CF', roughness: 0.6 });

    // 3D Holographic Approval Beacon Geometries
    const diamondGeo = new THREE.OctahedronGeometry(0.32, 0);
    const ringGeo = new THREE.TorusGeometry(0.52, 0.035, 8, 24);

    const buildAgentWorkstations = () => {
      const currentAgents = agentsRef.current;
      const agentMeshes = agentMeshesRef.current;
      const animStates = animStatesRef.current;

      // Clear existing meshes if any
      agentMeshes.forEach((mesh) => scene.remove(mesh));
      agentMeshes.clear();
      animStates.clear();

      currentAgents.forEach((agent, index) => {
        const group = new THREE.Group();
        const coords = AGENT_COORDINATES[agent.role] || [0, 0];
        group.position.set(coords[0], 0, coords[1]);
        group.userData = { agentId: agent.id, agent };

        const isHuman = agent.role === 'human_director';
        const rolePal = ROLE_COLORS[agent.role] || { jacket: '#475569', hair: '#1E293B', accent: '#94A3B8' };

        // 1. 3D Workstation Desk (in front at Z = +0.4)
        const desk = new THREE.Mesh(deskGeo, isHuman ? execDeskMat : deskMat);
        desk.position.set(0, 0.425, 0.4);
        desk.castShadow = true;
        desk.receiveShadow = true;
        group.add(desk);

        // Laptop / Keyboard on Desk
        const laptopBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.02, 0.4),
          new THREE.MeshStandardMaterial({ color: '#CBD5E1', metalness: 0.5, roughness: 0.3 })
        );
        laptopBase.position.set(0, 0.86, 0.25);
        laptopBase.receiveShadow = true;
        group.add(laptopBase);

        // 2. 3D Computer Monitor on Desk
        const monitor = new THREE.Mesh(monBase, new THREE.MeshStandardMaterial({ color: '#1E293B' }));
        monitor.position.set(0, 1.08, 0.45);
        monitor.castShadow = true;
        group.add(monitor);

        const screenMat = new THREE.MeshBasicMaterial({
          color: agent.status === 'working' ? '#10B981' : agent.status === 'waiting_approval' ? '#F59E0B' : '#38BDF8',
        });
        const screen = new THREE.Mesh(monScreen, screenMat);
        screen.position.set(0, 1.08, 0.41);
        group.add(screen);

        // 3. 3D Ergonomic Office Chair (seated at Z = -0.4)
        const chairGroup = new THREE.Group();
        chairGroup.position.set(0, 0, -0.4);

        const chairBase = new THREE.Mesh(chairBaseGeo, chairMat);
        chairBase.position.y = 0.03;
        chairBase.castShadow = true;
        chairGroup.add(chairBase);

        const chairPole = new THREE.Mesh(chairPoleGeo, chairPoleMat);
        chairPole.position.y = 0.25;
        chairGroup.add(chairPole);

        const chairSeat = new THREE.Mesh(chairSeatGeo, chairMat);
        chairSeat.position.y = 0.5;
        chairSeat.castShadow = true;
        chairGroup.add(chairSeat);

        const chairBack = new THREE.Mesh(chairBackGeo, chairMat);
        chairBack.position.set(0, 0.95, -0.35);
        chairBack.castShadow = true;
        chairGroup.add(chairBack);

        group.add(chairGroup);

        // 4. 3D Stylized Low-Poly Humanoid Agent (Pure 3D geometry, seated at desk)
        const charGroup = new THREE.Group();
        charGroup.position.set(0, 0.5, -0.32);

        // Torso / Suit Jacket
        const jacketMat = new THREE.MeshStandardMaterial({ color: rolePal.jacket, roughness: 0.6 });
        const torso = new THREE.Mesh(torsoGeo, jacketMat);
        torso.position.y = 0.45;
        torso.castShadow = true;
        torso.receiveShadow = true;
        charGroup.add(torso);

        // Head
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 0.98;
        head.castShadow = true;
        charGroup.add(head);

        // Stylized Hair
        const hairMat = new THREE.MeshStandardMaterial({ color: rolePal.hair, roughness: 0.7 });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.set(0, 1.14, -0.04);
        hair.castShadow = true;
        charGroup.add(hair);

        // Tech Headset Earpieces
        const headsetMat = new THREE.MeshStandardMaterial({ color: '#0F172A', metalness: 0.6, roughness: 0.4 });
        const headsetL = new THREE.Mesh(headsetGeo, headsetMat);
        headsetL.rotation.z = Math.PI / 2;
        headsetL.position.set(0.3, 0.98, 0);
        charGroup.add(headsetL);

        const headsetR = new THREE.Mesh(headsetGeo, headsetMat);
        headsetR.rotation.z = Math.PI / 2;
        headsetR.position.set(-0.3, 0.98, 0);
        charGroup.add(headsetR);

        // Arms positioned forward towards keyboard
        const leftArm = new THREE.Mesh(armGeo, jacketMat);
        leftArm.position.set(-0.36, 0.42, 0.28);
        leftArm.rotation.x = 0.6;
        leftArm.castShadow = true;
        charGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, jacketMat);
        rightArm.position.set(0.36, 0.42, 0.28);
        rightArm.rotation.x = 0.6;
        rightArm.castShadow = true;
        charGroup.add(rightArm);

        group.add(charGroup);

        // 5. 3D Holographic Approval Beacon (Floating above station when waiting approval)
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(0, 2.45, -0.32);

        const diamondMat = new THREE.MeshStandardMaterial({
          color: '#F59E0B',
          emissive: '#F59E0B',
          emissiveIntensity: 0.75,
          roughness: 0.2,
          metalness: 0.8,
        });
        const beaconDiamond = new THREE.Mesh(diamondGeo, diamondMat);
        beaconGroup.add(beaconDiamond);

        const ringMat = new THREE.MeshBasicMaterial({ color: '#FCD34D' });
        const beaconRing = new THREE.Mesh(ringGeo, ringMat);
        beaconRing.rotation.x = Math.PI / 4;
        beaconGroup.add(beaconRing);

        beaconGroup.visible = agent.status === 'waiting_approval';
        group.add(beaconGroup);

        scene.add(group);
        agentMeshes.set(agent.id, group);

        // Register Animation State
        animStates.set(agent.id, {
          agentId: agent.id,
          role: agent.role,
          status: agent.status,
          characterGroup: charGroup,
          headMesh: head,
          leftArm,
          rightArm,
          screenMesh: screen,
          beaconGroup,
          beaconDiamond,
          beaconRing,
          seed: index * 1.41,
        });
      });
    };

    buildAgentWorkstations();

    // --- 3. Mouse Navigation: Smooth Drag Pan & Zoom ---
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

      const factor = (camera.right - camera.left) / width;
      camera.position.x -= (dx - dy) * factor * 0.65;
      camera.position.z -= (dx + dy) * factor * 0.65;

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

      if (newWidth > 10 && newWidth < 50) {
        camera.left = -newWidth / 2;
        camera.right = newWidth / 2;
        camera.top = newHeight / 2;
        camera.bottom = -newHeight / 2;
        camera.updateProjectionMatrix();
      }
    };

    // Raycast Click Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const objectsToTest: THREE.Object3D[] = [];
      agentMeshesRef.current.forEach((grp) => objectsToTest.push(...grp.children));

      const hits = raycaster.intersectObjects(objectsToTest, true);
      if (hits.length > 0) {
        let curr: THREE.Object3D | null = hits[0].object;
        while (curr && !curr.userData.agentId) {
          curr = curr.parent;
        }
        if (curr && curr.userData.agent) {
          onSelectAgentRef.current(curr.userData.agent);
        }
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('click', onClick);

    // Resize
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

    // Camera action event listener (zoom-in, zoom-out, reset)
    const handleCameraAction = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!camera || !container) return;
      if (detail.action === 'zoom-in') {
        const factor = 0.82;
        camera.left *= factor;
        camera.right *= factor;
        camera.top *= factor;
        camera.bottom *= factor;
        camera.updateProjectionMatrix();
      } else if (detail.action === 'zoom-out') {
        const factor = 1.22;
        camera.left *= factor;
        camera.right *= factor;
        camera.top *= factor;
        camera.bottom *= factor;
        camera.updateProjectionMatrix();
      } else if (detail.action === 'reset') {
        const asp = container.clientWidth / container.clientHeight;
        camera.left = (-frustumSize * asp) / 2;
        camera.right = (frustumSize * asp) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.position.set(16, 20, 16);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
      }
    };
    window.addEventListener('office-camera-action', handleCameraAction);

    // --- 4. Master 3D Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate 3D Humanoid Figures & Holographic Beacons
      animStatesRef.current.forEach((state) => {
        const { status, seed, characterGroup, headMesh, leftArm, rightArm, beaconGroup, beaconDiamond, beaconRing } =
          state;

        if (status === 'working') {
          // Dynamic typing and focused forward rhythm
          characterGroup.position.y = 0.5 + Math.sin(elapsed * 6.5 + seed) * 0.012;
          headMesh.rotation.x = 0.15 + Math.sin(elapsed * 5.0 + seed) * 0.04;
          leftArm.rotation.x = 0.6 + Math.sin(elapsed * 12.0) * 0.08;
          rightArm.rotation.x = 0.6 - Math.sin(elapsed * 12.0) * 0.08;
        } else if (status === 'waiting_approval') {
          // Looking up alertly towards director, floating beacon rotating overhead
          characterGroup.position.y = 0.5 + Math.sin(elapsed * 3.5 + seed) * 0.015;
          headMesh.rotation.x = -0.2 + Math.sin(elapsed * 4.0) * 0.04;
          leftArm.rotation.x = 0.5;
          rightArm.rotation.x = 0.5;

          // Holographic Beacon 3D Animation
          beaconGroup.position.y = 2.45 + Math.sin(elapsed * 4.0) * 0.08;
          beaconDiamond.rotation.y = elapsed * 1.8;
          beaconRing.rotation.z = -elapsed * 2.2;
        } else {
          // Calm idle breathing
          characterGroup.position.y = 0.5 + Math.sin(elapsed * 2.2 + seed) * 0.015;
          headMesh.rotation.x = Math.sin(elapsed * 1.5 + seed) * 0.03;
          leftArm.rotation.x = 0.55;
          rightArm.rotation.x = 0.55;
        }
      });

      // Blinking LEDs on servers
      leds.forEach((led, idx) => {
        led.visible = Math.sin(elapsed * 4 + idx) > -0.2;
      });

      // Selection Halo Pulse
      if (selectedHalo.visible) {
        const s = 1 + Math.sin(elapsed * 5) * 0.06;
        selectedHalo.scale.set(s, s, 1);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('office-camera-action', handleCameraAction);
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
  }, []);

  // --- 2. Reactive Agent Status Updates (Zero scene reloads) ---
  useEffect(() => {
    agents.forEach((agent) => {
      const state = animStatesRef.current.get(agent.id);
      if (state) {
        state.status = agent.status;

        // Update Screen Color
        const mat = state.screenMesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.color.set(
            agent.status === 'working' ? '#10B981' : agent.status === 'waiting_approval' ? '#F59E0B' : '#38BDF8'
          );
        }

        // Update Holographic Beacon Visibility
        state.beaconGroup.visible = agent.status === 'waiting_approval';
      }
    });
  }, [agents]);

  // --- 3. Selection Halo Position Update ---
  useEffect(() => {
    if (!selectedHaloRef.current) return;
    if (selectedAgent) {
      const coords = AGENT_COORDINATES[selectedAgent.role] || [0, 0];
      selectedHaloRef.current.position.set(coords[0], 0.02, coords[1] + 0.4);
      selectedHaloRef.current.visible = true;
    } else {
      selectedHaloRef.current.visible = false;
    }
  }, [selectedAgent]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
      style={{ backgroundColor: '#F0EEE9' }}
    />
  );
}

export { PokemonOfficeScene as VirtualOfficeScene };
