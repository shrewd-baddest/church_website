import { useState } from "react";
import { FaArrowRight } from "react-icons/fa";

export default function Rosary() {
  const [rosaryType, setRosaryType] = useState("");
  const [proceed, setProceed] = useState(false);

  const rosaryOptions = [
    "Marian Rosary",
    "Divine Mercy",
    "7 Sorrows",
    "Archangel Michael",
    "Reparation",
  ];

  // Static subprayers/mysteries for each rosary type
  const rosaryData: Record<string, string[]> = {
    "Marian Rosary": [
      "Joyful Mysteries",
      "Sorrowful Mysteries",
      "Glorious Mysteries",
      "Luminous Mysteries",
    ],
    "Divine Mercy": [
      "Opening Prayer",
      "Our Father",
      "Hail Mary",
      "Apostles’ Creed",
      "Eternal Father",
      "For the sake of His sorrowful Passion...",
    ],
    "7 Sorrows": [
      "Prophecy of Simeon",
      "Flight into Egypt",
      "Loss of the Child Jesus",
      "Mary meets Jesus carrying the Cross",
      "Crucifixion of Jesus",
      "Body of Jesus placed in Mary’s arms",
      "Burial of Jesus",
    ],
    "Archangel Michael": [
      "Invocation to the Nine Choirs of Angels",
      "Prayers to Seraphim",
      "Prayers to Cherubim",
      "Prayers to Thrones",
      "Prayers to Dominions",
      "Prayers to Virtues",
      "Prayers to Powers",
      "Prayers to Principalities",
      "Prayers to Archangels",
      "Prayers to Angels",
    ],
    "Reparation": [
      "Act of Contrition",
      "Prayers for Forgiveness",
      "Meditation on Christ’s Passion",
      "Offering for Sins",
    ],
  };

  if (!proceed) {
    // First screen: choose rosary type
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Rosary Prayer</h2>
        <p className="text-gray-700 mb-2">Liturgical Season: Ordinary Time</p>
        <p className="text-gray-700 mb-4">Week: 2nd Week</p>

        <label className="block mb-2 font-semibold">Choose Rosary Type:</label>
        <select
          value={rosaryType}
          onChange={(e) => setRosaryType(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">-- Select Rosary --</option>
          {rosaryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {rosaryType && (
          <button
            onClick={() => setProceed(true)}
            className="mt-6 flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 transition"
          >
            Proceed <FaArrowRight />
          </button>
        )}
      </div>
    );
  }

  // Second screen: show subprayers/mysteries for chosen rosary
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{rosaryType}</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {rosaryData[rosaryType]?.map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-50 border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <h3 className="font-semibold mb-2">Step {idx + 1}</h3>
            <p className="text-gray-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
