import { OrderStatus } from "~/constants/order";
import { CartItem } from "~/models/CartItem";
import { Order } from "~/models/Order";
import { AvailableProduct, Product } from "~/models/Product";

export const products: Product[] = [
  {
    id: "1",
    title: 'Apple MacBook Pro 16" M3 Pro',
    description:
      "Powerful laptop with M3 Pro chip, 18GB RAM, 512GB SSD, Liquid Retina XDR display",
    price: 2499,
  },
  {
    id: "2",
    title: "Dell XPS 15 9530",
    description:
      "Premium laptop with Intel Core i7-13700H, 16GB RAM, 512GB SSD, OLED touch display",
    price: 1799,
  },
  {
    id: "3",
    title: "Lenovo ThinkPad X1 Carbon Gen 11",
    description:
      'Ultra-light business laptop with Intel Core i7, 16GB RAM, 1TB SSD, 14" IPS display',
    price: 1599,
  },
  {
    id: "4",
    title: "ASUS ROG Zephyrus G14",
    description:
      "Gaming laptop with AMD Ryzen 9, RTX 4060, 16GB RAM, 1TB SSD, 144Hz QHD display",
    price: 1399,
  },
  {
    id: "5",
    title: "Microsoft Surface Laptop 5",
    description:
      "Sleek laptop with Intel Core i5, 8GB RAM, 256GB SSD, PixelSense touchscreen",
    price: 999,
  },
];

export const availableProducts: AvailableProduct[] = products.map(
  (product, index) => ({ ...product, count: index + 1 })
);

export const cart: CartItem[] = [
  {
    product: {
      description: "Short Product Description1",
      id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
      price: 24,
      title: "ProductOne",
    },
    count: 2,
  },
  {
    product: {
      description: "Short Product Description7",
      id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
      price: 15,
      title: "ProductName",
    },
    count: 5,
  },
];

export const orders: Order[] = [
  {
    id: "1",
    address: {
      address: "some address",
      firstName: "Name",
      lastName: "Surname",
      comment: "",
    },
    items: [
      { productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa", count: 2 },
      { productId: "7567ec4b-b10c-45c5-9345-fc73c48a80a1", count: 5 },
    ],
    statusHistory: [
      { status: OrderStatus.Open, timestamp: Date.now(), comment: "New order" },
    ],
  },
  {
    id: "2",
    address: {
      address: "another address",
      firstName: "John",
      lastName: "Doe",
      comment: "Ship fast!",
    },
    items: [{ productId: "7567ec4b-b10c-48c5-9345-fc73c48a80aa", count: 3 }],
    statusHistory: [
      {
        status: OrderStatus.Sent,
        timestamp: Date.now(),
        comment: "Fancy order",
      },
    ],
  },
];
