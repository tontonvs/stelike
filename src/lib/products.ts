import plain from "@/assets/flavour-plain.png";
import vanilla from "@/assets/flavour-vanilla.png";
import strawberry from "@/assets/flavour-strawberry.png";
import banana from "@/assets/flavour-banana.png";
import probiotic from "@/assets/flavour-probiotic.png";
import greek from "@/assets/flavour-greek.png";

export type Flavour =
  | "plain"
  | "vanilla"
  | "strawberry"
  | "banana"
  | "lime"
  | "coconut";

export const flavourChip: Record<Flavour, string> = {
  plain: "bg-flavour-plain",
  vanilla: "bg-flavour-vanilla",
  strawberry: "bg-flavour-strawberry",
  banana: "bg-flavour-banana",
  lime: "bg-flavour-lime",
  coconut: "bg-flavour-coconut",
};

export type Product = {
  id: string;
  name: string;
  kind: string;
  flavour: Flavour;
  flavourLabel: string;
  price: number;
  image: string;
  isNew?: boolean;
};

export const products: Product[] = [
  {
    id: "white-plain",
    name: "The White One",
    kind: "Drinking yoghurt pouch",
    flavour: "plain",
    flavourLabel: "Plain",
    price: 15,
    image: plain,
  },
  {
    id: "yellow-vanilla",
    name: "The Yellow One",
    kind: "Drinking yoghurt pouch",
    flavour: "vanilla",
    flavourLabel: "Vanilla",
    price: 15,
    image: vanilla,
  },
  {
    id: "red-strawberry",
    name: "The Red One",
    kind: "Drinking yoghurt pouch",
    flavour: "strawberry",
    flavourLabel: "Strawberry",
    price: 15,
    image: strawberry,
  },
  {
    id: "banana",
    name: "Banana Drinking Yoghurt",
    kind: "Drinking yoghurt pouch",
    flavour: "banana",
    flavourLabel: "Banana",
    price: 17,
    image: banana,
    isNew: true,
  },
  {
    id: "probiotic",
    name: "Yoglait Probiotic",
    kind: "Probiotic tub",
    flavour: "plain",
    flavourLabel: "Plain",
    price: 25,
    image: probiotic,
  },
  {
    id: "greek",
    name: "Greek Yoghurt",
    kind: "Greek tub",
    flavour: "coconut",
    flavourLabel: "Plain",
    price: 32,
    image: greek,
  },
];
