"use client";

import { useEffect, useRef, useState } from "react";

export function useIsVisible<T extends HTMLElement = HTMLDivElement>(
  initialState = false,
): {
  ref: React.RefObject<T | null>;
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
} {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(initialState);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    }
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  return { ref, isVisible, setIsVisible };
}
