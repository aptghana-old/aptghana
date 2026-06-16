"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import CategoryMoveModal from "./CategoryMoveModal";

interface Props {
  productId: string;
  currentCategoryId?: string | null;
}

export default function ProductMoveButton({ productId, currentCategoryId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="xs" icon={<ArrowRightLeft size={11} />} onClick={() => setOpen(true)}>
        Move
      </Button>
      {open && (
        <CategoryMoveModal
          productId={productId}
          currentCategoryId={currentCategoryId}
          onClose={() => setOpen(false)}
          onMoved={() => router.refresh()}
        />
      )}
    </>
  );
}
