import { useState, useEffect } from "react";

type RosaryType = "dominican" | "servite" | "franciscan" | "brigittine" | "divineMercy";

const rosaryConfigs: Record<RosaryType, {
  beadCount: number;
  bigBeads: number[];
  beadColor: string;
  bigBeadColor: string;
  prayers: string[];
  intro: string;
  voiceParams: { pitch: number; rate: number; gender: "Male" | "Female" };
}> = {
  dominican: {
    beadCount: 59,
    bigBeads: [1, 7, 11, 21, 31, 41, 51],
    beadColor: "#808080",
    bigBeadColor: "#3b82f6",
    prayers: ["Apostles’ Creed", "Our Father", "Hail Mary", "Glory Be"],
    intro: "Welcome to the Dominican Rosary. Let us begin our meditation on the mysteries of the life of Christ.",
    voiceParams: { pitch: 1.0, rate: 0.95, gender: "Female" }
  },
  servite: {
    beadCount: 56,
    bigBeads: [1, 8, 15, 22, 29, 36, 43],
    beadColor: "#000000",
    bigBeadColor: "#4b5563",
    prayers: ["Intro Prayer", "Sorrow Meditation", "The Hail Mary", "Glory Be"],
    intro: "The Rosary of the Seven Sorrows. Let us walk with the Mother of Sorrows through the passion of her Son.",
    voiceParams: { pitch: 0.8, rate: 0.85, gender: "Female" }
  },
  franciscan: {
    beadCount: 72,
    bigBeads: [1, 11, 21, 31, 41, 51, 61],
    beadColor: "#6B4423",
    bigBeadColor: "#10b981",
    prayers: ["Intro Prayer", "The Joy Meditation", "The Hail Mary", "Glory Be"],
    intro: "The Franciscan Crown of Joys. Let us rejoice with Mary in the seven joys of her life with Jesus.",
    voiceParams: { pitch: 1.2, rate: 1.0, gender: "Female" }
  },
  brigittine: {
    beadCount: 70,
    bigBeads: [1, 11, 21, 31, 41, 51, 61],
    beadColor: "#9ca3af",
    bigBeadColor: "#6366f1",
    prayers: ["The Creed", "Meditation", "The Hail Mary", "Glory Be"],
    intro: "The Bridgettine Rosary. Let us devote this time to the honor of the Blessed Virgin Mary.",
    voiceParams: { pitch: 1.1, rate: 0.9, gender: "Female" }
  },
  divineMercy: {
    beadCount: 59,
    bigBeads: [1, 7, 11, 21, 31, 41, 51],
    beadColor: "#DC2626",
    bigBeadColor: "#f59e0b",
    prayers: ["Opening Prayer", "Eternal Father", "For the sake of His sorrowful Passion", "Holy God"],
    intro: "The Divine Mercy Chaplet. Let us pray for God's mercy upon us and upon the whole world.",
    voiceParams: { pitch: 0.9, rate: 0.8, gender: "Male" } // Unique Male voice for Divine Mercy
  }
};

