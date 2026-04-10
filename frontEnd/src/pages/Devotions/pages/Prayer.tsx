import { useState, useEffect } from "react";

type RosaryType = "dominican" | "servite" | "franciscan" | "brigittine" | "divineMercy";

const rosaryConfigs: Record<RosaryType, {
  beadCount: number;
  bigBeads: number[];
  beadColor: string;
  bigBeadColor: string;
  prayers: string[];
}> = {
  dominican: {
    beadCount: 59,
    bigBeads: [1, 7, 11, 21, 31, 41, 51],
    beadColor: "#808080",
    bigBeadColor: "rgba(30,58,138,0.85)", // faded indigo
    prayers: ["Apostles’ Creed", "Our Father", "Hail Mary", "Glory Be"]
  },
  servite: {
    beadCount: 56,
    bigBeads: [1, 8, 15, 22, 29, 36, 43],
    beadColor: "#000000",
    bigBeadColor: "rgba(160,160,160,0.85)", // faded gray
    prayers: ["Seven Sorrows devotion"]
  },
  franciscan: {
    beadCount: 72,
    bigBeads: [1, 11, 21, 31, 41, 51, 61],
    beadColor: "#6B4423",
    bigBeadColor: "rgba(34,139,34,0.85)", // faded green
    prayers: ["Seven Joys devotion"]
  },
  brigittine: {
    beadCount: 70,
    bigBeads: [1, 11, 21, 31, 41, 51, 61],
    beadColor: "#D3D3D3",
    bigBeadColor: "rgba(70,130,180,0.85)", // faded steel blue
    prayers: ["St. Bridget devotion"]
  },
  divineMercy: {
    beadCount: 59,
    bigBeads: [1, 7, 11, 21, 31, 41, 51],
    beadColor: "#DC2626",
    bigBeadColor: "rgba(255,215,0,0.85)", // faded gold
    prayers: ["Divine Mercy Chaplet"]
  }
};

export default function RosaryTracker() {
  const [rosaryType, setRosaryType] = useState<RosaryType>("dominican");
  const [activeBead, setActiveBead] = useState(1);
  const [message, setMessage] = useState<string>("");

  const config = rosaryConfigs[rosaryType];

  useEffect(() => {
    const timer = setTimeout(() => {
      const prayer = config.bigBeads.includes(activeBead)
        ? config.prayers[1] || config.prayers[0]
        : config.prayers[2] || config.prayers[0];
      setMessage(prayer);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeBead, rosaryType]);

  const nextBead = () => {
    if (activeBead < config.beadCount) setActiveBead(activeBead + 1);
  };

  const prevBead = () => {
    if (activeBead > 1) setActiveBead(activeBead - 1);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-100 flex flex-col items-center p-6 space-y-6">
      
      {/* Rosary Type Selector */}
      <div className="flex gap-4 flex-wrap justify-center">
        {(["dominican","servite","franciscan","brigittine","divineMercy"] as RosaryType[]).map((type) => (
          <button
            key={type}
            onClick={() => { setRosaryType(type); setActiveBead(1); }}
            className={`px-4 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 ${
              rosaryType === type ? "bg-indigo-500 text-white" : "bg-white text-gray-800"
            }`}
          >
            {type === "dominican" ? "Dominican" :
             type === "servite" ? "Servite (Seven Sorrows)" :
             type === "franciscan" ? "Franciscan Crown" :
             type === "brigittine" ? "Brigittine" :
             "Divine Mercy"}
          </button>
        ))}
      </div>

      {/* Layout: SVG Rosary + Info Container */}
      <div className="flex gap-10 items-start w-full justify-center">
        
        {/* Rosary SVG */}
        <svg width="400" height="400" viewBox="0 0 400 400" className="flex-shrink-0">
          {/* Crucifix on the right side */}
          <rect x="380" y="190" width="15" height="40" fill="black" />
          <rect x="372" y="200" width="30" height="15" fill="black" />
          {/* Beads */}
          {Array.from({ length: config.beadCount }, (_, i) => {
            const beadId = i + 1;
            const isBig = config.bigBeads.includes(beadId);
            const angle = (beadId / config.beadCount) * 2 * Math.PI;
            const x = 200 + 150 * Math.cos(angle);
            const y = 200 + 150 * Math.sin(angle);
            return (
              <circle
                key={beadId}
                cx={x}
                cy={y}
                r={activeBead === beadId ? 14 : isBig ? 10 : 6}
                fill={
                  activeBead === beadId
                    ? "green"
                    : isBig
                    ? config.bigBeadColor
                    : config.beadColor
                }
                stroke="black"
                strokeWidth={activeBead === beadId ? 2 : 1}
                onClick={() => setActiveBead(beadId)}
                className="cursor-pointer transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Info Container */}
        <div
          className="rounded-lg shadow-lg p-6 w-80 text-white"
          style={{ backgroundColor: config.bigBeadColor }}
        >
          <h3 className="text-lg font-bold mb-2">{rosaryType.toUpperCase()} Rosary</h3>
          <p className="text-sm">Bead Number: {activeBead}</p>
          <p className="italic mt-2">Prayer: {message}</p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-6 mt-4">
        <button
          onClick={prevBead}
          disabled={activeBead === 1}
          className="px-6 py-3 rounded-full shadow-lg text-white transition-transform transform hover:scale-105 disabled:opacity-50"
          style={{ backgroundColor: config.bigBeadColor }}
        >
           Previous
        </button>
        <button
          onClick={nextBead}
          disabled={activeBead === config.beadCount}
          className="px-6 py-3 rounded-full shadow-lg text-white transition-transform transform hover:scale-105 disabled:opacity-50"
          style={{ backgroundColor: config.bigBeadColor }}
        >
          Next 
        </button>
      </div>
    </div>
  );
}
