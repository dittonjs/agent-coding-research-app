import express from "express";
import {
  createAnonymousParticipant,
  findParticipantByUserId,
  updateDemographics,
  updateGroupAssignment,
  updateStep,
} from "../models/participants.js";
import { saveTestResult } from "../models/testResults.js";
import { saveCodeSubmission } from "../models/codeSubmissions.js";
import { saveSurveyResponse } from "../models/surveyResponses.js";
import { saveChatMessage, getChatHistory, getChatMessageCount } from "../models/chatMessages.js";
import { invokeAgent } from "../agent/codingAgent.js";
import { checkCode } from "../agent/codeChecker.js";
import { saveCodeCheck } from "../models/codeChecks.js";
import { saveLanguageChange } from "../models/languageChanges.js";
import { saveEditorEvents } from "../models/editorEvents.js";
import { saveInteractionEvents } from "../models/interactionEvents.js";
import { getActiveStudy, getStudyById } from "../models/studies.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Helper: load participant from req.user and validate current step
async function loadParticipant(req, res, expectedStep) {
  const participant = await findParticipantByUserId(req.user.id);
  if (!participant) {
    res.status(404).json({ error: "Participant not found." });
    return null;
  }
  if (participant.current_step !== expectedStep) {
    res.status(400).json({
      error: `Expected step ${expectedStep}, but participant is on step ${participant.current_step}.`,
    });
    return null;
  }
  return participant;
}

// GET /api/study/active-check
router.get("/active-check", async (req, res) => {
  try {
    const study = await getActiveStudy();
    res.json({ active: !!study });
  } catch {
    res.json({ active: false });
  }
});

