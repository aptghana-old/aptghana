"use client";

import { AnimatePresence, motion, m, useReducedMotion } from "framer-motion";
import ProductCard, { type ProductCardData } from "@/components/products/ProductCard";

interface Props {
  products: ProductCardData[];
  view: "grid" | "list";
}

const listItemTransition = {
  ease: [0.16, 1, 0.3, 1] as const,
  duration: 0.6,
};

const listItemVariants = {
  hidden: { opacity: 0 },
  show: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.06,
      duration: 1,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

/* ─── AnimatedProductGrid ─────────────────────────────────────────────────── */
export default function AnimatedProductGrid({ products, view }: Props) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <m.ol
      className={view === "list" ? "space-y-3" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4"}
      initial="hidden"
      animate="show"
      exit="hidden"
    >
      <AnimatePresence>
        {products.map((product, i) => (
          <m.li
            key={product.mpn}
            layout={shouldReduceMotion || "position"}
            transition={listItemTransition}
            variants={listItemVariants}
            custom={i % (products.length ?? 20)}
          >
            <ProductCard product={product} layout="list" />
          </m.li>
        ))}
      </AnimatePresence>
    </m.ol>
  );
}
