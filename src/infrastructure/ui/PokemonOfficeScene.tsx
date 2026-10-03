'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AgentEntity } from '@/domain/company';

interface PokemonOfficeSceneProps {
  agents: AgentEntity[];
  selectedAgent: AgentEntity | null;
  onSelectAgent: (agent: AgentEntity) => void;
}

// 3D Grid Positions for the Pokemon-style Office (X, Z coordinates on the floor plane)
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

// Spritesheet row mapping: 0=Coder, 1=Analyst/Commercial, 2=QA/Product, 3=DevOps, 4=Director
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

// Spritesheet constants (1024x1024, 8 cols, 5 rows -> 128x204.8 px per frame)
const SHEET_COLS = 8;
const SHEET_ROWS = 5;
const FRAME_ASPECT = 5 / 8; // 0.625 (128 / 204.8)
const SPRITE_HEIGHT = 2.08;
const SPRITE_WIDTH = SPRITE_HEIGHT * FRAME_ASPECT; // 1.30
const SPRITE_BASE_Y = SPRITE_HEIGHT / 2; // 1.04 (feet sit on Y=0)

interface AgentAnimState {
  agentId: string;
  role: string;
  status: string;
  texture: THREE.Texture;
  sprite: THREE.Sprite;
  screenMesh: THREE.Mesh;
  alertSprite: THREE.Sprite;
  rowIndex: number;
  currentCol: number;
  lastFrameTime: number;
  seed: number;
}

