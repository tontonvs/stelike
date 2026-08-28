import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { business } from "@/lib/business";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [{ title: "Contact — Stelike Exclusives" }],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="bg-gradient-contact">
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8 sm:pt-40">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Get in touch</h1>
        <p className="mt-3 max-w-lg text-foreground/80">
          Questions about a piece, a custom build, or a delivery — reach us directly, we
          reply fast.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={buildWhatsAppLink(business.whatsappNumber, "Hi Stelike, I have a question.")}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-md bg-card p-5 shadow-soft transition-transform duration-150 hover:scale-[1.02]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">WhatsApp</span>
              <span className="block text-sm text-muted-foreground">{business.whatsappNumber}</span>
            </span>
          </a>

          <a
            href={`tel:${business.hotline}`}
            className="flex items-center gap-4 rounded-md bg-card p-5 shadow-soft transition-transform duration-150 hover:scale-[1.02]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Phone className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Call us</span>
              <span className="block text-sm text-muted-foreground">{business.hotline}</span>
            </span>
          </a>

          <a
            href={business.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-md bg-card p-5 shadow-soft transition-transform duration-150 hover:scale-[1.02]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Instagram</span>
              <span className="block text-sm text-muted-foreground">@stelike_exclusives</span>
            </span>
          </a>

          <div className="flex items-center gap-4 rounded-md bg-card p-5 shadow-soft">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Visit us</span>
              <span className="block text-sm text-muted-foreground">{business.address}</span>
            </span>
          </div>
        </div>

        <p className="mt-10 inline-flex items-center gap-2 text-sm text-foreground/70">
          <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
          Prefer email? DM us on Instagram and we'll take it from there.
        </p>
      </div>
    </div>
  );
}
