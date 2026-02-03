"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";

const ACTIVITIES = [
  {
    id: 1,
    title: "Workshop de Metodologias Ativas",
    date: "24 MAI 2024",
    time: "09:00 - 13:00",
    location: "Luanda - INFQE",
    status: "Confirmado",
    type: "Workshop",
  },
  {
    id: 2,
    title: "Sessão de Formação: Inovação Pedagógica",
    date: "28 MAI 2024",
    time: "14:30 - 17:30",
    location: "Online (Zoom)",
    status: "Inscrições Abertas",
    type: "Formação",
  },
  {
    id: 3,
    title: "Conferência Regional de Educação",
    date: "02 JUN 2024",
    time: "08:30 - 18:00",
    location: "Auditório Camões",
    status: "Pendente",
    type: "Conferência",
  }
];

export function ActivityAgenda() {
  return (
    <section id="agenda" className="py-24 px-12 md:px-24 bg-white border-y border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
              Agenda de Actividades
            </h2>
            <p className="text-neutral-500 max-w-md font-body">
              Acompanhe o calendário completo de formações, eventos e workshops do programa.
            </p>
          </div>
          <div className="text-right">
            <span className="font-headline text-8xl font-black text-black/5 leading-none select-none">AGENDA</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ACTIVITIES.map((activity) => (
            <Card key={activity.id} className="border-black/10 rounded-none shadow-none hover:border-black transition-colors group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="border-black text-[10px] uppercase font-bold tracking-widest rounded-none">
                    {activity.type}
                  </Badge>
                  <span className="text-xs font-headline font-bold text-neutral-400">
                    {activity.status}
                  </span>
                </div>
                <CardTitle className="text-xl font-black uppercase group-hover:underline underline-offset-4 decoration-1">
                  {activity.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 border-t border-black/5">
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <CalendarIcon size={16} className="text-black" />
                  <span className="font-medium">{activity.date}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <Clock size={16} className="text-black" />
                  <span>{activity.time}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <MapPin size={16} className="text-black" />
                  <span>{activity.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
