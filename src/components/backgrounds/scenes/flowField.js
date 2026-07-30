const DEFAULTS = {
  knotColor: 0xff4d00,
  pointColor: 0x161512,
  pointCount: 720,
  cameraDistance: 6,
  rotationTurns: 1.3,
};

export function createScene({ THREE, scene, camera, config = {} }) {
  const options = { ...DEFAULTS, ...config };
  const group = new THREE.Group();
  scene.add(group);

  camera.fov = 34;
  camera.position.set(0, 0, options.cameraDistance);
  camera.updateProjectionMatrix();

  const knotGeometry = new THREE.TorusKnotGeometry(1.55, 0.38, 180, 18, 2, 3);
  const knotMaterial = new THREE.MeshBasicMaterial({
    color: options.knotColor,
    transparent: true,
    opacity: 0.34,
    wireframe: true,
  });
  const knot = new THREE.Mesh(knotGeometry, knotMaterial);
  knot.rotation.x = 0.55;
  group.add(knot);

  const pointPositions = new Float32Array(options.pointCount * 3);
  for (let index = 0; index < options.pointCount; index += 1) {
    const turn = index * 0.19;
    const radius = 1.9 + 1.15 * Math.sin(index * 1.73);
    pointPositions[index * 3] = Math.cos(turn) * radius;
    pointPositions[index * 3 + 1] = Math.sin(turn * 0.61) * 2.35;
    pointPositions[index * 3 + 2] = Math.sin(turn) * radius * 0.58;
  }

  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(pointPositions, 3),
  );
  const pointsMaterial = new THREE.PointsMaterial({
    color: options.pointColor,
    size: 0.018,
    transparent: true,
    opacity: 0.36,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  group.add(points);

  return {
    update({ elapsed, progress, pointer, intensity, reducedMotion }) {
      const motion = intensity * (reducedMotion ? 0 : 1);
      group.rotation.y =
        progress * Math.PI * options.rotationTurns + elapsed * 0.06 * motion;
      group.rotation.x = (progress - 0.5) * 0.7 + pointer.y * 0.08 * motion;
      group.position.x = pointer.x * 0.16 * motion;
      knot.rotation.z = progress * Math.PI * 1.8 - elapsed * 0.04 * motion;
      points.rotation.z = -progress * Math.PI * 0.45;
    },

    resize({ aspect }) {
      group.scale.setScalar(aspect < 0.8 ? 0.78 : 1);
    },

    dispose() {
      scene.remove(group);
      knotGeometry.dispose();
      knotMaterial.dispose();
      pointsGeometry.dispose();
      pointsMaterial.dispose();
    },
  };
}
