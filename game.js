// Basic Three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Loaders
const mtlLoader = new THREE.MTLLoader();
const objLoader = new THREE.OBJLoader();

// Assets path
const assetsPath = 'assets/';

let road;
let car;
const grassPatches = [];

// Load road with materials and texture
function loadRoad() {
  return new Promise((resolve, reject) => {
    mtlLoader.setPath(assetsPath);
    mtlLoader.load('road.mtl', (materials) => {
      materials.preload();

      objLoader.setMaterials(materials);
      objLoader.setPath(assetsPath);
      objLoader.load(
        'road.obj',
        (obj) => {
          obj.scale.set(1, 1, 1);
          obj.position.set(0, 0, 0);
          obj.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          road = obj;
          scene.add(road);
          resolve();
        },
        undefined,
        (err) => reject(err)
      );
    }, undefined, (err) => reject(err));
  });
}

// Create simple placeholder car (red box) until you add your car model
function createPlaceholderCar() {
  const geometry = new THREE.BoxGeometry(2, 1, 4);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  car = new THREE.Mesh(geometry, material);
  car.castShadow = true;
  car.position.set(0, 0.5, 0);
  scene.add(car);
}

// Create large flat green ground with simple plane (will replace with grass.obj later)
function createGround() {
  const geometry = new THREE.PlaneGeometry(100, 100);
  const material = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // forest green
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
}

// Controls
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

let speed = 0;
const maxSpeed = 2.5;
const accel = 0.05;
const friction = 0.95;
const turnSpeed = 0.03;

function updateCar() {
  if (!car) return;

  if (keys['w']) speed += accel;
  if (keys['s']) speed -= accel;
  if (keys[' ']) speed *= 0.7;

  speed = THREE.MathUtils.clamp(speed, -maxSpeed, maxSpeed);
  speed *= friction;

  if (keys['a']) car.rotation.y += turnSpeed * speed * 2;
  if (keys['d']) car.rotation.y -= turnSpeed * speed * 2;

  car.translateZ(speed);
}

// Camera follow offset
const camOffset = new THREE.Vector3(0, 6, -12);

function updateCamera() {
  if (!car) {
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);
    return;
  }
  const desiredPos = camOffset.clone().applyMatrix4(car.matrixWorld);
  camera.position.lerp(desiredPos, 0.1);
  camera.lookAt(car.position);
}

// Main animation loop
function animate() {
  requestAnimationFrame(animate);
  updateCar();
  updateCamera();
  renderer.render(scene, camera);
}

// Initialize
async function init() {
  try {
    createGround();
    await loadRoad();
    createPlaceholderCar();
    animate();
  } catch (e) {
    console.error('Error loading assets:', e);
  }
}

init();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
