import { CartItem } from "~/models/CartItem";

export type CartStatus = "OPEN" | "ORDERED";

export type Cart = {
  id: string;
  user_id: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
  items: CartItem[];
};
