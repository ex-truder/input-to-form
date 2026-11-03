import test from "node:test";
import assert from "node:assert/strict";
import { createVideoClock } from "../src/components/hda/hdaVideoClock.js";

function videoFixture(frameCallbacks = true) {
  let nextId = 1;
  const callbacks = new Map();
  const events = new Map();
  const video = {
    currentTime: 0, paused: true, ended: false, seeking: false,
    addEventListener(name, fn) { events.set(name, fn); },
    removeEventListener(name) { events.delete(name); },
  };
  const scheduler = {
    requestAnimationFrame(fn) { const id = nextId++; callbacks.set(id, fn); return id; },
    cancelAnimationFrame(id) { callbacks.delete(id); },
  };
  if (frameCallbacks) {
    video.requestVideoFrameCallback = scheduler.requestAnimationFrame;
    video.cancelVideoFrameCallback = scheduler.cancelAnimationFrame;
  }
  return { video, scheduler, callbacks, events,
    event(type) { events.get(type)?.({ type }); },
    frame(time) { const [id, fn] = callbacks.entries().next().value; callbacks.delete(id); fn(0, frameCallbacks ? { mediaTime: time } : undefined); },
  };
}

test("presented video timestamps drive the clock; seeks work while paused", () => {
  const f = videoFixture();
  const clock = createVideoClock(f.video, f.scheduler);
  let notifications = 0;
  const unsubscribe = clock.subscribe(() => notifications++);
  f.video.paused = false;
  f.video.currentTime = 4.2;
  f.frame(4.1);
  assert.equal(clock.getSnapshot(), 4.1);
  f.event("timeupdate");
  assert.equal(clock.getSnapshot(), 4.1);
  f.video.paused = true;
  f.video.currentTime = 1;
  f.event("seeked");
  assert.equal(clock.getSnapshot(), 1);
  assert.equal(notifications, 2);
  unsubscribe();
  assert.equal(f.callbacks.size, 0);
  assert.equal(f.events.size, 0);
});

test("loop reset and speed changes use media position", () => {
  const f = videoFixture();
  const clock = createVideoClock(f.video, f.scheduler);
  const stop = clock.subscribe(() => {});
  f.frame(9);
  f.frame(0);
  assert.equal(clock.getSnapshot(), 0);
  f.video.currentTime = 2;
  f.video.playbackRate = 2;
  f.event("ratechange");
  assert.equal(clock.getSnapshot(), 2);
  stop();
});

test("fallback uses currentTime and cleans up when the last subscriber leaves", () => {
  const f = videoFixture(false);
  const clock = createVideoClock(f.video, f.scheduler);
  const stop = clock.subscribe(() => {});
  assert.equal(f.callbacks.size, 0);
  f.video.paused = false;
  f.event("play");
  assert.equal(f.callbacks.size, 1);
  f.video.currentTime = 3;
  f.frame(100);
  assert.equal(clock.getSnapshot(), 3);
  stop();
  assert.equal(f.events.size, 0);
  assert.equal(f.callbacks.size, 0);
  const stopAgain = clock.subscribe(() => {});
  assert.equal(clock.getSnapshot(), 3);
  stopAgain();
});

test("a detached video store is stable", () => {
  const clock = createVideoClock(null);
  const stop = clock.subscribe(() => assert.fail());
  assert.equal(clock.getSnapshot(), 0);
  stop();
});

