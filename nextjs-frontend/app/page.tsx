import BenefitsSection from "@/components/BenefitsSection";
import ContactSection from "@/components/ContactSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        <section id="home" className="pt-24">
          <HeroSection />
        </section>
        <section id="features">
          <FeaturesSection />
        </section>
        <section id="benefits">
          <BenefitsSection />
        </section>
        <section id="contact">
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  );
}
