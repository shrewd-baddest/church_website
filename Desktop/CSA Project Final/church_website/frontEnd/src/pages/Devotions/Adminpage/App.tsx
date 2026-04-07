import { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaCheckCircle , FaUsers } from "react-icons/fa";
import { generateAndSaveQuestions } from "../../../api/axiosInstance";

const members = [
  { id: 1, jumuiaName: "St. Augustin" },
  { id: 2, jumuiaName: "Antony" },
  { id: 3, jumuiaName: "Cathline" },
  { id: 4, jumuiaName: "Dominic" },
  { id: 5, jumuiaName: "Elizabeth" },
  { id: 6, jumuiaName: "Mariagoretti" },
  { id: 7, jumuiaName: "Monica" },
];

const carouselSlides = [
  {
    title: "AI Generated Questions",
    subtitle:
      "Deepen your faith and exploration of scripture with intelligent, context-aware insights tailored to your spiritual journey.",
    bg: "from-stone-900/80 to-amber-900/60",
    image:
      "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=900&q=80",
  },
  {
    title: "Scripture Exploration",
    subtitle:
      "Discover deeper meaning in sacred texts with AI-powered analysis and community discussion tools.",
    bg: "from-stone-900/80 to-orange-900/60",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80",
  },
  {
    title: "Spiritual Growth",
    subtitle:
      "Track your journey, set goals, and connect with fellow believers on the path of faith.",
    bg: "from-stone-900/80 to-red-900/60",
    image:
      "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=900&q=80",
  },
  {
    title: "Analytical Insights",
    subtitle:
      "Compare attempted questions and accuracy across all jumuias, highlighting strengths and areas for growth.",
    bg: "from-stone-900/80 to-indigo-900/60",
    image:
      "https://images.unsplash.com/photo-1581090700227-4c4d1a3f3d3c?w=900&q=80",
  },
  {
    title: "Overall Comparison",
    subtitle:
      "Gain a clear overview of performance among the seven jumuias, fostering fairness and collective improvement.",
    bg: "from-stone-900/80 to-green-900/60",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&q=80",
  },
];

