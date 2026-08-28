import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, Truck, Wrench, MessageCircle } from "lucide-react";
import { business } from "@/lib/business";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Stelike Exclusives" },
      {
        name: "description",
        content: "Order, delivered on time, installed before you pay. Stelike Exclusives, Accra.",
      },
    ],
  }),
  component: About,
});

const steps = [
  {
    icon: ClipboardCheck,
    title: "You order",
    body: "Pick a piece — or tell us your dimensions for a custom build. No deposit required to start.",
  },
  {
    icon: Truck,
    title: "We deliver on time",
    body: "Nationwide delivery, on the date we agree with you. No last-minute surprises.",
  },
  {
    icon: Wrench,
    title: "We install first",
    body: "We set the piece up in your space and make sure it's exactly right — before any money changes hands.",
  },
];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">Our promise</p>
      <h1 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
        Order it. We deliver and install it. You only pay once it's in your home.
      </h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Stelike Exclusives designs and builds modern furniture — TV stands, mirrors, and
        centre/coffee tables — for homes across Ghana. Every piece is delivered and installed
        before we ask for a cedi. If it isn't right, you don't pay.
      </p>

      <ol className="mt-12 grid gap-6 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-md bg-card p-6 shadow-sm">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground">
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-semibold text-muted-foreground">Step {i + 1}</p>
            <p className="font-display mt-1 text-lg font-medium">{s.title}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14 flex flex-col items-start gap-4 rounded-md bg-primary p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl font-semibold">Have a space in mind?</p>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Tell us what you're picturing — we'll quote it and get you a date.
          </p>
        </div>
        <a
          href={buildWhatsAppLink(
            business.whatsappNumber,
            "Hi Stelike, I'd like to ask about getting a piece made/delivered.",
          )}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Chat on WhatsApp
        </a>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Or browse pieces already in stock —{" "}
        <Link to="/shop" className="font-medium text-primary underline underline-offset-2">
          visit the shop
        </Link>
        .
      </p>
    </div>
  );
}
