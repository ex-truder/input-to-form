export const LOOP_MODES = new Set(["once", "ping-pong", "wrap"]);
export const MATERIAL_SHADER_TYPES = new Set(["glass-refraction"]);
export const MATERIAL_SIDES = new Set(["front", "back", "double"]);

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

const SHADER_NUMBER_RANGES = {
  roughness: [0, 1],
  metalness: [0, 1],
  transmission: [0, 1],
  thickness: [0, Infinity],
  ior: [1, 2.333],
  attenuationDistance: [Number.MIN_VALUE, Infinity],
  dispersion: [0, 1],
  clearcoat: [0, 1],
  clearcoatRoughness: [0, 1],
  envMapIntensity: [0, Infinity],
};

const GLASS_SHADER_PARAMETERS = new Set([
  "color",
  "attenuationColor",
  "doubleSided",
  ...Object.keys(SHADER_NUMBER_RANGES),
]);

function validateRgb(value, path) {
  if (!Array.isArray(value) || value.length !== 3 || value.some((channel) => (
    !Number.isFinite(channel) || channel < 0 || channel > 1
  ))) {
    throw new Error(`${path} must be an RGB array with three values between 0 and 1.`);
  }
}

function validateMaterialShader(shader, target) {
  if (!shader || typeof shader !== "object" || Array.isArray(shader)) {
    throw new Error(`Material "${target}" shader must be an object.`);
  }

  if (!MATERIAL_SHADER_TYPES.has(shader.type)) {
    throw new Error(
      `Unknown material shader "${shader.type ?? "missing"}" for "${target}". `
      + `Use ${[...MATERIAL_SHADER_TYPES].join(", ")}.`,
    );
  }

  const parameters = shader.parameters || {};
  if (typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new Error(`Material "${target}" shader.parameters must be an object.`);
  }

  const unknownParameters = Object.keys(parameters).filter(
    (property) => !GLASS_SHADER_PARAMETERS.has(property),
  );
  if (unknownParameters.length) {
    throw new Error(
      `Material "${target}" shader has unknown parameters: ${unknownParameters.join(", ")}.`,
    );
  }

  for (const colorProperty of ["color", "attenuationColor"]) {
    if (parameters[colorProperty] != null) {
      validateRgb(parameters[colorProperty], `Material "${target}" shader.parameters.${colorProperty}`);
    }
  }

  for (const [property, [minimum, maximum]] of Object.entries(SHADER_NUMBER_RANGES)) {
    const parameter = parameters[property];
    if (parameter != null && (
      !Number.isFinite(parameter) || parameter < minimum || parameter > maximum
    )) {
      throw new Error(
        `Material "${target}" shader.parameters.${property} must be between ${minimum} and ${maximum}.`,
      );
    }
  }

  if (parameters.doubleSided != null && typeof parameters.doubleSided !== "boolean") {
    throw new Error(`Material "${target}" shader.parameters.doubleSided must be true or false.`);
  }
}

