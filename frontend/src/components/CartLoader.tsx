import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";

const CartLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
          ease: "linear",
        }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
          <ShoppingBag className="w-16 h-16 text-primary relative z-10" />
        </div>
      </motion.div>

      <motion.p
        className="mt-6 text-muted-foreground font-medium tracking-wide"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{
          repeat: Infinity,
          duration: 2,
        }}
      >
        Loading your cart...
      </motion.p>
    </div>
  );
};

export default CartLoader;
