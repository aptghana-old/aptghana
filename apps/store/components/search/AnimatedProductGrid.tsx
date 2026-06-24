"use client";

import { AnimatePresence, motion } from "framer-motion";
import ProductCard, { type ProductCardData } from "@/components/products/ProductCard";

interface Props {
  products: ProductCardData[];
  view: "grid" | "list";
}

/* ─── AnimatedProductGrid ─────────────────────────────────────────────────── */
export default function AnimatedProductGrid({ products, view }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {view === "list" ? (
        <motion.div
          key="list-view"
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18, staggerChildren: 0 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 0.2, ease: "easeOut", delay: i * 0.03 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <ProductCard product={product} layout="list" />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="grid-view"
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18 } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              layout="position"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { duration: 0.2, ease: "easeOut", delay: i * 0.025 },
              }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <ProductCard product={product} layout="grid" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
