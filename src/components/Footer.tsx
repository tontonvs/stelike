import { Link } from "@tanstack/react-router";
import { Instagram, MapPin, Phone } from "lucide-react";
import { business } from "@/lib/business";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/orders", label: "Track Order" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 bg-footer text-footer-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-brand text-3xl">Stelike Exclusives</p>
          <p className="mt-2 max-w-xs text-sm text-footer-foreground/70">
            Modern luxury furnishing — unique TV stands, multipurpose mirrors, and centre/coffee
            tables, built for Ghanaian homes.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-sm font-semibold uppercase tracking-wide">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-footer-foreground/70 transition-colors hover:text-footer-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">Say hello</p>
          <ul className="mt-3 space-y-2 text-sm text-footer-foreground/70">
            <li>
              <a
                href={business.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-footer-foreground"
              >
                <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" /> @stelike_exclusives
              </a>
            </li>
            <li>
              <a
                href={`tel:${business.whatsappNumber}`}
                className="inline-flex items-center gap-2 transition-colors hover:text-footer-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" /> {business.whatsappNumber}
              </a>
            </li>
            <li className="inline-flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {business.address}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-footer-foreground/10 px-5 py-5 text-center text-xs text-footer-foreground/60">
        <p>© {new Date().getFullYear()} Stelike Exclusives</p>
      </div>
    </footer>
  );
}
