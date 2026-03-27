import { Routes, Route } from "react-router-dom";
import { useStudy } from "./hooks/useStudy";
import { STEPS } from "./constants/steps";
import StudyHeader from "./components/StudyHeader";
import ConsentPage from "./pages/ConsentPage";
import DemographicSurvey from "./pages/DemographicSurvey";
import PreTest from "./pages/PreTest";
import Instructions from "./pages/Instructions";
import CodingChallenge from "./pages/CodingChallenge";
import PostTest from "./pages/PostTest";
import PostSurvey from "./pages/PostSurvey";
import StudyComplete from "./pages/StudyComplete";
import Admin from "./pages/Admin";

function StudyFlow() {
  const { participant, loading } = useStudy();

  if (loading) {
    return <p>Loading...</p>;
  }

  const currentStep = participant?.currentStep || STEPS.CONSENT;

  return (
    <>
      <StudyHeader currentStep={currentStep} />
      {import.meta.env.DEV && (
        <button
          className="btn dev-reset-btn"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            localStorage.removeItem("study_code");
            localStorage.removeItem("study_language");
            localStorage.removeItem("study_timer_start");
            window.location.reload();
          }}
        >
          Dev: Reset Session
        </button>
      )}
      <main className="container">
        {currentStep === STEPS.CONSENT && <ConsentPage />}
        {currentStep === STEPS.DEMOGRAPHICS && <DemographicSurvey />}
        {currentStep === STEPS.PRE_TEST && <PreTest />}
        {currentStep === STEPS.INSTRUCTIONS && <Instructions />}
        {currentStep === STEPS.CODING_CHALLENGE && <CodingChallenge />}
        {currentStep === STEPS.POST_TEST && <PostTest />}
        {currentStep === STEPS.POST_SURVEY && <PostSurvey />}
        {currentStep >= STEPS.COMPLETE && <StudyComplete />}
      </main>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<StudyFlow />} />
    </Routes>
  );
}

export default App;
