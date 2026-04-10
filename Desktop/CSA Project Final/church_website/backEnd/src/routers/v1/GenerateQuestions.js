import { Router } from "express";
import logger from "../../logger/winston.js";
import axios from "axios";
import { sansitiseAndParseQuestionBlock } from "../../utils/index.js";
import Question from "../../model/question.js";

const route = Router();

route.post("/", async (req, res) => {
  const { topic, numberOfQuestions = 50 } = req.body;

  logger.debug(`Generating ${numberOfQuestions} questions on topic: ${topic}`);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates multiple-choice questions strictly about Christianity. Do not create questions about mathematics, science, or any other topics, ⚠️ IMPORTANT , outside Christian faith, scripture, theology, and church life.",
          },
          {
            role: "user",
            content: `
                       Generate ${numberOfQuestions} thoughtful and challanging spiritual discussion questions about: "${topic}".

    ⚠️ IMPORTANT: Follow this exact format for each question block:

    1. Question text (numbered, bold)
       A) Option A
       B) Option B
       C) Option C
       D) Option D
       Correct Answer: C) Option C
       Explanation: A short explanation of why this is correct.

    Example:
    1. What does the parable of the Prodigal Son teach us?
       A) God’s unconditional love
       B) Strict punishment for sin
       C) Wealth leads to happiness
       D) Family unity above all
       Correct Answer: A) God’s unconditional love
       Explanation: The parable emphasizes forgiveness and mercy, showing God’s love for repentant sinners.

    ✅ Rules:
    - Always number questions sequentially.
    - Always provide exactly 4 options (A–D).
    - Always mark the correct answer with "Correct Answer: X)".
    - Always include an "Explanation:" line.
    - Do not add extra formatting like "---" or markdown headings.
    - Keep the explanation concise (1–2 sentences).
  `,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      },
    );

    // Check if the response from Groq API contains the expected content structure.
    if (!response?.data?.choices?.[0]?.message?.content) {
      logger.error("Groq API error: No content in response");
      return res
        .status(502)
        .json({ error: "Groq API error: No content in response" });
    }

    const content = response.data.choices[0].message.content;
    const questionsArray = sansitiseAndParseQuestionBlock(content);

    const validQuestions = questionsArray.filter(
      (q) =>
        q &&
        q.questionText &&
        Array.isArray(q.answers) &&
        q.answers.length === 4 &&
        q.correctAnswer?.option &&
        q.correctAnswer?.text &&
        q.correctAnswer?.explanation,
    );
    console.log(
      "Valid questions after sanitization and validation:",
      validQuestions,
    );
    if (validQuestions.length === 0) {
      logger.error("No valid questions parsed from Groq output");
      return res
        .status(400)
        .json({ error: "No valid questions parsed from Groq output" });
    }

    try {
      const insertedDocs = await Question.insertMany(questionsArray, {
        ordered: false,
      });
      return res.status(201).json({
        message: "Questions generated and saved successfully",
        count: insertedDocs.length,
      });
    } catch (err) {
      console.error("Partial insert error:", err.message);
      logger.error("Partial insert error:", err.message);
      return res.status(500).json({ error: "Some questions failed to save" });
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      logger.error(`Groq API error ${status}:`, error.response);

      if (status === 401) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Invalid Groq API key" });
      }
      if (status === 404) {
        return res
          .status(404)
          .json({ error: "Model not found or wrong endpoint" });
      }
      if (status === 400) {
        return res
          .status(400)
          .json({ error: "Bad Request: Invalid payload or model name" });
      }
      if (status === 429) {
        return res
          .status(429)
          .json({ error: "Too Many Requests: Rate limit exceeded" });
      }
      return res.status(502).json({ error: "Groq API error" });
    } else if (error.request) {
      logger.error("Gateway Timeout: No response from Groq");
      return res
        .status(504)
        .json({ error: "Gateway Timeout: No response from Groq" });
    } else {
      logger.error("Internal server error:", error.message);
      return res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
        stack: error.stack,
      });
    }
  }
});

export default route;
