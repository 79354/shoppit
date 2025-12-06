import { useCart } from "@/contexts/CartContext";
import { addToCartApiFunction, productInCart } from "@/lib/services";
import { useState } from "react";
import { toast } from "sonner";

export function useProductCart() {

  const { addToCart } = useCart();
  const [addToCartLoader, setAddToCartLoader] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);


  async function handleProductInCart(productId: number | undefined, cartCode: string) {
      if (!productId) return;
      try {
        const response = await productInCart(cartCode, productId);
        setAddedToCart(response.in_cart);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error checking product in cart", err.message);
        }
      }
    }

  async function handleAddToCart(productId: number|undefined, productName: string | undefined, cartCode: string) {
    if (!productId) return;
    setAddToCartLoader(true);
    try {
      const response = await addToCartApiFunction({
        cart_code: cartCode,
        product_id: productId,
      });
      addToCart(response.cartitems[response.cartitems.length - 1]);
      toast.success(`Product ${productName} added to cart successfully!`);
      setAddedToCart(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An unknown error occurred!");
      }
    } finally {
      setAddToCartLoader(false);
    }
  }

  return {
    // quantity,
    // setQuantity,
    // slug,
    // product,
    // setProduct,
    // loadingProduct,
    // setLoadingProduct,
    addToCartLoader,
    addedToCart,
    handleAddToCart,
    handleProductInCart,
  };
}
