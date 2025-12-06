import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/contexts/CartContext";
import { baseURL } from "@/lib/api";
import {
  decreaseItemQuantity,
  formatPrice,
  increaseItemQuantity,
} from "@/lib/services";
import { ICartitems } from "@/types/types";

import { DeleteCartitemDialog } from "./DeleteCartitemDialog";
import { Button } from "./ui/button";

interface Props {
  item: ICartitems;
}

const CartitemCard = ({ item }: Props) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [loader, setLoader] = useState(false);

  const { increaseItemQuantityContext, decreaseItemQuantityContext } =
    useCart();

  // Increase quantity handler
  async function handleIncreaseQuantity() {
    if (item.quantity >= item.product.quantity) {
      toast.error("Product is out of stock");
      return;
    }

    setLoader(true);
    try {
      const response = await increaseItemQuantity({ item_id: item.id });
      setQuantity((curr) => curr + 1);

      toast.success("Cart item quantity increased!");
      increaseItemQuantityContext(item.id);
      console.log(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoader(false);
    }
  }

  // Decrease quantity handler
  async function handleDecreaseQuantity() {
    setLoader(true);
    try {
      const response = await decreaseItemQuantity({ item_id: item.id });
      setQuantity((curr) => curr - 1);

      toast.success("Cart item quantity decreased!");
      decreaseItemQuantityContext(item.id);
      console.log(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setLoader(false);
    }
  }

  return (
    <div
      key={item.id}
      className="flex items-center gap-4 py-4 border-b last:border-b-0"
    >
      <img
        src={`${baseURL}${item.product.image}`}
        alt={item.product.name}
        className="w-20 h-20 object-cover rounded-lg"
      />

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{item.product.name}</h3>
        <p className="text-sm text-muted-foreground capitalize">
          {item.product.category}
        </p>
        <p className="text-lg font-bold text-primary">
          {formatPrice(item.product.price)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="disabled:cursor-not-allowed"
          disabled={loader || quantity <= 1}
          onClick={handleDecreaseQuantity}
        >
          <Minus className="w-4 h-4" />
        </Button>

        <span className="w-12 text-center font-medium">{quantity}</span>

        <Button
          variant="outline"
          size="icon"
          disabled={loader}
          onClick={handleIncreaseQuantity}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-right">
        <p className="font-bold">
          {formatPrice(item.product.price * item.quantity)}
        </p>

        <DeleteCartitemDialog itemId={item.id} />
      </div>
    </div>
  );
};

export default CartitemCard;
