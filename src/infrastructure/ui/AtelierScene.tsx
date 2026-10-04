'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { AgentEntity, JobEntity } from '@/domain/company';
import styles from './CompanyMonitor.module.css';

export interface AtelierCamera {
  zoom: (direction: 1 | -1) => void;
  reset: () => void;
}

interface Props {
  agents: AgentEntity[];
  jobs: JobEntity[];
  selectedId?: string;
  onSelect: (agent: AgentEntity) => void;
}

function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const drawable = object as THREE.Mesh;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (drawable.material) {
      for (const material of Array.isArray(drawable.material) ? drawable.material : [drawable.material]) {
        materials.add(material);
        const map = (material as THREE.MeshBasicMaterial).map;
        if (map) textures.add(map);
      }
    }
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  root.clear();
}

function label(text: string, caption: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#191919';
    ctx.font = '500 29px Arial, sans-serif';
    ctx.fillText(text, 256, 43, 500);
    ctx.fillStyle = '#65645f';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText(caption, 256, 78, 500);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.set(4.4, 0.96, 1);
  sprite.position.y = 3.15;
  return sprite;
}

/** Visual adapter only. All operational state arrives through the monitor port. */
export const AtelierScene = forwardRef<AtelierCamera, Props>(function AtelierScene(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const runtime = useRef<{
    root: THREE.Group;
    render: () => void;
    camera: THREE.OrthographicCamera;
    controls: OrbitControls;
    selection: THREE.Mesh;
    positions: Map<string, THREE.Vector3>;
  } | null>(null);
  const [failure, setFailure] = useState(false);
  useEffect(() => { latest.current = props; }, [props]);

  useImperativeHandle(ref, () => ({
    zoom(direction) {
      const value = runtime.current;
      if (!value) return;
      value.camera.zoom = THREE.MathUtils.clamp(value.camera.zoom * (direction === 1 ? 1.2 : 1 / 1.2), 0.65, 2.8);
      value.camera.updateProjectionMatrix();
      value.render();
    },
    reset() { runtime.current?.controls.reset(); runtime.current?.render(); },
  }), []);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFailure(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor('#f0eee9', 0);
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Maquete interativa da empresa. Use a lista de agentes para seleção por teclado.');
    renderer.domElement.setAttribute('role', 'img');

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-18, 18, 15, -15, 0.1, 150);
    camera.position.set(22, 28, 30);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.minZoom = 0.65;
    controls.maxZoom = 2.8;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2.4;
    controls.enablePan = false;
    controls.update();
    controls.saveState();
    scene.add(new THREE.HemisphereLight('#ffffff', '#a5a39c', 3));
    const light = new THREE.DirectionalLight('#ffffff', 3);
    light.position.set(-12, 25, 14);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, far: 80 });
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.normalBias = 0.04;
    scene.add(light);

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(13.6, 13.9, 0.35, 96), new THREE.MeshStandardMaterial({ color: '#e4e1da', roughness: 0.95 }));
    floor.position.y = -0.35;
    floor.receiveShadow = true;
    scene.add(floor);
    const inset = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 13.2, 0.05, 96), new THREE.MeshStandardMaterial({ color: '#f0eee9', roughness: 0.9 }));
    inset.position.y = -0.15;
    inset.receiveShadow = true;
    scene.add(inset);
    for (const radius of [4.3, 11.9]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.025, 128), new THREE.MeshBasicMaterial({ color: '#c5c2ba', side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.1;
      scene.add(ring);
    }
    const root = new THREE.Group();
    scene.add(root);
    const selection = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.02, 64), new THREE.MeshBasicMaterial({ color: '#191919', side: THREE.DoubleSide }));
    selection.rotation.x = -Math.PI / 2;
    selection.visible = false;
    scene.add(selection);
    const render = () => renderer.render(scene, camera);
    runtime.current = { root, camera, controls, selection, render, positions: new Map() };
    controls.addEventListener('change', render);
    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      const aspect = width / height;
      const extent = aspect < 1 ? 17 / aspect : 16;
      camera.left = -extent * aspect;
      camera.right = extent * aspect;
      camera.top = extent;
      camera.bottom = -extent;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const raycaster = new THREE.Raycaster();
    let down = { x: 0, y: 0 };
    const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
    const pointerUp = (event: PointerEvent) => {
      if (event.button !== 0 || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = raycaster.intersectObjects(root.children, true)[0];
      let target: THREE.Object3D | null = hit?.object ?? null;
      while (target && !target.userData.agentId) target = target.parent;
      const agent = latest.current.agents.find((item) => item.id === target?.userData.agentId);
      if (agent) latest.current.onSelect(agent);
    };
    const contextLost = (event: Event) => { event.preventDefault(); setFailure(true); };
    const contextRestored = () => { setFailure(false); render(); };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const animate = (time: number) => {
      frame = 0;
      if (document.hidden || motion.matches) return;
      let active = false;
      root.children.forEach((group) => {
        if (group.userData.working) {
          const beacon = group.getObjectByName('activity');
          if (beacon) beacon.position.y = 2.1 + Math.sin(time / 850) * 0.08;
          active = true;
        }
      });
      if (active) { render(); frame = requestAnimationFrame(animate); }
    };
    const resume = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(animate); };
    document.addEventListener('visibilitychange', resume);
    motion.addEventListener('change', resume);
    // Data updates render once and restart animation only for working agents.
    root.addEventListener('childadded', resume);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', resume);
      motion.removeEventListener('change', resume);
      root.removeEventListener('childadded', resume);
      controls.dispose();
      light.shadow.dispose();
      disposeTree(scene);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      renderer.dispose();
      renderer.domElement.remove();
      runtime.current = null;
    };
  }, []);

  useEffect(() => {
    const value = runtime.current;
    if (!value) return;
    disposeTree(value.root);
    value.positions.clear();
    const workforce = props.agents.filter((agent) => agent.role !== 'human_director');
    const pale = new THREE.MeshStandardMaterial({ color: '#f0eee9', roughness: 0.7 });
    const ink = new THREE.MeshStandardMaterial({ color: '#20201e', roughness: 0.55, metalness: 0.15 });
    const gray = new THREE.MeshStandardMaterial({ color: '#8b8983', roughness: 0.7 });
    // Materials are shared within this snapshot and disposed once on the next update.
    if (!props.agents.length) { pale.dispose(); ink.dispose(); gray.dispose(); }
    props.agents.forEach((agent) => {
      const human = agent.role === 'human_director';
      const index = workforce.findIndex((item) => item.id === agent.id);
      const angle = index / Math.max(workforce.length, 1) * Math.PI * 2 - Math.PI / 2;
      const position = human ? new THREE.Vector3() : new THREE.Vector3(Math.cos(angle) * 8.7, 0, Math.sin(angle) * 8.7);
      value.positions.set(agent.id, position);
      const group = new THREE.Group();
      group.position.copy(position);
      group.userData = { agentId: agent.id, working: agent.status === 'working' };
      const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
        const object = new THREE.Mesh(geometry, material);
        object.position.set(x, y, z);
        object.castShadow = true;
        object.receiveShadow = true;
        group.add(object);
        return object;
      };
      mesh(new THREE.CylinderGeometry(human ? 2.8 : 1.75, human ? 2.8 : 1.85, 0.22, 64), human ? ink : pale, 0, 0.05, 0);
      if (human) {
        mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.18, 64), pale, 0, 0.75, 0);
        mesh(new THREE.CylinderGeometry(0.85, 1, 0.65, 32), gray, 0, 0.36, 0);
        const sculpture = mesh(new THREE.TorusGeometry(0.72, 0.1, 12, 64), ink, 0, 1.7, 0);
        sculpture.rotation.y = -0.55;
        mesh(new THREE.SphereGeometry(0.16, 16, 16), ink, 0, 1.7, 0);
      } else {
        mesh(new THREE.BoxGeometry(2.25, 0.12, 1), pale, 0, 1, 0.3);
        mesh(new THREE.BoxGeometry(0.12, 0.85, 0.75), gray, -0.88, 0.52, 0.3);
        mesh(new THREE.BoxGeometry(0.12, 0.85, 0.75), gray, 0.88, 0.52, 0.3);
        mesh(new THREE.BoxGeometry(1.04, 0.66, 0.08), ink, 0, 1.43, 0.48);
        mesh(new THREE.BoxGeometry(0.1, 0.25, 0.1), ink, 0, 1.12, 0.48);
        mesh(new THREE.BoxGeometry(0.63, 0.03, 0.23), gray, 0, 1.08, 0.03);
        mesh(new THREE.CapsuleGeometry(0.24, 0.4, 4, 12), ink, 0, 0.85, -0.58);
        mesh(new THREE.SphereGeometry(0.26, 20, 16), pale, 0, 1.45, -0.58);
        const beacon = mesh(new THREE.OctahedronGeometry(0.13), agent.status === 'working' ? ink : gray, 0.9, 2.1, 0.3);
        beacon.name = 'activity';
        if (agent.status === 'waiting_approval') {
          const marker = mesh(new THREE.TorusGeometry(0.22, 0.045, 8, 32), ink, 0.9, 2.1, 0.3);
          marker.rotation.y = -0.6;
        }
      }
      const caption = human ? 'SUPERVISÃO HUMANA' : agent.status === 'working' ? 'EM EXECUÇÃO' : agent.status === 'waiting_approval' ? 'AGUARDA APROVAÇÃO' : agent.status === 'offline' ? 'OFFLINE' : agent.status === 'handoff' ? 'EM TRANSFERÊNCIA' : 'DISPONÍVEL';
      group.add(label(human ? 'Diretoria' : agent.name.replace(/^AI /, ''), caption));
      value.root.add(group);
    });
    // Only explicit handoffs in real jobs become connections in the scene.
    for (const job of props.jobs) {
      if (!job.handoffTo || job.status !== 'in_progress') continue;
      const source = props.agents.find((agent) => agent.role === job.agentRole);
      const target = props.agents.find((agent) => agent.role === job.handoffTo);
      const start = source && value.positions.get(source.id);
      const end = target && value.positions.get(target.id);
      if (!start || !end) continue;
      const curve = new THREE.QuadraticBezierCurve3(start.clone().setY(0.3), start.clone().add(end).multiplyScalar(0.5).setY(2), end.clone().setY(0.3));
      value.root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)), new THREE.LineBasicMaterial({ color: '#555550' })));
    }
    const selectedPosition = props.selectedId && value.positions.get(props.selectedId);
    value.selection.visible = Boolean(selectedPosition);
    if (selectedPosition) value.selection.position.copy(selectedPosition).setY(0.2);
    value.render();
  }, [props.agents, props.jobs]);

  useEffect(() => {
    const value = runtime.current;
    if (!value) return;
    const position = props.selectedId && value.positions.get(props.selectedId);
    value.selection.visible = Boolean(position);
    if (position) value.selection.position.copy(position).setY(0.2);
    value.render();
  }, [props.selectedId]);

  return <div className={styles.canvasHost} ref={host}>
    {failure && <div className={styles.sceneNotice} role="status">A visualização 3D está indisponível neste dispositivo. Os agentes e jobs continuam acessíveis nos painéis.</div>}
  </div>;
});
