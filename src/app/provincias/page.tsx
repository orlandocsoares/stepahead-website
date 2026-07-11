import { PublicSideMenu } from "@/components/PublicSideMenu";
import { PublicPagePlaceholder } from "@/components/PublicPagePlaceholder";

export default function ProvinciasPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-6 py-10">
      <div className="mx-auto max-w-5xl flex flex-col md:flex-row gap-6">
        <PublicSideMenu />
        <PublicPagePlaceholder title="Províncias" />
      </div>
    </main>
  );
}
