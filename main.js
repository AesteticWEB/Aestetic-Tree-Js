import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const canvas = document.querySelector('#bg');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x06040a, 8, 35);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(0, 0, 12);

const ambient = new THREE.AmbientLight(0x9c8cff, 0.55);
scene.add(ambient);

const keyLight = new THREE.PointLight(0xff5a8c, 1.3, 40);
keyLight.position.set(6, 6, 8);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x6cf6ff, 0.9, 40);
rimLight.position.set(-6, -3, 6);
scene.add(rimLight);

const group = new THREE.Group();
scene.add(group);

const coreGeometry = new THREE.IcosahedronGeometry(2.6, 1);
const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x0d0a16,
  roughness: 0.25,
  metalness: 0.85,
  clearcoat: 0.6,
  emissive: 0x1c122b,
  emissiveIntensity: 0.6,
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
core.castShadow = true;
core.receiveShadow = true;
// center core removed from scene

const rings = [];
for (let i = 0; i < 3; i += 1) {
  const ringGeo = new THREE.TorusGeometry(3.4 + i * 0.5, 0.015, 16, 240);
  const ringMat = new THREE.MeshBasicMaterial({
    color: i % 2 === 0 ? 0xff5a8c : 0x6cf6ff,
    transparent: true,
    opacity: 0.35,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.random() * Math.PI;
  ring.rotation.y = Math.random() * Math.PI;
  rings.push(ring);
  group.add(ring);
}


const starCount = 1400;
const starPositions = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
for (let i = 0; i < starCount; i += 1) {
  const i3 = i * 3;
  starPositions[i3] = (Math.random() - 0.5) * 80;
  starPositions[i3 + 1] = (Math.random() - 0.5) * 60;
  starPositions[i3 + 2] = -Math.random() * 80;
  starSizes[i] = Math.random() * 1.8;
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

function createStarTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = size / 2;
  const cy = size / 2;
  const spikes = 5;
  const outerRadius = size * 0.38;
  const innerRadius = size * 0.16;

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
  }
  ctx.closePath();
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerRadius);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.18,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending,
  map: createStarTexture(),
  depthWrite: false,
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const glowSprites = [];
const glowTexture = new THREE.TextureLoader().load(
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="white" stop-opacity="0.9"/><stop offset="65%" stop-color="white" stop-opacity="0.2"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient></defs><rect width="128" height="128" fill="url(%23g)"/></svg>'
);

for (let i = 0; i < 10; i += 1) {
  const spriteMat = new THREE.SpriteMaterial({
    map: glowTexture,
    color: i % 2 === 0 ? 0xff5a8c : 0x6cf6ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.65,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(
    (Math.random() - 0.5) * 14,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 12
  );
  const scale = 1.4 + Math.random() * 2.2;
  sprite.scale.set(scale, scale, scale);
  glowSprites.push(sprite);
  scene.add(sprite);
}

const cursor = new THREE.Vector2(0, 0);
window.addEventListener('pointermove', (event) => {
  cursor.x = (event.clientX / window.innerWidth) * 2 - 1;
  cursor.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

async function loadStackIcons() {
  const icons = document.querySelectorAll('.stack-icon[data-icon]');
  const requests = Array.from(icons).map(async (icon) => {
    const name = icon.getAttribute('data-icon');
    if (!name) return;
    try {
      const response = await fetch(`https://api.iconify.design/${name}.svg`);
      if (!response.ok) return;
      const svg = await response.text();
      icon.innerHTML = svg;
    } catch (error) {
      icon.textContent = name.split(':')[1]?.slice(0, 3).toUpperCase() || 'WEB';
    }
  });

  await Promise.all(requests);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const clock = new THREE.Clock();
loadStackIcons();

const title = document.querySelector('.title');
const subtitle = document.querySelector('.subtitle');
const titleText = document.querySelector('.title .typing-text');
const subtitleText = document.querySelector('.subtitle .typing-text');
const fonts = [
  "'UnifrakturCook', 'Cinzel', serif",
  "'DM Serif Display', 'Cinzel', serif",
  "'Playfair Display', 'Cinzel', serif",
  "'Orbitron', 'Rajdhani', sans-serif",
  "'Syncopate', 'Rajdhani', sans-serif",
  "'Space Grotesk', 'Rajdhani', sans-serif",
  "'Cinzel', serif",
  "'Rajdhani', system-ui, sans-serif",
];
const letterSpacing = ['0.08rem', '0.18rem', '0.1rem', '0.32rem', '0.42rem', '0.2rem', '0.28rem', '0.22rem'];
let fontIndex = 0;

function triggerTyping(element) {
  if (!element) return;
  element.classList.remove('typing');
  element.style.removeProperty('--type-width');
  requestAnimationFrame(() => {
    const width = Math.ceil(element.scrollWidth);
    if (width > 0) {
      element.style.setProperty('--type-width', `${width}px`);
    }
    void element.offsetWidth;
    element.classList.add('typing');
    setTimeout(() => element.classList.remove('typing'), 900);
  });
}

function applyFontCycle() {
  const font = fonts[fontIndex % fonts.length];
  const spacing = letterSpacing[fontIndex % letterSpacing.length];
  if (title) {
    title.style.fontFamily = font;
    title.style.letterSpacing = spacing;
  }
  if (subtitle) {
    subtitle.style.fontFamily = font;
    subtitle.style.letterSpacing = spacing;
  }
  triggerTyping(titleText);
  triggerTyping(subtitleText);
  fontIndex += 1;
}

applyFontCycle();
setInterval(applyFontCycle, 2600);

function animate() {
  const elapsed = clock.getElapsedTime();

  group.rotation.y = elapsed * 0.12 + cursor.x * 0.2;
  group.rotation.x = Math.sin(elapsed * 0.2) * 0.08 + cursor.y * 0.15;

  // core removed

  rings.forEach((ring, index) => {
    ring.rotation.z += 0.001 + index * 0.0006;
    ring.material.opacity = 0.25 + Math.sin(elapsed + index) * 0.15;
  });

  glowSprites.forEach((sprite, index) => {
    sprite.material.opacity = 0.3 + Math.sin(elapsed * 0.7 + index) * 0.25;
    sprite.position.y += Math.sin(elapsed * 0.4 + index) * 0.002;
  });

  stars.rotation.y = elapsed * 0.02;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
