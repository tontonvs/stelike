import zenTvConsole from "@/assets/products/zen-tv-console.png";
import centreTable from "@/assets/products/centre-table.png";
import halfMoonMirror from "@/assets/products/half-moon-mirror.png";
import placeholderImage from "@/assets/flavour-plain.png";

/**
 * Stelike Exclusives catalog. Real names, prices, and colour options pulled
 * from @stelike_exclusives on Instagram. Items marked priceOnRequest have no
 * fixed price (custom builds, live bidding) — the UI routes those to
 * WhatsApp instead of the cart, since Paystack checkout needs a real number.
 * Photos: three items have real cropped photos; the rest are on the
 * placeholder until clean (no Instagram UI) photos are supplied.
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
  priceOnRequest?: boolean;
  colours?: string[];
  image: string;
  images: string[];
  hot: boolean;
  stock: number;
  description: string;
};

export const products: Product[] = [
  {
    id: "zen-tv-console",
    name: "Zen TV Console",
    category: "tv-stands",
    price: 2800,
    colours: ["Grey", "Grainy Ash", "Cappuccino", "Black", "Wooden", "White"],
    image: zenTvConsole,
    images: [zenTvConsole],
    hot: true,
    stock: 6,
    description:
      "Our best-selling TV console — stylish, durable, and designed to give any space a clean modern look. Free delivery included.",
  },
  {
    id: "grooved-zen-tv-console",
    name: "Grooved Zen TV Console",
    category: "tv-stands",
    price: 3500,
    image: placeholderImage,
    images: [placeholderImage],
    hot: true,
    stock: 4,
    description:
      "The grooved-front take on our Zen console, with concealed under-lighting. An exclusive offer piece.",
  },
  {
    id: "centre-table-tv-unit-combo",
    name: "Centre Table + TV Unit Combo",
    category: "tv-stands",
    price: 4600,
    colours: ["Wooden", "White", "Cappuccino", "Black", "Grey", "Ash Graying"],
    image: centreTable,
    images: [centreTable],
    hot: true,
    stock: 3,
    description:
      "Not your regular setup — a matching Centre Table + TV Unit combo where style meets presence. Built for comfort, designed for style.",
  },
  {
    id: "custom-entertainment-wall",
    name: "Custom Entertainment Wall",
    category: "new",
    price: 12000,
    priceOnRequest: true,
    image: placeholderImage,
    images: [placeholderImage],
    hot: false,
    stock: 2,
    description:
      "A sleek, custom-designed entertainment wall built to your dimensions. From ₵12,000 and above depending on size — flexible payment options available.",
  },
  {
    id: "half-moon-mirror-cabinet",
    name: "Half Moon Mirror with Cabinet",
    category: "mirrors",
    price: 0,
    priceOnRequest: true,
    image: halfMoonMirror,
    images: [halfMoonMirror],
    hot: false,
    stock: 2,
    description: "A half moon mirror with built-in cabinet storage — ideal for bedrooms.",
  },
  {
    id: "bid-centre-table",
    name: "Centre Table — Bidding",
    category: "center-tables",
    price: 0,
    priceOnRequest: true,
    image: placeholderImage,
    images: [placeholderImage],
    hot: false,
    stock: 1,
    description:
      "Open for bidding — place your offer and the highest bid wins. Free delivery included on this piece.",
  },
];

export function variantsOf(product: Product, allProducts: Product[]) {
  return allProducts.filter((p) => p.category === product.category && p.id !== product.id);
}
