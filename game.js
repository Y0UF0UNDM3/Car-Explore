// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 10, 25);
camera.lookAt(0, 0, 0);

// Renderer
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
const objLoader = new THREE.OBJLoader();

const assetsPath = 'assets/';

let car = null;
let roadSegments = [];
let grassPatches = [];

function loadGrass() {
  return new Promise((resolve, reject) => {
    objLoader.load(
      assetsPath + 'grass.obj',
      (obj) => {
        resolve(obj);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function loadRoad() {
  return new Promise((resolve, reject) => {
    objLoader.load(
      assetsPath + 'road.obj',
      (obj) => {
        resolve(obj);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

function loadCar() {
  return new Promise((resolve, reject) => {
    objLoader.load(
      assetsPath + 'car.obj',
      (obj) => {
        resolve(obj);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

// Create large grass ground by tiling grass patches
async function createGrassField() {
  const grassPatch = await loadGrass();

  // Assume grass patch size approx 10x10 units
  const patchSize = 10;

  for (let i = -5; i < 5; i++) {
    for (let j = -5; j < 5; j++) {
      const patchClone = grassPatch.clone();
      patchClone.position.set(i * patchSize, 0, j * patchSize);
      patchClone.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        }
      });
      scene.add(patchClone);
      grassPatches.push(patchClone);
    }
  }
}

// Create a long road by cloning road segments in a line
async function createRoad() {
  const roadSegment = await loadRoad();

  // Assume road segment approx 5 wide x 20 long units
  const segmentLength = 20;

  for (let i = 0; i < 15; i++) {
    const segClone = roadSegment.clone();
    segClone.position.set(0, 0.01, i * segmentLength); // slight y offset so it’s above grass
    segClone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({ color: 0x333333 }); // asphalt dark gray
      }
    });
    scene.add(segClone);
    roadSegments.push(segClone);
  }
}

// Load and add car model
async function createCar() {
  car = await loadCar();
  car.scale.set(2, 2, 2);
  car.position.set(0, 0.5, 0);
  car.rotation.y = Math.PI; // face forward along positive z
  car.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    }
  });
  scene.add(car);
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

// Initialize scene by loading everything
async function init() {
  try {
    await createGrassField();
    await createRoad();
    await createCar();
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
