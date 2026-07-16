import type { Question } from "../data/questions";

// utils/fileHelpers.ts
export const normalizeFiles = (files: File[] | File | null | undefined): File[] => {
  if (!files) return [];
  return Array.isArray(files) ? files : [files];
};



// Maps MongoDB question objects from the API to the frontend Question format
export const mapDbQuestions = (dbQuestions: any[]): Question[] => {
  return dbQuestions.map((q, index) => {
    const options = q.answers?.map((a: any) => a.text) || [];
    const correctOption = q.correctAnswer?.option?.replace(")", "").trim().toLowerCase();
    const correctIndex = q.answers?.findIndex(
      (a: any) => a.option?.replace(")", "").trim().toLowerCase() === correctOption
    );
    return {
      id: q._id || (index + 1),
      question: q.questionText || "",
      options,
      correctAnswer: correctIndex >= 0 ? correctIndex : 0,
      category: "General",
      difficulty: "Medium" as const,
      reward: 10,
      explanation: q.correctAnswer?.explanation || "",
    };
  });
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