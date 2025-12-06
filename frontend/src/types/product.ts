export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  stock: number;
  featured?: boolean;

  // added by clint
  quantity: number
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}