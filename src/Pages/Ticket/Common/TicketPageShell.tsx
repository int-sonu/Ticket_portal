import type { ReactNode } from "react";

type TicketPageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

const TicketPageShell = ({
  children,
  className = "",
  contentClassName = "",
}: TicketPageShellProps) => {
  return (
    <div
      className={`relative z-0 flex h-full min-h-0 w-full flex-col ${className}`.trim()}
    >
      <div
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${contentClassName}`.trim()}
      >
        {children}
      </div>
    </div>
  );
};

export default TicketPageShell;
