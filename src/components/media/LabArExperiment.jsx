import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ModelViewerElement } from "@google/model-viewer";
import { getText } from "../../i18n/config";
import { publicAsset } from "../../utils/publicAsset";
import "./labAr.css";

// The GLBs use Draco. Keep the decoder on the same host as the site.
ModelViewerElement.dracoDecoderLocation = publicAsset("/draco/");

const models = [
  { id: "knit-horse", src: "/projects/knit-horse/model.glb", name: { ru: "Вязаная лошадка", en: "Knitted horse" }, size: "13.5 MB" },
  { id: "arthritis", src: "/projects/arthritis/model.glb", name: { ru: "Позвоночник", en: "Spine" }, size: "3.7 MB" },
  { id: "medznat_mascott_foxie", src: "/lab/models/medznat_mascott_foxie.glb", iosSrc: "/lab/models/medznat_mascott_foxie.usdz", name: { ru: "Лисёнок Foxie · Medznat", en: "Foxie mascot · Medznat" }, size: "1.1 MB" },
];

const copy = {
  ru: {
    title: "Из браузера — в пространство",
    intro: "Покрутите модель в 3D или разместите её рядом с собой через камеру телефона.",
    select: "Модель", loading: "Загружаем 3D-модель…", slow: "Загрузка занимает больше времени. Проверьте соединение или повторите попытку.",
    error: "Не удалось открыть 3D-модель. Проверьте соединение и поддержку WebGL в браузере.",
    retry: "Повторить загрузку", gesture: "Вращайте перетаскиванием. Приближайте двумя пальцами или колесом мыши.",
    ar: "Разместить в AR", preparing: "Открываем AR…", available: "Наведите камеру на освещённую поверхность и следуйте подсказкам телефона.",
    unavailable: "AR недоступна в этом браузере или на этом устройстве. 3D-просмотр остаётся доступен. Попробуйте Safari на iPhone/iPad или Chrome на совместимом Android.",
    insecure: "Для AR откройте эту страницу по HTTPS на совместимом телефоне. По обычному HTTP доступен 3D-просмотр.",
    arError: "AR не запустилась. Проверьте разрешение камеры, откройте страницу в Safari на iOS или Chrome на Android и попробуйте снова. Можно продолжить просмотр в 3D.",
    handoff: "Если AR не открылась, попробуйте снова или откройте ссылку в Safari на iOS / Chrome на Android. 3D-просмотр доступен здесь.",
    tracking: "Медленно перемещайте телефон, чтобы найти поверхность.",
    phone: "Открыть на телефоне", link: "Ссылка на выбранную модель", copy: "Скопировать ссылку", copied: "Ссылка скопирована", copyError: "Не удалось скопировать. Выделите ссылку и скопируйте вручную.",
    local: "Это локальный адрес компьютера. Для телефона нужна опубликованная HTTPS-версия или HTTPS-предпросмотр с доступом по сети.",
    limits: "Android: WebXR или Scene Viewer. iPhone/iPad: Quick Look; для Foxie используется готовый USDZ, для остальных моделей он создаётся при запуске. Анимация, blend shapes и переходы материалов в нативном AR не проверены; материалы могут выглядеть иначе. Масштаб можно менять — это не измерительный инструмент.",
  },
  en: {
    title: "From browser to your space",
    intro: "Explore a model in 3D or place it beside you through your phone’s camera.",
    select: "Model", loading: "Loading the 3D model…", slow: "Loading is taking longer than usual. Check your connection or try again.",
    error: "The 3D model could not be opened. Check your connection and browser WebGL support.",
    retry: "Reload model", gesture: "Drag to rotate. Pinch or use the mouse wheel to zoom.",
    ar: "Place in AR", preparing: "Opening AR…", available: "Point the camera at a well-lit surface and follow your phone’s instructions.",
    unavailable: "AR is unavailable in this browser or on this device. You can still explore in 3D. Try Safari on iPhone/iPad or Chrome on a compatible Android phone.",
    insecure: "For AR, open this page over HTTPS on a compatible phone. 3D viewing is available over plain HTTP.",
    arError: "AR could not start. Check camera permission, open the page in Safari on iOS or Chrome on Android, and try again. You can continue in 3D.",
    handoff: "If AR did not open, try again or open the link in Safari on iOS / Chrome on Android. 3D viewing is available here.",
    tracking: "Move your phone slowly to find a surface.",
    phone: "Open on your phone", link: "Link to the selected model", copy: "Copy link", copied: "Link copied", copyError: "Could not copy. Select the link and copy it manually.",
    local: "This address is local to your computer. Your phone needs a published HTTPS version or a network-accessible HTTPS preview.",
    limits: "Android: WebXR or Scene Viewer. iPhone/iPad: Quick Look; Foxie uses the supplied USDZ, while other models generate it on launch. Animation, blend shapes and material transitions have not been verified in native AR; materials may look different. Scale is adjustable — this is not a measuring tool.",
  },
};

