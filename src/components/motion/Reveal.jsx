import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  as: Component = "div",
  variant = "fade-up",
  delay = 0,
  className = "",
  threshold = 0.16,
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Component
      ref={elementRef}
      className={`reveal reveal-${variant} ${isVisible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {variant === "mask-up" ? <div className="reveal-inner">{children}</div> : children}
    </Component>
  );
}
