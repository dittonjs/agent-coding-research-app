import pool from "../db/connection.js";

export async function saveSurveyResponse(participantId, surveyType, responses) {
  const result = await pool.query(
    `INSERT INTO survey_responses (participant_id, survey_type, responses)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [participantId, surveyType, JSON.stringify(responses)]
  );
  return result.rows[0];
}

export async function getSurveyResponse(participantId, surveyType) {
  const result = await pool.query(
    "SELECT * FROM survey_responses WHERE participant_id = $1 AND survey_type = $2",
    [participantId, surveyType]
  );
  return result.rows[0] || null;
}