function ArViewer({ model, locale }) {
  const t = copy[locale];
  const ref = useRef(null);
  const [state, setState] = useState("loading");
  const [supported, setSupported] = useState(false);
  const [arState, setArState] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const viewer = ref.current;
    const onLoad = () => setState("ready");
    const onError = () => setState("error");
    const onAR = ({ detail }) => {
      if (detail.status === "failed") setArState("arError");
      if (detail.status === "session-started") setArState("available");
      if (detail.status === "not-presenting") setArState("");
    };
    const onTracking = ({ detail }) => setArState(detail.status === "not-tracking" ? "tracking" : "available");
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("ar-status", onAR);
    viewer.addEventListener("ar-tracking", onTracking);
    if (viewer.loaded) onLoad();
    // AR capability selection is asynchronous and has no dedicated change event.
    const capabilityTimer = window.setInterval(() => setSupported(viewer.canActivateAR), 1000);
    const slowTimer = window.setTimeout(() => setState(current => current === "loading" ? "slow" : current), 45000);
    return () => {
      window.clearInterval(capabilityTimer);
      window.clearTimeout(slowTimer);
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("ar-status", onAR);
      viewer.removeEventListener("ar-tracking", onTracking);
    };
  }, []);

  async function launchAR() {
    const viewer = ref.current;
    if (!viewer?.canActivateAR || !window.isSecureContext) return;
    setBusy(true);
    setArState("");
    try {
      // Call directly from the tap; Quick Look and Scene Viewer need user activation.
      await viewer.activateAR();
      setArState(current => current || "handoff");
    } catch {
      setArState("arError");
    } finally {
      setBusy(false);
    }
  }

  const ready = state === "ready";
  return (
    <>
      <div className="lab-ar__stage" aria-busy={state === "loading" || state === "slow"}>
        <model-viewer ref={ref} src={publicAsset(model.src)} alt={getText(model.name, locale)}
          ios-src={model.iosSrc ? publicAsset(model.iosSrc) : undefined}
          camera-controls touch-action="pan-y" environment-image="neutral" shadow-intensity="1"
          ar ar-modes="webxr scene-viewer quick-look" ar-placement="floor" ar-scale="auto"
          ar-usdz-max-texture-size="2048" loading="eager" reveal="auto">
          <span slot="ar-button" />
          <span slot="progress-bar" />
        </model-viewer>
        {!ready && <p className="lab-ar__load" role="status">{t[state]}</p>}
      </div>
      <div className="lab-ar__viewer-footer">
        <p className="text-sm leading-relaxed text-body">{t.gesture}</p>
        <button type="button" className="lab-ar__button" onClick={launchAR}
          disabled={!ready || !supported || !window.isSecureContext || busy}>
          {busy ? t.preparing : t.ar}
        </button>
        <p className="text-sm leading-relaxed text-body" role="status">
          {arState ? t[arState] : !window.isSecureContext ? t.insecure : supported ? t.available : t.unavailable}
        </p>
      </div>
    </>
  );
}

export default function LabArExperiment({ locale }) {
  const t = copy[locale];
  const [params, setParams] = useSearchParams();
  const model = models.find(item => item.id === params.get("model")) || models[0];
  const [attempt, setAttempt] = useState(0);
  const [copyState, setCopyState] = useState("");
  const shareUrl = new URL(window.location.href);
  shareUrl.hash = `/${locale}/lab?model=${model.id}`;
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(shareUrl.hostname);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl.href);
      setCopyState("copied");
    } catch {
      setCopyState("copyError");
    }
  }

  return (
    <section className="lab-ar mt-10 md:mt-14" aria-labelledby="lab-ar-title">
      <div className="lab-ar__heading">
        <h2 id="lab-ar-title" className="text-2xl font-bold leading-tight tracking-[-0.02em] md:text-4xl">{t.title}</h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-body">{t.intro}</p>
      </div>
      <div className="lab-ar__layout">
        <div className="min-w-0">
          <ArViewer key={`${model.id}-${attempt}`} model={model} locale={locale} />
        </div>
        <div className="lab-ar__options">
          <label htmlFor="lab-ar-model" className="font-semibold">{t.select}</label>
          <select id="lab-ar-model" value={model.id} onChange={event => {
            setParams(current => { const next = new URLSearchParams(current); next.set("model", event.target.value); return next; }, { replace: true, preventScrollReset: true });
            setCopyState("");
          }}>
            {models.map(item => <option key={item.id} value={item.id}>{getText(item.name, locale)} · {item.size}</option>)}
          </select>
          <button type="button" className="lab-ar__text-button" onClick={() => setAttempt(value => value + 1)}>{t.retry}</button>
          <div className="lab-ar__share">
            <h3 className="text-xl font-bold">{t.phone}</h3>
            <p className="mt-3 text-sm leading-relaxed text-body">{local ? t.local : t.link}</p>
            <a className="lab-ar__link" href={shareUrl.href}>{shareUrl.href}</a>
            <button type="button" className="lab-ar__secondary" onClick={copyLink}>{t.copy}</button>
            <p className="mt-2 text-sm leading-relaxed" role="status">{copyState ? t[copyState] : ""}</p>
          </div>
          <p className="text-sm leading-relaxed text-body">{t.limits}</p>
        </div>
      </div>
    </section>
  );
}
