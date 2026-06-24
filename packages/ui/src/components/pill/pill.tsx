import classNames from "classnames";

export type PillProps = {
  children: React.ReactNode;
  color?: "nebula" | "neutral";
};

export function Pill({ children, color = "neutral" }: PillProps) {
  return (
    <div
      className={classNames(
        "inline-flex justify-between items-center gap-3 text-[16px] p-2 border rounded-xs",
        color === "neutral" && "bg-[#f4f4f5] border-neutral-dark",
        color === "nebula" && "bg-nebula-lightest border-[#5468ff]"
      )}
    >
      {children}
    </div>
  );
}