function AIEngine() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Generating...");
  const [recentTopics, setRecentTopics] = useState([
    "Sermon on the Mount",
    "St. Francis of Assisi",
  ]);
  const [success, setSuccess] = useState(false); // track success state
  const [errorMessage, setErrorMessage] = useState(""); // track error state

  const generate = async () => {
    const messages = [
      "Getting questions ready...",
      "Combining the questions...",
      "Almost there...",
      "Questions ready in 3 seconds...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingText(messages[i]);
      i++;
      if (i >= messages.length) clearInterval(interval);
    }, 2000);

    if (!topic.trim()) return;
    setLoading(true);

    try {
      const responce = await generateAndSaveQuestions({ topic });
      if (responce.status === 201) {
        setSuccess(true);
      } else {
        setErrorMessage("Unexpected response . Please try again. or find attachment ");
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      setErrorMessage(
        "Sorry, something went wrong while generating questions. Please check your connection or try again later.",
      );
    } finally {
      setLoading(false);
      setTopic("");
      setLoadingText("Generated..");
      if (!recentTopics.includes(topic)) {
        const updated = [topic, ...recentTopics].slice(0, 5);
        setRecentTopics(updated);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-stone-200 p-4 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
          <FaUserCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-800">
            AI Question Engine : Ai generates questions based on your insights
          </h2>
          <p className="text-stone-500 text-xs">
            Generate thoughtful discussion questions only one simple step , prompt , and see the magic
          </p>
        </div>
      </div>

      {/* Main flex area */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left side */}
        <div className="flex-1 space-y-3">
          {!success ? (
            <>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="E.g., lets talk about The Parable of the Prodigal Son..."
                className="w-full h-24 border border-stone-200 rounded-lg p-2 text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none focus:ring-1 focus:ring-green-400 bg-stone-50"
              />
              <p className="text-right text-xs text-stone-400">
                Suggested length: 1–2 sentences Example : "let the members know about the book of Daniel"
              </p>
              <button
                onClick={generate}
                disabled={loading || !topic.trim()}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    {loadingText}
                  </>
                ) : (
                  "✦ Generate Questions"
                )}
              </button>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mt-2">
                  {errorMessage}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Success container */}
              <div className="flex flex-col items-center gap-3 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm">
                <FaCheckCircle className="w-10 h-10 text-green-500 animate-bounce" />
                <h3 className="text-lg font-semibold text-green-700">
                  🎉 Questions Generated Successfully!
                </h3>
                <p className="text-sm text-green-600 text-center leading-relaxed">
                  Your questions are ready and saved. Come back in{" "}
                  <span className="font-bold">3 days</span> to generate more.
                  Meanwhile, explore them in the{" "}
                  <span className="underline">Jumuiya section</span>.
                </p>
              </div>

              {/* Disabled button */}
              <button
                disabled
                className="w-full bg-gray-300 text-gray-600 font-medium py-2 rounded-lg flex items-center justify-center gap-2 text-sm cursor-not-allowed mt-2"
              >
                ⏳ Come back in 3 days
              </button>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex-1 flex justify-center items-center ">
          <img
            src="../src/assets/images/ai-chatboot.png"
            alt="Generate AI Questions Made Easy"
            className="w-24 sm:w-32 md:w-40 lg:w-48 object-contain drop-shadow-lg"
          />
        </div>
      </div>

      {/* Footer */}
     <div className="flex flex-wrap items-center gap-3 mt-4 border-t border-stone-200 pt-3">
  <span className="text-sm font-medium text-stone-500">
    Recent Topics:
  </span>
  {recentTopics.map((t) => (
    <button
      key={t}
      onClick={() => setTopic(t)}
      className="px-2 py-1 text-xs rounded-md bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors"
    >
      {t}
    </button>
  ))}
<span className="ml-auto flex items-center text-xs text-stone-400 italic">
  Powered by <span className="ml-1 font-semibold text-green-600">Ascension AI</span>
  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
</span>
</div>
    </div>
  );
}

function Carousel() {
  const [slide, setSlide] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const startTimer = () => {
    if (timer.current !== undefined) clearInterval(timer.current);
    timer.current = window.setInterval(
      () => setSlide((s) => (s + 1) % carouselSlides.length),
      4500,
    );
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timer.current !== undefined) clearInterval(timer.current);
    };
  }, []);

  const goTo = (i: number) => {
    setSlide(i);
    startTimer();
  };
  const cur = carouselSlides[slide];

   return(
    <div className="relative rounded-2xl overflow-hidden h-52 md:h-60 shadow-lg">
  <img
    key={slide}
    src={cur.image}
    alt="slide"
    className="absolute inset-0 w-full h-full object-cover"
    style={{ transition: "opacity 0.6s" }}
  />
  <div className={`absolute inset-0 bg-gradient-to-r ${cur.bg}`} />

  {/* Badge */}
  <div className="absolute top-4 left-4">
    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase">
      ★ New Feature
    </span>
  </div>

  {/* Text container with margin from nav buttons */}
  <div className="absolute inset-y-0 left-14 right-14 flex flex-col justify-center px-6 py-6">
    <h1 className="text-white font-black text-xl md:text-3xl leading-tight drop-shadow-lg max-w-xs">
      {cur.title}
    </h1>
    <p className="text-white/80 text-xs md:text-sm mt-2 max-w-xs leading-relaxed">
      {cur.subtitle}
    </p>
    <div className="flex gap-3 mt-5">
      <button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-5 py-2 rounded-lg transition-all">
        Get Started
      </button>
      <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-5 py-2 rounded-lg backdrop-blur-sm transition-all">
        Learn More
      </button>
    </div>
  </div>

  {/* Dots */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
    {carouselSlides.map((_, i) => (
      <button
        key={i}
        onClick={() => goTo(i)}
        className={`h-2 rounded-full transition-all duration-300 ${
          i === slide ? "bg-orange-400 w-5" : "bg-white/50 w-2"
        }`}
      />
    ))}
  </div>

  {/* Back button */}
  <button
    onClick={() =>
      goTo((slide - 1 + carouselSlides.length) % carouselSlides.length)
    }
    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white text-lg leading-none transition-all duration-300 shadow-md"
  >
    ‹
  </button>

  {/* Forward button */}
  <button
    onClick={() => goTo((slide + 1) % carouselSlides.length)}
    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white text-lg leading-none transition-all duration-300 shadow-md"
  >
    ›
  </button>
</div>

   )
}

