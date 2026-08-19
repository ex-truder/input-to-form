import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import dracoWasmWrapper from "three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?raw";
import dracoWasmUrl from "three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url";

export function createBundledDracoLoader() {
  const loader = new DRACOLoader();
  loader.setDecoderConfig({ type: "wasm" });

  // DRACOLoader normally expects fixed filenames in a public directory.
  // Routing both decoder resources through Vite keeps them local and base-path safe.
  loader._loadLibrary = async (_fileName, responseType) => {
    if (responseType === "arraybuffer") {
      const response = await fetch(dracoWasmUrl);
      if (!response.ok) throw new Error(`Draco decoder could not be loaded (${response.status}).`);
      return response.arrayBuffer();
    }

    return dracoWasmWrapper;
  };

  return loader;
}
