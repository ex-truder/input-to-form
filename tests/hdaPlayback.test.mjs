import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareHdaBundle, fieldsAtSample, sampleAtTime, mapVideoTime, menuLabel, rgbToCss } from "../src/components/hda/hdaPlayback.js";

function fixture() {
  const timeline = { fps: 24, startFrame: 1001, endFrame: 1004, sampleStep: 1, sampleCount: 4, lastSampleTime: 3 / 24, timeOrigin: "first_sample" };
  const state = (value) => ({ status: "ok", value, components: [{ isHidden: false }] });
  const templates = { number: { type: "Float", label: "Amount" }, ramp: { type: "Ramp" } };
  const definitions = {
    amount: { nodeId: "n", name: "amount", templateId: "number" },
    child: { nodeId: "n", name: "item1", templateId: "number" },
    ramp: { nodeId: "n", name: "ramp", templateId: "ramp" },
    rampChild: { nodeId: "n", name: "ramp1value", templateId: "number", parentMultiparm: "n/ramp" },
  };
  const base = { "n/amount": "amount", "n/ramp": "ramp", "n/ramp1value": "rampChild" };
  const parameters = { format: "hda-demo.parameters", version: 1, exportId: "e", timeline, templates, definitions,
    nodes: [{ id: "n", path: "/obj/test", name: "test", initialLayoutId: "base" }], layouts: {
      base: { nodeId: "n", templateIds: ["number", "ramp"], activeDefinitions: base },
      expanded: { nodeId: "n", templateIds: ["number", "ramp"], activeDefinitions: { ...base, "n/item1": "child" } },
    } };
  const animation = { format: "hda-demo.animation", version: 1, exportId: "e", timeline,
    sampleFrames: [1001, 1002, 1003, 1004], sampleTimes: [0, 1 / 24, 2 / 24, 3 / 24],
    layoutTracks: { n: [[0, "base"], [1, "expanded"], [2, "base"], [3, "expanded"]] },
    tracks: {
      "n/amount": { interpolation: "hold", samples: [[0, state(1)], [2, state(8)]] },
      "n/ramp": { interpolation: "hold", samples: [[0, state({ kind: "ramp", positions: [0, 1], values: [0, 1] })]] },
      "n/ramp1value": { interpolation: "hold", samples: [[0, state(0)]] },
      "n/item1": { interpolation: "hold", samples: [[1, state(3)], [3, state(9)]] },
    } };
  return { parameters, animation };
}

test("sparse values support forward playback, reverse seeks and end holds", () => {
  const { parameters, animation } = fixture();
  const bundle = prepareHdaBundle(parameters, animation);
  const panel = { node: "/obj/test", fields: ["amount"] };
  assert.equal(sampleAtTime(bundle, -0.1), -1);
  assert.equal(sampleAtTime(bundle, null), -1);
  for (const [time, expected] of [[0, 1], [0.09, 8], [50, 8], [0.01, 1], [2 / 24 - 1e-12, 8]]) {
    assert.equal(fieldsAtSample(bundle, panel, sampleAtTime(bundle, time))[0].state.value, expected);
  }
});

test("multiparm removal/reappearance is governed by layouts, including explicit lists", () => {
  const { parameters, animation } = fixture();
  const bundle = prepareHdaBundle(parameters, animation);
  const panel = { node: "n", fields: ["item1"] };
  assert.deepEqual(fieldsAtSample(bundle, panel, 0), []);
  assert.equal(fieldsAtSample(bundle, panel, 1)[0].state.value, 3);
  assert.deepEqual(fieldsAtSample(bundle, panel, 2), []);
  assert.equal(fieldsAtSample(bundle, panel, 3)[0].state.value, 9);
  assert.equal(fieldsAtSample(bundle, panel, 1)[0].state.value, 3);
});

test("automatic fields omit ramp internals, and visibility can be overridden", () => {
  const { parameters, animation } = fixture();
  animation.tracks["n/amount"].samples[0][1].components[0].isHidden = true;
  const bundle = prepareHdaBundle(parameters, animation);
  assert.deepEqual(fieldsAtSample(bundle, {}, 0).map((f) => f.definition.name), ["ramp"]);
  assert.deepEqual(fieldsAtSample(bundle, { fields: ["amount"], showHidden: true }, 0).map((f) => f.definition.name), ["amount"]);
});

test("node names must be unambiguous", () => {
  const { parameters, animation } = fixture();
  const bundle = prepareHdaBundle(parameters, animation);
  assert.throws(() => fieldsAtSample(bundle, { node: "missing" }, 0), /missing or ambiguous/);
});

