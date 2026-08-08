# Yoglait Fresh Site

Build a marketing + light e-commerce website for "Yoglait" — a yoghurt company based in Tema Community 1, Accra, Ghana. Their products are drinking yoghurt pouches, probiotic yoghurt tubs, and Greek yoghurt tubs, sold as healthy, nutritional, cold dairy products.

BRAND VOICE / TAGLINES (use across hero, CTAs, section headers — don't reuse all in one spot):
- "Joy In A Cup"
- "Yoglait On The Go"
- "Your Daily Dose of Delicious"
- "Healthy. Tasty. Just right."
- "Big benefits. One smooth sip."

DESIGN SYSTEM
- Visual mood: playful, cold/fresh, dairy-bright — soft sky-blue-to-cream gradients, rounded pill-shaped buttons and nav, floating product cutout images, a wavy/organic shape dividing hero from content (like a soft dune/wave silhouette in cream against a blue gradient hero).
- Typography: pair a bold, chunky, decorative display font for headlines with a clean readable sans for body text. Use "Fredoka" (SemiBold/Bold) or "Baloo 2" (Bold/ExtraBold) for all headings, hero copy, and section titles — big, rounded, friendly letterforms. Use "Poppins" or "Inter" for body copy, nav, and product info. Load both from Google Fonts.
- Color palette: base background a soft blue-to-white/cream vertical gradient (like #BFE3F5 → #F7F3E9) for hero sections; white or cream cards elsewhere; a warm accent color (coral/red or golden yellow) for primary CTA buttons; each product flavour gets its own small accent color chip (white/plain, yellow/vanilla, red/strawberry, yellow-brown/banana, green/lime, blue/coconut) used consistently as flavour tags across the site.
- Nav bar: floating pill-shaped rounded nav bar (rounded-full, soft shadow, slightly glassmorphic/frosted background) fixed near the top, matching the glassmorphism navbar style from labianca-frost. Links: Home, Menu, About, Contact. Include a small cart icon with item-count badge on the right.
- Buttons: fully rounded (pill) buttons everywhere, bold text, soft drop shadow, subtle scale/lift on hover.
- Motion: use Framer Motion. Follow a strict, purposeful motion system — short duration (150–300ms), ease-out for entrances, no animating `width` or `height` (animate `transform`/`opacity` only, use `scale`/`translate` instead), respect `prefers-reduced-motion` (disable/shorten non-essential motion for users who have it set), stagger children on section entrance, subtle hover lift on cards and buttons. Motion should feel light and bouncy (matches the playful brand) but never janky — no animation should block interaction or delay content paint.
- Performance: this must load fast on low-end devices/slow connections common in Ghana. Lazy-load below-the-fold images, use responsive/optimized image sizes, avoid large unused JS, keep the hero interactive quickly (no heavy animation blocking first paint).
- Fully responsive, mobile-first (most visitors will be on phones).

TECH: React + TypeScript + Tailwind CSS + Framer Motion. Set up a clean route structure for Home, Menu, About, Contact (routes can be placeholders for now except Home).

HOME PAGE (build fully now)
1. Floating pill nav bar as described (Home / Menu / About / Contact + cart icon).
2. Hero section: gradient blue-to-cream background, big decorative-font headline using one of the taglines above, a short supporting line about healthy probiotic yoghurt made in Accra, two pill CTA buttons ("Order Now" → links to Menu, "See Flavours" → scrolls down), and a floating product image (yoghurt pouch/tub cutout with soft shadow) on the right. Bottom of hero has a soft wavy cream shape transitioning into the page background, like a dune silhouette.
3. Trust/stat strip: 3–4 short stat or badge callouts (e.g. "100% Probiotic", "Low Fat", "No Preservatives", "Made in Ghana").
4. "Most Loved Flavours" section: a horizontally-scrollable or grid row of 4–6 flavour cards (image, name, flavour color tag, price, small "Order" pill button) — pull from: The White One (Plain), The Yellow One (Vanilla), The Red One (Strawberry), Banana Drinking Yoghurt (NEW badge), Yoglait Probiotic (Plain tub), Greek Yoghurt (Plain tub). Use placeholder images for now.
5. "Why Yoglait" section: 4 short benefit cards (Supports digestion, Boosts immunity, Better nutrient absorption, Reduces bloating) with simple icons.
6. Footer (build once, will be reused on all pages): Yoglait logo/name, short tagline, quick links (Home/Menu/About/Contact), contact info (Instagram @yoglaitgh, WhatsApp/Phone +233 20 552 7771), and a bottom line "Powered by Nine Heavens Design" that links to https://tonton-portfolio.lovable.app/ (open in new tab).

Keep everything in this design system consistent — this becomes the base I'll build Menu, About and Contact on top of in the next steps.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://yoglait.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bf1d493e-7727-4db2-815e-844bbe9d89d3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
