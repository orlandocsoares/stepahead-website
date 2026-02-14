import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { KnowledgeTreeSection } from "@/components/KnowledgeTreeSection";
import { ActivityAgenda } from "@/components/ActivityAgenda";
import { DocumentRepository } from "@/components/DocumentRepository";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen relative bg-black">
      <Navbar />
      <HeroSection />
      <KnowledgeTreeSection />
      <ActivityAgenda />
      <DocumentRepository />
      <Footer />
    </main>
  );
}