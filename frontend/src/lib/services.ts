import axios from "axios";
import { api } from "./api";

export const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

export function toSnakeCase(value: string) {
  if (!value) return "";
  return value.toLowerCase().replace(/\s+/g, "_");
}

export async function addProduct(data: FormData) {
  try {
    const response = await api.post("/add_product/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function updateProduct(pk: number, data: FormData) {
  try {
    const response = await api.put(`/update_product/${pk}/`, data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function generateAIDescription(data: { name: string }) {
  try {
    const response = await api.post("/generate_product_description/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function getProducts(page: number) {
  try {
    const response = await api.get(`/get_products/?page=${page}`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}


export async function adminProductSearch(page: number, search:string) {
  try {
    const response = await api.get(`/get_products/?page=${page}&search=${search}`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function getProduct(pk: number) {
  try {
    const response = await api.get(`/get_product/${pk}/`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function deleteProduct(pk: number) {
  try {
    const response = await api.delete(`/delete_product/${pk}/`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function getFeaturedProducts() {
  try {
    const response = await api.get("/get_featured_products/");
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function getAllProducts(
  page: number,
  search: string,
  category: string
) {
  try {
    const response = await api.get(
      `/get_all_products/?page=${page}&search=${search}&category=${category}`
    );
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function getProductsBySlug(slug: string | undefined) {
  try {
    const response = await api.get(`/get_product_by_slug/${slug}/`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function getCart(cartCode: string) {
  try {
    const response = await api.get(`/get_cart/${cartCode}/`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function addToCartApiFunction(data: {
  cart_code: string;
  product_id: number | null;
}) {
  try {
    const response = await api.post("/add_to_cart/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function productInCart(cart_code: string, product_id: number) {
  try {
    const response = await api.get(
      `/check_product_in_cart/?cart_code=${cart_code}&product_id=${product_id}`
    );
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function increaseItemQuantity(data: {
  item_id: number;
}) {
  try {
    const response = await api.put("/increase_cartitem_quantity/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}


export async function decreaseItemQuantity(data: {
  item_id: number;
}) {
  try {
    const response = await api.put("/decrease_cartitem_quantity/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}


export async function deleteCartitem(pk: number) {
  try {
    const response = await api.delete(`/delete_cartitem/${pk}/`);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}



export async function signUpUser(data: {
  email: string;
  username: string;
  password: string
}) {
  try {
    const response = await api.post("/auth/signup/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}



export async function signInUser(data: {
  email: string;
  password: string
}) {
  try {
    const response = await api.post("/auth/signin/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}




export async function createShippingAddress(data: {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string
}) {
  try {
    const response = await api.post("/create_or_update_shipping_info/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}



export async function initiatePayment(data: {
  cart_code: string | null;
}) {
  if(!data.cart_code) return;
  try {
    const response = await api.post("/initialize_payment/", data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}



export async function verifyPayment(reference: string | null){
  try{
    const response = await api.get(`/verify_payment/${reference}/`)
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}




export async function getShippingInfo(){
  try{
    const response = await api.get('/get_shipping_address/')
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}



export async function getUserOrders(page: number){
  try{
    const response = await api.get(`/get_user_orders/?page=${page}`)
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}


export async function getAllOrders(page: number, status: string){
  try{
    const response = await api.get(`/get_all_orders/?page=${page}&status=${status}`)
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}


export async function updateOrderStatus(pk: number, data: {status: string}){
  try{
    const response = await api.put(`/update_order_status/${pk}/`, data)
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}



export async function deleteOrder(pk: number){
  try{
    const response = await api.delete(`/delete_order/${pk}/`)
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}


export async function findOrderBySku(page: number, sku: string){
  try{
    const response = await api.get(`/get_all_orders/?sku=${sku}&page=${page}`)
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}


export async function isUserAdmin(){
  try{
    const response = await api.get("/user_is_admin/")
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}

export async function isUserLoggedIn(){
  try{
    const response = await api.get("/user_is_logged_in/")
    return response.data
  }
  catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      throw new Error(err?.response?.data?.error || err.message);
    }
    throw new Error("An unexpected error occured!");
  }
}