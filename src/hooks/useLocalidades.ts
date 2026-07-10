"use client";

import { useEffect, useState } from "react";

type Municipio = { id: string; nome: string };
type ProvinciaComMunicipios = { id: string; nome: string; municipios: Municipio[] };

let cache: ProvinciaComMunicipios[] | null = null;
let cachePromise: Promise<ProvinciaComMunicipios[]> | null = null;

function fetchLocalidades(): Promise<ProvinciaComMunicipios[]> {
  if (cache) return Promise.resolve(cache);
  if (!cachePromise) {
    cachePromise = fetch("/api/localidades")
      .then(r => r.json())
      .then(({ data }): ProvinciaComMunicipios[] => { cache = data ?? []; return cache!; })
      .catch((): ProvinciaComMunicipios[] => { cachePromise = null; return []; });
  }
  return cachePromise;
}

// Divisão político-administrativa de Angola (Lei n.º 14/24) — 21 províncias, 326 municípios.
export function useLocalidades() {
  const [provincias, setProvincias] = useState<ProvinciaComMunicipios[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let mounted = true;
    fetchLocalidades().then(data => {
      if (mounted) { setProvincias(data); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  const nomesProvincias = provincias.map(p => p.nome);
  function getMunicipios(nomeProvincia?: string | null): string[] {
    if (!nomeProvincia) return [];
    return provincias.find(p => p.nome === nomeProvincia)?.municipios.map(m => m.nome) ?? [];
  }

  return { provincias: nomesProvincias, getMunicipios, loading };
}
