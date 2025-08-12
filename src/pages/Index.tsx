
import { HeroSection } from "@/components/ui/hero-section-dark";

const Index = () => {
  return (
    <HeroSection
      title="AI-Powered Content Creation"
      subtitle={{
        regular: "Transform your ideas into ",
        gradient: "stunning visuals and videos",
      }}
      description="Generate high-quality images and videos using advanced AI models. From static images to dynamic animations, bring your creative vision to life."
      ctaText="Start Creating"
      ctaHref="#"
      bottomImage={{
        light: "https://farmui.vercel.app/dashboard-light.png",
        dark: "https://farmui.vercel.app/dashboard.png",
      }}
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#2a2a2a",
      }}
    />
  );
};

export default Index;