interface Member {
  id: number;
  jumuiaName: string;
}

function MemberProfile({ member }: { member: Member }) {
  return (
    <div className="p-4 space-y-5">
      <div
        className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-stone-100 
                   transition transform hover:bg-stone-50 hover:scale-[1.02] hover:shadow-md"
      >
        {/* Icon instead of avatar */}
        <div className="w-16 h-16 flex items-center justify-center text-orange-500">
          <FaUserCircle className="w-14 h-14" />
        </div>
        <div>
          <h2 className="text-xl font-black text-stone-800">
            {member.jumuiaName}
          </h2>
          <p className="text-stone-400 text-sm">Jumui Member #{member.id}</p>
        </div>
      </div>
      <AIEngine />
    </div>
  );
}

export default function Appadmin() {
  const [view, setView] = useState<string | number>("dashboard");
  const activeMember = members.find((m) => m.id === view);

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-stone-100 fixed left-0 top-0 bottom-0 z-20">
        <div className="px-4 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
            </div>
            <span className="font-black text-stone-800">csk Admin</span>
          </div>
        </div>
        <nav className="px-3 py-4">
          <button
            onClick={() => setView("dashboard")}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${view === "dashboard" ? "bg-orange-500 text-white shadow" : "text-stone-600 hover:bg-stone-50"}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
              />
            </svg>
            Dashboard
          </button>
        </nav>
        <div className="px-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Members
            </span>
            <div className="w-4 h-4 text-stone-400">⊕</div>
          </div>
          <ul className="space-y-0.5">
            <ul className="space-y-1">
              {members.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setView(m.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ease-in-out
          ${
            view === m.id
              ? "bg-orange-50 text-orange-600 font-semibold shadow-sm"
              : "text-stone-600 hover:bg-stone-100 hover:text-orange-500 hover:shadow"
          }`}
                  >
                    <FaUsers className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{m.jumuiaName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </ul>
        </div>
        <div className="px-4 py-3 border-t border-stone-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-white text-xs font-bold">
            AU
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-700 truncate">
              Admin User
            </p>
            <p className="text-[10px] text-stone-400 truncate">
              admin@faithascension.org
            </p>
          </div>
          <span className="text-stone-400 text-lg">⚙</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-56 overflow-y-auto pb-20 md:pb-6">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-100 px-4 py-3 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
            </div>
            <span className="font-black text-stone-800 text-sm">
              {view === "dashboard" ? "Dashboard" : activeMember?.jumuiaName}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-white text-xs font-bold">
            AU
          </div>
        </header>

        {view === "dashboard" ? (
          <div className="p-4 space-y-5">
            <Carousel />
            <AIEngine />
          </div>
        ) : activeMember ? (
          <MemberProfile member={activeMember} />
        ) : null}
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 z-30 flex shadow-lg overflow-x-auto">
        <button
          onClick={() => setView("dashboard")}
          className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold transition-all ${view === "dashboard" ? "text-orange-500" : "text-stone-400"}`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"
            />
          </svg>
          Home
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setView(m.id)}
            className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold transition-all ${view === m.id ? "text-orange-500" : "text-stone-400"}`}
          >
            <span className="truncate w-10 text-center">
              {m.jumuiaName.split(" ")[0]}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
