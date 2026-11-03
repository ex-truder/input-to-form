"""Contract/error-path tests using a small fake HOM; no Houdini installation needed.

These tests do not establish real HOM compatibility. Run hda_export.self_test()
inside Houdini for that check.
"""

import copy
import json
import math
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import hda_export as exporter


class Interrupted(Exception):
    pass


class Template:
    def __init__(self, name, kind="Float", children=()):
        self._name, self.kind, self.children = name, kind, children

    def name(self):
        return self._name

    def label(self):
        return "Параметр " + self._name

    def type(self):
        return "parmTemplateType." + self.kind

    def parmTemplates(self):
        return self.children

    def asCode(self):
        return "# archival template " + self._name


class Ramp:
    def keys(self):
        return (0.0, 1.0)

    def values(self):
        return (0.0, 2.0)

    def basis(self):
        return ("rampBasis.Linear",) * 2

    def lookup(self, x):
        return x * 2


class Parm:
    def __init__(self, owner, tuple_, name, function):
        self.owner, self._tuple, self._name, self.function = owner, tuple_, name, function

    def name(self):
        return self._name

    def path(self):
        return self.owner.path() + "/" + self._name

    def tuple(self):
        return self._tuple

    def eval(self):
        return self.function(self.owner.hom.frame())

    def evalAsString(self):
        return str(self.eval())

    def evalAsRamp(self):
        return self.eval()

    def keyframes(self):
        return ()

    def rawValue(self):
        return "$F"  # Raw source must not replace the evaluated value.

    def isHidden(self):
        return self.owner.hom.frame() >= 3

    def isDisabled(self):
        return False

    def isLocked(self):
        return False

    def containingFolders(self):
        return ("Настройки",)

    def parentMultiParm(self):
        if self._name == "item1":
            return self.owner.by_name["items"][0]
        return None

    def multiParmInstanceIndices(self):
        return (0,) if self._name == "item1" else ()

    def isMultiParmParent(self):
        return self._name == "items"

    def multiParmStartOffset(self):
        return 1

    def menuItems(self):
        return ("first", "second")

    def menuLabels(self):
        return ("Первый", "Второй " + str(int(self.owner.hom.frame())))


class ParmTuple:
    def __init__(self, owner, name, kind, functions):
        self._name = name
        self.template = Template(name, kind)
        self.parms = [Parm(owner, self, name if len(functions) == 1 else name + str(i), f)
                      for i, f in enumerate(functions)]

    def name(self):
        return self._name

    def parmTemplate(self):
        return self.template

    def __len__(self):
        return len(self.parms)

    def __iter__(self):
        return iter(self.parms)

    def __getitem__(self, index):
        return self.parms[index]


class Node:
    def __init__(self, hom, path="/obj/asset"):
        self.hom, self._path = hom, path
        specs = [
            ("amount", "Float", [lambda f: f * f]),
            ("constant", "Int", [lambda f: 7]),
            ("enabled", "Toggle", [lambda f: f >= 2]),
            ("text", "String", [lambda f: "Кадр " + str(int(f))]),
            ("vector", "Float", [lambda f: 1.0, lambda f: 2.0, lambda f: 3.0]),
            ("mode", "Menu", [lambda f: 0]),
            ("profile", "Ramp", [lambda f: Ramp()]),
            ("items", "Folder", [lambda f: int(f == 2)]),
            ("item1", "Float", [lambda f: 9.0]),
            ("button", "Button", [lambda f: (_ for _ in ()).throw(AssertionError("Button was evaluated!"))]),
        ]
        self.by_name = {name: ParmTuple(self, name, kind, funcs) for name, kind, funcs in specs}

    def path(self):
        return self._path

    def name(self):
        return self._path.rsplit("/", 1)[-1]

    def type(self):
        return self

    def category(self):
        return self

    def description(self):
        return "Fake asset"

    def updateParmStates(self):
        pass

    def parmTuples(self):
        return [p for name, p in self.by_name.items() if name != "item1" or self.hom.frame() == 2]

    def parmTemplateGroup(self):
        return self

    def entries(self):
        # The template always exists; only its concrete multiparm instance changes.
        return (Template("settings", "Folder", tuple(p.template for p in self.by_name.values())),)