export function PokemonOfficeScene({ agents, selectedAgent, onSelectAgent }: PokemonOfficeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const masterTextureRef = useRef<THREE.Texture | null>(null);
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

    // --- Pokemon 2D/3D Orthographic Isometric Camera ---
    // Classic Pokémon Gen 4/5 DS angle: elevated looking towards center
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

    // --- Warm Soft Lighting (Daylight Office / Pokemon Center) ---
    const ambientLight = new THREE.AmbientLight('#FFFDF8', 0.88);
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
    const haloGeo = new THREE.RingGeometry(0.9, 1.05, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: '#2563EB', side: THREE.DoubleSide });
    const selectedHalo = new THREE.Mesh(haloGeo, haloMat);
    selectedHalo.rotation.x = -Math.PI / 2;
    selectedHalo.position.y = 0.02;
    selectedHalo.visible = false;
    scene.add(selectedHalo);
    selectedHaloRef.current = selectedHalo;

    // --- 2. Sprite Sheet & Agent Workstations Setup ---
    const deskGeo = new THREE.BoxGeometry(2.4, 0.85, 1.3);
    const deskMat = new THREE.MeshStandardMaterial({ color: '#D6CEBD', roughness: 0.6 });
    const execDeskMat = new THREE.MeshStandardMaterial({ color: '#4A3728', roughness: 0.4 });
    const monBase = new THREE.BoxGeometry(0.6, 0.45, 0.08);
    const monScreen = new THREE.BoxGeometry(0.54, 0.39, 0.02);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/anime_8bit_color.png', (masterTexture) => {
      masterTexture.wrapS = THREE.RepeatWrapping;
      masterTexture.wrapT = THREE.RepeatWrapping;
      masterTexture.magFilter = THREE.NearestFilter;
      masterTexture.minFilter = THREE.NearestFilter;
      masterTexture.generateMipmaps = false;
      masterTextureRef.current = masterTexture;

      // Populate Agents
      buildAgentWorkstations(masterTexture);
    });

    const buildAgentWorkstations = (masterTexture: THREE.Texture) => {
      const currentAgents = agentsRef.current;
      const agentMeshes = agentMeshesRef.current;
      const animStates = animStatesRef.current;

      // Clear existing agent meshes if any
      agentMeshes.forEach((mesh) => scene.remove(mesh));
      agentMeshes.clear();
      animStates.clear();

      currentAgents.forEach((agent, index) => {
        const group = new THREE.Group();
        const coords = AGENT_COORDINATES[agent.role] || [0, 0];
        group.position.set(coords[0], 0, coords[1]);
        group.userData = { agentId: agent.id, agent };

        // 1. 3D Workstation Desk (positioned in front at Z = +0.4)
        const isHuman = agent.role === 'human_director';
        const desk = new THREE.Mesh(deskGeo, isHuman ? execDeskMat : deskMat);
        desk.position.set(0, 0.425, 0.4);
        desk.castShadow = true;
        desk.receiveShadow = true;
        group.add(desk);

        // 2. 3D Computer Monitor on Desk
        const monitor = new THREE.Mesh(monBase, new THREE.MeshStandardMaterial({ color: '#334155' }));
        monitor.position.set(0, 1.05, 0.3);
        monitor.castShadow = true;
        group.add(monitor);

        const screenMat = new THREE.MeshBasicMaterial({
          color: agent.status === 'working' ? '#10B981' : agent.status === 'waiting_approval' ? '#F59E0B' : '#38BDF8',
        });
        const screen = new THREE.Mesh(monScreen, screenMat);
        screen.position.set(0, 1.05, 0.35);
        group.add(screen);

        // 3. 2D Anime Character Sprite (Standing behind desk at Z = -0.4)
        const rowIndex = ROLE_ROW_MAP[agent.role] ?? 0;
        const charTex = masterTexture.clone();
        charTex.wrapS = THREE.RepeatWrapping;
        charTex.wrapT = THREE.RepeatWrapping;
        charTex.repeat.set(1 / SHEET_COLS, 1 / SHEET_ROWS);
        charTex.offset.set(0, 1.0 - (rowIndex + 1) * (1 / SHEET_ROWS));
        charTex.magFilter = THREE.NearestFilter;
        charTex.minFilter = THREE.NearestFilter;
        charTex.generateMipmaps = false;

        const charMat = new THREE.SpriteMaterial({
          map: charTex,
          transparent: true,
          alphaTest: 0.15,
          depthTest: true,
          depthWrite: true,
        });

        const charSprite = new THREE.Sprite(charMat);
        charSprite.position.set(0, SPRITE_BASE_Y, -0.4);
        charSprite.scale.set(SPRITE_WIDTH, SPRITE_HEIGHT, 1);
        charSprite.name = 'charSprite';
        group.add(charSprite);

        // Ground Contact Shadow Disc (Classic Pokemon drop shadow under feet)
        const shadowGeo = new THREE.CircleGeometry(0.52, 16);
        const shadowMat = new THREE.MeshBasicMaterial({ color: '#2B261D', transparent: true, opacity: 0.25 });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.set(0, 0.02, -0.4);
        group.add(shadow);

        // 4. Floating Name Tag Pill (High-DPI canvas texture)
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 320;
        labelCanvas.height = 80;
        const lctx = labelCanvas.getContext('2d');
        if (lctx) {
          lctx.scale(2, 2);
          lctx.fillStyle = '#FFFFFF';
          lctx.strokeStyle = '#D1D5DB';
          lctx.lineWidth = 1.5;
          lctx.beginPath();
          lctx.roundRect(2, 2, 156, 36, 18);
          lctx.fill();
          lctx.stroke();

          lctx.fillStyle = '#111827';
          lctx.font = 'bold 13px -apple-system, sans-serif';
          lctx.textAlign = 'center';
          lctx.fillText(agent.name, 80, 24);
        }
        const labelTex = new THREE.CanvasTexture(labelCanvas);
        labelTex.magFilter = THREE.LinearFilter;
        const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
        labelSprite.position.set(0, 2.45, -0.4);
        labelSprite.scale.set(2.2, 0.55, 1);
        group.add(labelSprite);

        // 5. Exclamation Icon `!` when Waiting Approval
        const alertCanvas = document.createElement('canvas');
        alertCanvas.width = 64;
        alertCanvas.height = 64;
        const actx = alertCanvas.getContext('2d');
        if (actx) {
          actx.fillStyle = '#EF4444';
          actx.beginPath();
          actx.arc(32, 32, 28, 0, Math.PI * 2);
          actx.fill();
          actx.fillStyle = '#FFFFFF';
          actx.font = 'bold 36px sans-serif';
          actx.textAlign = 'center';
          actx.fillText('!', 32, 45);
        }
        const alertTex = new THREE.CanvasTexture(alertCanvas);
        const alertSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTex, transparent: true }));
        alertSprite.position.set(0, 3.0, -0.4);
        alertSprite.scale.set(0.65, 0.65, 1);
        alertSprite.visible = agent.status === 'waiting_approval';
        group.add(alertSprite);

        scene.add(group);
        agentMeshes.set(agent.id, group);

        // Store Animation State
        animStates.set(agent.id, {
          agentId: agent.id,
          role: agent.role,
          status: agent.status,
          texture: charTex,
          sprite: charSprite,
          screenMesh: screen,
          alertSprite,
          rowIndex,
          currentCol: 0,
          lastFrameTime: 0,
          seed: index * 1.37,
        });
      });
    };

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

    // --- 4. Master Animation Loop ---
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate Agent Sprites (Frames & Breathing Bob)
      animStatesRef.current.forEach((state) => {
        const { status, seed, texture, sprite, alertSprite } = state;

        // Frame timing per status
        const frameInterval = status === 'working' ? 0.22 : status === 'waiting_approval' ? 0.45 : 1.2;

        if (elapsed - state.lastFrameTime > frameInterval) {
          state.lastFrameTime = elapsed;

          if (status === 'working') {
            // Brisk cycling through active coding/typing frames
            state.currentCol = (state.currentCol + 1) % 4;
          } else if (status === 'waiting_approval') {
            // Alert toggling (looking around / waiting)
            state.currentCol = state.currentCol === 0 ? 4 : 0;
          } else {
            // Gentle idle shift/blink
            state.currentCol = state.currentCol === 0 ? 1 : 0;
          }

          // Update UV offset (Independent per agent clone)
          texture.offset.x = (state.currentCol % SHEET_COLS) / SHEET_COLS;
        }

        // Subtly bob sprite based on state
        if (status === 'working') {
          sprite.position.y = SPRITE_BASE_Y + Math.sin(elapsed * 7.0 + seed) * 0.02;
        } else if (status === 'waiting_approval') {
          sprite.position.y = SPRITE_BASE_Y + Math.sin(elapsed * 4.5 + seed) * 0.035;
          alertSprite.position.y = 3.0 + Math.sin(elapsed * 5.0) * 0.07;
        } else {
          // Calm idle breathing
          sprite.position.y = SPRITE_BASE_Y + Math.sin(elapsed * 2.8 + seed) * 0.03;
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

        // Update Alert Sprite
        state.alertSprite.visible = agent.status === 'waiting_approval';
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
