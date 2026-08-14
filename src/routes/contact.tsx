import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Instagram, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { fadeUp, staggerParent, viewportOnce, EASE_OUT } from "@/lib/motion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Yoglait — Order in Accra, Ghana" },
      {
        name: "description",
        content:
          "Reach Yoglait on WhatsApp +233 20 552 7771 or Instagram @yoglaitgh to order fresh yoghurt in Accra.",
      },
      { property: "og:title", content: "Contact Yoglait" },
      { property: "og:description", content: "WhatsApp +233 20 552 7771 · Instagram @yoglaitgh." },
    ],
  }),
  component: ContactPage,
});

const stockists = [
  "Accra Melcom",
  "Kaneshi Melcom Boundary",
  "Ashaley Botwe Melcom",
  "Haatso Melcom",
  "Ashongman Melcom",
  "Nanakrom Melcom",
  "Hampton Melcom",
  "Frafraha Melcom",
  "Takoradi Shoprite & Melcom",
  "Cape Coast Melcom",
];

type FormState = { name: string; contact: string; message: string };
const emptyForm: FormState = { name: "", contact: "", message: "" };

function ContactPage() {
  const reduce = useReducedMotion();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.reportValidity()) return;
    setSending(true);
    // No backend yet — simulate submission so the UI has something real to confirm against.
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 700);
  };

  return (
    <>
      <section className="bg-hero-gradient px-5 pb-16 pt-36 sm:px-8 sm:pt-44">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerParent}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h1 variants={fadeUp} className="font-display text-4xl font-bold sm:text-5xl">
            Say hello
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-sm text-muted-foreground sm:text-base">
            Yoglait On The Go — reach us directly, or find us on a shelf near you.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerParent}
          className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-3"
        >
          <motion.a
            variants={fadeUp}
            href="https://wa.me/233205527771"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat on WhatsApp
          </motion.a>
          <motion.a
            variants={fadeUp}
            href="tel:+233205527771"
            className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 text-sm font-bold shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Phone className="h-4 w-4" aria-hidden="true" /> +233 20 552 7771
          </motion.a>
          <motion.a
            variants={fadeUp}
            href="https://instagram.com/yoglaitgh"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 text-sm font-bold shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" /> @yoglaitgh
          </motion.a>
        </motion.div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-md">
          <div className="relative overflow-hidden rounded-4xl bg-card p-6 shadow-soft sm:p-8">
            {sent ? (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                </span>
                <p className="font-display text-xl font-bold">Message sent!</p>
                <p className="text-sm text-muted-foreground">
                  Thanks for reaching out — we'll get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm);
                    setSent(false);
                  }}
                  className="mt-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <p className="font-display text-xl font-bold">Send us a message</p>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Name
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Phone or email
                  </span>
                  <input
                    required
                    value={form.contact}
                    onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                    className="w-full rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                    placeholder="020 000 0000 or you@example.com"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Message
                  </span>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full resize-none rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                    placeholder="How can we help?"
                  />
                </label>
                <button
                  type="submit"
                  disabled={sending}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 disabled:opacity-70"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />{" "}
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={fadeUp}
            className="font-display text-center text-2xl font-bold sm:text-3xl"
          >
            Find us
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={fadeUp}
            className="mt-6 flex justify-center"
          >
            <a
              href="https://www.google.com/maps/search/Melcom+Accra+Ghana"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              <MapPin className="h-5 w-5" aria-hidden="true" /> Find a store near you
            </a>
          </motion.div>

          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={staggerParent}
            className="mx-auto mt-6 max-w-md space-y-2 text-center sm:columns-2 sm:space-y-0 sm:text-left"
          >
            {stockists.map((s) => (
              <motion.li
                key={s}
                variants={fadeUp}
                className="py-1 text-sm font-medium text-muted-foreground"
              >
                {s}
              </motion.li>
            ))}
          </motion.ul>

          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={fadeUp}
            className="mt-6 rounded-2xl bg-secondary/40 px-4 py-3 text-center text-xs text-muted-foreground"
          >
            Stock at any individual store can vary day to day — call or WhatsApp ahead to confirm
            availability, especially for Greek Yoghurt.
          </motion.p>
        </div>
      </section>
    </>
  );
}
