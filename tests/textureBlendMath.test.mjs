import test from 'node:test';
import assert from 'node:assert/strict';
import { mixBaseColorPixels } from '../src/components/media/textureBlendMath.js';

test('albedo endpoints preserve exact source pixels, including alpha', () => {
  const start = Uint8Array.of(10, 20, 30, 40);
  const end = Uint8Array.of(200, 210, 220, 230);
  const output = new Uint8Array(4);
  mixBaseColorPixels(start, end, 0, output);
  assert.deepEqual(output, start);
  mixBaseColorPixels(start, end, 1, output);
  assert.deepEqual(output, end);
});

test('black/white midpoint is linear-light gray, not a dark sRGB average', () => {
  const output = new Uint8Array(4);
  mixBaseColorPixels(Uint8Array.of(0, 0, 0, 0), Uint8Array.of(255, 255, 255, 255), .5, output);
  assert.deepEqual([...output], [188, 188, 188, 128]);
});

test('blending is symmetric and does not alter source arrays', () => {
  const start = Uint8Array.of(23, 67, 219, 255);
  const end = Uint8Array.of(231, 168, 36, 255);
  const forward = new Uint8Array(4);
  const reverse = new Uint8Array(4);
  mixBaseColorPixels(start, end, .25, forward);
  mixBaseColorPixels(end, start, .75, reverse);
  assert.deepEqual(forward, reverse);
  assert.deepEqual([...start], [23, 67, 219, 255]);
  assert.deepEqual([...end], [231, 168, 36, 255]);
});
