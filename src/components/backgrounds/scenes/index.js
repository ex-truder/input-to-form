export const DEFAULT_THREE_SCENE = "flow-field";

const sceneLoaders = {
  "flow-field": () => import("./flowField"),
  "orbital-grid": () => import("./orbitalGrid"),
};

export async function loadThreeScene(sceneName = DEFAULT_THREE_SCENE) {
  const loader = sceneLoaders[sceneName];

  if (!loader) {
    console.warn(
      `Unknown Three.js background scene "${sceneName}". Falling back to "${DEFAULT_THREE_SCENE}".`,
    );
  }

  const sceneModule = await (loader || sceneLoaders[DEFAULT_THREE_SCENE])();
  return sceneModule.createScene;
}
