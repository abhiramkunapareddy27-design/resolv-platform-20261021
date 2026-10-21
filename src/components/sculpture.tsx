"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { getCinematicFrame, type ScrollSignal } from "@/lib/cinematic";
function segmentGeometry(index: number, count: number) {
  const gap = 0.025,
    start = (index / count) * Math.PI * 2 + gap,
    end = ((index + 1) / count) * Math.PI * 2 - gap;
  const outer = 1.62,
    inner = 0.94;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, start, end, false);
  shape.lineTo(Math.cos(end) * inner, Math.sin(end) * inner);
  shape.absarc(0, 0, inner, end, start, true);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.43,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.045,
    bevelThickness: 0.045,
    curveSegments: 16,
  });
  const mid = (start + end) / 2;
  geometry.translate(-Math.cos(mid) * 1.28, -Math.sin(mid) * 1.28, -0.215);
  return geometry;
}
function StaticSculpture() {
  return (
    <svg
      className="sculpture-static"
      viewBox="0 0 900 700"
      role="img"
      aria-label="Three interlocking segmented bands, representing a solution built together"
    >
      <defs>
        <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#b6bfab" />
          <stop offset=".5" stopColor="#64715b" />
          <stop offset="1" stopColor="#374a39" />
        </linearGradient>
      </defs>
      <ellipse
        cx="490"
        cy="575"
        rx="210"
        ry="35"
        fill="#414f3c"
        opacity=".12"
      />
      <g
        fill="none"
        stroke="url(#stone)"
        strokeWidth="58"
        strokeDasharray="99 5"
      >
        <ellipse
          cx="490"
          cy="350"
          rx="155"
          ry="173"
          transform="rotate(-24 490 350)"
        />
        <ellipse
          cx="490"
          cy="350"
          rx="185"
          ry="74"
          transform="rotate(40 490 350)"
        />
        <ellipse
          cx="490"
          cy="350"
          rx="185"
          ry="74"
          transform="rotate(-40 490 350)"
        />
      </g>
    </svg>
  );
}
const subscribeScreen = (callback: () => void) => {
  const media = matchMedia("(max-width:699px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
export default function Sculpture({
  signal,
  reduced,
}: {
  signal: ScrollSignal;
  reduced: boolean;
}) {
  const mobile = useSyncExternalStore(
    subscribeScreen,
    () => matchMedia("(max-width:699px)").matches,
    () => false,
  );
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    const count = mobile ? 6 : 8;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    const readyFrame = requestAnimationFrame(() => setReady(true));
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.65));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e5e3d9");
    scene.fog = new THREE.Fog("#e5e3d9", 12, 28);
    const camera = new THREE.PerspectiveCamera(mobile ? 43 : 36, 1, 0.1, 80);
    const group = new THREE.Group();
    scene.add(group);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.8;
    room.dispose();
    pmrem.dispose();
    const noise = new Uint8Array(128 * 128 * 4);
    for (let i = 0; i < 128 * 128; i++) {
      const v = 150 + Math.sin(i * 17.123) * 25 + Math.cos(i * 0.843) * 16;
      noise[i * 4] = noise[i * 4 + 1] = noise[i * 4 + 2] = v;
      noise[i * 4 + 3] = 255;
    }
    const texture = new THREE.DataTexture(noise, 128, 128);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    texture.needsUpdate = true;
    const materials = [
      new THREE.MeshStandardMaterial({
        color: "#69785c",
        roughness: 0.56,
        metalness: 0.16,
        bumpMap: texture,
        bumpScale: 0.025,
      }),
      new THREE.MeshStandardMaterial({
        color: "#b5bba5",
        roughness: 0.61,
        metalness: 0.08,
        bumpMap: texture,
        bumpScale: 0.025,
      }),
      new THREE.MeshStandardMaterial({
        color: "#3e503d",
        roughness: 0.48,
        metalness: 0.2,
        bumpMap: texture,
        bumpScale: 0.02,
      }),
      new THREE.MeshStandardMaterial({
        color: "#a3674d",
        roughness: 0.47,
        metalness: 0.28,
        bumpMap: texture,
        bumpScale: 0.018,
      }),
    ];
    const geometries = Array.from({ length: count }, (_, i) =>
      segmentGeometry(i, count),
    );
    const pieces: THREE.Mesh[] = [];
    for (let layer = 0; layer < 3; layer++)
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(
          geometries[i],
          materials[i === 1 && layer === 1 ? 3 : layer],
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        pieces.push(mesh);
      }
    const floorGeometry = new THREE.PlaneGeometry(100, 100, 40, 40);
    floorGeometry.rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: "#dbd9cd",
      roughness: 0.96,
      bumpMap: texture,
      bumpScale: 0.035,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -1.93;
    floor.receiveShadow = true;
    scene.add(floor);
    const plinthGeometry = new THREE.CylinderGeometry(2.25, 2.4, 0.18, 64);
    const plinthMaterial = new THREE.MeshStandardMaterial({
      color: "#cecfc0",
      roughness: 0.83,
      bumpMap: texture,
      bumpScale: 0.025,
    });
    const plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
    plinth.position.set(0.75, -1.82, 0);
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    scene.add(plinth);
    const hemisphere = new THREE.HemisphereLight("#fffaf0", "#858b77", 1.1);
    scene.add(hemisphere);
    const key = new THREE.DirectionalLight("#fff7e4", 2.5);
    key.position.set(-3, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.0003;
    key.shadow.radius = 4;
    scene.add(key);
    const rim = new THREE.DirectionalLight("#dbe6d3", 1.5);
    rim.position.set(4, 2, -5);
    scene.add(rim);
    let visible = true,
      queued = 0;
    const render = (progress: number) => {
      const frame = getCinematicFrame(progress, count, reduced);
      for (const [i, piece] of pieces.entries()) {
        const pose = frame.pieces[i];
        piece.position.set(...pose.position);
        piece.rotation.set(...pose.rotation);
        piece.scale.setScalar(pose.scale);
      }
      group.position.set(...frame.group);
      group.rotation.set(...frame.rotation);
      camera.position.set(...frame.camera);
      if (mobile) {
        camera.position.multiplyScalar(
          1.04 + Math.sin(Math.PI * progress) * 0.15,
        );
        group.position.x = 0.3;
      }
      camera.lookAt(...frame.target);
      rim.intensity = frame.light;
      plinth.position.x = mobile ? 0.3 : frame.group[0];
      plinth.scale.setScalar(1 - 0.12 * Math.sin(Math.PI * progress));
      if (visible) renderer.render(scene, camera);
    };
    const requestRender = (value: number) => {
      cancelAnimationFrame(queued);
      queued = requestAnimationFrame(() => render(value));
    };
    const unsubscribe = signal.subscribe(requestRender);
    const resize = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      requestRender(signal.get());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const intersection = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) requestRender(signal.get());
    });
    intersection.observe(container);
    const theme = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      const bg = dark ? "#26332c" : "#e5e3d9";
      scene.background = new THREE.Color(bg);
      if (scene.fog instanceof THREE.Fog) scene.fog.color.set(bg);
      floorMaterial.color.set(dark ? "#2b392f" : "#dbd9cd");
      plinthMaterial.color.set(dark ? "#4a5748" : "#cecfc0");
      renderer.toneMappingExposure = dark ? 0.95 : 1.0;
      requestRender(signal.get());
    };
    const themeObserver = new MutationObserver(theme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    theme();
    resize();
    return () => {
      unsubscribe();
      cancelAnimationFrame(queued);
      cancelAnimationFrame(readyFrame);
      observer.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      floorGeometry.dispose();
      floorMaterial.dispose();
      plinthGeometry.dispose();
      plinthMaterial.dispose();
      texture.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [signal, reduced, mobile]);
  return (
    <div className="sculpture-stage">
      <div ref={host} className="sculpture-canvas" aria-hidden="true" />
      {!ready && <StaticSculpture />}
    </div>
  );
}
