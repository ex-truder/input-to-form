const DEFAULTS = {
  baseColor: 0xa79f98,
  flashColor: 0xff4d00,
  cubeSize: 10,
  spacing: 0.01,
  opacity: 0.1,
  cameraDistance: 9,
  attractionRadius: 3,
  attractionStrength: 20,
  returnStrength: 3.1,
  activeReturnStrength: 0.45,
  damping: 1,
  collisionRestitution: 0.01,
  clickRadius: 0.82,
  clickImpulse: 1.05,
  flashDecay: 0.55,
  maxCubes: 2000,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function createScene({ THREE, scene, camera, config = {} }) {
  const options = { ...DEFAULTS, ...config };
  const baseColor = new THREE.Color(options.baseColor);
  const flashColor = new THREE.Color(options.flashColor);
  const instanceColor = new THREE.Color();

  camera.fov = 30;
  camera.position.set(0, 0, options.cameraDistance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x8c7f75, 1.9);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(-4, 5, 7);
  scene.add(ambientLight, keyLight);

  const geometry = new THREE.BoxGeometry(
    options.cubeSize,
    options.cubeSize,
    options.cubeSize,
  );
  const glowGeometry = new THREE.BoxGeometry(
    options.cubeSize * 1.32,
    options.cubeSize * 1.32,
    options.cubeSize * 1.32,
  );
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    wireframe: true,
    roughness: 0.58,
    metalness: 0.12,
    transparent: true,
    opacity: options.opacity,
    depthWrite: false,
    vertexColors: true,
  });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: options.flashColor,
    wireframe: true,
    transparent: true,
    opacity: 0.72,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const bodies = [];
  let cubes;
  let glowCubes;
  let viewportWidth = 1;
  let viewportHeight = 1;
  let lastClickSequence = 0;

  const removeMeshes = () => {
    if (cubes) scene.remove(cubes);
    if (glowCubes) scene.remove(glowCubes);
    cubes = undefined;
    glowCubes = undefined;
  };

  const visibleWorldSize = () => {
    const height =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
    return { width: height * camera.aspect, height };
  };

  const rebuild = () => {
    removeMeshes();
    bodies.length = 0;

    const world = visibleWorldSize();
    const columns = Math.ceil(world.width / options.spacing) + 3;
    const rows = Math.ceil(world.height / options.spacing) + 3;
    const candidates = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if ((row + column) % 2 !== 0) continue;
        candidates.push({
          x: (column - (columns - 1) / 2) * options.spacing,
          y: (row - (rows - 1) / 2) * options.spacing,
          row,
          column,
        });
      }
    }

    const stride = Math.max(1, Math.ceil(candidates.length / options.maxCubes));
    candidates.filter((_, index) => index % stride === 0).forEach((item, index) => {
      bodies.push({
        x: item.x,
        y: item.y,
        vx: 0,
        vy: 0,
        homeX: item.x,
        homeY: item.y,
        phase: item.row * 0.73 + item.column * 0.41,
        spin: (index % 7) * 0.08 - 0.24,
        flash: 0,
      });
    });

    cubes = new THREE.InstancedMesh(geometry, material, bodies.length);
    glowCubes = new THREE.InstancedMesh(glowGeometry, glowMaterial, bodies.length);
    cubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    glowCubes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cubes.renderOrder = 1;
    glowCubes.renderOrder = 2;
    scene.add(cubes, glowCubes);
  };

  const pointerToWorld = (pointer) => ({
    x: pointer.x * viewportWidth * 0.5,
    y: pointer.y * viewportHeight * 0.5,
  });

  const triggerFlash = (pointer, addImpulse) => {
    const click = pointerToWorld(pointer);

    bodies.forEach((body) => {
      const dx = body.x - click.x;
      const dy = body.y - click.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= options.clickRadius) return;

      const falloff = 1 - distance / options.clickRadius;
      body.flash = Math.max(body.flash, falloff);
      if (addImpulse) {
        const inverseDistance = distance > 0.001 ? 1 / distance : 0;
        body.vx += dx * inverseDistance * options.clickImpulse * falloff;
        body.vy += dy * inverseDistance * options.clickImpulse * falloff;
      }
    });
  };

  const solveCollisions = () => {
    const minimumDistance = options.cubeSize * 0.9;
    const minimumDistanceSquared = minimumDistance * minimumDistance;

    for (let firstIndex = 0; firstIndex < bodies.length; firstIndex += 1) {
      const first = bodies[firstIndex];
      for (let secondIndex = firstIndex + 1; secondIndex < bodies.length; secondIndex += 1) {
        const second = bodies[secondIndex];
        let dx = second.x - first.x;
        let dy = second.y - first.y;
        let distanceSquared = dx * dx + dy * dy;
        if (distanceSquared >= minimumDistanceSquared) continue;

        if (distanceSquared < 0.000001) {
          const angle = (firstIndex * 2.399 + secondIndex) % (Math.PI * 2);
          dx = Math.cos(angle) * 0.001;
          dy = Math.sin(angle) * 0.001;
          distanceSquared = dx * dx + dy * dy;
        }

        const distance = Math.sqrt(distanceSquared);
        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minimumDistance - distance;
        first.x -= nx * overlap * 0.5;
        first.y -= ny * overlap * 0.5;
        second.x += nx * overlap * 0.5;
        second.y += ny * overlap * 0.5;

        const relativeVelocity =
          (second.vx - first.vx) * nx + (second.vy - first.vy) * ny;
        if (relativeVelocity >= 0) continue;
        const impulse =
          (-(1 + options.collisionRestitution) * relativeVelocity) * 0.5;
        first.vx -= impulse * nx;
        first.vy -= impulse * ny;
        second.vx += impulse * nx;
        second.vy += impulse * ny;
      }
    }
  };

  const writeInstances = (elapsed, reducedMotion) => {
    bodies.forEach((body, index) => {
      const movement = Math.hypot(body.vx, body.vy);
      const z = reducedMotion ? 0 : Math.sin(elapsed * 0.55 + body.phase) * 0.055;
      position.set(body.x, body.y, z);
      rotation.set(
        reducedMotion ? 0.16 : Math.sin(elapsed * 0.42 + body.phase) * 0.16,
        reducedMotion ? 0.18 : Math.cos(elapsed * 0.36 + body.phase) * 0.2,
        body.spin + clamp(movement * 0.12, -0.18, 0.18),
      );
      quaternion.setFromEuler(rotation);
      scale.setScalar(1);
      matrix.compose(position, quaternion, scale);
      cubes.setMatrixAt(index, matrix);

      scale.setScalar(body.flash > 0.008 ? 1 + body.flash * 0.58 : 0.001);
      matrix.compose(position, quaternion, scale);
      glowCubes.setMatrixAt(index, matrix);

      instanceColor.copy(baseColor).lerp(flashColor, body.flash);
      cubes.setColorAt(index, instanceColor);
    });

    cubes.instanceMatrix.needsUpdate = true;
    glowCubes.instanceMatrix.needsUpdate = true;
    if (cubes.instanceColor) cubes.instanceColor.needsUpdate = true;
  };

  return {
    update({ elapsed, delta, pointer, interaction, intensity, reducedMotion }) {
      if (!cubes || !glowCubes) return;

      if (interaction.clickSequence !== lastClickSequence) {
        lastClickSequence = interaction.clickSequence;
        triggerFlash(interaction.clickPointer, !reducedMotion);
      }

      const cursor = pointerToWorld(pointer);
      const attractionEnabled = interaction.active && !reducedMotion;
      const damping = Math.exp(-options.damping * delta);
      const springStrength = attractionEnabled
        ? options.activeReturnStrength
        : options.returnStrength;

      bodies.forEach((body) => {
        const idleX = reducedMotion ? 0 : Math.cos(elapsed * 0.31 + body.phase) * 0.014;
        const idleY = reducedMotion ? 0 : Math.sin(elapsed * 0.38 + body.phase) * 0.022;
        body.vx += (body.homeX + idleX - body.x) * springStrength * delta;
        body.vy += (body.homeY + idleY - body.y) * springStrength * delta;

        if (attractionEnabled) {
          const dx = cursor.x - body.x;
          const dy = cursor.y - body.y;
          const distance = Math.hypot(dx, dy);
          if (distance < options.attractionRadius && distance > 0.001) {
            const falloff = 1 - distance / options.attractionRadius;
            const force =
              options.attractionStrength * falloff * falloff * intensity;
            body.vx += (dx / distance) * force * delta;
            body.vy += (dy / distance) * force * delta;
          }
        }

        body.vx *= damping;
        body.vy *= damping;
        body.x += body.vx * delta;
        body.y += body.vy * delta;
        body.flash *= Math.exp(-options.flashDecay * delta);
      });

      if (!reducedMotion) solveCollisions();
      writeInstances(elapsed, reducedMotion);
    },

    resize({ aspect }) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      const world = visibleWorldSize();
      viewportWidth = world.width;
      viewportHeight = world.height;
      rebuild();
      writeInstances(0, true);
    },

    dispose() {
      removeMeshes();
      scene.remove(ambientLight, keyLight);
      geometry.dispose();
      glowGeometry.dispose();
      material.dispose();
      glowMaterial.dispose();
    },
  };
}
