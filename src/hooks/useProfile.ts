"use client";

import { useEffect, useState, useCallback } from 'react';

// Este hook é agora a única fonte de verdade para o perfil do utilizador no lado do cliente.
// Ele busca os dados da sua API local, que por sua vez usa a sua base de dados local.
export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // A função para buscar/refrescar o perfil é envolvida em useCallback.
  const syncProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Em vez de chamar o Supabase, chamamos a nossa API local.
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const { profile: userProfile } = await res.json();
      setProfile(userProfile);
    } catch (err) {
      console.error("Erro ao buscar o perfil do utilizador:", err);
      setProfile(null); // Limpa o perfil em caso de erro de rede
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncProfile();
  }, [syncProfile]);

  return { profile, loading, refresh: syncProfile };
}