// POST /api/study/begin
// Accept consent, create anonymous user + participant, set session cookie
router.post("/begin", async (req, res) => {
  const { consentAccepted } = req.body;

  if (!consentAccepted) {
    return res
      .status(400)
      .json({ error: "You must accept the consent to participate." });
  }

  try {
    const activeStudy = await getActiveStudy();
    if (!activeStudy) {
      return res.status(403).json({ error: "No active study is currently running. Please check back later." });
    }

    const { participant, user, sessionId } = await createAnonymousParticipant();

    res.cookie("session_id", sessionId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.status(201).json({
      participant: {
        id: participant.id,
        groupAssignment: participant.group_assignment,
        currentStep: participant.current_step,
      },
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("Study begin error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/demographics
router.post("/demographics", requireAuth, async (req, res) => {
  try {
    const participant = await loadParticipant(req, res, 2);
    if (!participant) return;

    const { ageRange, gender, csYear, priorAiUsage, ethnicity, devGroupOverride } =
      req.body;

    if (devGroupOverride && (devGroupOverride === "control" || devGroupOverride === "test")) {
      await updateGroupAssignment(participant.id, devGroupOverride);
    }

    const updated = await updateDemographics(participant.id, {
      ageRange,
      gender,
      csYear,
      priorAiUsage,
      ethnicity,
    });

    res.json({
      participant: {
        id: updated.id,
        groupAssignment: updated.group_assignment,
        currentStep: updated.current_step,
      },
    });
  } catch (err) {
    console.error("Demographics error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/pre-test
router.post("/pre-test", requireAuth, async (req, res) => {
  try {
    const participant = await loadParticipant(req, res, 3);
    if (!participant) return;

    const { results: testData } = req.body;

    const testResult = await saveTestResult(
      participant.id,
      "pre",
      testData || {}
    );

    const updated = await updateStep(participant.id, 4);

    res.json({
      testResult,
      participant: {
        id: updated.id,
        groupAssignment: updated.group_assignment,
        currentStep: updated.current_step,
      },
    });
  } catch (err) {
    console.error("Pre-test error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/instructions
router.post("/instructions", requireAuth, async (req, res) => {
  try {
    const participant = await loadParticipant(req, res, 4);
    if (!participant) return;

    const updated = await updateStep(participant.id, 5);

    res.json({
      participant: {
        id: updated.id,
        groupAssignment: updated.group_assignment,
        currentStep: updated.current_step,
      },
    });
  } catch (err) {
    console.error("Instructions error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/code-submission
router.post("/code-submission", requireAuth, async (req, res) => {
  try {
    const participant = await loadParticipant(req, res, 5);
    if (!participant) return;

    const { code, durationMs } = req.body;

    const submission = await saveCodeSubmission(
      participant.id,
      code || "",
      durationMs
    );

    const updated = await updateStep(participant.id, 6);

    res.json({
      submission,
      participant: {
        id: updated.id,
        groupAssignment: updated.group_assignment,
        currentStep: updated.current_step,
      },
    });
  } catch (err) {
    console.error("Code submission error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/post-test
router.post("/post-test", requireAuth, async (req, res) => {
  try {
    const participant = await loadParticipant(req, res, 6);
    if (!participant) return;

    const { results: testData } = req.body;

    const testResult = await saveTestResult(
      participant.id,
      "post",
      testData || {}
    );

    const updated = await updateStep(participant.id, 7);

    res.json({
      testResult,
      participant: {
        id: updated.id,
        groupAssignment: updated.group_assignment,
        currentStep: updated.current_step,
      },
    });
  } catch (err) {
    console.error("Post-test error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/post-survey
router.post("/post-survey", requireAuth, async (req, res) => {
  try {
    const participant = await loadParticipant(req, res, 7);
    if (!participant) return;

    const { responses } = req.body;

    await saveSurveyResponse(participant.id, "post", responses || {});

    const updated = await updateStep(participant.id, 8);

    res.json({
      message: "Study complete. Thank you for participating!",
      participant: {
        id: updated.id,
        groupAssignment: updated.group_assignment,
        currentStep: updated.current_step,
      },
    });
  } catch (err) {
    console.error("Post-survey error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/agent
router.post("/agent", requireAuth, async (req, res) => {
  try {
    const participant = await findParticipantByUserId(req.user.id);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found." });
    }

    if (participant.current_step !== 5) {
      return res.status(400).json({ error: "Agent only available during coding challenge." });
    }

    if (participant.group_assignment !== "test") {
      return res.status(403).json({ error: "Agent not available for control group." });
    }

    const messageCount = await getChatMessageCount(participant.id);
    if (messageCount >= 50) {
      return res.status(429).json({ error: "Maximum message limit reached." });
    }

    const { prompt, code, selection, language } = req.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    if (prompt.length > 500) {
      return res.status(400).json({ error: "Prompt too long (max 500 characters)." });
    }

    // Save user message
    await saveChatMessage(participant.id, "user", prompt.trim(), code, selection);

    // Get chat history for context
    const history = await getChatHistory(participant.id);
    const chatHistory = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Invoke agent
    const result = await invokeAgent({
      currentCode: code || "",
      language: language || "javascript",
      userPrompt: prompt.trim(),
      selection: selection || null,
      chatHistory,
    });

    // Save assistant response
    await saveChatMessage(participant.id, "assistant", result.message, result.code, null);

    res.json({
      code: result.code,
      message: result.message,
    });
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({ error: "Agent error. Please try again." });
  }
});

// GET /api/study/chat-history
router.get("/chat-history", requireAuth, async (req, res) => {
  try {
    const participant = await findParticipantByUserId(req.user.id);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found." });
    }

    const history = await getChatHistory(participant.id);
    res.json({
      messages: history.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
    });
  } catch (err) {
    console.error("Chat history error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/language-change
router.post("/language-change", requireAuth, async (req, res) => {
  try {
    const participant = await findParticipantByUserId(req.user.id);
    if (!participant || participant.current_step !== 5) {
      return res.status(400).json({ error: "Not on coding challenge step." });
    }

    const { fromLanguage, toLanguage, codeSnapshot } = req.body;

    await saveLanguageChange(participant.id, fromLanguage, toLanguage, codeSnapshot);

    res.json({ ok: true });
  } catch (err) {
    console.error("Language change error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/check-code
router.post("/check-code", requireAuth, async (req, res) => {
  try {
    const participant = await findParticipantByUserId(req.user.id);
    if (!participant || participant.current_step !== 5) {
      return res.status(400).json({ error: "Check only available during coding challenge." });
    }

    const { code, language } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required." });
    }

    const lang = language || "javascript";
    const result = await checkCode(code, lang);

    await saveCodeCheck(participant.id, code, lang, result.correct, result.message);

    res.json({
      correct: result.correct,
      message: result.correct
        ? "Your implementation is correct!"
        : "Your implementation is not quite right. Keep trying!",
    });
  } catch (err) {
    console.error("Check code error:", err);
    res.status(500).json({ error: "Unable to check code. Please try again." });
  }
});

// GET /api/study/progress
// Returns participant info if session exists, or null
router.get("/progress", async (req, res) => {
  if (!req.user) {
    return res.json({ participant: null });
  }

  try {
    const participant = await findParticipantByUserId(req.user.id);
    if (!participant) {
      return res.json({ participant: null });
    }

    let studyConfig = {};
    if (participant.study_id) {
      const study = await getStudyById(participant.study_id);
      if (study) {
        studyConfig = { timerEnabled: study.timer_enabled };
      }
    }

    res.json({
      participant: {
        id: participant.id,
        groupAssignment: participant.group_assignment,
        currentStep: participant.current_step,
        ...studyConfig,
      },
    });
  } catch (err) {
    console.error("Progress error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/editor-events
// Batch-save editor change events for playback
router.post("/editor-events", requireAuth, async (req, res) => {
  try {
    const participant = await findParticipantByUserId(req.user.id);
    if (!participant) {
      return res.status(404).json({ error: "No participant found." });
    }

    const { events, batchSeq } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "No events provided." });
    }

    await saveEditorEvents(participant.id, events, batchSeq || 0);
    res.json({ saved: events.length });
  } catch (err) {
    console.error("Editor events error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// POST /api/study/interaction-events
// Batch-save interaction events (clicks, keystrokes, etc.)
// Works with or without auth — uses participant_id if available, always uses sessionId
router.post("/interaction-events", async (req, res) => {
  try {
    const { events, batchSeq, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required." });
    }

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "No events provided." });
    }

    let participantId = null;
    if (req.user) {
      const participant = await findParticipantByUserId(req.user.id);
      if (participant) participantId = participant.id;
    }

    await saveInteractionEvents(participantId, sessionId, events, batchSeq || 0);
    res.json({ saved: events.length });
  } catch (err) {
    console.error("Interaction events error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
