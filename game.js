export function startGame(THREE, GLTFLoader, Sky, CANNON) {

// ================= SCENE =================

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xaaccff, 500, 6000);

const camera = new THREE.PerspectiveCamera(
  70, innerWidth/innerHeight, 0.1, 10000
);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ================= SKY =================

const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

sky.material.uniforms.turbidity.value = 8;
sky.material.uniforms.rayleigh.value = 2;
sky.material.uniforms.mieCoefficient.value = 0.005;
sky.material.uniforms.mieDirectionalG.value = 0.8;

const sun = new THREE.Vector3();
sun.setFromSphericalCoords(1, Math.PI/3, Math.PI/4);
sky.material.uniforms.sunPosition.value.copy(sun);

// ================= LIGHT =================

const light = new THREE.DirectionalLight(0xffffff, 1.3);
light.position.set(300,400,200);
light.castShadow = true;
light.shadow.mapSize.set(2048,2048);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff,0.25));

// ================= PHYSICS =================

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0,-9.82,0)
});

// ===== TERRAIN HEIGHTFIELD =====

const size = 256;
const matrix = [];

for(let i=0;i<size;i++){
  matrix.push([]);
  for(let j=0;j<size;j++){
    const h =
      Math.sin(i*0.15)*4 +
      Math.cos(j*0.18)*4 +
      Math.sin((i+j)*0.1)*6;
    matrix[i].push(h);
  }
}

const hfShape = new CANNON.Heightfield(matrix,{ elementSize:4 });
const hfBody = new CANNON.Body({ mass:0 });
hfBody.addShape(hfShape);
hfBody.position.set(-size*2,0,size*2);
hfBody.quaternion.setFromEuler(-Math.PI/2,0,0);
world.addBody(hfBody);

// visual terrain
const geo = new THREE.PlaneGeometry(size*4,size*4,size-1,size-1);
geo.rotateX(-Math.PI/2);

const verts = geo.attributes.position;
for(let i=0;i<verts.count;i++){
  const x = Math.floor(i % size);
  const y = Math.floor(i / size);
  verts.setY(i, matrix[x][y]);
}
geo.computeVertexNormals();

const ground = new THREE.Mesh(
  geo,
  new THREE.MeshStandardMaterial({ color:0x4c7a3f, roughness:1 })
);
ground.receiveShadow = true;
scene.add(ground);

// ================= VEHICLE =================

const chassisShape = new CANNON.Box(new CANNON.Vec3(1,0.5,2));
const chassisBody = new CANNON.Body({ mass:1200 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0,20,0);
world.addBody(chassisBody);

const vehicle = new CANNON.RaycastVehicle({
  chassisBody
});

const wheelOptions = {
  radius:0.4,
  suspensionStiffness:30,
  suspensionRestLength:0.5,
  frictionSlip:5,
  dampingRelaxation:2.3,
  dampingCompression:4.4,
  maxSuspensionForce:100000,
  rollInfluence:0.01,
  axleLocal: new CANNON.Vec3(-1,0,0),
  directionLocal: new CANNON.Vec3(0,-1,0)
};

vehicle.addWheel({...wheelOptions, chassisConnectionPointLocal:new CANNON.Vec3(1,0,1.6)});
vehicle.addWheel({...wheelOptions, chassisConnectionPointLocal:new CANNON.Vec3(-1,0,1.6)});
vehicle.addWheel({...wheelOptions, chassisConnectionPointLocal:new CANNON.Vec3(1,0,-1.6)});
vehicle.addWheel({...wheelOptions, chassisConnectionPointLocal:new CANNON.Vec3(-1,0,-1.6)});

vehicle.addToWorld(world);

// ================= CAR MODEL =================

let carMesh;
new GLTFLoader().load("car.glb", gltf=>{
  carMesh = gltf.scene;
  carMesh.scale.set(2,2,2);
  carMesh.traverse(o=>{
    if(o.isMesh){ o.castShadow=true; }
  });
  scene.add(carMesh);
});

// ================= INPUT =================

const keys={};
addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

// ================= CONTROLS =================

function updateControls(){
  const engine = 2500;
  const steer = 0.5;

  vehicle.applyEngineForce(
    keys["w"] ? -engine : keys["s"] ? engine : 0, 2
  );
  vehicle.applyEngineForce(
    keys["w"] ? -engine : keys["s"] ? engine : 0, 3
  );

  vehicle.setSteeringValue(keys["a"]?steer:keys["d"]?-steer:0,0);
  vehicle.setSteeringValue(keys["a"]?steer:keys["d"]?-steer:0,1);

  const brake = keys[" "] ? 50 : 0;
  for(let i=0;i<4;i++) vehicle.setBrake(brake,i);

  if(keys["r"]){
    chassisBody.position.set(0,20,0);
    chassisBody.velocity.setZero();
  }
}

// ================= CAMERA RIG =================

function updateCamera(){
  const p = chassisBody.position;
  const q = chassisBody.quaternion;

  const back = new THREE.Vector3(0,4,-12).applyQuaternion(
    new THREE.Quaternion(q.x,q.y,q.z,q.w)
  );

  camera.position.lerp(
    new THREE.Vector3(p.x,p.y,p.z).add(back),
    0.1
  );
  camera.lookAt(p.x,p.y+1,p.z);
}

// ================= LOOP =================

function animate(){
  requestAnimationFrame(animate);
  updateControls();
  world.step(1/60);

  if(carMesh){
    carMesh.position.copy(chassisBody.position);
    carMesh.quaternion.copy(chassisBody.quaternion);
  }

  updateCamera();
  renderer.render(scene,camera);
}

animate();

// resize
addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

}
