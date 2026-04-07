import { useState, useEffect, useRef } from "react";
import { FaQuestionCircle,FaMedal, FaBookOpen,FaStar,FaLock,FaTrophy,FaHome} from "react-icons/fa";
import { getQuestionsForToday, clearQuestionsFromStorage} from "../data/questions";
import type { Question } from "../data/questions";
import { CompletionContainer } from "../components/CompletionContainer";
import { LocalStorage } from "../../../utils";

export default function Challenge() {
  const today = new Date().toDateString();

  const [portalStatus, setPortalStatus] = useState< "welcome" | "portal" | "closed" | "completed" >("welcome");

  const [questions, setQuestions] = useState<Question[]>(() => {
    const cached = LocalStorage.get(`questions_${today}`);
    if (cached) {
      return JSON.parse(cached);
    } else {
      const todaysQuestions = getQuestionsForToday();
      localStorage.setItem(`questions_${today}`, JSON.stringify(todaysQuestions || []));
      return todaysQuestions || [];
    }
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1); // 2 seconds for testing
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  // Timer countdown effect
  useEffect(() => {
    if (portalStatus === "portal" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 3000);
    } else if (timeLeft === 0 && portalStatus === "portal") {
      timerRef.current = setTimeout(() => {
        setQuestions([])
        setPortalStatus("closed");
        localStorage.removeItem(`questions_${today}`);
      }, 0);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, portalStatus, today]);

  

  const handleStartChallenge = () => {
    setPortalStatus("portal");
    setCurrentQuestionIndex(0);
    setTimeLeft(2); // Reset timer for testing
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentQuestionIndex === questions.length - 1) {
      // All questions answered - mark as completed
      setPortalStatus("completed");
    }
  };

  const handleReset = () => {
    clearQuestionsFromStorage();
    setPortalStatus("welcome");
    setCurrentQuestionIndex(0);
    setTimeLeft(2);
  };

  const progressPercentage = Math.round(
    ((currentQuestionIndex + 1) / questions.length) * 100,
  );

  // Welcome Screen
  if (portalStatus === "welcome") {
    return (
      <div className="max-w-2xl mx-auto p-1 relative overflow-hidden min-h-screen">
        {/* Floating animated elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-pink-200 rounded-full mix-blend-multiply filter blur-sm opacity-70 animate-blob" />
          <div className="absolute right-20 w-20 h-20 bg-blue-200 rounded-full mix-blend-multiply filter blur-sm opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="text-center">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Liturgical Questions Challenge
            </h1>
            <p className="text-gray-600 text-sm">
              Test your knowledge of the sacred liturgy
            </p>
          </div>

          {/* Motivation Cards */}
          <div className="grid md:grid-cols-2 gap-4 my-8">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 border border-pink-200">
              <FaMedal className="text-pink-500 text-3xl mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-800 mb-2">
                Earn Rewards as Jumia members
              </h3>
              <p className="text-gray-700 text-sm">
                Complete challenges to unlock achievements and increase your
                score
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <FaTrophy className="text-purple-500 text-3xl mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-800 mb-2">
                Master the Liturgy
              </h3>
              <p className="text-gray-700 text-sm">
                Deepen your understanding of Catholic traditions and practices
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <FaBookOpen className="text-blue-500 text-3xl mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-800 mb-2">Learn Daily</h3>
              <p className="text-gray-700 text-sm">
                New questions every day to keep your knowledge fresh
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <FaStar className="text-green-500 text-3xl mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-800 mb-2">
                Challenge Yourself
              </h3>
              <p className="text-gray-700 text-sm">
                Questions of varying difficulty to test your expertise
              </p>
            </div>
          </div>

          <button
            onClick={handleStartChallenge}
            disabled={questions.length <= 0}
            className="m-2 bg-gradient-to-r from-pink-600  to-pink-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-pink-700 hover:to-pink-800 transition-all transform hover:scale-105 flex items-center justify-center gap-2 mx-auto shadow-lg"
          >
            <FaQuestionCircle />
           {questions.length <= 0 ? <span>No questions know check later </span> : <span> {questions.length} questions await you</span>} 
          </button>
        </div>
      </div>
    );
  }

  // Portal Closed Screen
  if (portalStatus === "closed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-white to-gray-200 p-6">
        <div className="w-full sm:max-w-md bg-gray-50 shadow-lg rounded-xl p-8 text-center">
          <FaLock className="text-6xl text-red-500 mx-auto mb-6 drop-shadow-md" />
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">
            Questions Closed
          </h2>
          <p className="text-gray-700 mb-4 text-lg font-medium">
            The challenge portal has expired for today.
          </p>
          <p className="text-gray-500 mb-8 italic">
            Return tomorrow for a new set of questions!
          </p>
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-transform duration-200"
          >
            <FaHome className="text-xl" />
            <span className="tracking-wide">Return Home</span>
          </button>
        </div>
      </div>
    );
  }

  // Questions Portal
  if (portalStatus === "portal" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="max-w-2xl mx-auto p-4">
        {/* Header with Timer */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <FaQuestionCircle className="text-pink-500" /> Quiz Portal
          </h2>
          <div
            className={`text-xl font-bold ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-green-600"}`}
          >
            {timeLeft}s
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-pink-600">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white shadow-md rounded-lg p-4 border border-gray-200 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {currentQuestion.question}
          </h3>
          <div className="space-y-2 mb-6">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center gap-2 cursor-pointer hover:text-pink-500 transition-transform duration-300 hover:translate-x-1 p-2 rounded-lg hover:bg-pink-50"
              >
                <input type="radio" name="answer" className="accent-pink-500" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {/* Badges Section */}
          <div className="flex flex-wrap gap-2 mb-6 border-t pt-4">
            <span className="inline-flex items-center gap-1 bg-pink-100 text-pink-600 text-xs font-medium px-2 py-1 rounded-full">
              <FaStar /> Difficulty: {currentQuestion.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
              <FaBookOpen /> Category: {currentQuestion.category}
            </span>
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded-full">
              <FaMedal /> Points: +{currentQuestion.reward}
            </span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded-md font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ? Previous
          </button>
          <button
            onClick={handleNextQuestion}
            className="flex-1 bg-pink-600 text-white px-3 py-1 rounded-md font-semibold hover:bg-pink-700 transition-colors"
          >
            {currentQuestionIndex === questions.length - 1
              ? "Complete ?"
              : "Next ?"}
          </button>
        </div>
      </div>
    );
  }

  // Completed Screen
  if (portalStatus === "completed") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <CompletionContainer onReset={handleReset} />
      </div>
    );
  }

  return null;
} 
