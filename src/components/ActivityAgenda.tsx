'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, MapPin, Clock, User, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Activity = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  type: string;
  description: string; // Novo
  speaker: string;     // Novo
  link: string;        // Novo
};

export function ActivityAgenda() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('id', { ascending: true });

      if (!error) setActivities(data || []);
      setLoading(false);
    }
    fetchActivities();
  }, []);

  if (loading) return <div className="py-24 text-center text-neutral-500 uppercase font-bold text-xs">A carregar agenda...</div>;

  return (
    <section id="agenda" className="py-24 px-12 md:px-24 bg-white border-y border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 space-y-4">
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Agenda de Actividades</h2>
          <p className="text-neutral-500 max-w-md font-body">Calendário atualizado do programa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-black/10 rounded-none shadow-none hover:border-black transition-all bg-white h-full flex flex-col group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="border-black text-[10px] uppercase font-bold rounded-none group-hover:bg-black group-hover:text-white transition-colors">
                      {activity.type}
                    </Badge>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      {activity.status}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-black uppercase leading-tight group-hover:text-black">
                    {activity.title}
                  </CardTitle>
                  {activity.description && (
                    <p className="text-sm text-neutral-500 font-body mt-2 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-4 border-t border-black/5 flex-grow">
                   {/* Novo campo: Orador */}
                   {activity.speaker && (
                     <div className="flex items-center gap-3 text-sm font-bold uppercase text-black">
                        <User size={14} />
                        <span>{activity.speaker}</span>
                     </div>
                   )}

                   <div className="space-y-2">
                     <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <CalendarIcon size={14} />
                        <span>{activity.date}</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <Clock size={14} />
                        <span>{activity.time}</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm text-neutral-600">
                        <MapPin size={14} />
                        <span>{activity.location}</span>
                     </div>
                   </div>

                   {/* Novo campo: Link de Inscrição */}
                   {activity.link && (
                     <Button variant="outline" className="w-full rounded-none border-black hover:bg-black hover:text-white mt-4" asChild>
                       <a href={activity.link} target="_blank" rel="noopener noreferrer">
                         Saber Mais / Inscrição <ExternalLink size={14} className="ml-2" />
                       </a>
                     </Button>
                   )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}