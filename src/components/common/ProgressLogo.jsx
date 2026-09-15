const VIEWBOX = "0 0 1099.83 621.39";
const PROGRESS_CIRCLES = [
  { cx: 219.52, cy: 566.09 },
  { cx: 440.83, cy: 566.09 },
  { cx: 662.14, cy: 566.09 },
  { cx: 883.44, cy: 566.09 },
];

export default function ProgressLogo({ activeStep = 0, className = "" }) {
  return (
    <svg
      viewBox={VIEWBOX}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <image href="/logo.svg" width="1099.83" height="621.39" />
      {PROGRESS_CIRCLES.map((circle, index) => {
        const active = index < activeStep;

        return (
          <circle
            key={circle.cx}
            cx={circle.cx}
            cy={circle.cy}
            r="46"
            fill="currentColor"
            className={`origin-center transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
              active ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
            style={{ transformBox: "fill-box" }}
          />
        );
      })}
    </svg>
  );
}
