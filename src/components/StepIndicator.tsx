import {
  STEP_DESKTOP_TITLES,
  STEP_MOBILE_SUBTITLES,
  STEP_MOBILE_TITLES,
} from "@/lib/step-copy";

type Props = {
  current: number;
  total?: number;
  mobileSubtitle?: string;
  variant?: "default" | "article";
};

function ProgressSegments({
  current,
  total,
  stepClass,
  activeClass,
  completedClass,
}: {
  current: number;
  total: number;
  stepClass: string;
  activeClass: string;
  completedClass: string;
}) {
  return (
    <>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        let className = stepClass;
        if (step < current) className = `${stepClass} ${completedClass}`;
        else if (step === current) className = `${stepClass} ${activeClass}`;
        return <div key={i} className={className} aria-hidden />;
      })}
    </>
  );
}

export function StepIndicator({
  current,
  total = 4,
  mobileSubtitle,
  variant = "default",
}: Props) {
  const subtitle =
    mobileSubtitle ?? STEP_MOBILE_SUBTITLES[current] ?? "";
  const isArticle = variant === "article";

  if (isArticle) {
    return (
      <div
        className="article-progress"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <ProgressSegments
          current={current}
          total={total}
          stepClass="progress-step"
          activeClass="progress-step-active"
          completedClass="progress-step-completed"
        />
      </div>
    );
  }

  return (
    <>
      <div
        className="progress-desktop mb-6 hidden gap-2 md:flex"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <ProgressSegments
          current={current}
          total={total}
          stepClass="progress-step"
          activeClass="progress-step-active"
          completedClass="progress-step-completed"
        />
      </div>

      <div
        className="progress-dots md:hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <ProgressSegments
          current={current}
          total={total}
          stepClass="progress-dot"
          activeClass="progress-dot-active"
          completedClass="progress-dot-completed"
        />
      </div>

      <div className="step-header hidden md:flex">
        <h2 className="step-title">{STEP_DESKTOP_TITLES[current]}</h2>
        <div className="step-counter">
          Schritt {current} von {total}
        </div>
      </div>

      <div className="mb-5 md:hidden">
        <h2 className="step-title-mobile">{STEP_MOBILE_TITLES[current]}</h2>
        {subtitle ? (
          <p className="step-subtitle-mobile">{subtitle}</p>
        ) : null}
      </div>
    </>
  );
}
