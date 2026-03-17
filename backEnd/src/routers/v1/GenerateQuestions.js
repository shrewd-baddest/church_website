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
    // call the api.groq.com to generate preferef content based on suggested prompt
    // topic , no of question and examples of output to closs the gap for halucination
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
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`, //Groq API key , the key which authenticates us to the gloq and esure we can freely bi-directionally communicate with the model
        },
      },
    );

    // Check if the response from Groq API contains the expected content structure. If not,
    //  log an error and return a 502 Bad Gateway response to indicate that there was an issue with the upstream Groq API.

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
c0onsole.log("Valid questions after sanitization and validation:", validQuestions);
    if (validQuestions.length === 0) {
      logger.error("No valid questions parsed from Groq output");
      return res
        .status(400)
        .json({ error: "No valid questions parsed from Groq output" });
    }

    // if there is at least 1 valid question after sanitising and validating through our custom filter and
    //  modification function we insert them to the database and return the success message with the count of the inserted question

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
    // Check if the error is an HTTP error from the Groq API
    // This can happen if the API returns a non-2xx status code, such as 400 Bad Request, 401 Unauthorized, 404 Not Found, or 429 Too Many Requests.
    if (error.response) {
      const status = error.response.status;
      logger.error(`Groq API error ${status}:`, error.response);

      if (status === 401) {
        logger.error(`Groq API error ${status}:`, error.response);
        return res
          .status(401)
          .json({ error: "Unauthorized: Invalid Groq API key" });
      }
      if (status === 404) {
        logger.error(`Groq API error ${status}:`, error.response);
        return res
          .status(404)
          .json({ error: "Model not found or wrong endpoint" });
      }
      if (status === 400) {
        logger.error(`Groq API error ${status}:`, error.response);
        return res
          .status(400)
          .json({ error: "Bad Request: Invalid payload or model name" });
      }
      if (status === 429) {
        logger.error(`Groq API error ${status}:`, error.response);
        return res
          .status(429)
          .json({ error: "Too Many Requests: Rate limit exceeded" });
      }
      logger.error(`Groq API error ${status}:`, error.response);
      return res.status(502).json({ error: "Groq API error" });

      // Check if the error is a network error (no response received)
      // This can happen if the Groq API is down, there are connectivity issues, or the request times out.
      //  We log this as a gateway timeout error and return a 504 status code to indicate that our server did not receive a timely response from the upstream Groq API.
    } else if (error.request) {
      logger.error("Gateway Timeout: No response from Groq");
      return res
        .status(504)
        .json({ error: "Gateway Timeout: No response from Groq" });
      // Other types of errors (e.g., coding errors, unexpected issues)
    } else {
      if (error.name === "ValidationError") {
        logger.error("Mongo validation error:", err.message);
        return res
          .status(400)
          .json({ error: "Invalid question schema", details: err.message });
      }
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
