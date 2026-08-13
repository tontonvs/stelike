import plain from "@/assets/flavour-plain.png";
import vanilla from "@/assets/flavour-vanilla.png";
import strawberry from "@/assets/flavour-strawberry.png";
import banana from "@/assets/flavour-banana.png";
import probioticImg from "@/assets/flavour-probiotic.png";
import greekImg from "@/assets/flavour-greek.png";
import pineapple from "@/assets/flavour-pineapple.png";
import lime from "@/assets/flavour-lime.png";
import coconut from "@/assets/flavour-coconut.png";
import hero from "@/assets/hero-yoglait.png";

export type Flavour =
  "plain" | "vanilla" | "strawberry" | "banana" | "pineapple" | "lime" | "coconut";

export type Line = "drinking" | "probiotic" | "greek" | "cups";
export type Format = "pouch" | "tub" | "cup";
export type Badge =
  | "NEW"
  | "High Protein"
  | "Low Fat"
  | "Low Sugar"
  | "No Preservatives"
  | "Contains Iron"
  | "Probiotic";

export const flavourChip: Record<Flavour, string> = {
  plain: "bg-flavour-plain",
  vanilla: "bg-flavour-vanilla",
  strawberry: "bg-flavour-strawberry",
  banana: "bg-flavour-banana",
  pineapple: "bg-flavour-pineapple",
  lime: "bg-flavour-lime",
  coconut: "bg-flavour-coconut",
};

/** Selected-state styling for filter chips, tinted per flavour. */
export const flavourChipActive: Record<Flavour, string> = {
  plain: "bg-flavour-plain text-foreground",
  vanilla: "bg-flavour-vanilla text-foreground",
  strawberry: "bg-flavour-strawberry text-primary-foreground",
  banana: "bg-flavour-banana text-foreground",
  pineapple: "bg-flavour-pineapple text-foreground",
  lime: "bg-flavour-lime text-foreground",
  coconut: "bg-flavour-coconut text-foreground",
};

export const lineLabels: Record<Line, string> = {
  drinking: "Drinking Yoghurt",
  probiotic: "Probiotic",
  greek: "Greek Yoghurt",
  cups: "Fruit Cups",
};

export const flavourLabels: Record<Flavour, string> = {
  plain: "Plain",
  vanilla: "Vanilla",
  strawberry: "Strawberry",
  banana: "Banana",
  pineapple: "Pineapple",
  lime: "Lime",
  coconut: "Coconut",
};

export type Product = {
  id: string;
  name: string;
  line: Line;
  format: Format;
  size: string;
  flavour: Flavour;
  price: number;
  image: string;
  images: string[];
  badges: Badge[];
  tagline: string;
  description: string;
};

export const products: Product[] = [
  {
    id: "white-plain",
    name: "The White One",
    line: "drinking",
    format: "pouch",
    size: "250ml pouch",
    flavour: "plain",
    price: 15,
    image: plain,
    images: [plain, hero],
    badges: ["Low Sugar", "No Preservatives", "Probiotic"],
    tagline: "Plain, but never boring.",
    description:
      "Our original drinking yoghurt — smooth, cold and lightly tart, with live cultures in every sip. Nothing added but good dairy.",
  },
  {
    id: "yellow-vanilla",
    name: "The Yellow One",
    line: "drinking",
    format: "pouch",
    size: "250ml pouch",
    flavour: "vanilla",
    price: 15,
    image: vanilla,
    images: [vanilla, hero],
    badges: ["Low Fat", "No Preservatives", "Probiotic"],
    tagline: "Sunshine you can sip.",
    description:
      "Creamy vanilla drinking yoghurt with a soft, sweet finish. The crowd-pleaser of the pouch family.",
  },
  {
    id: "red-strawberry",
    name: "The Red One",
    line: "drinking",
    format: "pouch",
    size: "250ml pouch",
    flavour: "strawberry",
    price: 15,
    image: strawberry,
    images: [strawberry, hero],
    badges: ["Low Fat", "Contains Iron", "Probiotic"],
    tagline: "Berry serious about flavour.",
    description:
      "Real strawberry sweetness blended into cold, creamy yoghurt. Chilled, shaken and ready to go.",
  },
  {
    id: "banana",
    name: "Banana Drinking Yoghurt",
    line: "drinking",
    format: "pouch",
    size: "250ml pouch",
    flavour: "banana",
    price: 17,
    image: banana,
    images: [banana, hero],
    badges: ["NEW", "Contains Iron", "Probiotic"],
    tagline: "The newest one on the block.",
    description:
      "Smooth banana drinking yoghurt — rich, filling and naturally sweet. Great as a quick breakfast on the move.",
  },
  {
    id: "probiotic-500",
    name: "Yoglait Probiotic Yoghurt",
    line: "probiotic",
    format: "tub",
    size: "500g tub",
    flavour: "plain",
    price: 45,
    image: probioticImg,
    images: [probioticImg, hero],
    badges: ["Probiotic", "Low Sugar", "No Preservatives"],
    tagline: "Your gut's favourite tub.",
    description:
      "A 500g family tub of plain probiotic yoghurt, packed with live cultures for digestion and immunity. Spoon it, blend it, cook with it.",
  },
  {
    id: "greek-480",
    name: "Greek Yoghurt",
    line: "greek",
    format: "tub",
    size: "480g tub",
    flavour: "plain",
    price: 60,
    image: greekImg,
    images: [greekImg, hero],
    badges: ["High Protein", "Low Sugar", "No Preservatives"],
    tagline: "Thick, rich, protein-packed.",
    description:
      "Strained the traditional way for a dense, spoon-standing texture and a big protein hit. Plain and original — sweeten it your way.",
  },
  {
    id: "cup-pineapple",
    name: "Pineapple Cup",
    line: "cups",
    format: "cup",
    size: "150g cup",
    flavour: "pineapple",
    price: 20,
    image: pineapple,
    images: [pineapple, hero],
    badges: ["Low Fat", "Probiotic"],
    tagline: "Tropical in a tiny cup.",
    description:
      "Bright pineapple fruit yoghurt in a grab-and-go cup. Sweet, tangy and cold — snack size, big flavour.",
  },
  {
    id: "cup-lime",
    name: "Lime Cup",
    line: "cups",
    format: "cup",
    size: "150g cup",
    flavour: "lime",
    price: 20,
    image: lime,
    images: [lime, hero],
    badges: ["Low Sugar", "Probiotic"],
    tagline: "Zesty and wide awake.",
    description:
      "A sharp lime twist over creamy yoghurt. The most refreshing cup in the fridge on a hot Accra afternoon.",
  },
  {
    id: "cup-coconut",
    name: "Coconut Cup",
    line: "cups",
    format: "cup",
    size: "150g cup",
    flavour: "coconut",
    price: 22,
    image: coconut,
    images: [coconut, hero],
    badges: ["Low Fat", "Contains Iron", "Probiotic"],
    tagline: "Soft, creamy, holiday mood.",
    description:
      "Mellow coconut yoghurt with a silky finish. Blue label, calm vibes, seriously moreish.",
  },
];

export function variantsOf(product: Product, allProducts: Product[]) {
  return allProducts.filter((p) => p.line === product.line && p.id !== product.id);
}
