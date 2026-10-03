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

export function PokemonOfficeScene({ agents, selectedAgent, onSelectAgent }: PokemonOfficeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectedHaloRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    const frustumSize = 24;

    // --- 1. Scene & Atmosphere (Pantone 2026 Cloud Dancer #F0EEE9) ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#F0EEE9');
    scene.fog = new THREE.FogExp2('#F0EEE9', 0.015);

    // --- 2. Pokemon 2D/3D Orthographic Isometric Camera ---
    // Classic Pokémon Gen 4/5 DS angle: elevated 45° looking at center
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

    // --- 3. WebGL Renderer with Soft Contact Shadows ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- 4. Warm Soft Lighting (Pokemon Center / Office daylight) ---
    const ambientLight = new THREE.AmbientLight('#FFFDF8', 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFF7E6', 1.0);
    sunLight.position.set(15, 25, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    // Subtle sky-blue fill light
    const fillLight = new THREE.DirectionalLight('#E0F2FE', 0.4);
    fillLight.position.set(-15, 12, -10);
    scene.add(fillLight);

    // --- 5. Floor Tiles (Pantone 2026 Cloud Dancer Palette) ---
    const officeGroup = new THREE.Group();
    scene.add(officeGroup);

    // Checkerboard floor tiles in #F0EEE9 and #E8E5DF
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

    // Low-poly Office Walls (North and West cozy walls, typical of Pokemon interiors)
    const wallMat = new THREE.MeshStandardMaterial({ color: '#DFDBD3', roughness: 0.85 });

    // North Wall
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(26, 2.5, 0.4), wallMat);
    northWall.position.set(0, 1.25, -11.2);
    northWall.receiveShadow = true;
    northWall.castShadow = true;
    officeGroup.add(northWall);

    // West Wall
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 22), wallMat);
    westWall.position.set(-13.2, 1.25, 0);
    westWall.receiveShadow = true;
    westWall.castShadow = true;
    officeGroup.add(westWall);

    // Office Decorative Whiteboard on North Wall
    const wb = new THREE.Mesh(new THREE.BoxGeometry(5, 1.4, 0.1), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4 }));
    wb.position.set(0, 1.4, -10.95);
    officeGroup.add(wb);

    // Mini post-its on whiteboard
    const postItColors = ['#FDE047', '#86EFAC', '#93C5FD', '#FCA5A5'];
    postItColors.forEach((color, i) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.02), new THREE.MeshBasicMaterial({ color }));
      p.position.set(-1.8 + i * 0.9, 1.4, -10.88);
      officeGroup.add(p);
    });

    // Potted Pokemon Bonsai Plants (in corners)
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

    // --- 6. 2D Billboard Sprites in 3D (Pokémon Gen 4/5 NPC Style) ---
    const textureLoader = new THREE.TextureLoader();
    const spriteSheet = textureLoader.load('/anime_8bit_color.png');
    spriteSheet.magFilter = THREE.NearestFilter;
    spriteSheet.minFilter = THREE.NearestFilter;

    // Sprite Row map: 0=Coder, 1=Analyst/Commercial, 2=QA/Product, 3=DevOps, 4=Director
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

    // Desk 3D Geometries & Materials
    const deskGeo = new THREE.BoxGeometry(2.4, 0.85, 1.3);
    const deskMat = new THREE.MeshStandardMaterial({ color: '#D6CEBD', roughness: 0.6 });
    const execDeskMat = new THREE.MeshStandardMaterial({ color: '#4A3728', roughness: 0.4 });

    // Monitor 3D Geometries
    const monBase = new THREE.BoxGeometry(0.6, 0.45, 0.08);
    const monScreen = new THREE.BoxGeometry(0.54, 0.39, 0.02);

    const agentMeshes = new Map<string, THREE.Group>();
    agentMeshesRef.current = agentMeshes;

    // Selection Disc
    const haloGeo = new THREE.RingGeometry(0.9, 1.05, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: '#2563EB', side: THREE.DoubleSide });
    const selectedHalo = new THREE.Mesh(haloGeo, haloMat);
    selectedHalo.rotation.x = -Math.PI / 2;
    selectedHalo.position.y = 0.02;
    selectedHalo.visible = false;
    scene.add(selectedHalo);
    selectedHaloRef.current = selectedHalo;

    agents.forEach((agent) => {
      const group = new THREE.Group();
      const coords = AGENT_COORDINATES[agent.role] || [0, 0];
      group.position.set(coords[0], 0, coords[1]);
      group.userData = { agentId: agent.id, agent };

      // 1. 3D Desk
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

      // 3. 2D Anime Character Sprite (Pokemon NPC style, standing upright)
      const rowIndex = ROLE_ROW_MAP[agent.role] ?? 0;
      const charTex = spriteSheet.clone();
      charTex.magFilter = THREE.NearestFilter;
      charTex.repeat.set(1 / 8, 1 / 5);
      charTex.offset.set(0, 1 - (rowIndex + 1) * (1 / 5));

      const charMat = new THREE.SpriteMaterial({ map: charTex, transparent: true });
      const charSprite = new THREE.Sprite(charMat);
      charSprite.position.set(0, 1.35, -0.4);
      charSprite.scale.set(1.9, 1.9, 1);
      charSprite.name = 'charSprite';
      group.add(charSprite);

      // Ground Contact Shadow Disc (Classic Pokemon drop shadow)
      const shadowGeo = new THREE.CircleGeometry(0.55, 16);
      const shadowMat = new THREE.MeshBasicMaterial({ color: '#2B261D', transparent: true, opacity: 0.25 });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(0, 0.02, -0.4);
      group.add(shadow);

      // 4. Subtle Floating Status Pill (Pokemon Trainer / NPC label)
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 160;
      labelCanvas.height = 44;
      const lctx = labelCanvas.getContext('2d');
      if (lctx) {
        lctx.fillStyle = '#FFFFFF';
        lctx.strokeStyle = '#D1D5DB';
        lctx.lineWidth = 2;
        lctx.beginPath();
        lctx.roundRect(4, 4, 152, 36, 18);
        lctx.fill();
        lctx.stroke();

        lctx.fillStyle = '#111827';
        lctx.font = 'bold 15px -apple-system, sans-serif';
        lctx.textAlign = 'center';
        lctx.fillText(agent.name, 80, 26);
      }
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      labelTex.magFilter = THREE.LinearFilter;
      const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
      labelSprite.position.set(0, 2.5, -0.4);
      labelSprite.scale.set(2.4, 0.66, 1);
      group.add(labelSprite);

      // 5. Exclamation Icon `!` when Waiting Approval (Pokemon Encounter / Quest style)
      if (agent.status === 'waiting_approval') {
        const alertCanvas = document.createElement('canvas');
        alertCanvas.width = 48;
        alertCanvas.height = 48;
        const actx = alertCanvas.getContext('2d');
        if (actx) {
          actx.fillStyle = '#EF4444';
          actx.beginPath();
          actx.arc(24, 24, 20, 0, Math.PI * 2);
          actx.fill();
          actx.fillStyle = '#FFFFFF';
          actx.font = 'bold 26px sans-serif';
          actx.textAlign = 'center';
          actx.fillText('!', 24, 33);
        }
        const alertTex = new THREE.CanvasTexture(alertCanvas);
        const alertSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTex, transparent: true }));
        alertSprite.position.set(0, 3.2, -0.4);
        alertSprite.scale.set(0.8, 0.8, 1);
        alertSprite.name = 'alertSprite';
        group.add(alertSprite);
      }

      scene.add(group);
      agentMeshes.set(agent.id, group);
    });

    // --- 7. Mouse Navigation: Smooth Drag Pan & Zoom ---
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
      // In isometric tilt, move along camera axis
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
      agentMeshes.forEach((grp) => objectsToTest.push(...grp.children));

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

    // --- 8. Animation Loop (Breathing Sprites & Blinking LEDs) ---
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle Pokemon NPC breathing bounce
      agentMeshes.forEach((group, id) => {
        const sprite = group.getObjectByName('charSprite');
        if (sprite) {
          sprite.position.y = 1.35 + Math.sin(elapsed * 3.5 + Number(id.charCodeAt(id.length - 1))) * 0.04;
        }
        const alertSp = group.getObjectByName('alertSprite');
        if (alertSp) {
          alertSp.position.y = 3.2 + Math.sin(elapsed * 6) * 0.1;
        }
      });

      // Blinking LEDs on servers
      leds.forEach((led, idx) => {
        led.visible = Math.sin(elapsed * 4 + idx) > -0.2;
      });

      // Selection halo pulse
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
  }, [agents, onSelectAgent]);

  // Update selection halo position
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
