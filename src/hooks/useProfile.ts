"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. A LISTA MESTRA (HARDCODE BYPASS)
  // Qualquer e-mail aqui terá acesso Super-Admin absoluto, ignorando bloqueios da Base de Dados.
  const SUPER_ADMINS = [
    'programasabermais3ciclo@gmail.com', 
    'arch.medius@gmail.com'
  ];

  async function syncProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Tentamos ler a BD...
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        // 2. A INJECÇÃO DE AUTORIDADE
        const isMaster = SUPER_ADMINS.includes(user.email || '');
        
        let finalProfile = { ...(data || {}), email: user.email };

        // Se for o Arquiteto Jair, forçamos os dados para não dar erro de "null" e abrir o menu
        if (isMaster) {
          finalProfile.role = 'super-admin';
          finalProfile.status = 'aprovado';
          finalProfile.first_name = finalProfile.first_name || 'Coordenação';
          finalProfile.last_name = finalProfile.last_name || 'Saber Mais';
          finalProfile.specialization = finalProfile.specialization || 'Gestão Global';
          finalProfile.province = finalProfile.province || 'Nacional';
        }

        setProfile(finalProfile);
        console.log("PSM_FORCED_ACCESS: Cargo Activo ->", finalProfile.role);
      }
    } catch (err) {
      console.error("Erro crítico ignorado pela contingência:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    syncProfile();
  }, []);

  return { profile, loading, refresh: syncProfile };
}