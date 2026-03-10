import { useState } from "react";
import { FaBible, FaBookOpen, FaMusic, FaShareAlt } from "react-icons/fa";

export default function Readings() {
  type SectionType = "first" | "second" | "psalm" | null;
  const [openSection, setOpenSection] = useState<SectionType>(null);

  const toggleSection = (section: SectionType): void => {
    setOpenSection(openSection === section ? null : section);
  };

  const verseText =
    "The Lord is my light and my salvation—whom shall I fear?";
  const verseSource = "Psalm 27:1";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Verse of the Day",
        text: `${verseText} (${verseSource})`,
      });
    } else {
      alert("Sharing is not supported on this device.");
    }
  };

  return (
    <div className="flex flex-col items-center px-4 sm:px-6 md:px-8">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 text-center">
        Verse of the Day
      </h2>

      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-xl rounded-2xl p-6 max-w-3xl w-full border border-indigo-200">
        {/* Verse Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8">
          <img
            src="/src/assets/bible.svg"
            alt="Bible"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md"
          />
          <div className="border-l-4 border-indigo-500 pl-4 flex-1">
            <p className="italic text-base sm:text-lg text-gray-700 text-center sm:text-left">
              "{verseText}"
            </p>

            {/* Inspiration Badge + Share Button */}
            <div className="flex flex-col sm:flex-row items-center sm:justify-between mt-3 gap-3">
              <span className="inline-block bg-indigo-200 text-indigo-800 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                {verseSource}
              </span>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg shadow hover:bg-indigo-700 transition"
              >
                <FaShareAlt /> Share
              </button>
            </div>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-5">
          {/* First Reading */}
          <div>
            <button
              onClick={() => toggleSection("first")}
              className="flex items-center justify-between w-full text-left p-4 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition shadow-sm"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-800 text-base">
                <FaBible className="text-indigo-600" /> First Reading
              </span>
              <span className="text-lg">{openSection === "first" ? "−" : "+"}</span>
            </button>
            {openSection === "first" && (
              <div className="mt-3 p-4 text-gray-700 bg-white rounded-lg shadow-inner border-l-4 border-indigo-400">
                <p className="font-semibold">Wisdom 2:12-20</p>
                <p className="italic mt-2">
                  "Let us lie in wait for the righteous man, because he is inconvenient to us..."
                </p>
              </div>
            )}
          </div>

          {/* Second Reading */}
          <div>
            <button
              onClick={() => toggleSection("second")}
              className="flex items-center justify-between w-full text-left p-4 rounded-lg bg-green-100 hover:bg-green-200 transition shadow-sm"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-800 text-base">
                <FaBookOpen className="text-green-600" /> Second Reading
              </span>
              <span className="text-lg">{openSection === "second" ? "−" : "+"}</span>
            </button>
            {openSection === "second" && (
              <div className="mt-3 p-4 text-gray-700 bg-white rounded-lg shadow-inner border-l-4 border-green-400">
                <p className="font-semibold">Romans 8:31-39</p>
                <p className="italic mt-2">"If God is for us, who can be against us?"</p>
              </div>
            )}
          </div>

          {/* Responsorial Psalm */}
          <div>
            <button
              onClick={() => toggleSection("psalm")}
              className="flex items-center justify-between w-full text-left p-4 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition shadow-sm"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-800 text-base">
                <FaMusic className="text-yellow-600" /> Responsorial Psalm
              </span>
              <span className="text-lg">{openSection === "psalm" ? "−" : "+"}</span>
            </button>
            {openSection === "psalm" && (
              <div className="mt-3 p-4 text-gray-700 bg-white rounded-lg shadow-inner border-l-4 border-yellow-400">
                <p className="font-semibold">Psalm 27</p>
                <p className="italic mt-2">
                  "The Lord is my light and my salvation—whom shall I fear?"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}