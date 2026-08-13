import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import heroImage from "@/assets/hero-yoglait.png";
import banana from "@/assets/flavour-banana.png";
import strawberry from "@/assets/flavour-strawberry.png";
import vanilla from "@/assets/flavour-vanilla.png";
import plain from "@/assets/flavour-plain.png";

const slides = [
  { src: heroImage, alt: "Yoglait drinking yoghurt pouch and probiotic tub" },
  { src: strawberry, alt: "Yoglait strawberry drinking yoghurt pouch" },
  { src: banana, alt: "Yoglait banana drinking yoghurt pouch" },
  { src: vanilla, alt: "Yoglait vanilla drinking yoghurt pouch" },
  { src: plain, alt: "Yoglait plain drinking yoghurt pouch" },
];

/** Cascading hero images that swipe in from the right and out to the left. */
export function HeroCarousel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return undefined;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[16rem] sm:max-w-sm">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.img
          key={index}
          src={slides[index]!.src}
          alt={slides[index]!.alt}
          width={1024}
          height={1024}
          fetchPriority={index === 0 ? "high" : "low"}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 90, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: -90, scale: 0.94 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_28px_35px_rgba(23,50,77,0.25)]"
        />
      </AnimatePresence>

      <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.alt}
            type="button"
            aria-label={`Show image ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === index ? "w-5 bg-primary" : "w-1.5 bg-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
