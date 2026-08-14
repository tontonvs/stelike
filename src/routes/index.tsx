import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Leaf, Shield, Sparkles, HeartPulse, Droplets, Snowflake, MapPin } from "lucide-react";
import { flavourChip, flavourLabels } from "@/lib/products";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/components/CartProvider";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { fadeUp, staggerParent, viewportOnce, EASE_OUT } from "@/lib/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yoglait — Joy In A Cup | Fresh Yoghurt in Accra, Ghana" },
      {
        name: "description",
        content:
          "Yoglait makes drinking yoghurt pouches, probiotic tubs and Greek yoghurt in Tema Community 1, Accra. Healthy. Tasty. Just right.",
      },
      { property: "og:title", content: "Yoglait — Joy In A Cup" },
      {
        property: "og:description",
        content:
          "Cold, creamy, probiotic yoghurt made in Accra. Order drinking pouches, probiotic tubs and Greek yoghurt.",
      },
    ],
  }),
  component: Home,
});

const stats = [
  { icon: Sparkles, label: "100% Probiotic" },
  { icon: Shield, label: "No Preservatives" },
  { icon: Leaf, label: "Low Fat" },
  { icon: MapPin, label: "Made in Ghana" },
];

const benefits = [
  {
    icon: HeartPulse,
    title: "Supports digestion",
    copy: "Live cultures keep your gut calm and happy every day.",
  },
  {
    icon: Shield,
    title: "Boosts immunity",
    copy: "A daily sip helps your body's natural defences stay sharp.",
  },
  {
    icon: Droplets,
    title: "Better nutrient absorption",
    copy: "Calcium and protein your body can actually put to work.",
  },
  {
    icon: Snowflake,
    title: "Reduces bloating",
    copy: "Light, cold and easy — never heavy after you drink it.",
  },
];

function Home() {
  const { addItem } = useCart();
  const { data: products, isLoading } = useProducts();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient pb-20 pt-24 sm:pb-40 sm:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 sm:gap-10 sm:px-8 md:grid-cols-2">
          <motion.div initial="hidden" animate="show" variants={staggerParent}>
            <motion.span
              variants={fadeUp}
              className="inline-flex rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur"
            >
              Don't say yogurt... say YOGLAIT!
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="mt-3 text-4xl font-bold leading-[1.05] sm:mt-4 sm:text-6xl lg:text-7xl"
            >
              Joy In A Cup
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-3 max-w-md text-sm text-muted-foreground sm:mt-4 sm:text-lg"
            >
              Healthy probiotic yoghurt, made fresh and kept cold in Accra. Big benefits. One
              smooth sip.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              <Link
                to="/menu"
                className="inline-flex items-center rounded-lg bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                Order Now
              </Link>
              <a
                href="#flavours"
                className="inline-flex items-center rounded-lg bg-card px-7 py-3 text-sm font-bold text-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                See Flavours
              </a>
            </motion.div>
          </motion.div>

          <HeroCarousel />
        </div>

        {/* Wavy dune divider */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-background sm:h-24"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,64 C240,120 420,16 720,48 C1020,80 1200,120 1440,56 L1440,120 L0,120 Z"
          />
        </svg>
      </section>

      {/* Stat panel */}
      <section className="mx-auto -mt-2 max-w-5xl px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={fadeUp}
          className="relative grid grid-flow-col grid-cols-2 grid-rows-2 gap-y-3 rounded-2xl border-[1.4px] border-primary bg-card px-5 py-4"
        >
          <span
            aria-hidden="true"
            className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-foreground/30"
          />
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex items-center gap-2 ${i < 2 ? "pr-5" : "pl-5"}`}
            >
              <s.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate text-xs font-semibold sm:text-sm">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>


      {/* Flavours */}
      <section id="flavours" className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerParent}
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
            Most Loved Flavours
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-2 text-sm text-muted-foreground sm:text-base">
            Your Daily Dose of Delicious — chilled and ready to go.
          </motion.p>

          <motion.ul
            variants={staggerParent}
            className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : (products ?? []).slice(0, 6).map((p) => (
                  <motion.li
                    key={p.id}
                    variants={fadeUp}
                    whileHover={{ y: -4, scale: 1.01 }}
                    transition={{ duration: 0.18, ease: EASE_OUT }}
                    className="relative flex flex-col rounded-2xl bg-card p-3 shadow-sm sm:p-4"
                  >
                    {p.badges.includes("NEW") && (
                      <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase text-accent-foreground">
                        New
                      </span>
                    )}
                    <div className="grid h-28 place-items-center rounded-xl bg-secondary/40 sm:h-36">
                      <img
                        src={p.image}
                        alt={`${p.name} — ${flavourLabels[p.flavour]} yoghurt`}
                        width={768}
                        height={768}
                        loading="lazy"
                        decoding="async"
                        className="h-24 w-auto object-contain sm:h-32"
                      />
                    </div>
                    <div className="mt-2 flex min-w-0 items-center gap-1.5">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border ${flavourChip[p.flavour]}`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-[11px] font-medium text-muted-foreground">
                        {flavourLabels[p.flavour]}
                      </span>
                    </div>
                    <h3 className="mt-0.5 truncate text-sm font-semibold sm:text-base">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{p.size}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold sm:text-base">
                        GH₵ {p.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => addItem(p.id)}
                        className="rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95 sm:px-5 sm:py-2 sm:text-xs"
                      >
                        Order
                      </button>
                    </div>
                  </motion.li>
                ))}
          </motion.ul>
        </motion.div>
      </section>

      {/* Why Yoglait */}
      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerParent}
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
            Why Yoglait
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-2 text-sm text-muted-foreground sm:text-base">
            Healthy. Tasty. Just right.
          </motion.p>
          <motion.ul
            variants={staggerParent}
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {benefits.map((b) => (
              <motion.li
                key={b.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="rounded-3xl bg-card p-6 shadow-soft"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary">
                  <b.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.copy}</p>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </section>
    </div>
  );
}
