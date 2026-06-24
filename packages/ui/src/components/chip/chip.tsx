"use client";

import { X as CloseIcon } from "lucide-react";

import classNames from "classnames";
import type { ForwardedRef } from "react";

import type { ButtonProps } from "../button/button";
import { Button } from "../button/button";

export type ChipProps = ButtonProps & {
  ref?: ForwardedRef<HTMLButtonElement>;
  closeIcon?: boolean;
};

export function Chip({
  children,
  className,
  selected,
  closeIcon = false,
  ...props
}: ChipProps) {
  const cn = classNames(className, { "chip-selected": selected }, "chip");

  return (
    <Button type="native" className={cn} {...props}>
      {children}
      {closeIcon && <CloseIcon className="w-5 h-5" />}
    </Button>
  );
}
