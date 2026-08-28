import heroBanner from "@/assets/hero/hero-banner.jpg";

/** 4.5cm-tall hero banner just below the nav. Background photo with a dark
 * overlay for legibility, brand headline, short subhead. */
export function Hero() {
  return (
    <section className="relative flex h-[4.5cm] w-full items-center overflow-hidden">
      <img
        src={heroBanner}
        alt="Modern furnished living room by Stelike Exclusives"
        width={1600}
        height={900}
        loading="eager"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />

      <div className="relative w-full px-5 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-hero text-2xl leading-tight sm:text-4xl lg:text-5xl">
            <span className="text-white">Welcome to </span>
            <span className="text-gold-orange-gradient">Stelike Exclusives</span>
          </h1>
          <p className="font-ubuntu mt-2 max-w-md text-xs text-white/90 sm:text-sm lg:text-base">
            Home of Exclusive furniture collections, upgrade your living space with modern and
            luxurious furnitures.
          </p>
        </div>
      </div>
    </section>
  );
}
