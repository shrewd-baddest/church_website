import { useState, useEffect } from "react";
import { FaBible, FaBookOpen, FaMusic, FaShareAlt } from "react-icons/fa";

const weeklyReadings = [
  {
    day: "Sunday",
    verse: "I am the resurrection and the life. Whoever believes in me, though he die, yet shall he live.",
    source: "John 11:25",
    first: { ref: "Acts 10:34-43", text: "Peter opened his mouth and said: 'Truly I understand that God shows no partiality, but in every nation anyone who fears him and does what is right is acceptable to him...'" },
    second: { ref: "Colossians 3:1-4", text: "If then you have been raised with Christ, seek the things that are above, where Christ is, seated at the right hand of God..." },
    psalm: { ref: "Psalm 118", text: "This is the day that the Lord has made; let us rejoice and be glad in it. Give thanks to the Lord, for he is good; his steadfast love endures forever!" },
  },
  {
    day: "Monday",
    verse: "Let your light shine before others, so that they may see your good works and give glory to your Father who is in heaven.",
    source: "Matthew 5:16",
    first: { ref: "Isaiah 1:10-17", text: "Hear the word of the Lord, you rulers of Sodom! Give ear to the teaching of our God, you people of Gomorrah! 'What to me is the multitude of your sacrifices? says the Lord... Learn to do good; seek justice, correct oppression; bring justice to the fatherless, plead the widow's cause.'" },
    second: { ref: "Hebrews 10:19-25", text: "Therefore, brothers, since we have confidence to enter the holy places by the blood of Jesus, by the new and living way that he opened for us through the curtain... let us draw near with a true heart in full assurance of faith..." },
    psalm: { ref: "Psalm 50", text: "The Mighty One, God the Lord, speaks and summons the earth from the rising of the sun to its setting. Out of Zion, the perfection of beauty, God shines forth." },
  },
  {
    day: "Tuesday",
    verse: "Blessed are the pure in heart, for they shall see God.",
    source: "Matthew 5:8",
    first: { ref: "Ezekiel 18:1-10", text: "The word of the Lord came to me: 'What do you mean by repeating this proverb concerning the land of Israel: The fathers have eaten sour grapes, and the children's teeth are set on edge? As I live, declares the Lord God, this proverb shall no more be used by you in Israel... The soul who sins shall die.'" },
    second: { ref: "James 1:22-27", text: "But be doers of the word, and not hearers only, deceiving yourselves. For if anyone is a hearer of the word and not a doer, he is like a man who looks intently at his natural face in a mirror..." },
    psalm: { ref: "Psalm 24", text: "The earth is the Lord's and the fullness thereof, the world and those who dwell therein, for he has founded it upon the seas and established it upon the rivers." },
  },
  {
    day: "Wednesday",
    verse: "Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.",
    source: "Matthew 7:7",
    first: { ref: "Jeremiah 29:11-14", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope. Then you will call upon me and come and pray to me, and I will hear you." },
    second: { ref: "Romans 8:26-30", text: "Likewise the Spirit helps us in our weakness. For we do not know what to pray for as we ought, but the Spirit himself intercedes for us with groanings too deep for words..." },
    psalm: { ref: "Psalm 145", text: "The Lord is near to all who call on him, to all who call on him in truth. He fulfills the desire of those who fear him; he also hears their cry and saves them." },
  },
  {
    day: "Thursday",
    verse: "I can do all things through him who strengthens me.",
    source: "Philippians 4:13",
    first: { ref: "Deuteronomy 31:1-8", text: "So Moses continued to speak these words to all Israel. 'Be strong and courageous. Do not fear or be in dread of them, for it is the Lord your God who goes with you. He will not leave you or forsake you.'" },
    second: { ref: "Ephesians 6:10-18", text: "Finally, be strong in the Lord and in the strength of his might. Put on the whole armor of God, that you may be able to stand against the schemes of the devil..." },
    psalm: { ref: "Psalm 27", text: "The Lord is my light and my salvation; whom shall I fear? The Lord is the stronghold of my life; of whom shall I be afraid?" },
  },
  {
    day: "Friday",
    verse: "Greater love has no one than this, that someone lay down his life for his friends.",
    source: "John 15:13",
    first: { ref: "Isaiah 53:1-12", text: "Surely he has borne our griefs and carried our sorrows; yet we esteemed him stricken, smitten by God, and afflicted. But he was pierced for our transgressions; he was crushed for our iniquities..." },
    second: { ref: "1 Peter 2:19-25", text: "For this is a gracious thing, when, mindful of God, one endures sorrows while suffering unjustly. For what credit is it if, when you sin and are beaten for it, you endure? But if when you do good and suffer for it you endure, this is a gracious thing in the sight of God." },
    psalm: { ref: "Psalm 22", text: "My God, my God, why have you forsaken me? Why are you so far from saving me, from the words of my groaning? O my God, I cry by day, but you do not answer, and by night, but I find no rest." },
  },
  {
    day: "Saturday",
    verse: "Come to me, all who labor and are heavy laden, and I will give you rest.",
    source: "Matthew 11:28",
    first: { ref: "Exodus 33:12-17", text: "Moses said to the Lord, 'See, you say to me, Bring up this people, but you have not let me know whom you will send with me...' And the Lord said to Moses, 'This very thing that you have spoken I will do, for you have found favor in my sight, and I know you by name.'" },
    second: { ref: "Hebrews 4:1-11", text: "Therefore, while the promise of entering his rest still stands, let us fear lest any of you should seem to have failed to reach it. For good news came to us just as to them, but the message they heard did not benefit them..." },
    psalm: { ref: "Psalm 62", text: "For God alone my soul waits in silence; from him comes my salvation. He alone is my rock and my salvation, my fortress; I shall not be greatly shaken." },
  },
];

export default function Readings() {
  type SectionType = "first" | "second" | "psalm" | null;
  const [openSection, setOpenSection] = useState<SectionType>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayIndex = new Date().getDay();
  const todayReading = weeklyReadings[todayIndex];

  const toggleSection = (section: SectionType): void => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Verse of the Day",
        text: `${todayReading.verse} (${todayReading.source})`,
      });
    }
  };

  const getMessage = () => {
    if (!openSection) return "Take a quiet moment with God's word today.";
    switch (openSection) {
      case "first": return "The first reading speaks — listen with your heart.";
      case "second": return "Let this message strengthen your faith.";
      case "psalm": return "Pray this slowly — let it become your voice.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-10">
      <div className="relative w-full max-w-3xl">
        <div
          className={`absolute z-20 flex flex-col items-end 
          right-[-10px] sm:right-[-20px] top-0 transition-all duration-1000
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="relative mb-2">
            <div className="bg-white/90 backdrop-blur-md text-gray-700 text-[11px] sm:text-xs px-3 py-2 rounded-xl shadow-lg border border-gray-200 max-w-[160px] sm:max-w-[200px] animate-fadeIn">
              {getMessage()}
            </div>
            <div className="absolute bottom-[-5px] right-6 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-200"></div>
          </div>
          <img
            src="../src/assets/images/read-you-bible.png"
            alt="Guide"
            className="w-16 sm:w-20 drop-shadow-xl animate-float"
          />
        </div>

        <div className="text-center mb-2">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{todayReading.day}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
          Verse of the Day
        </h2>

        <div className="backdrop-blur-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-10">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-4 rounded-2xl shadow-lg">
              <img src="/src/assets/bible.svg" className="w-12 h-12" />
            </div>

            <div className="flex-1">
              <p className="italic text-lg sm:text-xl text-gray-700">
                "{todayReading.verse}"
              </p>

              <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
                <span className="bg-indigo-100 text-indigo-700 text-xs sm:text-sm px-4 py-1 rounded-full">
                  {todayReading.source}
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

          <div className="space-y-4">
            {[
              { key: "first" as const, title: "First Reading", icon: <FaBible />, color: "indigo", ref: todayReading.first.ref, text: todayReading.first.text },
              { key: "second" as const, title: "Second Reading", icon: <FaBookOpen />, color: "green", ref: todayReading.second.ref, text: todayReading.second.text },
              { key: "psalm" as const, title: "Responsorial Psalm", icon: <FaMusic />, color: "yellow", ref: todayReading.psalm.ref, text: todayReading.psalm.text },
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
                    onClick={() => toggleSection(section.key)}
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

      <style>
        {`
          @keyframes float {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          .animate-float { animation: float 4s ease-in-out infinite; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fadeIn { animation: fadeIn 0.4s ease-in-out; }
        `}
      </style>
    </div>
  );
}
