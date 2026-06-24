"use client";

import { ArrowDown as ArrowIcon } from "lucide-react";
import classNames from "classnames";
import { forwardRef } from "react";

import { useIsVisible } from "../../hooks/useIsVisible";
import type { ButtonProps } from "../button/button";
import { Button } from "../button/button";
import { Collapse } from "../collapse/collapse";
import { Count } from "../count/count";

export type DropdownOption = {
  value: string;
  label: string;
};

export type DropdownProps = Omit<ButtonProps, "ref" | "onToggle"> & {
  header: React.ReactNode | string;
  count?: number;
  children: React.ReactNode;
  className?: string;
  classNameContainer?: string;
  isOpen?: boolean;
  initialIsOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
};

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  function Dropdown(
    {
      header,
      count = 0,
      children,
      className,
      classNameContainer,
      isOpen: customIsOpen,
      initialIsOpen = false,
      onToggle,
      ...props
    }: DropdownProps,
    customRef
  ) {
    const {
      ref: defaultRef,
      isVisible,
      setIsVisible: setIsOpen,
    } = useIsVisible(initialIsOpen);

    const isOpen = customIsOpen ? customIsOpen : isVisible;
    const ref = customRef ? customRef : defaultRef;

    return (
      <div className={classNames("relative group", className)} ref={ref}>
        <Button
          className={classNames(
            "w-full small-bold flex items-center justify-between px-2 py-1.5 border rounded-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-uranus-base",
            {
              "bg-[#23263b] border-[#d3d4d8] text-white hover:text-[#d3d4d8]":
                isOpen,
              "bg-white border-neutral-dark hover:text-[#23263b] hover:bg-[#f4f4f5]":
                !isOpen,
            }
          )}
          onClick={() => {
            if (typeof onToggle === "function") {
              onToggle(isOpen);
            } else {
              setIsOpen((c) => !c);
            }
          }}
          {...props}
        >
          <span className="mr-2">{header}</span>
          {count > 0 && (
            <Count
              className={classNames(
                "mr-0.5 group-hover:bg-[#d3d4d8] transition-colors",
                {
                  "bg-[#f4f4f5] text-[#23263b]": isOpen,
                }
              )}
            >
              {count}
            </Count>
          )}
          <ArrowIcon
            className={classNames("w-6 h-6 transition-transform", {
              "rotate-180": isOpen,
            })}
          />
        </Button>

        <Collapse
          isCollapsed={!isOpen}
          className={classNames(
            "z-10 min-w-max w-full absolute left-0 border border-[#d3d4d8] rounded-xs mt-1.5 bg-white shadow-small",
            classNameContainer
          )}
        >
          {children}
        </Collapse>
      </div>
    );
  }
);
