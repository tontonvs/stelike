import { supabase } from "./supabase";
import { products as fallbackProducts, type Product } from "./products";
import placeholderImage from "@/assets/flavour-plain.png";

// Images stay bundled locally rather than in Supabase Storage — faster to load
// on a slow connection and no extra infra to manage. Derived from the existing
// local catalog so there's a single source of truth for image paths, keyed by
// product id (must match the `id` column in the products table).
const productImages: Record<string, { image: string; images: string[] }> = Object.fromEntries(
  fallbackProducts.map((p) => [p.id, { image: p.image, images: p.images }]),
);

type ProductRow = {
  id: string;
  line: Product["line"];
  format: Product["format"];
  name: string;
  flavour: Product["flavour"];
  size: string;
  price: number;
  tagline: string | null;
  description: string | null;
  badges: Product["badges"];
  active: boolean;
};

/** Fetches the live menu from Supabase. Falls back to the bundled catalog if the
 * database is unreachable, so the site never shows an empty menu. */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("line", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error)
      console.warn("Could not load products from Supabase, using bundled fallback:", error.message);
    return fallbackProducts;
  }

  return (data as ProductRow[]).map((row) => {
    const media = productImages[row.id];
    return {
      id: row.id,
      name: row.name,
      line: row.line,
      format: row.format,
      size: row.size,
      flavour: row.flavour,
      price: Number(row.price),
      badges: row.badges,
      tagline: row.tagline ?? "",
      description: row.description ?? "",
      image: media?.image ?? placeholderImage,
      images: media?.images ?? [placeholderImage],
    };
  });
}
