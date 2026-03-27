import { STEPS, STEP_LABELS } from "../constants/steps";

const visibleSteps = [
  STEPS.CONSENT,
  STEPS.DEMOGRAPHICS,
  STEPS.PRE_TEST,
  STEPS.CODING_CHALLENGE,
  STEPS.POST_TEST,
  STEPS.POST_SURVEY,
];

export default function StudyHeader({ currentStep }) {
  return (
    <header className="study-header">
      <h1 className="study-title">Coding Research Study</h1>
      <div className="progress-bar">
        {visibleSteps.map((step) => (
          <div
            key={step}
            className={`progress-step ${
              step === currentStep
                ? "progress-step-active"
                : step < currentStep
                ? "progress-step-done"
                : ""
            }`}
          >
            <div className="progress-dot" />
            <span className="progress-label">{STEP_LABELS[step]}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
