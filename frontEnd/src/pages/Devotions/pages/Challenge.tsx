import { useState, useEffect, useRef } from "react";
import { FaLock, FaHome, FaInbox } from "react-icons/fa";
import {
  getQuestionsForToday,
  clearQuestionsFromStorage,
} from "../data/questions";
import type { Question } from "../data/questions";
import { LocalStorage } from "../../../utils";
import { fetchDailyQuestions } from "../../../api/axiosInstance"; // ✅ your API
import { parseQuestionsFromText } from "../utitlty";
import { useSocket } from "../../../context/SocketContext";
import { ArrowRightIcon } from "lucide-react";

// 🔁 TOGGLE HERE
const USE_DB = false;

export default function Challenge() {
  const { socket } = useSocket();

  const today = new Date().toDateString();

  const [portalStatus, setPortalStatus] = useState<"welcome" | "portal" | "closed" | "completed" >("welcome");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hour

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  //  LOAD QUESTIONS
  useEffect(() => {
    const loadQuestions = async () => {
      const cached = LocalStorage.get(`questions_${today}`);
      if (cached) {
        setQuestions(cached);
        return;
      }

      try {
        if (USE_DB) {
          // if the flag is true, fetch from DB and parse the text response into questions
          //  API CALL - REPLACE WITH YOUR ENDPOINT
          const res = await fetchDailyQuestions(10);
          const parsed = parseQuestionsFromText(res.data);
          if (!parsed.length) {
            setPortalStatus("closed");
            return;
          }
          setQuestions(parsed);
          localStorage.setItem(`questions_${today}`, JSON.stringify(parsed));
        } else {
          // if the flag is false, use local utility to get questions (could be static or from local JSON)
          //  This allows you to easily switch between a dynamic API source and a static local source for testing or fallback
          const local = getQuestionsForToday();
          if (!local.length) {
            setPortalStatus("closed");
            return;
          }
          setQuestions(local);
          localStorage.setItem(`questions_${today}`, JSON.stringify(local));
        }
      } catch (err) {
        console.error(err);
        setPortalStatus("closed");
      }
    };

    loadQuestions();
  }, [today]);

  useEffect(() => {
    // ✅ Start timer
    if (portalStatus !== "portal") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!); // stop timer
          setPortalStatus("closed"); // safe to call here inside callback
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [portalStatus]);

  const handleStartChallenge = () => {
    setPortalStatus("portal");
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTimeLeft(60 * 60);
  };

  //  EXAM MODE (NO GOING BACK)
  const handleNextQuestion = (selectedIndex: number) => {
    const current = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === current.correctAnswer;

    setUserAnswers((prev) => [...prev, selectedIndex]);

    //  SOCKET EMIT --this is what we will emit to the database and listen at our admin side to update real-time stats
    //  and track user progress. You can expand the payload with more user info or question details as needed.
    socket?.emit("attempt", {
      questionId: current.id,
      memberId: "USER_ID",
      jumuiyaId: "JUMUIYA_ID",
      selectedOption: current.options[selectedIndex],
      isCorrect,
    });


    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setPortalStatus("completed");
    }
  };

  const handleReset = () => {
    clearQuestionsFromStorage();
    setPortalStatus("welcome");
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setTimeLeft(60 * 60);
  };

  const score = userAnswers.filter(
    (ans, i) => ans === questions[i]?.correctAnswer,
  ).length;

  // ================= UI =================

  // ✅ WELCOME


