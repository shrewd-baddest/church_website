export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward: number;
  explanation: string;
}


export const questionsDatabase: Question[] = [
  {
    id: 1,
    question: "What color vestments does a priest wear during Ordinary Time?",
    options: ["Red", "Green", "Purple", "White"],
    correctAnswer: 1,
    category: "Liturgy",
    difficulty: "Easy",
    reward: 10,
    explanation: "Green vestments are worn during Ordinary Time, symbolizing hope and growth in faith."
  },
  {
    id: 2,
    question: "How many Joyful Mysteries are there in the Rosary?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 2,
    category: "Rosary",
    difficulty: "Easy",
    reward: 10,
    explanation: "There are 5 Joyful Mysteries: The Annunciation, The Visitation, The Nativity, The Presentation, and The Finding of Jesus in the Temple."
  },
  {
    id: 3,
    question: "In what year was the Second Vatican Council concluded?",
    options: ["1962", "1965", "1970", "1975"],
    correctAnswer: 1,
    category: "Church History",
    difficulty: "Medium",
    reward: 15,
    explanation: "The Second Vatican Council was concluded in 1965, opening the doors of the Church to the modern world."
  },
  {
    id: 4,
    question: "Which book of the Bible contains the Ten Commandments?",
    options: ["Deuteronomy", "Leviticus", "Genesis", "Numbers"],
    correctAnswer: 0,
    category: "Scripture",
    difficulty: "Easy",
    reward: 10,
    explanation: "The Ten Commandments are found in Exodus 20 and repeated in Deuteronomy 5."
  },
  {
    id: 5,
    question: "What is the holy day of obligation that celebrates the Resurrection of Christ?",
    options: ["Good Friday", "Easter Sunday", "Pentecost", "Ascension"],
    correctAnswer: 1,
    category: "Liturgy",
    difficulty: "Easy",
    reward: 10,
    explanation: "Easter Sunday celebrates the Resurrection of Jesus Christ, the foundation of Christian faith."
  },
  {
    id: 6,
    question: "How many Sorrowful Mysteries are in the Rosary?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 2,
    category: "Rosary",
    difficulty: "Medium",
    reward: 15,
    explanation: "There are 5 Sorrowful Mysteries contemplating Christ's suffering and passion."
  }
];

export function getQuestionsForToday(): Question[] {
    
  // Shuffle and select 5 questions for today
  const shuffled = [...questionsDatabase].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);;

}


export function clearQuestionsFromStorage(): void {
  const today = new Date().toDateString();
  localStorage.removeItem(`questions_${today}`);
}