class FakeHOM:
    OperationInterrupted = Interrupted

    def __init__(self):
        self.current = 19.5
        self.nodes = [Node(self)]
        self.playbar = self

    def frame(self):
        return self.current

    def setFrame(self, frame):
        self.current = frame

    def fps(self):
        return 24

    def selectedNodes(self):
        return self.nodes

    def node(self, path):
        return next((n for n in self.nodes if n.path() == path), None)

    def expandString(self, value):
        return value

    def applicationVersionString(self):
        return "fake-HOM"

    def playbackRange(self):
        return (1, 3)


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix=".test-", dir=str(Path(__file__).parent))
        self.addCleanup(self.temp.cleanup)
        self.hom = FakeHOM()
        self.hou_patch = patch.object(exporter, "hou", self.hom)
        self.hou_patch.start()
        self.addCleanup(self.hou_patch.stop)
        self.addCleanup(patch.stopall)

    def export(self, **kwargs):
        defaults = dict(output_dir=self.temp.name, start_frame=1, end_frame=3, progress=False)
        defaults.update(kwargs)
        with patch("builtins.print"):
            result = exporter.export_nodes(**defaults)
        docs = [json.loads(Path(result[key]).read_text(encoding="utf-8"))
                for key in ("parameters", "animation", "report")]
        return result, docs

    def test_full_export_decode_and_restore(self):
        result, (params, anim, report) = self.export()
        self.assertEqual(self.hom.frame(), 19.5)
        self.assertEqual(result["status"], "ok")
        self.assertEqual(report["issues"], [])
        self.assertTrue(exporter.validate_bundle(params, anim))
        node_id = params["nodes"][0]["id"]
        for index in range(3):
            states = exporter.state_at_sample(params, anim, index)[node_id]
            self.assertEqual(states[node_id + "/amount"]["value"], (index + 1) ** 2)
            self.assertEqual(states[node_id + "/text"]["value"], "Кадр " + str(index + 1))
            self.assertIs(states[node_id + "/enabled"]["value"], index >= 1)
            self.assertEqual(states[node_id + "/vector"]["value"], [1.0, 2.0, 3.0])
            self.assertEqual(states[node_id + "/button"]["status"], "no_value")
            self.assertEqual(states[node_id + "/mode"]["menu"]["labels"][1], "Второй " + str(index + 1))
            self.assertEqual(node_id + "/item1" in states, index == 1)
        # One value plus a visibility change, rather than one sample per frame.
        self.assertEqual(len(anim["tracks"][node_id + "/constant"]["samples"]), 2)
        self.assertEqual(anim["sampleTimes"], [0.0, 1 / 24, 2 / 24])
        source = next(d for d in params["definitions"].values() if d["name"] == "amount")["sourceChannels"]
        self.assertEqual(source[0]["rawValue"], "$F")

    def test_no_profiles_or_archival_template_source(self):
        _, (params, anim, _) = self.export(ramp_resolution=0, include_source=False)
        self.assertTrue(all("houdiniPythonSource" not in t for t in params["templates"].values()))
        ramp = next(track for name, track in anim["tracks"].items() if name.endswith("/profile"))
        self.assertNotIn("profile", ramp["samples"][0][1]["value"])

    def test_parameter_failure_is_explicit_and_aggregated(self):
        def fail(frame):
            raise RuntimeError("Missing dependency")
        self.hom.nodes[0].by_name["amount"][0].function = fail
        _, (params, anim, report) = self.export()
        self.assertEqual(report["status"], "partial")
        issue = report["issues"][0]
        self.assertEqual((issue["code"], issue["occurrences"], issue["firstFrame"], issue["lastFrame"]),
                         ("evaluation_failed", 3, 1.0, 3.0))
        node_id = params["nodes"][0]["id"]
        self.assertEqual(exporter.state_at_sample(params, anim, 1)[node_id][node_id + "/amount"]["status"], "error")
        self.assertEqual(self.hom.frame(), 19.5)

    def test_unknown_data_is_not_silently_stringified(self):
        node = self.hom.nodes[0]
        node.by_name["data"] = ParmTuple(node, "data", "Data", [lambda f: object()])
        _, (_, anim, report) = self.export()
        track = next(v for k, v in anim["tracks"].items() if k.endswith("/data"))
        self.assertEqual(track["samples"][0][1]["status"], "unsupported")
        self.assertEqual(report["summary"]["warnings"], 1)

    def test_cancel_restores_frame_and_writes_nothing(self):
        def cancel(frame):
            raise Interrupted("Esc")
        self.hom.nodes[0].by_name["amount"][0].function = cancel
        with self.assertRaises(Interrupted):
            self.export()
        self.assertEqual(self.hom.frame(), 19.5)
        self.assertEqual(list(Path(self.temp.name).iterdir()), [])

    def test_fatal_node_failure_restores_frame(self):
        def fail():
            raise RuntimeError("Node was deleted")
        self.hom.nodes[0].parmTuples = fail
        with self.assertRaisesRegex(RuntimeError, "Node was deleted"):
            self.export()
        self.assertEqual(self.hom.frame(), 19.5)
        self.assertEqual(list(Path(self.temp.name).iterdir()), [])

    def test_existing_export_untouched_unless_explicit_overwrite(self):
        result, _ = self.export()
        previous = Path(result["parameters"]).read_bytes()
        with self.assertRaises(FileExistsError):
            self.export()
        self.assertEqual(Path(result["parameters"]).read_bytes(), previous)
        self.assertEqual(self.hom.frame(), 19.5)
        updated, _ = self.export(overwrite=True)
        self.assertNotEqual(Path(updated["parameters"]).read_bytes(), previous)

    def test_mixed_exports_rejected(self):
        _, (params, anim, _) = self.export()
        wrong = copy.deepcopy(anim)
        wrong["exportId"] = "other"
        with self.assertRaises(ValueError):
            exporter.validate_bundle(params, wrong)

    def test_missing_track_rejected(self):
        _, (params, anim, _) = self.export()
        del anim["tracks"][next(iter(anim["tracks"]))]
        with self.assertRaises(ValueError):
            exporter.validate_bundle(params, anim)

    def test_out_of_order_samples_rejected(self):
        _, (params, anim, _) = self.export()
        track = next(iter(anim["tracks"].values()))
        track["samples"] = [track["samples"][1], track["samples"][0]]
        with self.assertRaises(ValueError):
            exporter.validate_bundle(params, anim)

    def test_multinode_and_selection_order(self):
        self.hom.nodes.append(Node(self.hom, "/obj/other"))
        _, (params, _, _) = self.export()
        self.hom.nodes.reverse()
        _, (again, _, _) = self.export(name="again")
        self.assertEqual([n["id"] for n in params["nodes"]], [n["id"] for n in again["nodes"]])

    def test_nonfinite_values_are_strict_json(self):
        self.hom.nodes[0].by_name["amount"][0].function = lambda f: math.nan
        _, (_, anim, _) = self.export()
        track = next(v for k, v in anim["tracks"].items() if k.endswith("/amount"))
        self.assertEqual(track["samples"][0][1]["value"], {"$number": "NaN"})
        json.dumps(anim, allow_nan=False)

    def test_invalid_inputs_do_not_move_frame_or_write_files(self):
        for args in (dict(sample_step=0), dict(start_frame=4, end_frame=1),
                     dict(ramp_resolution=1), dict(name="../escape"), dict(name="CON"),
                     dict(nodes=["/missing"]), dict(nodes=[])):
            with self.subTest(args=args), self.assertRaises(ValueError):
                self.export(**args)
        self.assertEqual(self.hom.frame(), 19.5)
        self.assertEqual(list(Path(self.temp.name).iterdir()), [])


class FrameTests(unittest.TestCase):
    def test_decimal_steps_and_non_aligned_end(self):
        self.assertEqual(exporter.sample_frames(1, 1.3, 0.1), [1.0, 1.1, 1.2, 1.3])
        self.assertEqual(exporter.sample_frames(1, 2, 0.4), [1.0, 1.4, 1.8, 2.0])
        self.assertEqual(exporter.sample_frames(-1, 1), [-1.0, 0.0, 1.0])
        self.assertEqual(exporter.sample_frames(5, 5), [5.0])

    def test_reject_nonfinite_and_excessive_ranges(self):
        for args in ((1, float("inf"), 1), (1, 2, float("nan")), (0, 1000000, 0.01)):
            with self.subTest(args=args), self.assertRaises(ValueError):
                exporter.sample_frames(*args)


if __name__ == "__main__":
    unittest.main()
