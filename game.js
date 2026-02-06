// Load MTL then OBJ with materials
const mtlLoader = new THREE.MTLLoader();
mtlLoader.setPath('assets/');
mtlLoader.load('road.mtl', (materials) => {
  materials.preload();

  const objLoader = new THREE.OBJLoader();
  objLoader.setMaterials(materials);
  objLoader.setPath('assets/');
  objLoader.load('road.obj', (object) => {
    object.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(object);
  });
});
