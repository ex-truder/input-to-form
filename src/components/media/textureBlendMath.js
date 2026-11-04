const linear = Float32Array.from({ length: 256 }, (_, index) => {
  const value = index / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
});
const srgb = Uint8Array.from({ length: 4096 }, (_, index) => {
  const value = index / 4095;
  return Math.round(255 * (value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055));
});

// Blend albedo in linear light, as the existing PBR shader does. Normal/ORM
// maps contain data and must never pass through this color conversion.
export function mixBaseColorPixels(from, to, amount, output) {
  const blend = Math.max(0, Math.min(1, amount));
  if (blend === 0) { output.set(from); return; }
  if (blend === 1) { output.set(to); return; }
  for (let index = 0; index < from.length; index += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const start = linear[from[index + channel]];
      const end = linear[to[index + channel]];
      output[index + channel] = srgb[Math.round((start + (end - start) * blend) * 4095)];
    }
    output[index + 3] = Math.round(from[index + 3] + (to[index + 3] - from[index + 3]) * blend);
  }
}
