import { getCart } from "@/lib/services";
import { ICart, ICartitems } from "@/types/types";
import React, { createContext, useContext, useEffect, useState } from "react";

interface ICartContextProp {
  addToCart: (newItem: ICartitems) => void;
  removeFromCart: (id: number) => void;
  cart: ICart;
  cartitemCount: number;
  cartTotal: number;
  cartCode: string;
  loading: boolean;
  increaseItemQuantityContext: (itemId: number) => void;
  decreaseItemQuantityContext: (itemId: number) => void;
  resetCart: () => void;
  toggleCartCode: () => void;
}

const CartContext = createContext<ICartContextProp | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<ICart>({
    id: 0,
    cart_code: "",
    cartitems: [],
    cart_total: 0,
  });

  const [cartCode, setCartCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [newCartCodeToggle, setNewCartCodeToggle] = useState(false)

  const cartitemCount = cart?.cartitems.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotal = cart?.cartitems.reduce((acc, curr) => acc + curr.sub_total, 0);

  function resetCart(){
    setCart({
    id: 0,
    cart_code: "",
    cartitems: [],
    cart_total: 0,
  })
  }

  function toggleCartCode(){
    setNewCartCodeToggle((curr)=> !curr)
  }

  const addToCart = (newItem: ICartitems) => {
    setCart((prevCart) => ({
      ...prevCart,
      cartitems: [...prevCart.cartitems, newItem],
      cart_total: prevCart.cart_total + newItem.sub_total,
    }));
  };


  const increaseItemQuantityContext = (itemId: number) => {
  setCart((prevCart) => {
    // Create a deep copy of cartitems and update the matching one
    const updatedItems = prevCart.cartitems.map((item) => {
      if (item.id === itemId) {
        const updatedQuantity = item.quantity + 1;
        const updatedSubTotal = item.product.price * updatedQuantity;
        return { ...item, quantity: updatedQuantity, sub_total: updatedSubTotal };
      }
      return item;
    });

    // Recalculate total
    const updatedTotal = updatedItems.reduce((sum, item) => sum + item.sub_total, 0);

    return {
      ...prevCart,
      cartitems: updatedItems,
      cart_total: updatedTotal,
    };
  });
};


const decreaseItemQuantityContext = (itemId: number) => {
  setCart((prevCart) => {
    const updatedItems = prevCart.cartitems
      .map((item) => {
        if (item.id === itemId) {
          const updatedQuantity = Math.max(1, item.quantity - 1); // prevent going below 1
          const updatedSubTotal = item.product.price * updatedQuantity;
          return { ...item, quantity: updatedQuantity, sub_total: updatedSubTotal };
        }
        return item;
      })
      .filter((item) => item.quantity > 0); // optional: remove if you want zero-quantity items

    const updatedTotal = updatedItems.reduce((sum, item) => sum + item.sub_total, 0);

    return {
      ...prevCart,
      cartitems: updatedItems,
      cart_total: updatedTotal,
    };
  });
};




  const removeFromCart = (id: number) => {
    setCart((prevCart) => {
      const updatedItems = prevCart.cartitems.filter((item) => item.id !== id);
      const updatedTotal = updatedItems.reduce((sum, item) => sum + item.sub_total, 0);
      return {
        ...prevCart,
        cartitems: updatedItems,
        cart_total: updatedTotal,
      };
    });
  };

  // ✅ Initialize cartCode (runs once)
  useEffect(() => {
    let existingCode = localStorage.getItem("cartCode");
    if (!existingCode) {
      existingCode = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("cartCode", existingCode);
    }
    setCartCode(existingCode);
  }, [newCartCodeToggle]);

  // ✅ Fetch cart when cartCode changes
  useEffect(() => {
    if (!cartCode) return;

    setLoading(true);
    async function handleGetCart() {
      try {
        const response = await getCart(cartCode);
        setCart(response);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error("Error getting cart:", err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    handleGetCart();
  }, [cartCode]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        cartTotal,
        cartitemCount,
        cartCode,
        loading,
        increaseItemQuantityContext,
        decreaseItemQuantityContext,
        resetCart,
        toggleCartCode
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

