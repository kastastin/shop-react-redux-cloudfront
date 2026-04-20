export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export const products: Product[] = [
  {
    id: '1',
    title: 'Apple MacBook Pro 16" M3 Pro',
    description: 'Powerful laptop with M3 Pro chip, 18GB RAM, 512GB SSD, Liquid Retina XDR display',
    price: 2499,
    count: 8,
  },
  {
    id: '2',
    title: 'Dell XPS 15 9530',
    description: 'Premium laptop with Intel Core i7-13700H, 16GB RAM, 512GB SSD, OLED touch display',
    price: 1799,
    count: 12,
  },
  {
    id: '3',
    title: 'Lenovo ThinkPad X1 Carbon Gen 11',
    description: 'Ultra-light business laptop with Intel Core i7, 16GB RAM, 1TB SSD, 14" IPS display',
    price: 1599,
    count: 6,
  },
  {
    id: '4',
    title: 'ASUS ROG Zephyrus G14',
    description: 'Gaming laptop with AMD Ryzen 9, RTX 4060, 16GB RAM, 1TB SSD, 144Hz QHD display',
    price: 1399,
    count: 10,
  },
  {
    id: '5',
    title: 'Microsoft Surface Laptop 5',
    description: 'Sleek laptop with Intel Core i5, 8GB RAM, 256GB SSD, PixelSense touchscreen',
    price: 999,
    count: 15,
  },
];
