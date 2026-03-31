import pool from "../db/connection.js";
import crypto from "crypto";
import { createUser, createSession } from "./users.js";
import { getActiveStudy } from "./studies.js";

export async function createAnonymousParticipant() {
  const uuid = crypto.randomUUID();
  const username = `p_${uuid.slice(0, 8)}`;
  const email = `${username}@study.local`;
  const password = crypto.randomUUID();

  const user = await createUser(username, email, password);
  const sessionId = await createSession(user.id);

  const groupAssignment = Math.random() < 0.5 ? "control" : "test";

  const activeStudy = await getActiveStudy();

  const result = await pool.query(
    `INSERT INTO participants (user_id, group_assignment, consent_accepted, consent_timestamp, current_step, study_id)
     VALUES ($1, $2, TRUE, NOW(), 2, $3)
     RETURNING *`,
    [user.id, groupAssignment, activeStudy?.id || null]
  );

  return { participant: result.rows[0], user, sessionId };
}

export async function findParticipantByUserId(userId) {
  const result = await pool.query(
    "SELECT * FROM participants WHERE user_id = $1",
    [userId]
  );
  return result.rows[0] || null;
}

export async function updateDemographics(participantId, data) {
  const result = await pool.query(
    `UPDATE participants
     SET age_range = $1, gender = $2, cs_year = $3,
         prior_ai_usage = $4, ethnicity = $5, current_step = 3
     WHERE id = $6
     RETURNING *`,
    [
      data.ageRange,
      data.gender,
      data.csYear,
      data.priorAiUsage,
      data.ethnicity,
      participantId,
    ]
  );
  return result.rows[0];
}

export async function updateGroupAssignment(participantId, group) {
  const result = await pool.query(
    "UPDATE participants SET group_assignment = $1 WHERE id = $2 RETURNING *",
    [group, participantId]
  );
  return result.rows[0];
}

export async function updateStep(participantId, step) {
  const result = await pool.query(
    "UPDATE participants SET current_step = $1 WHERE id = $2 RETURNING *",
    [step, participantId]
  );
  return result.rows[0];
}
