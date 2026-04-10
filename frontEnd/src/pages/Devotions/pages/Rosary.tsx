import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa"; // ✅ only Back icon is used
import { marianMysteries } from "../data/mysteries/marian";
import { sevenSorrows } from "../data/mysteries/sevenSorrows";
import { reparationMysteries } from "../data/mysteries/reparation";
import { archangelMichaelMysteries } from "../data/mysteries/archangelMichael";
import { divineMercyMysteries } from "../data/mysteries/divineMercyMysteries ";

// ✅ Types
type Mystery = {
  title: string;
  scripture?: string;
  fruit?: string;
  english?: string;
  kiswahili?: string;
};
type MarianKey = "joyful" | "sorrowful" | "glorious" | "luminous";

export default function Rosary() {
  const [rosaryType, setRosaryType] = useState("");
  const [proceed, setProceed] = useState(false);
  const [selectedMystery, setSelectedMystery] = useState<string | null>(null);

  const rosaryOptions = [
    "Marian Rosary",
    "Divine Mercy",
    "7 Sorrows",
    "Archangel Michael",
    "Reparation",
  ];

  const bgMap: Record<string, string> = {
    "Marian Rosary": "bg-blue-100",
    "Divine Mercy": "bg-purple-100",
    "7 Sorrows": "bg-gray-200",
    "Archangel Michael": "bg-yellow-100",
    "Reparation": "bg-red-100",
  };

  // ✅ Centralized dataset selection
  const getData = (): Mystery[] | string[] => {
    switch (rosaryType) {
      case "Marian Rosary":
        if (selectedMystery) {
          const key = selectedMystery.toLowerCase() as MarianKey;
          return marianMysteries[key] || [];
        }
        return Object.keys(marianMysteries);

      case "7 Sorrows":
        return selectedMystery
          ? sevenSorrows.filter((m) => m.title === selectedMystery)
          : sevenSorrows.map((m) => m.title);

      case "Archangel Michael":
        return selectedMystery
          ? archangelMichaelMysteries.filter((m) => m.title === selectedMystery)
          : archangelMichaelMysteries.map((m) => m.title);

      case "Reparation":
        return selectedMystery
          ? reparationMysteries.filter((m) => m.title === selectedMystery)
          : reparationMysteries.map((m) => m.title);

      case "Divine Mercy":
        return selectedMystery
          ? divineMercyMysteries.filter((m) => m.title === selectedMystery)
          : divineMercyMysteries.map((m) => m.title);

      default:
        return [];
    }
  };

  const data = getData();

  // First screen: choose rosary type
  if (!proceed) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Rosary Prayer</h2>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Left: Avatar + Intro */}
          <div className="flex flex-col items-center text-center md:text-left md:w-1/2">
            <img
              src="../src/assets/Images/rosary-praying-avatar.png"
              alt="Rosary Praying Avatar"
              className="w-40 h-auto sm:w-56 md:w-64 lg:w-72 xl:w-80 object-contain mx-auto"
            />
            <p className="text-gray-700 italic mt-4">
              Take a moment of peace. Choose your devotion and let’s begin.
            </p>
            <p className="text-gray-700 mt-2">
              Liturgical Season: Ordinary Time <br />
              Week: 2nd Week
            </p>
          </div>

          {/* Right: Selection */}
          <div className="md:w-1/2 w-full relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rosaryOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => setRosaryType(opt)}
                  className={`cursor-pointer rounded-lg p-4 shadow-md hover:shadow-lg transition 
                    ${bgMap[opt]} 
                    ${rosaryType === opt ? "ring-2 ring-pink-600" : ""}`}
                >
                  <h3 className="font-semibold text-lg mb-2">{opt}</h3>
                  <p className="text-gray-700 text-sm">
                    {opt === "Marian Rosary" && "Meditate on the mysteries of Christ and Mary."}
                    {opt === "Divine Mercy" && "Trust in God’s infinite mercy."}
                    {opt === "7 Sorrows" && "Walk with Mary through her sorrows."}
                    {opt === "Archangel Michael" && "Honor St. Michael and the angelic choirs."}
                    {opt === "Reparation" && "Offer prayers in reparation for sins."}
                  </p>
                </div>
              ))}
            </div>

            {rosaryType && (
              <div className="absolute right-0 mt-4">
                <button
                  onClick={() => setProceed(true)}
                  className="bg-pink-600 text-white px-6 py-3 rounded hover:bg-pink-700 shadow-md transition"
                >
                  Begin Prayer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Second screen: list mysteries
  if (!selectedMystery) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-4">
          <button
            onClick={() => {
              setProceed(false);
              setRosaryType("");
            }}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 shadow-md transition"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-4">{rosaryType}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {(data as string[]).map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedMystery(item)}
              className={`cursor-pointer rounded-lg p-4 shadow-md hover:shadow-lg transition ${bgMap[rosaryType]}`}
            >
              <h3 className="font-semibold mb-2">{item}</h3>
              <p className="text-gray-700">Click to enter this mystery.</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Third screen: show details
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <button
          onClick={() => setSelectedMystery(null)}
          className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 shadow-md transition"
        >
          <FaArrowLeft /> Back
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-4">{selectedMystery}</h2>

      <div className="space-y-6">
        {(data as Mystery[]).map((item, idx) => (
          <div
            key={idx}
            className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-semibold mb-2">{item.title}</h3>
            {item.scripture && (
              <p className="text-sm text-gray-500 mb-2">
                <strong>Scripture:</strong> {item.scripture}
              </p>
            )}
            {item.fruit && (
              <p className="text-sm text-gray-500 mb-2">
                <strong>Fruit:</strong> {item.fruit}
              </p>
            )}
            {item.english && <p className="text-gray-700 mb-2">{item.english}</p>}
            {item.kiswahili && <p className="text-gray-600 italic">{item.kiswahili}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
