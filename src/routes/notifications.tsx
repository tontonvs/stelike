import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — Stelike Exclusives" }],
  }),
  component: Notifications,
});

// Blank for now — no database yet, so there's nothing to show.
function Notifications() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-5">
      <p className="text-sm text-muted-foreground">Notifications — coming soon.</p>
    </section>
  );
}
