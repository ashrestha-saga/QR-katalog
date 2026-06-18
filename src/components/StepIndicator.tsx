import {
  STEP_DESKTOP_TITLES,
  STEP_MOBILE_SUBTITLES,
  STEP_MOBILE_TITLES,
} from "@/lib/step-copy";

type Props = {
  current: number;
  total?: number;
  mobileSubtitle?: string;
};

export function StepIndicator({ current, total = 4, mobileSubtitle }: Props) {
  const subtitle =
    mobileSubtitle ?? STEP_MOBILE_SUBTITLES[current] ?? "";

  return (
    <>
      {/* Desktop progress */}
      <div
        className="progress-desktop mb-6 hidden gap-2 md:flex"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          let className = "progress-step";
          if (step < current) className = "progress-step progress-step-completed";
          else if (step === current) className = "progress-step progress-step-active";
          return <div key={i} className={className} aria-hidden />;
        })}
      </div>

      {/* Mobile progress dots */}
      <div
        className="progress-dots md:hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          let className = "progress-dot";
          if (step < current) className = "progress-dot progress-dot-completed";
          else if (step === current) className = "progress-dot progress-dot-active";
          return <div key={i} className={className} aria-hidden />;
        })}
      </div>

      {/* Desktop step header */}
      <div className="step-header hidden md:flex">
        <h2 className="step-title">{STEP_DESKTOP_TITLES[current]}</h2>
        <div className="step-counter">
          Schritt {current} von {total}
        </div>
      </div>

      {/* Mobile step header */}
      <div className="mb-5 md:hidden">
        <h2 className="step-title-mobile">{STEP_MOBILE_TITLES[current]}</h2>
        {subtitle ? (
          <p className="step-subtitle-mobile">{subtitle}</p>
        ) : null}
      </div>
    </>
  );
}
