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
  <div className="w-full h-screen bg-[#fcfcfd] relative flex flex-col overflow-hidden">
    
    {/* Spiritual Header - Increased top padding to push content down */}
    <div className="flex flex-col items-center pt-14 pb-4 bg-white shadow-sm shrink-0 border-b border-gray-50">
      <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Liturgy</h2>
      <p className="text-[10px] text-blue-600 font-extrabold uppercase tracking-[0.3em] mt-1 italic">Order of the Mass</p>
    </div>

    {/* Avatar Assistant - Moved to the corner to prevent clashing */}
    {!avatarAwake && (
      <div className="absolute top-2 right-2 sm:top-24 sm:right-4 z-40 animate-fadeIn pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xl px-2.5 py-1.5 rounded-xl shadow-md border border-gray-100 flex items-center gap-2">
          <p className="text-[8px] text-gray-400 font-black max-w-[60px] leading-tight text-right uppercase italic">
            Tap below
          </p>
          <img
            src="/src/assets/images/avatar-sleep.png"
            alt="Assistant"
            className="w-7 h-7 sm:w-10 sm:h-10 opacity-50"
          />
        </div>
      </div>
    )}

    {/* Content Area - Added top margin for separation */}
    <div className="flex-1 w-full overflow-y-auto no-scrollbar px-5 py-4 space-y-4 pb-48 mt-4">
      {OrderOfTheMassData.map((section, index) => {
        const isOpen = openSection === section.section;
        return (
          <div
            key={section.section}
            className={`rounded-2xl transition-all duration-300 border ${
              isOpen 
              ? "bg-white border-blue-100 shadow-xl shadow-blue-50/50" 
              : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            <button
              onClick={() => toggleSection(section.section)}
              className="w-full flex justify-between items-center p-5 text-left group"
            >
              <div className="flex items-center gap-4">
                <span className={`text-xs font-black ${isOpen ? 'text-blue-600' : 'text-gray-300'}`}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={`font-black text-sm uppercase tracking-wider ${isOpen ? 'text-blue-700' : 'text-gray-700'}`}>
                  {section.section}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isOpen ? 'bg-blue-600 text-white rotate-180' : 'bg-gray-50 text-gray-400'
              }`}>
                {isOpen ? "−" : "+"}
              </div>
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="p-6 pt-0 space-y-6">
                  {isOpen && avatarAwake && (
                    <div className="flex justify-center animate-bounce">
                      <img
                        src="/src/assets/images/avatar-awake.png"
                        alt="Awake"
                        className="w-12 h-12 drop-shadow-md"
                      />
                    </div>
                  )}

                  {/* Gestures Section */}
                  {section.gestures && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Gestures & Meanings</h4>
                      <div className="grid gap-2">
                        {section.gestures.map((g, i) => (
                          <div key={i} className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 flex gap-3">
                            <span className="text-xl">✨</span>
                            <div>
                               <p className="font-black text-xs text-gray-900 uppercase">{g.action}</p>
                               <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{g.meaning}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Liturgical Responses */}
                  {section.responses && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Liturgical Dialogue</h4>
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                        {section.responses[language]?.map((resp, i) => (
                          <div key={i} className="flex gap-3">
                             <div className="w-1 h-auto bg-amber-200 rounded-full shrink-0"></div>
                             <p className="text-sm text-amber-900 font-serif italic italic leading-relaxed">
                               {resp}
                             </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teaching / Discussion */}
                  {section.topics && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Faith Insights</h4>
                      <div className="space-y-4">
                        {section.topics.map((t, i) => (
                          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="font-black text-sm text-gray-900 leading-snug">{t.question}</p>
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed border-t border-gray-50 pt-2">{t.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Floating Language Switcher - Redesigned to look more deliberate */}
    <div className="fixed bottom-12 sm:bottom-6 right-6 z-[60]">
      <div className="relative flex bg-white rounded-2xl p-1 shadow-2xl border border-gray-100 w-44">
        {/* Sliding Indicator (Clean & Professional) */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-blue-600 shadow-md transform transition-transform duration-500 ease-out ${
            language === "english" ? "translate-x-0" : "translate-x-full"
          }`}
        ></div>

        <button
          onClick={() => setLanguage("english")}
          className={`relative z-10 flex-1 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${
            language === "english" ? "text-white" : "text-gray-400 font-bold"
          }`}
        >
          English
        </button>

        <button
          onClick={() => setLanguage("kiswahili")}
          className={`relative z-10 flex-1 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${
            language === "kiswahili" ? "text-white" : "text-gray-400 font-bold"
          }`}
        >
          Kiswahili
        </button>
      </div>
    </div>

    <style>
      {`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}
    </style>
  </div>
);



}
