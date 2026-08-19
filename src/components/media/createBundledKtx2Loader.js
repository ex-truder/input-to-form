import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { publicAsset } from "../../utils/publicAsset";

export function createBundledKtx2Loader(renderer) {
  const loader = new KTX2Loader();
  loader.setTranscoderPath(publicAsset("/basis/"));
  loader.detectSupport(renderer);
  return loader;
}
