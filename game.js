// ---- game.js ----

// Import necessary THREE loaders at top of your HTML:
// <script src="https://cdn.jsdelivr.net/npm/three@0.148.0/build/three.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.148.0/examples/js/loaders/OBJLoader.js"></script>

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // light blue sky
scene.fog = new THREE.Fog(0xaaccff, 500, 6000);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 20, 30);
camera.lookAt(0, 0, 0);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Debug helpers
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(200, 20);
scene.add(gridHelper);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 50, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
groundGeometry.rotateX(-Math.PI / 2);

// Add simple waves to the ground height
const positions = groundGeometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getZ(i);
  const height = Math.sin(x * 0.1) * 2 + Math.cos(z * 0.1) * 2;
  positions.setY(i, height);
}
groundGeometry.computeVertexNormals();

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x228b22,
  roughness: 1,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

// Placeholder car (red box) until model loads
const placeholderCar = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
placeholderCar.position.y = 0.5;
scene.add(placeholderCar);

// Load your car.obj model
let car = null;
const objLoader = new THREE.OBJLoader();

objLoader.load(
  'car.obj',
  (object) => {
    console.log('Car model loaded:', object);

    // Remove placeholder
    scene.remove(placeholderCar);

    car = object;
    car.scale.set(2, 2, 2);

    // Apply simple red material to all meshes in car model
    car.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      }
    });

    car.position.y = 5; // raise car above ground
    scene.add(car);
  },
  undefined,
  (error) => {
    console.error('Error loading car.obj:', error);
  }
);

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
  if (!car) {
    // Rotate placeholder car for fun while waiting
    placeholderCar.rotation.y += 0.01;
    return;
  }

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

animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});
