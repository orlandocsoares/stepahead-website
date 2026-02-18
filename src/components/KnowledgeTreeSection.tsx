'use client';

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, easeInOut } from "framer-motion";

export function KnowledgeTreeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end end"] });
  const smoothProgress = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });
  
  const easedProgress = useTransform(smoothProgress, [0, 1], [0, 1], { ease: easeInOut });
  const opacity = useTransform(smoothProgress, [0, 0.2], [0, 1]);
  const filter = useTransform(smoothProgress, [0, 0.25], ["blur(32px)", "blur(0px)"]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.load();
      video.onloadedmetadata = () => setDuration(video.duration);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = easedProgress.on("change", (v) => {
      if (videoRef.current && duration) {
        const time = v * duration;
        if (isFinite(time)) videoRef.current.currentTime = time;
      }
    });
    return () => unsubscribe();
  }, [duration, easedProgress]);

  return (
    <section ref={containerRef} className="relative h-[400vh] -mt-[100vh] z-0 pointer-events-none">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-auto">
        <motion.div style={{ opacity, filter }} className="relative w-full h-full">
           <video ref={videoRef} muted playsInline className="w-full h-full object-cover" preload="auto">
             <source src="https://qwaoeikvwwthlgcpagyz.supabase.co/storage/v1/object/public/Knowledge%20tree/Arvore%20do%20conhecimento.mp4" type="video/mp4" />
           </video>
        </motion.div>
      </div>
    </section>
  );
}
