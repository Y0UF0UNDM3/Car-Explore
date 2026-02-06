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

// Ground plane (green farm land)
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Loaders
const objLoader = new THREE.OBJLoader();
const assetsPath = 'assets/';

let roadSegments = [];

// Load road.obj
function loadRoad() {
  return new Promise((resolve, reject) => {
    objLoader.load(
      assetsPath + 'road.obj',
      (obj) => resolve(obj),
      undefined,
      (err) => reject(err)
    );
  });
}

// Create long road by tiling road.obj segments
async function createRoad() {
  const roadSegment = await loadRoad();

  const segmentLength = 4.4; // length approx from your road.obj

  for (let i = 0; i < 15; i++) {
    const segClone = roadSegment.clone();
    segClone.position.set(0, 0.01, i * segmentLength); // slightly above ground

    segClone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({ color: 0x333333 });
      }
    });

    scene.add(segClone);
    roadSegments.push(segClone);
  }
}

// Temporary red cube car
const carGeometry = new THREE.BoxGeometry(2, 1, 4);
const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeometry, carMaterial);
car.position.set(0, 0.5, 0);
car.castShadow = true;
car.receiveShadow = true;
scene.add(car);

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
  const desiredPos = camOffset.clone().applyMatrix4(car.matrixWorld);
  camera.position.lerp(desiredPos, 0.1);
  camera.lookAt(car.position);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  updateCar();
  updateCamera();
  renderer.render(scene, camera);
}

// Initialize and start
async function init() {
  try {
    await createRoad();
    animate();
  } catch (e) {
    console.error('Error loading assets:', e);
  }
}

init();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
