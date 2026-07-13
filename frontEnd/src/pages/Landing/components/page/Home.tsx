import ImageSlider from "../ImageSlider";
import { AboutSection, CommunitySection, SupportSection, SuggestionBox, GalleryTeaser } from "../sections";
import { LiturgicalTicker } from "../LiturgicalTicker";
import { useLiturgicalCalendar } from "../../../../hooks/useLiturgicalCalendar";
import { useAuth } from "../../../../context/AuthContext";

export const Home: React.FC = () => {
  const { data } = useLiturgicalCalendar();
  const { isAuthenticated } = useAuth();
  
  let themeClass = "bg-gray-50";
  if (data && data.celebrations.length > 0) {
    const color = data.celebrations[0].colour.toLowerCase();
    if (color === "red") themeClass = "bg-red-50/30";
    if (color === "purple") themeClass = "bg-purple-50/30";
    if (color === "green") themeClass = "bg-green-50/30";
    if (color === "white") themeClass = "bg-amber-50/30";
    if (color === "rose") themeClass = "bg-rose-50/30";
  }

  return (
    <div className={`flex flex-col min-h-screen ${themeClass} transition-colors duration-1000`}>
      <LiturgicalTicker />
      <main className="flex-grow">
        <ImageSlider />
        <AboutSection />
        <GalleryTeaser />
        <CommunitySection />
        {isAuthenticated && <SuggestionBox />}
        <SupportSection />
      </main>
    </div>
  );
};
