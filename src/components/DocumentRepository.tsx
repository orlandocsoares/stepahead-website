'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from 'next/link';

type Document = {
  id: number;
  title: string;
  category: string;
  file_url: string;
};

export function DocumentRepository() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function initialize() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .order('id', { ascending: true });
        if (!error) setDocuments(data || []);
      }
      setLoading(false);
    }
    initialize();
  }, []);

  return (
    <section id="documentacao" className="py-24 px-12 md:px-24 bg-neutral-50 border-y border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Documentação</h2>
          <p className="text-neutral-500 mt-4 font-body">Recursos exclusivos para membros autorizados.</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-400 font-bold uppercase text-xs">A carregar...</div>
        ) : !user ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-black text-white p-12 text-center space-y-6">
            <Lock size={48} className="mx-auto opacity-30" />
            <h3 className="text-2xl font-black uppercase">Área Reservada</h3>
            <Button asChild className="bg-white text-black hover:bg-neutral-200 font-bold rounded-none">
              <Link href="/login">Fazer Login para Aceder</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, index) => (
              <Card key={doc.id} className="group hover:border-black transition-all border-black/10 rounded-none shadow-none">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText size={24} className="group-hover:text-black" />
                    <div>
                      <h3 className="font-bold uppercase leading-tight">{doc.title}</h3>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase rounded-none">{doc.category}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" className="rounded-none" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download size={18} /></a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}