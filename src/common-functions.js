//get meshes by name
function getMeshesByName(root, name) {
  const meshes = [];
  root.traverse((child) => {
    if (child.isMesh && child.name.toLowerCase().includes(name.toLowerCase())) {
      meshes.push(child);
    }
  });
  return meshes;
}

//Apply material by mesh name
function applyMaterialByMeshName(root, name, material) {
  root.traverse((child) => {
    if (child.isMesh && child.name === name) {
      child.material = material;
    }
  });
} 

//Apply material by material name (super useful for GLTFs)
function applyMaterialByMaterialName(root, matName, newMaterial) {
  root.traverse((child) => {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((mat) =>
          mat.name === matName ? newMaterial : mat
        );
      } else {
        if (child.material.name === matName) {
          child.material = newMaterial;
        }
      }
    }
  });
}

//Debug helper (VERY useful)
function logSceneStructure(root) {
  root.traverse((child) => {
    console.log({
      name: child.name,
      type: child.type,
      material: child.material,
    });
  });
}


export {getMeshesByName, applyMaterialByMeshName, applyMaterialByMaterialName, logSceneStructure}