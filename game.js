// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa0a0a0, 200, 2000);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(50, 100, 50);
scene.add(dir);

// Ground (open world feel)
const groundGeo = new THREE.PlaneGeometry(5000, 5000, 100, 100);
groundGeo.rotateX(-Math.PI / 2);

for (let v of groundGeo.attributes.position.array) {
  // slight noise
}

const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a });
const ground = new THREE.Mesh(groundGeo, groundMat);
scene.add(ground);

// Car body
const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.8, 4),
  new THREE.MeshStandardMaterial({ color: 0xff3333 })
);
body.position.y = 1;
car.add(body);

// Wheels
function makeWheel(x, z) {
  const w = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.5, 24),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  w.rotation.z = Math.PI / 2;
  w.position.set(x, 0.4, z);
  return w;
}

car.add(makeWheel(-1, 1.5));
car.add(makeWheel(1, 1.5));
car.add(makeWheel(-1, -1.5));
car.add(makeWheel(1, -1.5));

scene.add(car);

// Trees scattered
const treeGeo = new THREE.ConeGeometry(1, 4, 8);
const treeMat = new THREE.MeshStandardMaterial({ color: 0x2f5f2f });

for (let i = 0; i < 300; i++) {
  const t = new THREE.Mesh(treeGeo, treeMat);
  t.position.set(
    (Math.random() - 0.5) * 4000,
    2,
    (Math.random() - 0.5) * 4000
  );
  scene.add(t);
}

// Controls + physics
let speed = 0;
let accel = 0.02;
let maxSpeed = 2.5;
let friction = 0.98;
let turnRate = 0.03;

const keys = {};
addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// Camera follow offset
const camOffset = new THREE.Vector3(0, 6, -12);

function updateCar() {
  if (keys["w"]) speed += accel;
  if (keys["s"]) speed -= accel;
  if (keys[" "]) speed *= 0.9;

  speed = THREE.MathUtils.clamp(speed, -maxSpeed, maxSpeed);
  speed *= friction;

  if (keys["a"]) car.rotation.y += turnRate * speed * 2;
  if (keys["d"]) car.rotation.y -= turnRate * speed * 2;

  car.translateZ(speed);
}

function updateCamera() {
  const desired = camOffset.clone().applyMatrix4(car.matrixWorld);
  camera.position.lerp(desired, 0.1);
  camera.lookAt(car.position);
}

camera.position.set(0, 8, -15);

// Resize
addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop
function animate() {
  requestAnimationFrame(animate);

  updateCar();
  updateCamera();

  renderer.render(scene, camera);
}

animate();
