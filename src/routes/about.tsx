import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { HeartPulse, RefreshCcw, ShieldCheck, Sprout, Wind } from "lucide-react";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Yoglait — Yoghurt Made in Tema, Accra" },
      {
        name: "description",
        content:
          "The story behind Yoglait: healthy, nutritional cold dairy made in Tema Community 1, Accra, Ghana.",
      },
      { property: "og:title", content: "About Yoglait" },
      {
        property: "og:description",
        content: "Healthy, nutritional cold dairy made in Accra, Ghana.",
      },
    ],
  }),
  component: AboutPage,
});

const benefits = [
  {
    icon: Sprout,
    title: "Happier gut",
    body: "Supports healthy digestion by promoting a balanced gut microbiome.",
  },
  {
    icon: ShieldCheck,
    title: "Stronger defences",
    body: "Helps strengthen the immune system through beneficial bacteria support.",
  },
  {
    icon: HeartPulse,
    title: "Better absorption",
    body: "Improves how well your body absorbs nutrients from the food you eat.",
  },
  {
    icon: Wind,
    title: "Less bloating",
    body: "Helps reduce bloating and everyday digestive discomfort.",
  },
  {
    icon: RefreshCcw,
    title: "Restores balance",
    body: "Helps restore good bacteria, especially after a course of antibiotics.",
  },
] as const;

const differentiators = [
  "Low Fat",
  "Low Sugar",
  "No Preservatives",
  "Probiotic",
  "High Protein (Greek line)",
];

function AboutPage() {
  return (
    <>
      <section className="bg-hero-gradient px-5 pb-20 pt-36 sm:px-8 sm:pt-44">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerParent}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h1 variants={fadeUp} className="font-display text-4xl font-bold sm:text-5xl">
            Joy In A Cup, made in Accra.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-sm text-muted-foreground sm:text-base">
            Yoglait is a Ghanaian yoghurt company based in Tema Community 1, Accra — making healthy,
            nutritional, probiotic cold dairy the way it should taste. From drinking yoghurt pouches
            you can grab on the go, to probiotic tubs and high-protein Greek yoghurt, every cup is
            made to be your daily dose of delicious.
          </motion.p>
        </motion.div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={fadeUp}
            className="font-display text-center text-2xl font-bold sm:text-3xl"
          >
            Big benefits. One smooth sip.
          </motion.h2>

          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            variants={staggerParent}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            {benefits.map(({ icon: Icon, title, body }) => (
              <motion.li
                key={title}
                variants={fadeUp}
                className="flex flex-col items-start gap-3 rounded-3xl bg-card p-5 shadow-soft"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="font-display text-base font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{body}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-4xl bg-secondary/40 p-8 text-center sm:p-10"
        >
          <p className="font-display text-lg font-semibold sm:text-xl">
            What makes our yoghurt different
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {differentiators.map((d) => (
              <li
                key={d}
                className="rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground shadow-soft"
              >
                {d}
              </li>
            ))}
          </ul>
        </motion.div>
      </section>
    </>
  );
}
