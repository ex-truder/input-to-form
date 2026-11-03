"""Shelf entry point. Run this file with runpy.run_path(..., run_name='__main__')."""

import runpy
from pathlib import Path

import hou


def main():
    if not hou.selectedNodes():
        hou.ui.displayMessage("Select one or more nodes to export.")
        return
    output_dir = hou.ui.selectFile(
        title="Choose a folder for HDA demo JSON files",
        start_directory=hou.text.expandString("$HIP/") if hasattr(hou, "text") else hou.expandString("$HIP/"),
        file_type=hou.fileType.Directory,
    )
    if not output_dir:
        return
    button, fields = hou.ui.readMultiInput(
        "Export selected nodes. Frames are inclusive; time zero is the first frame.",
        ("Export name", "Start frame", "End frame", "Sample step"),
        initial_contents=("demo", str(hou.playbar.playbackRange()[0]),
                          str(hou.playbar.playbackRange()[1]), "1"),
        buttons=("Export", "Cancel"), default_choice=0, close_choice=1,
    )
    if button != 0:
        return
    exporter = runpy.run_path(str(Path(__file__).with_name("hda_export.py")))
    try:
        result = exporter["export_selected"](
            output_dir=output_dir, name=fields[0], start_frame=float(fields[1]),
            end_frame=float(fields[2]), sample_step=float(fields[3]),
        )
    except hou.OperationInterrupted:
        return
    except Exception as exc:
        hou.ui.displayMessage("Export failed:\n{}\n\nDetails are in the Python Shell.".format(exc))
        raise
    hou.ui.displayMessage(
        "Export complete: {}\n\n{}\n{}\n{}\n\nWarnings: {}; errors: {}".format(
            result["status"], result["parameters"], result["animation"], result["report"],
            result["summary"]["warnings"], result["summary"]["errors"],
        )
    )


if __name__ == "__main__":
    main()
