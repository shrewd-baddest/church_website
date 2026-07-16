import { testDb as db } from "../Configs/dbConfig.js";

const Question = {
  insertMany: async (questions) => {
    const inserted = [];
    for (const q of questions) {
      const { rows } = await db.query(
        `INSERT INTO questions (question_text, answers, correct_answer)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          q.questionText,
          JSON.stringify(q.answers),
          JSON.stringify(q.correctAnswer),
        ],
      );
      inserted.push({ id: rows[0].id, ...q });
    }
    return inserted;
  },

  aggregateRandom: async (limit) => {
    const { rows } = await db.query(
      `SELECT id, question_text, answers, correct_answer, created_at
       FROM questions
       ORDER BY RANDOM()
       LIMIT $1`,
      [limit],
    );
    return rows.map((r) => ({
      _id: r.id,
      questionText: r.question_text,
      answers: r.answers,
      correctAnswer: r.correct_answer,
      createdAt: r.created_at,
    }));
  },
};

export default Question;
