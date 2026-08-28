import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [{ title: "Orders — Stelike Exclusives" }],
  }),
  component: Orders,
});

// Blank for now — no database yet, so there's nothing to look up.
function Orders() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-5">
      <p className="text-sm text-muted-foreground">Orders — coming soon.</p>
    </section>
  );
}
