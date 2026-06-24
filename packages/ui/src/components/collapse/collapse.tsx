import classNames from "classnames";

export type CollapseProps = {
  isCollapsed: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Collapse({ isCollapsed, className, children }: CollapseProps) {
  return (
    <div
      className={classNames(
        "overflow-hidden collapse-transition",
        isCollapsed
          ? "max-h-0 opacity-0 pointer-events-none"
          : "max-h-[2000px] opacity-100 pointer-events-auto",
        className
      )}
      aria-hidden={isCollapsed}
    >
      {children}
    </div>
  );
}
