"use client";

import { CheckIcon } from "lucide-react";
import classNames from "classnames";
import type { KeyboardEvent } from "react";
import { useCallback, useRef, useState } from "react";

import { useIsVisible } from "../../hooks/useIsVisible";
import { modAbs } from "../../utils/math";
import { Button } from "../button/button";
import { Dropdown } from "../dropdown/dropdown";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  options: SelectOption[];
  defaultOption?: SelectOption;
  defaultOpen?: boolean;
  placeholder?: string;
  prefix?: React.ReactNode | string;
  suffix?: React.ReactNode | string;
  className?: string;
  currentOption?: SelectOption;
  onChange?: (selectedOption: SelectOption) => void;
};

export function Select({
  options,
  defaultOption,
  defaultOpen = false,
  placeholder = "Select an option",
  prefix,
  suffix,
  className,
  currentOption: customCurrentOption,
  onChange,
}: SelectProps) {
  const {
    ref,
    isVisible: isOpen,
    setIsVisible: setIsOpen,
  } = useIsVisible(defaultOpen);

  const [defaultCurrentOption, setCurrentOption] = useState(defaultOption);
  const currentOption = customCurrentOption
    ? customCurrentOption
    : defaultCurrentOption;

  const currentFocusedOptionIdx = useRef(-1);
  const optionEls = useRef<HTMLButtonElement[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      const isArrowDown = e.key === "ArrowDown";
      const isArrowUp = e.key === "ArrowUp";

      if (isArrowDown || isArrowUp) {
        e.preventDefault();

        const direction = isArrowDown ? 1 : -1;
        const newIdx = modAbs(
          currentFocusedOptionIdx.current + direction,
          options.length,
        );
        currentFocusedOptionIdx.current = newIdx;

        optionEls.current[newIdx]?.focus();
      }
    },
    [options.length],
  );

  const handleDropdownToggle = useCallback(
    (o: boolean) => {
      setIsOpen(!o);
      if (!o) currentFocusedOptionIdx.current = -1;
    },
    [setIsOpen],
  );

  return (
    <Dropdown
      header={
        <div className="flex items-center gap-1">
          {prefix} {currentOption?.label || placeholder} {suffix}
        </div>
      }
      className={className}
      ref={ref}
      isOpen={isOpen}
      role="listbox"
      onToggle={handleDropdownToggle}
      onKeyDown={handleKeyDown}
    >
      <ul className="flex flex-col gap-1 py-2">
        {options.map((option, i) => {
          const isOptionSelected = option.value === currentOption?.value;
          return (
            <li key={option.value}>
              <Button
                role="option"
                aria-selected={isOptionSelected}
                className={classNames(
                  "flex items-center justify-between w-full text-left px-2 py-1 focus-visible:outline-hidden focus-visible:bg-[#f4f4f5] can-hover:hover:text-[#23263b] can-hover:hover:bg-[#f4f4f5]",
                  { "font-bold": isOptionSelected },
                )}
                ref={(opt) => {
                  if (opt) optionEls.current[i] = opt;
                }}
                disabled={isOptionSelected}
                onClick={() => {
                  setCurrentOption(option);
                  setIsOpen(false);
                  if (typeof onChange === "function") onChange(option);
                }}
                onKeyDown={handleKeyDown}
              >
                {option.label}
                {isOptionSelected && <CheckIcon className="w-4 h-4" />}
              </Button>
            </li>
          );
        })}
      </ul>
    </Dropdown>
  );
}
