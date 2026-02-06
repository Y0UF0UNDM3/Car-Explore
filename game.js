const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd1e5);
scene.fog = new THREE.Fog(0xbfd1e5, 300, 4000);

// Camera
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  8000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lights
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(200, 400, 200);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// ===== REAL TERRAIN =====
const size = 5000;
const segments = 256;

const geo = new THREE.PlaneGeometry(size, size, segments, segments);
geo.rotateX(-Math.PI / 2);

const pos = geo.attributes.position;

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);

  const h =
    Math.sin(x * 0.002) * 20 +
    Math.cos(z * 0.002) * 20 +
    Math.sin((x + z) * 0.001) * 30;

  pos.setY(i, h);
}

geo.computeVertexNormals();

const ground = new THREE.Mesh(
  geo,
  new THREE.MeshStandardMaterial({
    color: 0x3f7c47,
    roughness: 1
  })
);

ground.receiveShadow = true;
scene.add(ground);

// ===== LOAD REAL CAR MODEL =====
// Put a file named car.glb in your repo root
let car;
const loader = new THREE.GLTFLoader();

loader.load(
  "car.glb",
  gltf => {
    car = gltf.scene;
    car.scale.set(2, 2, 2);
    car.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(car);
  },
  undefined,
  err => console.log("Model load failed — using fallback car")
);

// Fallback car if model missing
const fallback = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0xcc0000 })
);
fallback.castShadow = true;
scene.add(fallback);

// ===== TREES =====
const treeGeo = new THREE.ConeGeometry(2, 8, 8);
const treeMat = new THREE.MeshStandardMaterial({ color: 0x2e5e2e });

for (let i = 0; i < 200; i++) {
  const t = new THREE.Mesh(treeGeo, treeMat);
  t.position.set(
    (Math.random() - 0.5) * 4000,
    4,
    (Math.random() - 0.5) * 4000
  );
  t.castShadow = true;
  scene.add(t);
}

// ===== CONTROLS + PHYSICS =====
let speed = 0;
let accel = 0.03;
let maxSpeed = 3.5;
let friction = 0.985;
let turn = 0;

const keys = {};
addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function getCarObj() {
  return car || fallback;
}

function updateCar() {
  const obj = getCarObj();

  if (keys["w"]) speed += accel;
  if (keys["s"]) speed -= accel;
  if (keys[" "]) speed *= 0.9;

  speed = Math.max(-maxSpeed, Math.min(maxSpeed, speed));
  speed *= friction;

  if (keys["a"]) turn += 0.02 * speed;
  if (keys["d"]) turn -= 0.02 * speed;

  obj.rotation.y += turn;
  turn *= 0.8;

  obj.translateZ(speed);
}

// ===== CAMERA FOLLOW =====
const camOffset = new THREE.Vector3(0, 8, -16);

function updateCamera() {
  const obj = getCarObj();
  const desired = camOffset.clone().applyMatrix4(obj.matrixWorld);
  camera.position.lerp(desired, 0.08);
  camera.lookAt(obj.position);
}

camera.position.set(0, 10, -20);

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
