'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AgentEntity, AgentStatus } from '@/domain/company';

interface CompanyScene3DProps {
  agents: AgentEntity[];
  selectedAgent: AgentEntity | null;
  onSelectAgent: (agent: AgentEntity) => void;
}

export function CompanyScene3D({ agents, selectedAgent, onSelectAgent }: CompanyScene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const agentMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const selectedRingRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene Setup (Minimalist 8-Bit Monochrome Black & White) ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030303');
    scene.fog = new THREE.FogExp2('#030303', 0.02);

    const textureLoader = new THREE.TextureLoader();
    const animeSpriteTexture = textureLoader.load('/anime_8bit_sprites.jpg');
    animeSpriteTexture.magFilter = THREE.NearestFilter;
    animeSpriteTexture.minFilter = THREE.NearestFilter;

    // --- Camera ---
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 18, 26);
    camera.lookAt(0, 1, 0);

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#ffffff', 1.2);
    dirLight.position.set(15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    scene.add(dirLight);

    // Subtle blue rim light
    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.8);
    rimLight.position.set(-20, 15, -15);
    scene.add(rimLight);

    // --- Floor / Grid ---
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#0d1321',
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(50, 50, '#1e293b', '#0f172a');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Outer decorative concentric rings
    const ringGeo1 = new THREE.RingGeometry(14, 14.15, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#1e293b', side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.02;
    scene.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(8, 8.1, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat);
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.02;
    scene.add(ring2);

    // --- Pipeline Conduits (connecting the departments) ---
    const pipelineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.1, 6), // Commercial
      new THREE.Vector3(-10, 0.1, -2), // Analyst
      new THREE.Vector3(-6, 0.1, -8), // Product
      new THREE.Vector3(0, 0.1, -9), // Coder
      new THREE.Vector3(6, 0.1, -8), // QA
      new THREE.Vector3(10, 0.1, -2), // DevOps
      new THREE.Vector3(0, 0.1, 0), // Human Gate / Center
      new THREE.Vector3(8, 0.1, 6), // Support
      new THREE.Vector3(0, 0.1, 8), // Finance
    ]);

    const tubeGeo = new THREE.TubeGeometry(pipelineCurve, 128, 0.08, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color: '#334155', transparent: true, opacity: 0.7 });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tubeMesh);

    // Flowing particles along the pipeline
    const particleCount = 40;
    const particleGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const particleGroup = new THREE.Group();
    const particles: { mesh: THREE.Mesh; progress: number; speed: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleMat);
      particleGroup.add(pMesh);
      particles.push({
        mesh: pMesh,
        progress: (i / particleCount),
        speed: 0.0015 + Math.random() * 0.001,
      });
    }
    scene.add(particleGroup);

    // --- Selection Highlight Ring ---
    const selGeo = new THREE.RingGeometry(1.6, 1.8, 32);
    const selMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', side: THREE.DoubleSide });
    const selRing = new THREE.Mesh(selGeo, selMat);
    selRing.rotation.x = -Math.PI / 2;
    selRing.position.y = 0.05;
    selRing.visible = false;
    scene.add(selRing);
    selectedRingRef.current = selRing;

    // --- Workstations & Agent Meshes ---
    const agentMeshes = new Map<string, THREE.Group>();
    agentMeshesRef.current = agentMeshes;

    agents.forEach((agent) => {
      const group = new THREE.Group();
      group.position.set(...agent.coordinates);
      group.userData = { agentId: agent.id, agent };

      // 1. Workstation Circular Platform
      const isHuman = agent.role === 'human_director';
      const radius = isHuman ? 2.2 : 1.4;
      const platGeo = new THREE.CylinderGeometry(radius, radius * 1.05, 0.25, 32);
      const platMat = new THREE.MeshStandardMaterial({
        color: isHuman ? '#0f172a' : '#111827',
        roughness: 0.5,
        metalness: 0.6,
      });
      const platform = new THREE.Mesh(platGeo, platMat);
      platform.position.y = 0.125;
      platform.receiveShadow = true;
      group.add(platform);

      // Status ring on platform edge
      const sRingGeo = new THREE.TorusGeometry(radius * 0.95, 0.04, 16, 64);
      const sRingMat = new THREE.MeshBasicMaterial({
        color: agent.status === 'waiting_approval' ? '#f59e0b' : agent.color,
      });
      const sRing = new THREE.Mesh(sRingGeo, sRingMat);
      sRing.rotation.x = Math.PI / 2;
      sRing.position.y = 0.26;
      group.add(sRing);

      // 2. Desk Console
      if (isHuman) {
        // Holographic Executive Command Desk (Semi-circular ring)
        const deskGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.7, 32, 1, true, 0, Math.PI * 1.4);
        const deskMat = new THREE.MeshStandardMaterial({
          color: '#1e293b',
          roughness: 0.3,
          metalness: 0.8,
          side: THREE.DoubleSide,
        });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 0.6, 0);
        desk.rotation.y = Math.PI * 0.8;
        group.add(desk);

        // Center Hologram Beacon
        const holoGeo = new THREE.OctahedronGeometry(0.4, 0);
        const holoMat = new THREE.MeshBasicMaterial({
          color: '#38bdf8',
          wireframe: true,
        });
        const holo = new THREE.Mesh(holoGeo, holoMat);
        holo.position.set(0, 1.8, 0);
        holo.name = 'holoCenter';
        group.add(holo);
      } else {
        // Standard Agent Curved Workstation Desk
        const deskGeo = new THREE.BoxGeometry(1.4, 0.65, 0.6);
        const deskMat = new THREE.MeshStandardMaterial({
          color: '#1f2937',
          roughness: 0.4,
          metalness: 0.5,
        });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(0, 0.55, 0.3);
        desk.castShadow = true;
        group.add(desk);

        // Terminal Monitors (1-3 small glowing screens)
        const screenGeo = new THREE.BoxGeometry(0.5, 0.35, 0.04);
        const screenMat = new THREE.MeshBasicMaterial({ color: agent.color });
        const screen1 = new THREE.Mesh(screenGeo, screenMat);
        screen1.position.set(0, 0.95, 0.25);
        screen1.rotation.x = -0.15;
        group.add(screen1);
      }

      // 3. Stylized Agent Avatar (Humanoid / AI Core representation)
      const avatarGroup = new THREE.Group();
      avatarGroup.position.set(0, 0.3, isHuman ? 0 : -0.2);

      // Torso
      const torsoGeo = new THREE.CylinderGeometry(0.2, 0.28, 0.7, 16);
      const torsoMat = new THREE.MeshStandardMaterial({
        color: isHuman ? '#0284c7' : '#374151',
        roughness: 0.3,
        metalness: 0.7,
      });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.position.y = 1.0;
      torso.castShadow = true;
      avatarGroup.add(torso);

      // Head
      const headGeo = new THREE.SphereGeometry(0.22, 24, 24);
      const headMat = new THREE.MeshStandardMaterial({
        color: isHuman ? '#bae6fd' : '#9ca3af',
        roughness: 0.2,
        metalness: 0.8,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.55;
      head.castShadow = true;
      avatarGroup.add(head);

      // Glowing Halo / Visor
      const visorGeo = new THREE.TorusGeometry(0.26, 0.03, 16, 32);
      const visorMat = new THREE.MeshBasicMaterial({ color: agent.color });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.y = 1.6;
      visor.rotation.x = Math.PI / 2;
      visor.name = 'visor';
      avatarGroup.add(visor);

      group.add(avatarGroup);

      // 4. Retro 8-Bit Anime Character Sprite Billboard
      const charSpriteMat = new THREE.SpriteMaterial({
        map: animeSpriteTexture,
        transparent: true,
      });
      const charSprite = new THREE.Sprite(charSpriteMat);
      charSprite.position.set(0, isHuman ? 3.4 : 3.0, 0);
      charSprite.scale.set(1.4, 1.4, 1);
      group.add(charSprite);

      // 5. Floating Agent Label (8-bit Pixel Terminal Style)
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#050505';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, 248, 72);
        ctx.fillRect(6, 6, 244, 68);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(agent.name.toUpperCase(), 128, 34);

        ctx.fillStyle = agent.status === 'waiting_approval' ? '#f59e0b' : '#aaaaaa';
        ctx.font = 'bold 13px "Courier New", monospace';
        const statusText =
          agent.status === 'waiting_approval'
            ? '[! APROVACAO !]'
            : agent.status === 'working'
            ? '[> PROCESSANDO]'
            : '[  OCIOSO    ]';
        ctx.fillText(statusText, 128, 58);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, isHuman ? 2.3 : 2.0, 0);
      sprite.scale.set(3.0, 0.9, 1);
      group.add(sprite);

      scene.add(group);
      agentMeshes.set(agent.id, group);
    });

    // --- Interactive Mouse Controls (Pan, Rotate, Zoom) ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngle = { theta: 0, phi: 0.65, radius: 30 };

    const updateCameraPosition = () => {
      camera.position.x = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.sin(cameraAngle.theta);
      camera.position.y = cameraAngle.radius * Math.cos(cameraAngle.phi);
      camera.position.z = cameraAngle.radius * Math.sin(cameraAngle.phi) * Math.cos(cameraAngle.theta);
      camera.lookAt(0, 0.8, 0);
    };
    updateCameraPosition();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      cameraAngle.theta -= deltaX * 0.006;
      cameraAngle.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, cameraAngle.phi + deltaY * 0.006));

      updateCameraPosition();
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngle.radius = Math.max(12, Math.min(50, cameraAngle.radius + e.deltaY * 0.03));
      updateCameraPosition();
    };

    // Raycaster for Agent click selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const objectsToIntersect: THREE.Object3D[] = [];
      agentMeshes.forEach((grp) => objectsToIntersect.push(...grp.children));

      const intersects = raycaster.intersectObjects(objectsToIntersect, true);
      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
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

    // --- Window Resize ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Animate conduit pipeline particles
      particles.forEach((p) => {
        p.progress = (p.progress + p.speed) % 1;
        const pt = pipelineCurve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

      // Subtle breathing / pulsing rotation for each agent
      agentMeshes.forEach((group, id) => {
        const holo = group.getObjectByName('holoCenter');
        if (holo) {
          holo.rotation.y = elapsedTime * 0.8;
          holo.rotation.x = elapsedTime * 0.4;
          holo.position.y = 1.8 + Math.sin(elapsedTime * 2) * 0.08;
        }

        const visor = group.getObjectByName('visor');
        if (visor) {
          visor.rotation.z = elapsedTime * 0.5;
        }
      });

      // Animate selection ring
      if (selRing.visible) {
        selRing.rotation.z = elapsedTime * 0.5;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
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

  // Update selection ring position when selectedAgent changes
  useEffect(() => {
    if (!selectedRingRef.current) return;
    if (selectedAgent) {
      selectedRingRef.current.position.set(selectedAgent.coordinates[0], 0.05, selectedAgent.coordinates[2]);
      selectedRingRef.current.visible = true;
    } else {
      selectedRingRef.current.visible = false;
    }
  }, [selectedAgent]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing select-none" />;
}
