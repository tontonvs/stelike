import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact — Stelike Exclusives" }],
  }),
  component: Contact,
});

// Blank for now — built next.
function Contact() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-5 pt-28 sm:pt-40">
      <p className="text-sm text-muted-foreground">Contact — coming soon.</p>
    </section>
  );
}
