import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { CartItem } from "~/models/CartItem";
import { AvailableProduct } from "~/models/Product";
import { formatAsPrice } from "~/utils/utils";
import AddProductToCart from "~/components/AddProductToCart/AddProductToCart";
import { useAvailableProducts } from "~/queries/products";

type CartItemsProps = {
  items: CartItem[];
  isEditable: boolean;
};

const resolveProduct = (
  cartItem: CartItem,
  products: AvailableProduct[] = []
): AvailableProduct => {
  const match = products.find((p) => p.id === cartItem.product.id);
  return match ?? { ...cartItem.product, count: 0 };
};

export default function CartItems({ items, isEditable }: CartItemsProps) {
  const { data: products } = useAvailableProducts();

  const enriched = items.map((item) => ({
    cartItem: item,
    product: resolveProduct(item, products),
  }));

  const totalPrice = enriched.reduce(
    (total, { cartItem, product }) => total + cartItem.count * product.price,
    0
  );

  return (
    <>
      <List disablePadding>
        {enriched.map(({ cartItem, product }) => (
          <ListItem
            key={product.id}
            sx={{ padding: (theme) => theme.spacing(1, 0) }}
          >
            {isEditable && <AddProductToCart product={product} />}
            <ListItemText
              primary={product.title}
              secondary={product.description}
            />
            <Typography variant="body2">
              {formatAsPrice(product.price)} x {cartItem.count} ={" "}
              {formatAsPrice(product.price * cartItem.count)}
            </Typography>
          </ListItem>
        ))}
        <ListItem sx={{ padding: (theme) => theme.spacing(1, 0) }}>
          <ListItemText primary="Shipping" />
          <Typography variant="body2">Free</Typography>
        </ListItem>
        <ListItem sx={{ padding: (theme) => theme.spacing(1, 0) }}>
          <ListItemText primary="Total" />
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {formatAsPrice(totalPrice)}
          </Typography>
        </ListItem>
      </List>
    </>
  );
}
