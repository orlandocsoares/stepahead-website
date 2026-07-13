"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export function PdfViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const onLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-400">
      <p className="text-sm">Não foi possível carregar o documento.</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3 select-none" onContextMenu={e => e.preventDefault()}>
      {loading && (
        <div className="flex items-center gap-2 text-slate-400 py-8">
          <Loader2 size={18} className="animate-spin" /> A carregar...
        </div>
      )}

      <Document file={url} onLoadSuccess={onLoad} onLoadError={onError}
        loading={null} className="max-w-full">
        <Page pageNumber={page} scale={scale}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="shadow-lg rounded" />
      </Document>

      {numPages > 0 && (
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur rounded-full px-4 py-2">
          {/* Zoom */}
          <button onClick={() => setScale(s => Math.max(0.6, s - 0.2))}
            className="p-1 text-white/70 hover:text-white transition-colors" title="Reduzir">
            <ZoomOut size={15} />
          </button>
          <span className="text-white/50 text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(2.5, s + 0.2))}
            className="p-1 text-white/70 hover:text-white transition-colors" title="Aumentar">
            <ZoomIn size={15} />
          </button>

          <div className="w-px h-4 bg-white/20" />

          {/* Navegação */}
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="p-1 text-white/70 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-white text-xs tabular-nums">{page} / {numPages}</span>
          <button onClick={() => setPage(p => Math.min(numPages, p + 1))} disabled={page >= numPages}
            className="p-1 text-white/70 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
