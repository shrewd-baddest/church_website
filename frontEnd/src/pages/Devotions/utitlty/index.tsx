import type { Question } from "../data/questions";

// utils/fileHelpers.ts
export const normalizeFiles = (files: File[] | File | null | undefined): File[] => {
  if (!files) return [];
  return Array.isArray(files) ? files : [files];
};



  // ✅ PARSER (DB TEXT → STRUCTURED)
 export const parseQuestionsFromText = (text: string): Question[] => {
    const blocks = text.split(/\n(?=\d+\.\s)/);
    return blocks.map((block, index) => {
      const lines = block.split("\n").map((l) => l.trim());
      const questionLine = lines[0].replace(/^\d+\.\s*/, "");
      const options = lines.filter((l) => /^[A-D]\)/.test(l)).map((l) => l.replace(/^[A-D]\)\s*/, ""));
      const correctLine = lines.find((l) => l.startsWith("Correct Answer:"));

      const explanationLine = lines.find((l) =>l.startsWith("Explanation:"));

      const correctLetter = correctLine?.match(/[A-D]/)?.[0] || "A";
      const correctAnswer = ["A", "B", "C", "D"].indexOf(correctLetter);

      return {
        id: index + 1,
        question: questionLine,
        options,
        correctAnswer,
        explanation:explanationLine?.replace("Explanation:", "").trim() || "",
        category: "General",
        difficulty: "Medium",
        reward: 10,
      };
    });
  };