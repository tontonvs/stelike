import { createFileRoute } from "@tanstack/react-router";

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
      { property: "og:description", content: "Healthy, nutritional cold dairy made in Accra, Ghana." },
    ],
  }),
  component: () => (
    <section className="bg-hero-gradient px-5 pb-24 pt-36 text-center">
      <h1 className="text-4xl font-bold sm:text-5xl">About</h1>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">
        Big benefits. One smooth sip. Our full story lands here soon.
      </p>
    </section>
  ),
});
