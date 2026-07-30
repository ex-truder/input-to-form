const DEFAULTS = {
  color: 0xff4d00,
  columns: 11,
  rows: 7,
  spacing: 1,
  cameraDistance: 4,
};

export function createScene({ THREE, scene, camera, config = {} }) {
  const options = { ...DEFAULTS, ...config };
  const count = options.columns * options.rows;
  const geometry = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  const material = new THREE.MeshBasicMaterial({
    color: options.color,
    transparent: true,
    opacity: 0.42,
    wireframe: true,
  });
  const grid = new THREE.InstancedMesh(geometry, material, count);
  grid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(grid);

  camera.fov = 38;
  camera.position.set(0, 0, options.cameraDistance);
  camera.updateProjectionMatrix();

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);

  const updateInstances = ({ elapsed, progress, pointer, intensity, reducedMotion }) => {
    const motion = intensity * (reducedMotion ? 0 : 1);
    let instance = 0;

    for (let row = 0; row < options.rows; row += 1) {
      for (let column = 0; column < options.columns; column += 1) {
        const x = (column - (options.columns - 1) / 2) * options.spacing;
        const y = (row - (options.rows - 1) / 2) * options.spacing;
        const phase = column * 0.52 + row * 0.38;
        const wave = Math.sin(phase + progress * Math.PI * 4 + elapsed * 0.55 * motion);

        position.set(
          x + pointer.x * 0.08 * motion,
          y + pointer.y * 0.08 * motion,
          wave * 0.72,
        );
        rotation.set(
          wave * 0.35,
          progress * Math.PI + phase * 0.08,
          wave * 0.16,
        );
        quaternion.setFromEuler(rotation);
        scale.setScalar(0.75 + (wave + 1) * 0.18);
        matrix.compose(position, quaternion, scale);
        grid.setMatrixAt(instance, matrix);
        instance += 1;
      }
    }

    grid.instanceMatrix.needsUpdate = true;
    grid.rotation.z = (progress - 0.5) * 0.16;
  };

  return {
    update: updateInstances,

    resize({ aspect }) {
      grid.scale.setScalar(aspect < 0.8 ? 0.72 : 1);
    },

    dispose() {
      scene.remove(grid);
      geometry.dispose();
      material.dispose();
    },
  };
}