export function validateAnimationManifest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Animation manifest must be a JSON object.");
  }

  if (value.version !== 1) {
    throw new Error(`Unsupported animation manifest version: ${value.version ?? "missing"}.`);
  }

  const timeline = value.timeline || {};
  const loop = timeline.loop || "wrap";

  if (!LOOP_MODES.has(loop)) {
    throw new Error(`Unknown loop mode "${loop}". Use once, ping-pong or wrap.`);
  }

  if (timeline.speed != null && (!Number.isFinite(timeline.speed) || timeline.speed <= 0)) {
    throw new Error("timeline.speed must be a number greater than zero.");
  }

  const viewer = value.viewer || {};
  if (viewer.environment != null && (typeof viewer.environment !== "string" || !viewer.environment.trim())) {
    throw new Error("viewer.environment must be a non-empty path to an HDR or EXR file.");
  }
  if (viewer.background != null && (typeof viewer.background !== "string" || !viewer.background.trim())) {
    throw new Error('viewer.background must be a CSS color or "transparent".');
  }
  if (viewer.environmentIntensity != null && (!Number.isFinite(viewer.environmentIntensity) || viewer.environmentIntensity < 0)) {
    throw new Error("viewer.environmentIntensity must be a number greater than or equal to zero.");
  }
  if (viewer.showEnvironment != null && typeof viewer.showEnvironment !== "boolean") {
    throw new Error("viewer.showEnvironment must be true or false.");
  }

  const materialTargets = new Set();
  for (const material of value.materials || []) {
    if (!material?.target || typeof material.target !== "string") {
      throw new Error("Every material animation requires a target material name.");
    }

    if (materialTargets.has(material.target)) {
      throw new Error(`Material "${material.target}" is configured more than once.`);
    }
    materialTargets.add(material.target);

    if (material.target === "*" && (value.materials || []).length > 1) {
      throw new Error('The wildcard material target "*" cannot be combined with other material tracks.');
    }

    if (material.side != null && !MATERIAL_SIDES.has(material.side)) {
      throw new Error(
        `Unknown side "${material.side}" for material "${material.target}". Use front, back or double.`,
      );
    }

    if (material.shader != null) validateMaterialShader(material.shader, material.target);

    const keyframes = material.blend?.keyframes;
    if (keyframes) {
      let previous = -Infinity;
      for (const keyframe of keyframes) {
        if (!Number.isFinite(keyframe.progress) || !Number.isFinite(keyframe.value)) {
          throw new Error(`Material "${material.target}" contains an invalid keyframe.`);
        }
        if (keyframe.progress < 0 || keyframe.progress > 1 || keyframe.value < 0 || keyframe.value > 1) {
          throw new Error(`Material "${material.target}" keyframes must stay between 0 and 1.`);
        }
        if (keyframe.progress < previous) {
          throw new Error(`Keyframes for material "${material.target}" must be sorted by progress.`);
        }
        previous = keyframe.progress;
      }
    }
  }

  return {
    ...value,
    timeline: {
      autoplay: true,
      speed: 1,
      ...timeline,
      loop,
    },
    materials: value.materials || [],
  };
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

export function evaluateKeyframes(keyframes, progress, easing = "linear") {
  if (!keyframes?.length) return clamp01(progress);
  if (progress <= keyframes[0].progress) return keyframes[0].value;
  if (progress >= keyframes[keyframes.length - 1].progress) return keyframes[keyframes.length - 1].value;

  const rightIndex = keyframes.findIndex((keyframe) => keyframe.progress >= progress);
  const left = keyframes[rightIndex - 1];
  const right = keyframes[rightIndex];
  const span = right.progress - left.progress;
  let local = span === 0 ? 1 : (progress - left.progress) / span;

  if (easing === "smoothstep") local = smoothstep(local);
  if (easing === "step") local = 0;

  return left.value + (right.value - left.value) * local;
}

export function advanceTimeline({ time, direction = 1 }, delta, duration, loopMode, speed = 1) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return { time: 0, direction: 1, progress: 0, ended: loopMode === "once" };
  }

  let nextTime = time + delta * speed * direction;
  let nextDirection = direction;
  let ended = false;

  if (loopMode === "once") {
    if (nextTime >= duration) {
      nextTime = duration;
      ended = true;
    }
    if (nextTime <= 0) nextTime = 0;
  } else if (loopMode === "wrap") {
    nextTime = ((nextTime % duration) + duration) % duration;
  } else {
    while (nextTime > duration || nextTime < 0) {
      if (nextTime > duration) {
        nextTime = duration - (nextTime - duration);
        nextDirection = -1;
      } else if (nextTime < 0) {
        nextTime = -nextTime;
        nextDirection = 1;
      }
    }
  }

  return {
    time: nextTime,
    direction: nextDirection,
    progress: clamp01(nextTime / duration),
    ended,
  };
}

export function resolveManifestAsset(manifestUrl, assetPath) {
  if (!assetPath) return null;
  return new URL(assetPath, new URL(manifestUrl, window.location.href)).href;
}
