
import logger from "../logger/winston.js"

export const parseQuestionBlock = (block) => {
  const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

  // First line must look like "1. **Question...**"
  let questionText = lines[0]?.replace(/^\d+\.\s*/, "");
  questionText = questionText?.replace(/^\*+|\*+$/g, ""); // strip **

  if (!questionText || !/^\d+\./.test(lines[0])) return null;

  // Next 4 lines = options (A) or A.)
  const answers = lines.slice(1, 5).map(line => {
    const match = line.match(/^([A-Da-d])[\.\)]\s*(.*)$/);
    if (!match) return null;
    return { option: `${match[1].toLowerCase()})`, text: match[2] };
  }).filter(Boolean);

  if (answers.length !== 4) return null;

  // Find correct answer line
  const answerLine = lines.find(l => /correct answer:/i.test(l));
  if (!answerLine) return null;

  const match = answerLine.match(/correct answer:\s*([A-Da-d])[\.\)]?\s*(.*)?/i);
  if (!match) return null;

  const correctOption = `${match[1].toLowerCase()})`;

  // Explanation line may be separate
  const explanationLine = lines.find(l => /explanation:/i.test(l));
  const explanation = explanationLine
    ? explanationLine.replace(/^\*?Explanation:\*?\s*/i, "")
    : "No explanation provided";

  const correctAnswerText = answers.find(a => a.option === correctOption)?.text || match[2] || "";

  return {
    questionText,
    answers,
    correctAnswer: {
      option: correctOption,
      text: correctAnswerText,
      explanation
    }
  };
};


export const sansitiseAndParseQuestionBlock = (content)=>{

   const array =  content.split(/(?:\n\s*\n|---)/) // split on blank lines OR ---
          .map((block, i) => {
            const parsed = parseQuestionBlock(block);
            if (!parsed) {
              logger.warn(`Skipping malformed block #${i}:`, block);
              return null;
            }
            return { ...parsed, createdAt: new Date() };
          })
          .filter(Boolean);

          return array
}

