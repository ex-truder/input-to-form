// Imported only in Vite development. Private local exports never enter the build.
import { useEffect, useMemo, useState } from "react";
import HdaDemo from "../components/hda/HdaDemo";
import { fieldsAtSample, prepareHdaBundle } from "../components/hda/hdaPlayback";
import { useLocale } from "../i18n/useLocale";
import "./hdaPreview.css";

const localParameters = import.meta.glob("/houdini-exports.local/*.parameters.json", { query: "?url", import: "default" });
const localAnimations = import.meta.glob("/houdini-exports.local/*.animation.json", { query: "?url", import: "default" });

function defaultFields(bundle, node) {
  const fields = fieldsAtSample(bundle, { node: node.id, showHidden: true }, 0);
  const animated = fields.filter((field) => {
    const samples = bundle.animation.tracks[field.id].samples;
    return samples.some(([, state]) => JSON.stringify(state.value) !== JSON.stringify(samples[0][1].value));
  });
  const ramp = fields.find((field) => field.template.type === "Ramp");
  const selected = [...animated.slice(0, 9), ...(ramp ? [ramp] : [])];
  return [...new Set((selected.length ? selected : fields.slice(0, 8)).map((field) => field.definition.name))];
}

function PreviewWorkspace({ bundle, name }) {
  const locale = useLocale();
  const ru = locale === "ru";
  const [nodeId, setNodeId] = useState(bundle.parameters.nodes[0].id);
  const node = bundle.nodes.get(nodeId);
  const [fields, setFields] = useState(() => defaultFields(bundle, node));
  const [theme, setTheme] = useState("dark");
  const [variant, setVariant] = useState("table");
  const [rowHeight, setRowHeight] = useState(44);
  const [placement, setPlacement] = useState("right");
  const [anchor, setAnchor] = useState("top-right");
  const [accent, setAccent] = useState("#ff6633");
  const [width, setWidth] = useState(340);
  const [showHidden, setShowHidden] = useState(true);
  const [colorSpace, setColorSpace] = useState("srgb");
  const [video, setVideo] = useState(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [offset, setOffset] = useState(0);
  const [copied, setCopied] = useState(false);
  const lastTime = bundle.animation.sampleTimes.at(-1);
  const duration = lastTime + 1 / bundle.animation.timeline.fps;
  const allFields = useMemo(() => {
    const seen = new Map();
    // Include instances first appearing later in the timeline, too.
    for (const definition of Object.values(bundle.parameters.definitions)) {
      if (definition.nodeId !== nodeId || seen.has(definition.name)) continue;
      const template = bundle.parameters.templates[definition.templateId];
      if (["Button", "Label", "Separator", "FolderSet"].includes(template.type)) continue;
      const parent = Object.values(bundle.parameters.definitions).find((item) => `${item.nodeId}/${item.name}` === definition.parentMultiparm);
      if (parent && bundle.parameters.templates[parent.templateId].type === "Ramp") continue;
      seen.set(definition.name, { name: definition.name, label: template.label || definition.name });
    }
    return [...seen.values()];
  }, [bundle, nodeId]);

  useEffect(() => {
    if (!playing || video) return undefined;
    let previous = performance.now();
    let handle;
    const tick = (now) => {
      const elapsed = Math.max(0, (now - previous) / 1000);
      previous = now;
      setTime((value) => (value + elapsed) % duration);
      handle = requestAnimationFrame(tick);
    };
    handle = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(handle);
  }, [playing, video, duration]);

  useEffect(() => () => { if (video) URL.revokeObjectURL(video.src); }, [video]);

  const panel = { node: node.path, title: node.name, fields, theme, variant, placement, anchor,
    width, accent, showHidden, colorSpace, ...(variant === "table" ? { rowHeight } : {}) };
  const configuration = { type: "hdaDemo", parameters: `/projects/my-case/${name}.parameters.json`,
    animation: `/projects/my-case/${name}.animation.json`,
    video: { src: "/projects/my-case/demo.mp4", controls: true, loop: true },
    sync: { videoStart: offset, sourceStart: 0, speed: 1 }, panels: [panel] };

  function chooseNode(id) {
    setNodeId(id);
    setFields(defaultFields(bundle, bundle.nodes.get(id)));
  }

  return (
    <>
      <div className="hda-preview-summary">
        <div><strong>{node.name}</strong><span>{bundle.animation.timeline.sampleCount} {ru ? "кадров" : "samples"} · {bundle.animation.timeline.fps} FPS · {duration.toFixed(2)} s</span></div>
        <label className="hda-preview-button"><span>{video ? ru ? "Заменить видео" : "Replace video" : ru ? "Выбрать видео" : "Choose video"}</span>
          <input type="file" accept="video/*" onChange={(event) => {
            const file = event.target.files[0];
            if (file) { setPlaying(false); setVideo({ src: URL.createObjectURL(file), name: file.name, controls: true, loop: true }); }
            event.target.value = "";
          }} /></label>
      </div>
      <HdaDemo bundle={bundle} video={video} time={time} sync={video ? configuration.sync : undefined} panels={[panel]} showTime
        emptyMedia={<div className="hda-preview-empty"><span className="hda-preview-empty-mark">HDA</span>
          <strong>{ru ? "Предпросмотр параметров" : "Parameter preview"}</strong>
          <p>{ru ? "Запусти шкалу ниже или выбери видео демонстрации." : "Play the timeline below or choose your demo video."}</p>
          <span>{node.type}</span></div>} />
      {!video && <div className="hda-preview-transport">
        <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={ru ? playing ? "Пауза" : "Воспроизвести" : playing ? "Pause" : "Play"}>
          {playing ? "Ⅱ" : "▶"}</button>
        <input type="range" min="0" max={lastTime} step={1 / bundle.animation.timeline.fps} value={Math.min(time, lastTime)}
          aria-label={ru ? "Время анимации" : "Animation time"} onChange={(event) => setTime(Number(event.target.value))} />
        <span>{time.toFixed(2)} / {duration.toFixed(2)} s</span>
      </div>}
      {video && <p className="hda-preview-note">{video.name} · {ru ? "Панель следует времени видео, включая паузу и перемотку." : "The panel follows video playback, pause and seeking."}
        <button type="button" onClick={() => setVideo(null)}>{ru ? "Убрать видео" : "Remove video"}</button></p>}

      <div className="hda-preview-settings">
        <div className="hda-preview-setting-heading"><span>01</span><h2>{ru ? "Отображение" : "Appearance"}</h2></div>
        <div className="hda-preview-options">
          <label>{ru ? "Нода" : "Node"}<select value={nodeId} onChange={(event) => chooseNode(event.target.value)}>
            {bundle.parameters.nodes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>{ru ? "Расположение" : "Placement"}<select value={placement} onChange={(event) => setPlacement(event.target.value)}>
            <option value="right">{ru ? "Справа" : "Right"}</option><option value="left">{ru ? "Слева" : "Left"}</option>
            <option value="overlay">{ru ? "Поверх видео" : "Overlay"}</option><option value="below">{ru ? "Под видео" : "Below"}</option></select></label>
          <label>{ru ? "Оформление" : "Theme"}<select value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="dark">{ru ? "Тёмное" : "Dark"}</option><option value="light">{ru ? "Светлое" : "Light"}</option></select></label>
          <label>{ru ? "Вид" : "Layout"}<select value={variant} onChange={(event) => setVariant(event.target.value)}>
            <option value="table">{ru ? "Таблица" : "Table"}</option><option value="cards">{ru ? "Карточки" : "Cards"}</option></select></label>
          {variant === "table" && <label>{ru ? "Высота строки, px" : "Row height, px"}<input type="number" min="24" max="120" value={rowHeight}
            onChange={(event) => setRowHeight(Math.max(24, Math.min(120, Number(event.target.value) || 44)))} /></label>}
          <label>{ru ? "Акцент" : "Accent"}<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} /></label>
          <label>{ru ? "Ширина, px" : "Width, px"}<input type="number" min="220" max="640" value={width} onChange={(event) => setWidth(Math.max(220, Math.min(640, Number(event.target.value) || 340)))} /></label>
          {placement === "overlay" && <label>{ru ? "Угол" : "Anchor"}<select value={anchor} onChange={(event) => setAnchor(event.target.value)}>
            <option value="top-right">{ru ? "Справа сверху" : "Top right"}</option><option value="top-left">{ru ? "Слева сверху" : "Top left"}</option>
            <option value="bottom-right">{ru ? "Справа снизу" : "Bottom right"}</option><option value="bottom-left">{ru ? "Слева снизу" : "Bottom left"}</option></select></label>}
          <label>{ru ? "Значения RGB" : "RGB values"}<select value={colorSpace} onChange={(event) => setColorSpace(event.target.value)}>
            <option value="srgb">sRGB</option><option value="linear">Linear → sRGB</option></select></label>
          {video && <label>{ru ? "Начало в видео, s" : "Video start, s"}<input type="number" step="0.01" value={offset} onChange={(event) => setOffset(Number(event.target.value) || 0)} /></label>}
        </div>
        <label className="hda-preview-checkbox"><input type="checkbox" checked={!showHidden} onChange={(event) => setShowHidden(!event.target.checked)} />
          {ru ? "Учитывать скрытие полей в Houdini" : "Respect Houdini hidden states"}</label>
      </div>
      <details className="hda-preview-settings">
        <summary className="hda-preview-setting-heading"><span>02</span><h2>{ru ? "Параметры" : "Parameters"}</h2><small>{fields.length} / {allFields.length}</small></summary>
        <div className="hda-preview-field-picker">{allFields.map((field) => <label className="hda-preview-checkbox" key={field.name}>
          <input type="checkbox" checked={fields.includes(field.name)} onChange={(event) => setFields((current) => event.target.checked
            ? [...current, field.name] : current.filter((name) => name !== field.name))} /><span>{field.label}<small>{field.name}</small></span>
        </label>)}</div>
      </details>
      <details className="hda-preview-settings">
        <summary className="hda-preview-setting-heading"><span>03</span><h2>{ru ? "Подключение в кейс" : "Use in a case"}</h2></summary>
        <p className="hda-preview-note">{ru ? "Помести JSON и видео в public/projects/my-case/. Добавь этот блок в blocks нужного проекта в src/data/projects.js." : "Put the JSON files and video in public/projects/my-case/. Add this block to the project’s blocks in src/data/projects.js."}</p>
        <pre className="hda-preview-code"><code>{JSON.stringify(configuration, null, 2)}</code></pre>
        <button type="button" className="hda-preview-button" onClick={async () => {
          try { await navigator.clipboard.writeText(JSON.stringify(configuration, null, 2)); setCopied(true); }
          catch { setCopied(false); }
        }}>{copied ? ru ? "Скопировано" : "Copied" : ru ? "Копировать блок" : "Copy block"}</button>
      </details>
    </>
  );
}

export default function HdaPreviewPage() {
  const locale = useLocale();
  const ru = locale === "ru";
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    const path = Object.keys(localParameters).sort().find((name) => localAnimations[name.replace(".parameters.json", ".animation.json")]);
    if (!path) return undefined;
    const load = async (getUrl) => {
      const url = await getUrl();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };
    Promise.all([load(localParameters[path]), load(localAnimations[path.replace(".parameters.json", ".animation.json")])])
      .then(([parameters, animation]) => {
        const bundle = prepareHdaBundle(parameters, animation);
        if (active) setLoaded((current) => current ?? { bundle, name: path.split("/").at(-1).replace(".parameters.json", "") });
      }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  async function chooseJson(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (!files.length) return;
    setLoading(true);
    setError("");
    try {
      const documents = await Promise.all(files.map(async (file) => ({ file, data: JSON.parse(await file.text()) })));
      const parameters = documents.find((item) => item.data.format === "hda-demo.parameters");
      const animation = documents.find((item) => item.data.format === "hda-demo.animation");
      if (!parameters || !animation) throw new Error(ru ? "Выбери оба файла: parameters.json и animation.json." : "Choose both parameters.json and animation.json.");
      setLoaded({ bundle: prepareHdaBundle(parameters.data, animation.data), name: parameters.file.name.replace(".parameters.json", "") });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <section className="hda-preview-page mx-auto max-w-[1600px] px-5 py-12 md:px-8 md:py-16">
      <div className="hda-preview-intro"><div><p className="hda-preview-eyebrow">HOUDINI → WEB / {ru ? "ЛОКАЛЬНЫЙ ПРОСМОТР" : "LOCAL PREVIEW"}</p>
        <h1>{ru ? "Предпросмотр HDA" : "HDA preview"}</h1><p>{ru ? "Проверь анимацию, настрой панель и подключи её к видео." : "Check the animation, style the panel and connect your video."}</p></div>
        <label className="hda-preview-button"><span>{loading ? ru ? "Загрузка…" : "Loading…" : ru ? "Выбрать JSON" : "Choose JSON"}</span>
          <input type="file" multiple accept=".json,application/json" disabled={loading} onChange={chooseJson} /></label></div>
      {error && <p className="hda-preview-error" role="alert">{error}</p>}
      {loaded ? <PreviewWorkspace key={loaded.bundle.parameters.exportId} {...loaded} />
        : <div className="hda-load-state">{ru ? "Выбери одновременно файлы parameters.json и animation.json. Экспорты из houdini-exports.local подхватываются автоматически." : "Choose parameters.json and animation.json together. Exports in houdini-exports.local load automatically."}</div>}
    </section>
  );
}