export default function RosaryTracker() {
  const [rosaryType, setRosaryType] = useState<RosaryType>("dominican");
  const [activeBead, setActiveBead] = useState(1);
  const [message, setMessage] = useState<string>("");

  const config = rosaryConfigs[rosaryType];

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select voice based on gender preference
      const voices = window.speechSynthesis.getVoices();
      const preferredGender = config.voiceParams.gender.toLowerCase();
      
      // Try to find a voice that matches the gender keyword in its name
      const matchedVoice = voices.find(v => 
        v.name.toLowerCase().includes(preferredGender) || 
        (preferredGender === "female" && (v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Female"))) ||
        (preferredGender === "male" && (v.name.includes("David") || v.name.includes("Mark") || v.name.includes("Male")))
      );

      if (matchedVoice) utterance.voice = matchedVoice;
      
      utterance.rate = config.voiceParams.rate; 
      utterance.pitch = config.voiceParams.pitch;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    // Speak intro when devotion type changes
    speak(config.intro);
    setActiveBead(1);
  }, [rosaryType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const isBig = config.bigBeads.includes(activeBead);
      const prayerName = isBig
        ? config.prayers[1] || config.prayers[0]
        : config.prayers[2] || config.prayers[0];
      
      setMessage(prayerName);
      
      // Don't speak the bead prayer if we just started (to avoid clashing with intro)
      if (activeBead > 1) {
        speak(`Now, pray the ${prayerName}`);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [activeBead]);

  const nextBead = () => {
    if (activeBead < config.beadCount) setActiveBead(activeBead + 1);
  };

  const prevBead = () => {
    if (activeBead > 1) setActiveBead(activeBead - 1);
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full max-w-full overflow-hidden flex flex-col items-center bg-transparent px-3 pt-4 pb-16">
      
      {/* 1. Selection (Rigid Header - Optimized) */}
      <header className="w-full shrink-0 flex flex-col items-center space-y-2 mb-2">
        <div className="flex flex-wrap gap-2 justify-center px-2">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest self-center mr-1 italic">Devotion</span>
          {(["dominican","servite","franciscan","brigittine","divineMercy"] as RosaryType[]).map((type) => (
            <button
              key={type}
              onClick={() => { setRosaryType(type); setActiveBead(1); }}
              className={`px-4 py-2 text-xs rounded-full font-black transition-all border whitespace-nowrap tracking-wide leading-none shadow-sm h-9 flex items-center justify-center ${
                rosaryType === type 
                ? "bg-gray-900 text-white border-gray-900 scale-105" 
                : "bg-white text-gray-600 border-gray-100"
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Optimized Info Display */}
      <div className="w-full text-center shrink-0 mb-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 text-gray-900 text-[10px] font-extrabold uppercase tracking-widest border border-black/5">
           <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.bigBeadColor }}></span>
           {rosaryType} • Bead {activeBead}
        </div>
        <div className="h-[36px] flex flex-col justify-center px-4 mt-1">
          <p className="text-xs sm:text-sm font-serif italic text-gray-800 leading-tight line-clamp-2">
            "{message}"
          </p>
        </div>
      </div>

      {/* 3. Adaptive Rosary SVG Container (Maximized Height) */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center p-1">
          <svg 
            viewBox="-25 -25 450 450" 
            className="w-full h-full max-w-full max-h-full drop-shadow-xl overflow-visible object-contain"
          >
            {/* Same SVG content as before... */}
            <g transform="translate(195, 360) scale(0.65)">
                <rect x="0" y="8" width="12" height="44" fill="#1f2937" rx="2" />
                <rect x="-16" y="18" width="44" height="12" fill="#1f2937" rx="2" />
            </g>
            
            <circle cx="200" cy="180" r="150" fill="none" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4,6" className="opacity-40" />

            <g>
              {Array.from({ length: config.beadCount }, (_, i) => {
                const beadId = i + 1;
                const isActive = activeBead === beadId;
                const isBig = config.bigBeads.includes(beadId);
                const angle = (beadId / config.beadCount) * 2 * Math.PI - Math.PI / 2;
                const x = 200 + 150 * Math.cos(angle);
                const y = 180 + 150 * Math.sin(angle);
                
                return (
                  <g key={beadId} className="cursor-pointer" onClick={() => setActiveBead(beadId)}>
                    {isActive && (
                      <circle cx={x} cy={y} r="18" fill="#10B981" className="opacity-10 animate-ping" />
                    )}
                    <circle
                      cx={x} cy={y}
                      r={isBig ? 11 : 8}
                      fill={isActive ? "#10B981" : isBig ? config.bigBeadColor : config.beadColor}
                      className="transition-all duration-300 hover:scale-150 origin-center"
                      stroke={isActive ? "white" : "rgba(0,0,0,0.05)"}
                      strokeWidth={isActive ? "4" : "1"}
                    />
                  </g>
                );
              })}

              {(() => {
                const activeAngle = (activeBead / config.beadCount) * 2 * Math.PI - Math.PI / 2;
                const arrowDist = 185; 
                const ax = 200 + arrowDist * Math.cos(activeAngle);
                const ay = 180 + arrowDist * Math.sin(activeAngle);
                const rotationDeg = (activeAngle * 180) / Math.PI - 90;
                return (
                  <g style={{ transform: `translate(${ax}px, ${ay}px) rotate(${rotationDeg}deg)`, transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <path d="M -8 11 L 0 0 L 8 11 Z" fill="#10B981" className="drop-shadow-lg" />
                  </g>
                );
              })()}
            </g>
          </svg>
        </div>
      </div>

      {/* 4. Navigation Controls (Pushed Down) */}
      <div className="w-full shrink-0 flex justify-center px-8 pb-4 mb-2">
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={prevBead}
            disabled={activeBead === 1}
            className="flex-1 bg-white border border-gray-100 text-gray-500 py-4 rounded-full font-black shadow-sm active:scale-95 disabled:opacity-30 transition-all text-[11px] uppercase tracking-widest"
          >
            Back
          </button>
          <button
            onClick={nextBead}
            disabled={activeBead === config.beadCount}
            className="flex-[1.5] text-white py-4 px-8 rounded-full font-black shadow-xl active:scale-95 disabled:opacity-30 transition-all text-[11px] uppercase tracking-[0.1em] hover:brightness-110"
            style={{ backgroundColor: config.bigBeadColor }}
          >
            Next Prayer
          </button>
        </div>
      </div>
    </div>
  );
}
