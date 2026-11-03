import { useId } from "react";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";
import { fieldsAtSample, menuLabel, resolveNode, rgbToCss } from "./hdaPlayback";

function formatValue(value, precision, locale) {
  if (typeof value === "number") {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: precision }).format(value);
  }
  if (value?.$number) return value.$number;
  if (Array.isArray(value)) return value.map((part) => formatValue(part, precision, locale)).join(" / ");
  return value == null ? "—" : String(value);
}

function RampValue({ ramp, colorSpace, locale }) {
  const id = useId();
  const positions = ramp.profile?.positions ?? ramp.positions ?? [];
  const values = ramp.profile?.values ?? ramp.values ?? [];
  if (Array.isArray(values[0])) {
    const stops = values.map((value, i) => {
      const color = rgbToCss(value, colorSpace);
      return color && Number.isFinite(positions[i]) ? `${color} ${positions[i] * 100}%` : null;
    }).filter(Boolean);
    return <div className="hda-gradient" role="img" aria-label={locale === "ru" ? "Цветовая рампа" : "Color ramp"}
      style={{ backgroundImage: stops.length ? `linear-gradient(90deg, ${stops.join(", ")})` : undefined }} />;
  }
  const points = positions.map((x, i) => [x, values[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (!points.length) return <span>—</span>;
  const min = Math.min(0, ...points.map(([, y]) => y));
  const max = Math.max(1, ...points.map(([, y]) => y));
  const xCoord = (x) => 6 + Math.max(0, Math.min(1, x)) * 288;
  const yCoord = (y) => 78 - (y - min) / (max - min) * 68;
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${xCoord(x)},${yCoord(y)}`).join(" ");
  const area = `${path} L${xCoord(points[points.length - 1][0])},80 L${xCoord(points[0][0])},80 Z`;
  return (
    <div className="hda-ramp">
      <svg viewBox="0 0 300 88" role="img" aria-label={locale === "ru" ? "Числовая рампа" : "Float ramp"}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity="0.22" /><stop offset="1" stopColor="currentColor" stopOpacity="0.015" /></linearGradient></defs>
        {[6, 78, 150, 222, 294].map((x) => <path key={x} d={`M${x} 6V80`} className="hda-ramp-grid" />)}
        {[12, 46, 80].map((y) => <path key={y} d={`M6 ${y}H294`} className="hda-ramp-grid" />)}
        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeDasharray={ramp.profile ? undefined : "3 3"} />
        {(ramp.positions || []).map((x, i) => Number.isFinite(ramp.values?.[i])
          ? <circle key={i} cx={xCoord(x)} cy={yCoord(ramp.values[i])} r="3" fill="currentColor" /> : null)}
      </svg>
      {!ramp.profile && <span className="hda-ramp-note">{locale === "ru" ? "Точки рампы" : "Ramp control points"}</span>}
    </div>
  );
}

function FieldValue({ field, panel, locale }) {
  const { state, template, options } = field;
  if (state.status !== "ok") {
    return <span className="hda-unavailable" title={state.reason}>
      {state.status === "no_value" ? "—" : locale === "ru" ? "Нет данных" : "Unavailable"}
    </span>;
  }
  const value = state.value;
  const precision = Math.max(0, Math.min(12, options.precision ?? panel.precision ?? 2));
  const view = options.view ?? "auto";
  if (template.type === "Toggle") {
    return <span className={`hda-value-checkbox ${value ? "is-checked" : ""}`} role="checkbox"
      aria-checked={Boolean(value)} aria-readonly="true"
      aria-label={getText(options.label, locale) || template.label || field.definition.name}>
      {value && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7" /></svg>}
    </span>;
  }
  if (view === "text") return <span className="hda-text-value">{formatValue(value, precision, locale)}</span>;
  if (value?.kind === "ramp") return <RampValue ramp={value} colorSpace={options.colorSpace ?? panel.colorSpace} locale={locale} />;
  const color = view === "color" || view === "auto" && ["ColorSquare", "HueCircle"].includes(template.look);
  if (color) {
    const cssColor = rgbToCss(value, options.colorSpace ?? panel.colorSpace);
    return <span className="hda-color-value"><span className="hda-color-chip" style={{ backgroundColor: cssColor ?? "transparent" }} aria-hidden="true" />
      <span>{formatValue(value, precision, locale)}</span></span>;
  }
  const label = menuLabel(value, state.menu, template);
  if (label !== null) return <span className="hda-text-value">{label}</span>;
  if (view === "bar" && typeof value === "number" && Number.isFinite(value)) {
    const min = options.min ?? template.minValue ?? 0;
    const max = options.max ?? template.maxValue ?? 1;
    const progress = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
    return <span className="hda-bar-value"><span>{formatValue(value, precision, locale)}{options.unit && ` ${options.unit}`}</span>
      <span className="hda-bar-track" aria-hidden="true"><span style={{ width: `${progress * 100}%` }} /></span></span>;
  }
  return <span className={typeof value === "string" ? "hda-text-value" : "hda-number-value"}>
    {formatValue(value, template.type === "Int" ? 0 : precision, locale)}{options.unit && ` ${options.unit}`}
  </span>;
}

export default function HdaParameterPanel({ bundle, panel, sampleIndex }) {
  const locale = useLocale();
  const node = resolveNode(bundle, panel.node);
  const fields = fieldsAtSample(bundle, panel, sampleIndex);
  const title = getText(panel.title, locale) || node.name;
  const style = { "--hda-accent": panel.accent ?? "#ff6633",
    "--hda-row-height": `${Number.isFinite(panel.rowHeight) ? Math.max(24, Math.min(120, panel.rowHeight)) : 44}px`,
    ...(panel.placement === "below" ? { width: panel.width ?? 320, maxWidth: "100%" } : {}), ...panel.style };
  return (
    <section className={`hda-panel hda-theme-${panel.theme === "light" ? "light" : "dark"} hda-variant-${panel.variant === "cards" ? "cards" : "table"}`}
      style={style} aria-label={title}>
      <div className="hda-panel-heading"><span className="hda-status-dot" aria-hidden="true" /><h3>{title}</h3>
        {panel.showFrame !== false && sampleIndex >= 0 && <span className="hda-frame-label">F {bundle.animation.sampleFrames[sampleIndex]}</span>}
      </div>
      {getText(panel.subtitle, locale) && <p className="hda-panel-subtitle">{getText(panel.subtitle, locale)}</p>}
      <dl className="hda-fields">
        {fields.map((field) => {
          const disabled = field.state.components?.length > 0 && field.state.components.every((part) => part.isDisabled);
          return <div className={`hda-field ${field.state.value?.kind === "ramp" ? "hda-field-ramp" : ""} ${disabled ? "is-disabled" : ""}`}
            key={field.id} data-parameter={field.definition.name}>
            <dt>{getText(field.options.label, locale) || field.template.label || field.definition.name}</dt>
            <dd key={JSON.stringify(field.state.value)}><FieldValue field={field} panel={panel} locale={locale} /></dd>
          </div>;
        })}
      </dl>
      {!fields.length && <p className="hda-panel-empty">{locale === "ru" ? "Нет отображаемых параметров" : "No visible parameters"}</p>}
    </section>
  );
}
