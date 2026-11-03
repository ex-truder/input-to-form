// Version 1 of tools/houdini/hda_export.py. Source code in metadata is never run.
function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export function heldValue(samples, index) {
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (samples[middle][0] <= index) low = middle + 1;
    else high = middle;
  }
  return low ? samples[low - 1][1] : undefined;
}

function validateTrack(samples, count, name) {
  requireValue(Array.isArray(samples) && samples.length > 0, `Empty track: ${name}`);
  let previous = -1;
  for (const sample of samples) {
    requireValue(Array.isArray(sample) && sample.length === 2
      && Number.isInteger(sample[0]) && sample[0] > previous && sample[0] < count,
    `Invalid sample order: ${name}`);
    previous = sample[0];
  }
}

export function prepareHdaBundle(parameters, animation) {
  requireValue(parameters?.format === "hda-demo.parameters" && parameters.version === 1,
    "Unsupported parameters format/version.");
  requireValue(animation?.format === "hda-demo.animation" && animation.version === 1,
    "Unsupported animation format/version.");
  requireValue(typeof parameters.exportId === "string" && parameters.exportId === animation.exportId,
    "The JSON files belong to different exports.");
  const timeline = animation.timeline;
  const count = timeline?.sampleCount;
  requireValue(Number.isInteger(count) && count > 0 && Number.isFinite(timeline.fps) && timeline.fps > 0,
    "Invalid timeline.");
  for (const key of ["fps", "startFrame", "endFrame", "sampleStep", "sampleCount", "lastSampleTime", "timeOrigin"]) {
    requireValue(parameters.timeline?.[key] === timeline[key], `Timeline mismatch: ${key}`);
  }
  requireValue(Array.isArray(animation.sampleTimes) && animation.sampleTimes.length === count
    && Array.isArray(animation.sampleFrames) && animation.sampleFrames.length === count,
  "Invalid sample table.");
  for (let i = 0; i < count; i += 1) {
    requireValue(Number.isFinite(animation.sampleTimes[i]) && Number.isFinite(animation.sampleFrames[i])
      && (i === 0 ? animation.sampleTimes[i] === 0 : animation.sampleTimes[i] > animation.sampleTimes[i - 1]
        && animation.sampleFrames[i] > animation.sampleFrames[i - 1]), "Sample times must increase.");
  }
  requireValue(parameters.templates && parameters.definitions && parameters.layouts
    && Array.isArray(parameters.nodes) && parameters.nodes.length > 0
    && animation.tracks && animation.layoutTracks, "Incomplete export.");
  const nodes = new Map(parameters.nodes.map((node) => [node.id, node]));
  requireValue(nodes.size === parameters.nodes.length
    && Object.keys(animation.layoutTracks).length === nodes.size, "Invalid node list.");
  for (const [id, track] of Object.entries(animation.tracks)) {
    requireValue(track.interpolation === "hold", `Unsupported interpolation: ${id}`);
    validateTrack(track.samples, count, id);
    for (const [, state] of track.samples) {
      requireValue(state && ["ok", "no_value", "error", "unsupported"].includes(state.status), `Invalid state: ${id}`);
    }
  }
  for (const template of Object.values(parameters.templates)) {
    for (const child of template.children || []) {
      requireValue(Object.hasOwn(parameters.templates, child), `Missing child template: ${child}`);
    }
  }
  for (const definition of Object.values(parameters.definitions)) {
    requireValue(nodes.has(definition.nodeId) && Object.hasOwn(parameters.templates, definition.templateId),
      "Invalid parameter definition.");
  }
  for (const layout of Object.values(parameters.layouts)) {
    requireValue(nodes.has(layout.nodeId) && layout.activeDefinitions
      && Array.isArray(layout.templateIds) && layout.templateIds.every((id) => Object.hasOwn(parameters.templates, id)),
    "Invalid layout.");
    for (const [id, definitionId] of Object.entries(layout.activeDefinitions)) {
      const definition = parameters.definitions[definitionId];
      requireValue(definition && definition.nodeId === layout.nodeId && id === `${definition.nodeId}/${definition.name}`
        && Object.hasOwn(animation.tracks, id), `Missing definition/track: ${id}`);
    }
  }
  for (const node of nodes.values()) {
    const changes = animation.layoutTracks[node.id];
    validateTrack(changes, count, node.id);
    requireValue(changes[0][0] === 0 && changes[0][1] === node.initialLayoutId, "Missing initial layout.");
    for (const [index, layoutId] of changes) {
      const layout = parameters.layouts[layoutId];
      requireValue(layout?.nodeId === node.id, "Layout belongs to another node.");
      for (const id of Object.keys(layout.activeDefinitions)) {
        requireValue(heldValue(animation.tracks[id].samples, index) !== undefined, `Missing initial state: ${id}`);
      }
    }
  }
  return { parameters, animation, nodes };
}

