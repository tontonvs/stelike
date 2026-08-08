import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Yoglait Drinking Yoghurt & Tubs" },
      {
        name: "description",
        content:
          "Browse the full Yoglait menu: drinking yoghurt pouches, probiotic tubs and Greek yoghurt, fresh from Accra.",
      },
      { property: "og:title", content: "Menu — Yoglait" },
      { property: "og:description", content: "Drinking pouches, probiotic tubs and Greek yoghurt." },
    ],
  }),
  component: () => (
    <PagePlaceholder title="Menu" tagline="Your Daily Dose of Delicious — full menu coming next." />
  ),
});

function PagePlaceholder({ title, tagline }: { title: string; tagline: string }) {
  return (
    <section className="bg-hero-gradient px-5 pb-24 pt-36 text-center">
      <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">{tagline}</p>
    </section>
  );
}
