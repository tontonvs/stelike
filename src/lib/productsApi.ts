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

export type ProductRow = {
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
  in_stock: boolean;
};

export type ProductInput = {
  name: string;
  line: Product["line"];
  format: Product["format"];
  flavour: Product["flavour"];
  size: string;
  price: number;
  tagline: string;
  description: string;
  badges: Product["badges"];
  active: boolean;
  in_stock: boolean;
};

/** Turns a product name into a stable, URL-safe id ("Banana Cup" ->
 * "banana-cup") — used as the primary key for newly-created products so
 * staff never have to think about ids. If it collides with an existing id,
 * the insert fails with a clear Postgres error (surfaced as-is to the
 * caller) rather than silently overwriting another product. */
export function slugifyProductId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
      inStock: row.in_stock,
    };
  });
}

/** Staff: the full catalog including inactive rows, for the dashboard's Menu
 * tab — staff need to see (and re-activate) out-of-stock items too, not
 * just what's currently live on the public Menu page. */
export async function fetchAllProductsForStaff(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("line", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductRow[];
}

/** Staff: creates a new product row. Note: newly-created products have no
 * matching bundled image (see `productImages` above, which is deliberately
 * keyed off the existing local catalog for load-speed reasons) — they'll
 * show the placeholder image on the site until a real image asset is added
 * to the codebase and mapped to this id. Editing/toggling *existing*
 * products is unaffected by this. */
export async function createProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from("products").insert({
    id,
    name: input.name,
    line: input.line,
    format: input.format,
    flavour: input.flavour,
    size: input.size,
    price: input.price,
    tagline: input.tagline || null,
    description: input.description || null,
    badges: input.badges,
    active: input.active,
    in_stock: input.in_stock,
  });
  if (error) throw new Error(error.message);
}

/** Staff: edits any subset of a product's fields (price, tagline, flavour,
 * availability, etc). */
export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Staff: quick on/off for whether a product shows on the public Menu,
 * without editing anything else about it. */
export async function setProductActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("products").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Staff: quick on/off for whether a product is currently orderable. Unlike
 * setProductActive(), the product stays visible on the public Menu when
 * this is false — just greyed out with an "Out of stock" label and no
 * add-to-cart control. For something still being made but temporarily
 * unavailable; use setProductActive() instead for a genuinely discontinued
 * or hidden item. */
export async function setProductInStock(id: string, inStock: boolean): Promise<void> {
  const { error } = await supabase.from("products").update({ in_stock: inStock }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Staff: permanently removes a product row. Safe with respect to past
 * orders — order line items are a jsonb snapshot at order time (see
 * orders.ts), not a live join to this table, so deleting a product never
 * rewrites or breaks historical order totals. Prefer setProductActive()
 * for "out of stock for now"; use this only for a genuine mistake/cleanup. */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
