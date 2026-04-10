import { useState, useEffect, useRef } from "react";
import { OrderOfTheMassData } from "../data/OrdeerOfTheMass";

export default function Liturgy() {
  type SectionType = string | null;
  const [openSection, setOpenSection] = useState<SectionType>(null);
  const [avatarAwake, setAvatarAwake] = useState(false);
  const [language, setLanguage] = useState<"english" | "kiswahili">("english");
  const sleepTimer = useRef<NodeJS.Timeout | null>(null);

  const toggleSection = (key: SectionType) => {
    const isOpening = openSection !== key && key !== null;
    setOpenSection(openSection === key ? null : key);

    if (isOpening) {
      if (sleepTimer.current) clearTimeout(sleepTimer.current);
      setAvatarAwake(true);

      if ("speechSynthesis" in window) speechSynthesis.cancel();

      const section = OrderOfTheMassData.find((s) => s.section === key);
      const guide = section?.responses?.[language]?.[0];
      if (guide && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(guide);
        utterance.lang = language === "english" ? "en-US" : "sw-KE";
        speechSynthesis.speak(utterance);
      }

      sleepTimer.current = setTimeout(() => setAvatarAwake(false), 5000);
    }
  };

  useEffect(() => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
  }, [language]);


return (
  <div className="w-full h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-100 relative flex flex-col">
    
    {/* Floating Reminder inside parent */}
    <div className="flex justify-center pt-2">
      <div className="bg-gray-600/60 text-white px-6 py-3 rounded-lg">
        <h2 className="text-2xl font-bold text-center">Order of the Mass</h2>
      </div>
    </div>

    {/* Sleeping avatar always visible when not awake */}
    {!avatarAwake && (
      <div className="fixed top-24 right-4 flex flex-col items-center z-50 transition-all duration-500">
        <img
          src="../src/assets/images/avatar-sleep.png"
          alt="Sleeping Avatar"
          className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-lg transition-all duration-500"
        />
        <p className="text-xs sm:text-sm text-gray-700 italic mt-2 max-w-[160px] text-center animate-fadeIn">
          👀 I’m watching each section for your details…
        </p>
      </div>
    )}

    {/* Accordion fills entire viewport */}
    <div className="flex-1 w-full overflow-y-scroll no-scrollbar px-6 py-6 space-y-6">
      {OrderOfTheMassData.map((section) => {
        const isOpen = openSection === section.section;
        return (
          <div
            key={section.section}
            className="rounded-xl p-4 bg-gray-100/90 backdrop-blur-md"
          >
            <button
              onClick={() => toggleSection(section.section)}
              className="w-full flex justify-between items-center font-semibold text-gray-800"
            >
              {section.section}
              <span>{isOpen ? "−" : "+"}</span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                isOpen ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                {isOpen && avatarAwake && (
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src="../src/assets/images/avatar-awake.png"
                      alt="Awake Avatar"
                      className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-lg animate-fadeIn"
                    />
                  </div>
                )}

                {/* Gestures */}
                {section.gestures && (
                  <ul className="list-disc pl-6 text-gray-700 mb-3">
                    {section.gestures.map((g, i) => (
                      <li key={i}>
                        <strong>{g.action}:</strong> {g.meaning}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Responses */}
                {section.responses && (
                  <div className="space-y-2 text-gray-700 italic">
                    {section.responses[language]?.map((resp, i) => (
                      <p key={i}>{resp}</p>
                    ))}
                  </div>
                )}

                {/* Hot Discussion */}
                {section.topics && (
                  <div className="space-y-4">
                    {section.topics.map((t, i) => (
                      <div key={i} className="border-l-4 border-indigo-400 pl-3">
                        <p className="font-semibold">{t.question}</p>
                        <p className="text-gray-600 italic">{t.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Floating Language Switcher */}
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative flex bg-gray-600/60 rounded-full p-1 shadow-lg w-40">
        {/* Sliding Switcher */}
        <div
          className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
            language === "english" ? "translate-x-0" : "translate-x-full"
          }`}
        ></div>

        {/* English Button */}
        <button
          onClick={() => setLanguage("english")}
          className={`relative z-10 flex-1 px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
            language === "english" ? "text-gray-900" : "text-gray-500"
          }`}
        >
          English
        </button>

        {/* Kiswahili Button */}
        <button
          onClick={() => setLanguage("kiswahili")}
          className={`relative z-10 flex-1 px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
            language === "kiswahili" ? "text-gray-900" : "text-gray-500"
          }`}
        >
          Kiswahili
        </button>
      </div>
    </div>

    {/* Animations */}
    <style>
      {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-in-out;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}
    </style>
  </div>
);



}
