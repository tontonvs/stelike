import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { GreetingBanner } from "@/components/GreetingBanner";
import { CategoryCircles } from "@/components/CategoryCircles";
import { SectionTitle } from "@/components/SectionTitle";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { ProductSheet } from "@/components/ProductSheet";
import { useProducts } from "@/hooks/useProducts";
import { type Product } from "@/lib/products";
import { fadeUp, staggerParent, viewportOnce } from "@/lib/motion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stelike Exclusives — Modern Luxury Furnishing" },
      {
        name: "description",
        content: "TV tables, center tables, bedframes and mirrors, crafted for modern Ghanaian homes.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products, isLoading } = useProducts();
  const [active, setActive] = useState<Product | null>(null);

  return (
    <div>
      <GreetingBanner />

      <CategoryCircles />

      {/* New Deals */}
      <section className="mx-auto mt-10 max-w-6xl px-5 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <SectionTitle>New Deals</SectionTitle>
          </div>
          <Link to="/shop" className="shrink-0 text-xs font-medium text-primary hover:underline">
            Show all
          </Link>
        </div>

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={staggerParent}
          className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : (products ?? []).map((p) => (
                <ProductCard key={p.id} product={p} onOpen={() => setActive(p)} />
              ))}
        </motion.ul>
      </section>

      <ProductSheet
        product={active}
        allProducts={products ?? []}
        onClose={() => setActive(null)}
        onSelect={setActive}
      />
    </div>
  );
}
