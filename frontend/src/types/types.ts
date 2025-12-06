export interface IProduct{
    id: number;
    name: string;
    slug: string;
    sku: string;
    category: string;
    description: string;
    price: number;
    minimumStock: number;
    quantity: number;
    image: string;
    created_at: string;
    featured: boolean
}

export interface ICartitems{
    id: number;
    product: IProduct;
    quantity: number;
    sub_total: number
}

export interface ICart{
    id: number;
    cart_code: string;
    cartitems: ICartitems[];
    cart_total: number
}


export interface IOrderitems{
    id: number;
    product: IProduct;
    quantity: number
}


export interface IOrders{
    id: number;
    reference: string;
    sku: string; 
    total_amount: number;
    status: string;
    orderitems: IOrderitems[];
    created_at: string;
    updated_at: string
}