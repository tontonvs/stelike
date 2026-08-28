import placeholderImage from "@/assets/flavour-plain.png";

/**
 * Stelike Exclusives product model — modern luxury furnishing, no database.
 * The catalog below is a placeholder set (blank/generic entries) to build
 * the UI against. Swap in real names, prices, categories and photos once
 * they're ready — everything downstream (cards, category filters, the
 * detail overlay) reads from this single array.
 */

export type Category = "tv-stands" | "bed-frames" | "mirrors" | "center-tables" | "new";

export const categoryLabels: Record<Category, string> = {
  "tv-stands": "TV Stands & Consoles",
  "bed-frames": "Bed Frames",
  mirrors: "Mirrors",
  "center-tables": "Coffee & Center Tables",
  new: "New Arrivals",
};

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  images: string[];
  hot: boolean;
  stock: number;
  description: string;
};

export const products: Product[] = [
  {
    id: "tv-stand-01",
    name: "TV Stand — Sample Piece",
    category: "tv-stands",
    price: 0,
    image: placeholderImage,
    images: [placeholderImage],
    hot: true,
    stock: 0,
    description: "Placeholder — swap in real product details and photos.",
  },
  {
    id: "bed-frame-01",
    name: "Bed Frame — Sample Piece",
    category: "bed-frames",
    price: 0,
    image: placeholderImage,
    images: [placeholderImage],
    hot: false,
    stock: 0,
    description: "Placeholder — swap in real product details and photos.",
  },
  {
    id: "mirror-01",
    name: "Mirror — Sample Piece",
    category: "mirrors",
    price: 0,
    image: placeholderImage,
    images: [placeholderImage],
    hot: true,
    stock: 0,
    description: "Placeholder — swap in real product details and photos.",
  },
  {
    id: "center-table-01",
    name: "Center Table — Sample Piece",
    category: "center-tables",
    price: 0,
    image: placeholderImage,
    images: [placeholderImage],
    hot: false,
    stock: 0,
    description: "Placeholder — swap in real product details and photos.",
  },
];

export function variantsOf(product: Product, allProducts: Product[]) {
  return allProducts.filter((p) => p.category === product.category && p.id !== product.id);
}
