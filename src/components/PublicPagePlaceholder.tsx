export function PublicPagePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex-1 border border-white/15 rounded-lg px-6 py-16 flex flex-col items-center justify-center text-center gap-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-white/50 text-sm">Página em construção.</p>
    </div>
  );
}
