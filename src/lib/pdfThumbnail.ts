// Gera uma miniatura (JPEG) a partir da 1ª página de um PDF, sempre via <canvas> —
// nunca <embed>/<iframe>, que em vários browsers dispara o download nativo do ficheiro.
//
// pdfjs-dist é importado dinamicamente (só quando esta função corre, no browser).
// Um import estático no topo do ficheiro faz o Next tentar avaliar o módulo também
// no SSR, onde o pdfjs-dist tenta carregar o binário nativo `canvas` do Node e falha.
export async function gerarMiniaturaPdf(source: File | string, maxWidth = 480): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const loadingTask = source instanceof File
      ? pdfjsLib.getDocument({ data: await source.arrayBuffer() })
      : pdfjsLib.getDocument(source);

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport }).promise;

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82);
    });
  } catch {
    return null;
  }
}
