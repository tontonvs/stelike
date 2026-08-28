import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [{ title: "Shop — Stelike Exclusives" }],
  }),
  component: Shop,
});

// Blank for now — built next once the product catalog and filters are ready.
function Shop() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-5">
      <p className="text-sm text-muted-foreground">Shop — coming soon.</p>
    </section>
  );
}
