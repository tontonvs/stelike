import { Link } from "@tanstack/react-router";
import { Instagram, Phone } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/orders", label: "Track Order" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-2xl font-medium">Stelike Exclusives</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Modern luxury furnishing — TV tables, center tables, bedframes and mirrors, crafted
            for Ghanaian homes.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="font-display text-sm font-medium uppercase tracking-wide">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-display text-sm font-medium uppercase tracking-wide">Say hello</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" /> @stelikeexclusives
              </a>
            </li>
            <li>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> WhatsApp us
              </a>
            </li>
            <li>Accra, Ghana</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 px-5 py-5 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Stelike Exclusives</p>
      </div>
    </footer>
  );
}
