// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xaaccff, 500, 6000);
scene.background = new THREE.Color(0x87ceeb); // light blue sky

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 8, -15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Helpers to orient scene
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(200, 20);
scene.add(gridHelper);

// Lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
dirLight.position.set(300, 400, 200);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.25));

// Terrain (wavy ground)
const size = 256;
const segments = 256;
const geometry = new THREE.PlaneGeometry(1024, 1024, segments - 1, segments - 1);
geometry.rotateX(-Math.PI / 2);

const positions = geometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getZ(i);

  const height =
    Math.sin(x * 0.005) * 15 +
    Math.cos(z * 0.005) * 15 +
    Math.sin((x + z) * 0.003) * 20;

  positions.setY(i, height);
}
geometry.computeVertexNormals();

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x4c7a3f,
  roughness: 1,
});
const ground = new THREE.Mesh(geometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

// Car loading variables
let car;

// Load OBJ + MTL if available, else load OBJ alone
const mtlLoader = new THREE.MTLLoader();
const objLoader = new THREE.OBJLoader();

function loadCarModel() {
  mtlLoader.load(
    'car.mtl',
    (materials) => {
      materials.preload();
      objLoader.setMaterials(materials);
      objLoader.load(
        'car.obj',
        (object) => {
          setCar(object);
          console.log('Car model loaded with MTL!');
        },
        undefined,
        (error) => {
          console.error('Error loading car.obj with MTL:', error);
        }
      );
    },
    undefined,
    () => {
      // No MTL, load OBJ only
      objLoader.load(
        'car.obj',
        (object) => {
          setCar(object);
          console.log('Car model loaded without MTL!');
        },
        undefined,
        (error) => {
          console.error('Error loading car.obj:', error);
        }
      );
    }
  );
}

function setCar(object) {
  if (car) scene.remove(car);
  car = object;
  car.scale.set(2, 2, 2);
  car.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  car.position.y = 5;
  scene.add(car);
}

// Show placeholder red box until car loads
const placeholderCar = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
placeholderCar.position.y = 0.5;
scene.add(placeholderCar);

// Start loading car
loadCarModel();

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
    // Move placeholder for fun while loading
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

// Camera follow
const camOffset = new THREE.Vector3(0, 6, -12);

function updateCamera() {
  if (!car) {
    // Keep camera fixed while loading
    camera.position.set(0, 20, 30);
    camera.lookAt(0, 0, 0);
    return;
  }
  const desiredPos = camOffset.clone().applyMatrix4(car.matrixWorld);
  camera.position.lerp(desiredPos, 0.1);
  camera.lookAt(car.position);
}

function animate() {
  requestAnimationFrame(animate);
  updateCar();
  updateCamera();
  renderer.render(scene, camera);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
