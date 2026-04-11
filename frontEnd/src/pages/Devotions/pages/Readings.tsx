import { useState, useEffect } from "react";
import { FaBible, FaBookOpen, FaMusic, FaShareAlt } from "react-icons/fa";

export default function Readings() {
  type SectionType = "first" | "second" | "psalm" | null;
  const [openSection, setOpenSection] = useState<SectionType>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleSection = (section: SectionType): void => {
    setOpenSection(openSection === section ? null : section);
  };

  const verseText = "The Lord is my light and my salvation—whom shall I fear?";
  const verseSource = "Psalm 27:1";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Verse of the Day",
        text: `${verseText} (${verseSource})`,
      });
    }
  };

  // 💬 Dynamic messages
  const getMessage = () => {
    if (!openSection)
      return "👋 Welcome to the readings page… take a quiet moment with God today.";

    switch (openSection) {
      case "first":
        return "📖 The first reading speaks… listen with your heart.";
      case "second":
        return "✨ Let this message strengthen your faith.";
      case "psalm":
        return "🎶 Pray this slowly… let it become your voice.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-10">
      <div className="relative w-full max-w-3xl">
        {/* 🧍 Talking Guide */}
        <div
          className={`absolute z-20 flex flex-col items-end 
          right-[-10px] sm:right-[-20px] top-0 transition-all duration-1000
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          {/* 💬 Bubble */}
          <div className="relative mb-2">
            <div className="bg-white/90 backdrop-blur-md text-gray-700 text-[11px] sm:text-xs px-3 py-2 rounded-xl shadow-lg border border-gray-200 max-w-[160px] sm:max-w-[200px] animate-fadeIn">
              {getMessage()}
            </div>

            {/* Tail */}
            <div className="absolute bottom-[-5px] right-6 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-200"></div>

           <div className="absolute right-[70px] top-[40px]">
  <span className="wave"></span>
  <span className="wave delay-1"></span>
  <span className="wave delay-2"></span>
</div>
          </div>

          {/* Avatar */}
          <img
            src="../src/assets/images/read-you-bible.png"
            alt="Guide"
            className="w-16 sm:w-20 drop-shadow-xl animate-float"
          />
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
          Verse of the Day
        </h2>

        {/* Main Card */}
        <div className="backdrop-blur-xl  p-6 sm:p-8">
          {/* Verse */}
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-10">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-4 rounded-2xl shadow-lg">
              <img src="/src/assets/bible.svg" className="w-12 h-12" />
            </div>

            <div className="flex-1">
              <p className="italic text-lg sm:text-xl text-gray-700">
                “{verseText}”
              </p>

              <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
                <span className="bg-indigo-100 text-indigo-700 text-xs sm:text-sm px-4 py-1 rounded-full">
                  {verseSource}
                </span>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-sm rounded-xl shadow hover:scale-105 transition"
                >
                  <FaShareAlt /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {[
              {
                key: "first",
                title: "First Reading",
                icon: <FaBible />,
                color: "indigo",
                ref: "Wisdom 2:12-20",
                text: `"Let us lie in wait for the righteous man..."`,
              },
              {
                key: "second",
                title: "Second Reading",
                icon: <FaBookOpen />,
                color: "green",
                ref: "Romans 8:31-39",
                text: `"If God is for us, who can be against us?"`,
              },
              {
                key: "psalm",
                title: "Responsorial Psalm",
                icon: <FaMusic />,
                color: "yellow",
                ref: "Psalm 27",
                text: `"The Lord is my light and my salvation..."`,
              },
            ].map((section) => {
              const isOpen = openSection === section.key;

              const colorMap: Record<string, string> = {
                indigo: "bg-indigo-100 hover:bg-indigo-200 border-indigo-400",
                green: "bg-green-100 hover:bg-green-200 border-green-400",
                yellow: "bg-yellow-100 hover:bg-yellow-200 border-yellow-400",
              };

              return (
                <div key={section.key}>
                  <button
                    onClick={() => toggleSection(section.key as SectionType)}
                    className={`w-full flex justify-between items-center p-4 rounded-xl transition-all shadow-sm ${colorMap[section.color]}`}
                  >
                    <span className="flex items-center gap-3 font-semibold text-gray-800">
                      {section.icon} {section.title}
                    </span>
                    <span>{isOpen ? "−" : "+"}</span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? "grid-rows-[1fr] mt-2" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-4 bg-white rounded-xl shadow-inner border-l-4">
                        <p className="font-semibold">{section.ref}</p>
                        <p className="italic mt-2 text-gray-600">
                          {section.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🎬 Animations */}
      <style>
        {`
          @keyframes float {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }

          .animate-float {
            animation: float 4s ease-in-out infinite;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fadeIn {
            animation: fadeIn 0.4s ease-in-out;
          }

/* 🎵 Sound wave effect */
@keyframes soundWave {
  0% {
    opacity: 0.8;
    transform: scale(0.6);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}

.wave {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #22c55e; /* greenish tone */
  opacity: 0.7;
  animation: soundWave 1.2s infinite ease-out;
  position: absolute;
}
.delay-1 {
  animation-delay: 0.3s;
}
.delay-2 {
  animation-delay: 0.6s;
}

        `}
      </style>
    </div>
  );
}