test("reject mixed files, unsupported versions, invalid ordering and missing references", () => {
  const changes = [
    (p, a) => { a.exportId = "wrong"; },
    (p) => { p.version = 999; },
    (p, a) => { a.sampleTimes[2] = 0; },
    (p, a) => { a.tracks["n/amount"].samples.reverse(); },
    (p, a) => { delete a.tracks["n/item1"]; },
    (p) => { p.definitions.child.templateId = "missing"; },
    (p, a) => { a.tracks["n/amount"].interpolation = "linear"; },
    (p, a) => { a.layoutTracks.n[0][0] = 1; },
  ];
  for (const mutate of changes) {
    const { parameters, animation } = fixture();
    mutate(parameters, animation);
    assert.throws(() => prepareHdaBundle(parameters, animation));
  }
});

test("time offset and cuts use video time and never depend on wall-clock time", () => {
  assert.equal(mapVideoTime(1, { videoStart: 2 }), null);
  assert.equal(mapVideoTime(2, { videoStart: 2 }), 0);
  assert.equal(mapVideoTime(3, { videoStart: 2, speed: 2, sourceStart: 4 }), 6);
  const segments = [{ videoStart: 0, videoEnd: 2, sourceStart: 5, speed: 0.5 },
    { videoStart: 3, videoEnd: 5, sourceStart: 10, speed: -1 }];
  assert.equal(mapVideoTime(1, { segments }), 5.5);
  assert.equal(mapVideoTime(2.5, { segments }), null);
  assert.equal(mapVideoTime(4, { segments }), 9);
  assert.equal(mapVideoTime(5, { segments }), null);
  assert.equal(mapVideoTime(0, { speed: 0, sourceStart: 3 }), 3);
  assert.throws(() => mapVideoTime(1, { segments: [segments[1], segments[0]] }), /ordered/);
});

test("menu indexes and numeric/string tokens are different encodings", () => {
  const menu = { tokens: ["10", "20"], labels: ["First", "Second"] };
  assert.equal(menuLabel(1, menu, {}), "Second");
  assert.equal(menuLabel(20, menu, { menuUseToken: true }), "Second");
  assert.equal(menuLabel("10", menu, {}), "First");
  assert.equal(menuLabel(50, menu, {}), null);
});

test("color conversion is explicit and clamps visual samples only", () => {
  const rgb = [0.5, -1, 2, 0.4];
  assert.equal(rgbToCss(rgb), "rgb(128 0 255 / 0.4)");
  assert.equal(rgbToCss(rgb, "linear"), "rgb(188 0 255 / 0.4)");
  assert.deepEqual(rgb, [0.5, -1, 2, 0.4]);
  assert.equal(rgbToCss([null, 0, 1]), null);
});

const localParameters = new URL("../houdini-exports.local/buildingHDAdemo.parameters.json", import.meta.url);
const localAnimation = new URL("../houdini-exports.local/buildingHDAdemo.animation.json", import.meta.url);
test("real building export matches the Python reference decoder at all 300 samples", {
  skip: !existsSync(localParameters) || !existsSync(localAnimation),
}, () => {
  const parameters = JSON.parse(readFileSync(localParameters, "utf8"));
  const animation = JSON.parse(readFileSync(localAnimation, "utf8"));
  const bundle = prepareHdaBundle(parameters, animation);
  const python = spawnSync("python", ["-c", [
    "import json, runpy, sys",
    "from pathlib import Path",
    "m=runpy.run_path('tools/houdini/hda_export.py')",
    "p=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))",
    "a=json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))",
    "print(json.dumps([m['state_at_sample'](p,a,i) for i in range(len(a['sampleFrames']))],ensure_ascii=True))",
  ].join("; "), fileURLToPath(localParameters), fileURLToPath(localAnimation)],
  { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(python.status, 0, python.stderr);
  const expected = JSON.parse(python.stdout);
  for (let index = 0; index < animation.sampleTimes.length; index += 1) {
    assert.equal(sampleAtTime(bundle, animation.sampleTimes[index]), index);
    for (const node of parameters.nodes) {
      const layout = parameters.layouts[animation.layoutTracks[node.id].filter(([i]) => i <= index).at(-1)[1]];
      const fields = Object.keys(layout.activeDefinitions);
      const actual = fieldsAtSample(bundle, { node: node.id, fields, showHidden: true }, index);
      assert.deepEqual(Object.fromEntries(actual.map((field) => [field.id, field.state])), expected[index][node.id]);
    }
  }
});
