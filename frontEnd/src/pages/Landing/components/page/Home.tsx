import ImageSlider from "../ImageSlider";
import { AboutSection, SupportSection } from "../sections";

export const Home: React.FC = () => {

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <ImageSlider />
        <AboutSection />
        <SupportSection />
      </main>
    </div>
  );
};