import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { fetchActiveAnnouncement, type Announcement } from "@/lib/announcements";
import { EASE_OUT } from "@/lib/motion";

const DISMISSED_KEY = "yoglait_dismissed_announcement_id";

/** Fetches the single active announcement (if any) and shows it as a one-time
 * popup on site visit. Persists which announcement id was last dismissed in
 * localStorage so it doesn't reappear on every page nav within the same
 * visit — it only pops up again once a *different* announcement goes live. */
export function AnnouncementPopup() {
  const reduce = useReducedMotion();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchActiveAnnouncement().then((a) => {
      if (!active || !a) return;
      const lastDismissedId =
        typeof window !== "undefined" ? window.localStorage.getItem(DISMISSED_KEY) : null;
      if (lastDismissedId === a.id) return;
      setAnnouncement(a);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleDismiss = () => {
    if (announcement) window.localStorage.setItem(DISMISSED_KEY, announcement.id);
    setDismissed(true);
  };

  const show = announcement && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-title"
          onClick={handleDismiss}
        >
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-4xl bg-card p-6 text-center shadow-float"
          >
            {announcement!.type === "advert" && !reduce && (
              <motion.div
                aria-hidden="true"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 18, ease: "linear", repeat: Infinity }}
                className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-25"
              >
                <GoldenRays />
              </motion.div>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-secondary/60 text-muted-foreground transition-transform duration-150 hover:scale-110"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {announcement!.image_url && (
              <img
                src={announcement!.image_url}
                alt=""
                className="mx-auto mb-4 h-32 w-32 rounded-3xl object-cover shadow-soft"
              />
            )}

            <p id="announcement-title" className="font-display text-xl font-bold">
              {announcement!.title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{announcement!.body}</p>

            <button
              type="button"
              onClick={handleDismiss}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Radiating-rays sunburst shown behind the popup card for `advert`
 * announcements. Plain SVG (not an image) — no extra asset or network
 * request, and it colors via a Tailwind text-color class. */
function GoldenRays() {
  const rayCount = 16;
  const rays = Array.from({ length: rayCount });
  return (
    <svg viewBox="0 0 400 400" className="h-[520px] w-[520px] text-amber-400">
      {rays.map((_, i) => {
        const angle = (360 / rayCount) * i;
        return (
          <rect
            key={i}
            x="196"
            y="0"
            width="8"
            height="200"
            fill="currentColor"
            transform={`rotate(${angle} 200 200)`}
          />
        );
      })}
    </svg>
  );
}
