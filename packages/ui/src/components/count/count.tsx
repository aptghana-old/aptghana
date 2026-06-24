import classNames from "classnames";

export type CountProps = {
  children: React.ReactNode;
  className?: string;
};

export function Count({ children, className }: CountProps) {
  return (
    <div
      className={classNames(
        "bg-[#d3d4d8] text-[#23263b] w-5 h-5 small-bold rounded-full flex items-center justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}
