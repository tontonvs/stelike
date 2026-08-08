import { Link } from "@tanstack/react-router";
import { Instagram, Phone } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-20 bg-secondary/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-display text-2xl font-bold">Yoglait</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Joy In A Cup. Cold, healthy, probiotic yoghurt made fresh in Tema Community 1, Accra.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="font-display text-sm font-semibold uppercase tracking-wide">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground transition-colors hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide">Say hello</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href="https://instagram.com/yoglaitgh"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" /> @yoglaitgh
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/233205527771"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> +233 20 552 7771
              </a>
            </li>
            <li>Tema Community 1, Accra, Ghana</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 px-5 py-5 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Yoglait ·{" "}
          <a
            href="https://tonton-portfolio.lovable.app/"
            target="_blank"
            rel="noreferrer"
            className="font-medium transition-colors hover:text-primary"
          >
            Powered by Nine Heavens Design
          </a>
        </p>
      </div>
    </footer>
  );
}
