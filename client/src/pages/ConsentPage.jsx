import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStudy } from "../hooks/useStudy";

export default function ConsentPage() {
  const { setParticipant } = useStudy();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [studyActive, setStudyActive] = useState(null); // null = loading

  useEffect(() => {
    fetch("/api/study/active-check")
      .then((res) => res.json())
      .then((data) => setStudyActive(data.active))
      .catch(() => setStudyActive(false));
  }, []);

  async function handleAccept() {
    setSubmitting(true);
    setError("");

    const g = searchParams.get("g");
    const forceGroup = g === "control" || g === "test" ? g : undefined;

    try {
      const res = await fetch("/api/study/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentAccepted: true, forceGroup }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }

      setParticipant(data.participant);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (studyActive === null) return <p>Loading...</p>;

  if (!studyActive) {
    return (
      <div className="consent-page">
        <h2>Study Not Available</h2>
        <p>There is no active study running at this time. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="consent-page">
      <h2>Letter of Information</h2>
      <div className="consent-document">
        <h3>Constrained Agentic Programming</h3>

        <p>
          You are invited to participate in a research study being conducted by
          Dr. John Edwards, an Associate Professor in the Computer Science
          Department at Utah State University.
        </p>

        <p>
          <strong>The purpose of this research is to</strong> understand how
          students interact with constrained-based agentic AI tools during
          programming tasks and
          how these interactions impact learning and performance. This study
          examines differences in student behavior and outcomes when using
          constrained agentic AI compared to traditional programming without AI
          assistance. You are being asked to participate in this research
          because you are an adult enrolled in a computer science course at USU.
        </p>

        <p>
          Your participation in this study is voluntary and you may withdraw
          your participation at any time for any reason by closing the browser.
        </p>

        <p>
          If you take part in this study, you will complete all study activities
          on a web-based platform (
          <a
            href="https://usu-coding-research-b26e03958e21.herokuapp.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://usu-coding-research-b26e03958e21.herokuapp.com/
          </a>
          ) developed by the research team.
        </p>

        <p>
          At first, you will agree to this informed consent presented in the
          webpage and confirm you are 18 years of age or older. Then, you will
          begin with a survey that asks a few demographic questions as well as a
          pre-test, which is designed to assess your baseline understanding of
          the coding task.
        </p>

        <p>
          After completing the pre-test, you will be randomly assigned to one of
          two groups. One group will complete a programming task using a{" "}
          <strong>constrained agentic AI</strong> system. This system will not
          provide a complete
          solution to the problem. Instead, you will need to interact with the
          AI step by step, asking questions and receiving incremental guidance
          as you work through the problem. The other group will complete the
          same programming task writing exact code to solve the task. The
          programming task will involve implementing an algorithm and will be
          completed in an online code editor. A visualization of the algorithm
          will also be displayed in both cases to support your understanding.
          The system will record your keystrokes and the time you spend
          completing each part of the task. If you are assigned to the AI
          condition, your interactions with the constrained agentic AI (e.g.,
          prompts and responses) will also be recorded. This program will also
          record your interaction with play, replay, and randomize along with
          their corresponding timestamps in the visualization section.
        </p>

        <p>
          After completing the programming task, you will complete a post-test
          to assess your understanding after the task. You will then be asked to
          complete a short survey about your experience. The entire study will
          take approximately around 20 minutes.
        </p>

        <p>
          <strong>The possible risks of participating in this study</strong>{" "}
          includes loss of confidentiality. We cannot guarantee that you will
          benefit from this
          study, but it has been designed to learn more about learning gains
          while using constrained agentic AI.
        </p>

        <p>
          <strong>
            We will make every effort to ensure that the information you provide
            remains confidential.
          </strong>{" "}
          To ensure this, we will not be collecting any
          personally identifying information for this study. We will not reveal
          your identity in any publications, presentations, or reports resulting
          from this research study.
        </p>

        <p>
          <strong>We will collect your information through</strong> a web based
          program that collects your responses and reports the time on task on
          pre-test,
          coding task, and post-test. It will also collect your keystroke logs
          while interacting with the programming task. This program will store
          the interaction with play, replay, and randomized button along with
          their corresponding timestamp. Data will be securely stored in a
          restricted-access, encrypted cloud-based storage system (Box.com)
          recommended by Utah State University. This research will not collect
          identifiable data and will be anonymous. This anonymous data will be
          kept indefinitely and may be used or shared for future research
          without further consent from you.
        </p>

        <p>
          You can decline to participate in any part of this study for any
          reason and can end your participation at any time.
        </p>

        <p>
          If you have any questions about this study, you can contact Dr. John
          Edwards (
          <a href="mailto:john.edwards@usu.edu">john.edwards@usu.edu</a>). Thank
          you again for your time and consideration. If you have any concerns
          about this study, please contact Utah State University's Human
          Research Protection Office at (435) 797-0567 or{" "}
          <a href="mailto:irb@usu.edu">irb@usu.edu</a>.
        </p>

        <p>
          <strong>
            By continuing to the survey you agree that you are 18 years of age
            or older, and wish to participate.
          </strong>{" "}
          You agree that you understand the risks and benefits of participation,
          and that you know what you are being asked to do. You also agree that
          if you have contacted the research team with any questions about your
          participation, and are clear on how to stop your participation in this
          study if you choose to do so. Please be sure to retain a copy of this
          form for your records.
        </p>
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        className="btn btn-primary"
        onClick={handleAccept}
        disabled={submitting}
      >
        {submitting ? "Starting..." : "I Agree — Begin Study"}
      </button>
    </div>
  );
}