// Time mapping: Houdini seconds = (video seconds - videoStart) * speed + sourceStart.
// Segments allow cuts, slow motion, reverse shots and a held frame (speed: 0).
export function mapVideoTime(time, sync = {}) {
  if (!Number.isFinite(time)) return null;
  const segments = sync.segments;
  let segment = sync;
  if (segments) {
    requireValue(Array.isArray(segments), "sync.segments must be an array.");
    let previousEnd = -Infinity;
    for (const item of segments) {
      requireValue(Number.isFinite(item.videoStart) && Number.isFinite(item.videoEnd)
        && item.videoEnd > item.videoStart && item.videoStart >= previousEnd,
      "Time segments must be ordered and must not overlap.");
      previousEnd = item.videoEnd;
    }
    segment = segments.find((item) => time >= item.videoStart && time < item.videoEnd);
    if (!segment) return null;
  }
  const videoStart = segment.videoStart ?? 0;
  const sourceStart = segment.sourceStart ?? 0;
  const speed = segment.speed ?? 1;
  requireValue([videoStart, sourceStart, speed].every(Number.isFinite), "Invalid time mapping.");
  if (time < videoStart || (segment.videoEnd != null && time >= segment.videoEnd)) return null;
  return (time - videoStart) * speed + sourceStart;
}

export function sampleAtTime(bundle, time) {
  if (time == null || !Number.isFinite(time) || time < 0) return -1;
  const times = bundle.animation.sampleTimes;
  let low = 0;
  let high = times.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    // Avoid losing a frame to binary floating-point rounding at exact timestamps.
    if (times[middle] <= time + 1e-8) low = middle + 1;
    else high = middle;
  }
  return Math.max(0, low - 1);
}

export function resolveNode(bundle, selector) {
  if (selector == null) {
    requireValue(bundle.nodes.size === 1, "Specify panel.node when the export contains several nodes.");
    return bundle.parameters.nodes[0];
  }
  const candidates = bundle.parameters.nodes.filter((node) => [node.id, node.path, node.name].includes(selector));
  requireValue(candidates.length === 1, `Node selector is missing or ambiguous: ${selector}`);
  return candidates[0];
}

export function fieldsAtSample(bundle, panel, index) {
  if (index < 0) return [];
  const node = resolveNode(bundle, panel.node);
  const { parameters, animation } = bundle;
  const layoutId = heldValue(animation.layoutTracks[node.id], index);
  const active = parameters.layouts[layoutId].activeDefinitions;
  const entries = Object.entries(active).map(([id, definitionId]) => {
    const definition = parameters.definitions[definitionId];
    return { id, definition, template: parameters.templates[definition.templateId],
      state: heldValue(animation.tracks[id].samples, index) };
  });
  const requested = panel.fields?.map((field) => typeof field === "string" ? { name: field } : field);
  const fields = requested ? requested.map((options) => {
    const found = entries.find((entry) => entry.definition.name === options.name || entry.id === options.name);
    // Absent multiparm instances stay absent, even with an explicit field list.
    return found ? { ...found, options } : null;
  }).filter(Boolean) : entries.map((entry) => ({ ...entry, options: {} }));
  return fields.filter((field) => {
    if (["Button", "Label", "Separator", "FolderSet"].includes(field.template.type) && !requested) return false;
    if (!requested && field.definition.parentMultiparm) {
      const parentDef = parameters.definitions[active[field.definition.parentMultiparm]];
      if (parentDef && parameters.templates[parentDef.templateId].type === "Ramp") return false;
    }
    if (panel.showHidden !== true && field.options.showHidden !== true) {
      if (field.template.isHidden || field.state.components?.length
        && field.state.components.every((component) => component.isHidden)) return false;
    }
    return true;
  });
}

export function menuLabel(value, menu, template) {
  if (!menu || menu.status === "error") return null;
  const index = typeof value === "string" || template.menuUseToken
    ? menu.tokens.indexOf(String(value)) : Number.isInteger(value) ? value : -1;
  return menu.labels[index] ?? null;
}

export function rgbToCss(rgb, space = "srgb") {
  if (!Array.isArray(rgb) || rgb.length < 3 || !rgb.slice(0, 3).every(Number.isFinite)) return null;
  const convert = (value) => {
    const v = Math.min(1, Math.max(0, value));
    return Math.round(255 * (space === "linear" ? v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055 : v));
  };
  const alpha = Number.isFinite(rgb[3]) ? Math.min(1, Math.max(0, rgb[3])) : 1;
  return `rgb(${rgb.slice(0, 3).map(convert).join(" ")} / ${alpha})`;
}