// Inline Tailwind animations for this file only
const styles = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  @keyframes float {
    0% { transform: translateY(-6px); }
    50% { transform: translateY(0px); }
    100% { transform: translateY(-6px); }
  }
  .animate-float {
    animation: float 4s ease-in-out infinite;
  }

  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  .animate-fadeIn {
    animation: fadeIn 2s ease-in-out forwards;
  }
}
`;

if (portalStatus === "welcome") {
  return (
    <>
      {/* Inject styles */}
      <style>{styles}</style>

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-4xl p-8 sm:p-10 relative overflow-hidden">
          
          {/* Animated Path */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <svg className="w-full h-full" viewBox="0 0 500 200">
              <path
                id="zigzagPath"
                d="M0,150 Q150,50 300,120 T500,80"
                fill="none"
                stroke="url(#gradientStroke)"
                strokeWidth="3"
                strokeDasharray="10,10"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="20"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
              <defs>
                <linearGradient id="gradientStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-600 to-amber-700 mb-4 tracking-tight drop-shadow-lg animate-fadeIn">
              Daily Liturgical Challenge
            </h1>

            {/* Subtitle */}
            <p className="italic text-gray-600 text-base sm:text-lg mb-6 max-w-xl mx-auto leading-relaxed">
              Stay consistent. Grow your knowledge. Earn your rewards.
            </p>

            {/* Achievement Cards - Stacked on mobile, Grid on desktop */}
            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-6 sm:gap-4 mb-10 items-center">
              {[
                { icon: "🔥", title: "Consistency", desc: "Build a daily streak", badge: "Streak Master", color: "bg-orange-50 text-orange-900" },
                { icon: "🧠", title: "Knowledge", desc: "Learn something new", badge: "Thinker", color: "bg-white text-gray-900 border border-gray-100" },
                { icon: "🏆", title: "Rewards", desc: "Earn recognition", badge: "Champion", color: "bg-yellow-50 text-yellow-900" }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col justify-center items-center rounded-2xl w-full h-40 sm:h-44 shadow-lg transition-all duration-300
                    ${idx === 1 
                      ? "sm:scale-110 sm:-translate-y-2 z-20 animate-float shadow-2xl bg-white" 
                      : ""} ${item.color}`}
                >
                  <div className="text-4xl animate-bounce mb-2">{item.icon}</div>
                  <p className="italic text-lg font-black tracking-tight">{item.title}</p>
                  <p className="italic text-xs opacity-70 mt-1 px-4 text-center">{item.desc}</p>
                  <span className="mt-3 px-4 py-1.5 text-[10px] italic font-black rounded-full bg-gray-950 text-white shadow-lg uppercase tracking-widest">
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm text-gray-500 italic">
              <span>{questions.length} Questions</span>
              <span>⏱ 1 Hour</span>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleStartChallenge}
              disabled={questions.length <= 0}
              className="w-full flex items-center justify-center gap-2 px-8 py-3 
                         bg-gray-700 text-white rounded-lg text-lg font-semibold shadow-md 
                         hover:shadow-xl hover:scale-105 hover:bg-gray-600 transition-all duration-300 
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {questions.length <= 0 ? "No Questions Available" : "Let’s Go!"}
              <ArrowRightIcon className="w-6 h-6" />
            </button>

            {/* Footer */}
            <p className="italic text-xs text-gray-400 mt-6">
              Come back daily to maintain your streak
            </p>
          </div>
        </div>
      </div>
    </>
  );
}



  // ✅ CLOSED
 if (portalStatus === "closed") {
  const isTimeout = questions.length > 0; // closed because time ran out
  const title = isTimeout ? "Time Limit Reached" : "No Questions Available";
  const message = isTimeout
    ? "You gave it a good try today 👏 The challenge has now closed."
    : "Looks like there are no questions available right now. 📭";

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-xl p-8 text-center">
        
        {/* Icon */}
        <div className={`w-16 h-16 mx-auto flex items-center justify-center rounded-full mb-4 
          ${isTimeout ? "bg-red-100" : "bg-yellow-100"}`}>
          {isTimeout ? (
            <FaLock className="text-2xl text-red-500" />
          ) : (
            <FaInbox className="text-2xl text-yellow-500" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {title}
        </h2>

        {/* Message */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Motivation Box */}
        <div className="bg-gray-50 border rounded-lg p-4 mb-6 text-sm text-gray-600">
          <p className="font-medium text-gray-700 mb-1">
            🚀 Keep the momentum going
          </p>
          <p>
            Come back tomorrow for a fresh set of questions and continue
            building your streak.
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold 
          hover:scale-105 transition-transform duration-300"
        >
          <FaHome />
          Return Home
        </button>

        {/* Footer hint */}
        <p className="text-xs text-gray-400 mt-4">
          New challenges unlock every day
        </p>
      </div>
    </div>
  );
}


  // ✅ PORTAL (EXAM MODE)
  if (portalStatus === "portal" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-2xl p-6">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600 font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>

            <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-500 font-semibold">
              ⏱ {timeLeft}s
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-2 rounded-full mb-6">
            <div
              className="h-2 bg-gray-900 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question */}
          <h3 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
            {currentQuestion.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleNextQuestion(index)}
                className="w-full text-left p-4 rounded-xl border border-gray-200 bg-white 
                hover:bg-gray-50 hover:border-gray-400 
                transition-all duration-200 shadow-sm"
              >
                <span className="font-medium text-gray-700">{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ✅ COMPLETED (REVIEW MODE)
  if (portalStatus === "completed") {
    return (
      <div className="min-h-screen bg-transparent px-4 py-12 flex justify-center overflow-y-auto no-scrollbar">
        <div className="w-full max-w-2xl">
          {/* Compact Top Header - Optimized Vertical Space */}
          <div className="flex flex-col items-center sm:items-start mb-12 px-2 gap-5">
            {/* Victory Row */}
            <div className="flex items-center gap-5">
              <div className="text-4xl sm:text-5xl animate-bounce">🏆</div>
              <div>
                <p className="text-[9px] font-black text-blue-700 uppercase tracking-[0.3em] italic">Devotion Milestone</p>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter leading-none mb-1">
                  Score: {score}<span className="text-gray-400">/{questions.length}</span>
                </h2>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] italic">Know the Church</p>
              </div>
            </div>

            {/* Actions Row */}
            <div className="w-full flex justify-center sm:justify-start">
              <button
                onClick={handleReset}
                className="flex items-center gap-3 bg-gray-900 text-white px-8 py-3.5 rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all active:scale-95 group"
              >
                Finish Challenge
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Results List - Borderless Style */}
          <div className="space-y-16 pb-32">
            {questions.map((q, i) => {
              const userAnswer = userAnswers[i];
              const isCorrect = userAnswer === q.correctAnswer;

              return (
                <div
                  key={i}
                  className="animate-fadeIn relative"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Vertical Question ID Indicator */}
                  <div className="flex items-center gap-3 mb-6">
                     <span className="text-xs font-black text-gray-500 italic tracking-tighter">QUESTION {String(i + 1).padStart(2, '0')}</span>
                     <div className={`h-[1px] flex-1 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}></div>
                     {isCorrect ? (
                       <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Mastered</span>
                     ) : (
                       <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Incomplete</span>
                     )}
                  </div>
                  
                  {/* Question Title */}
                  <h3 className="font-bold text-xl text-gray-800 mb-8 leading-snug max-w-xl">
                    {q.question}
                  </h3>

                  {/* Options List - Clean/No Border */}
                  <div className="space-y-4">
                    {q.options.map((opt, idx) => {
                      const isUserChoice = idx === userAnswer;
                      const isCorrectAnswer = idx === q.correctAnswer;

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-4 group"
                        >
                          {/* Dot Indicator */}
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 transition-all ${
                            isCorrectAnswer 
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
                              : isUserChoice && !isCorrectAnswer
                                ? "bg-red-400"
                                : "bg-gray-200"
                          }`}></div>

                          <div className="flex flex-col">
                            <span className={`text-sm font-medium transition-colors ${
                              isCorrectAnswer 
                                ? "text-gray-900 font-bold" 
                                : isUserChoice && !isCorrectAnswer
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}>
                              {opt}
                            </span>
                            
                            {/* Sub-label */}
                            {isCorrectAnswer && (
                              <span className="text-[8px] font-black text-green-700 uppercase tracking-widest mt-1">Correct Answer</span>
                            )}
                            {isUserChoice && !isCorrectAnswer && (
                              <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mt-1">Your Selection</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Minimal Reflection */}
                  {q.explanation && (
                    <div className="mt-8 pl-6 border-l-2 border-gray-200">
                      <p className="text-xs text-gray-500 italic leading-relaxed font-semibold">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
