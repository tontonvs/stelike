import { createFileRoute } from "@tanstack/react-router";

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
  component: () => (
    <section className="bg-hero-gradient px-5 pb-24 pt-36 text-center">
      <h1 className="text-4xl font-bold sm:text-5xl">Contact</h1>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">
        Yoglait On The Go — full contact page coming next.
      </p>
    </section>
  ),
});
