import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteProduct } from "@/lib/services";
import { IProduct } from "@/types/types";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  product?: IProduct;
  frontendDeleteProduct?: (id: number) => void;
}

const DeleteDialog = ({ product, frontendDeleteProduct }: Props) => {
  const [loading, setLoading] = useState(false);

  async function handleDeleteProduct() {
    if (!product) return;
    setLoading(true);
    try {
      const response = await deleteProduct(product.id);
      console.log("del res", response);
      frontendDeleteProduct?.(product.id);
      toast.success(`${product.name} deleted successfully!`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
        return;
      } else {
        toast.error("An unknown error occured!");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Trash2 className="w-4 h-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-black">
              {product ? product.name : ""}
            </span>
            ? <br />
            This action is permanent and cannot be undone. Once deleted, this
            product and its details will be removed from your store.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
            onClick={handleDeleteProduct}
            disabled={loading}
          >
            {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
