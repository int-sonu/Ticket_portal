import resolvedIcon from '../../assets/icons/resolved.svg';
import unresolvedIcon from '../../assets/icons/unresolved.svg';
import closedTicketIcon from '../../assets/icons/closedTicketIcon.svg';

interface TicketClosedCardProps {
  closed: number;
  resolved: number;
  unresolved: number;
  className?: string;
  onClick?: () => void;
}

const TicketClosedCard: React.FC<TicketClosedCardProps> = ({
  closed,
  resolved,
  unresolved,
  className = '',
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-full w-full min-h-[88px] items-stretch overflow-hidden rounded-lg border border-[#B3E9EA] bg-white text-left shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {/* Left: Closed label + count */}
      <div className="relative flex w-[32%] min-w-[110px] max-w-[150px] flex-col justify-center border-r border-[#d4e8ea] px-4 py-3">
        <span
          className="pointer-events-none absolute left-0 top-1/2 h-3 w-1.5 -translate-y-1/2 border-y-[6px] border-l-[6px] border-y-transparent border-l-[#B3E9EA]"
          aria-hidden
        />
        <div className="flex items-center gap-2">
          <img src={closedTicketIcon} alt="" className="h-4 w-4 shrink-0" />
          <p className="text-xs font-medium text-[#4A6B6B]">Closed</p>
        </div>
        <p className="mt-1 text-3xl font-semibold leading-none text-slate-900">
          {String(closed ?? 0).padStart(2, '0')}
        </p>
      </div>

      {/* Right: Resolved / Unresolved rows */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center justify-between gap-2 border-b border-[#e2e8f0] px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <img src={resolvedIcon} alt="" className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium text-[#5A7A7A]">Resolved</span>
          </div>
          <span className="shrink-0 text-base font-semibold text-slate-800">
            {String(resolved ?? 0).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <img src={unresolvedIcon} alt="" className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium text-[#5A7A7A]">Unresolved</span>
          </div>
          <span className="shrink-0 text-base font-semibold text-slate-800">
            {String(unresolved ?? 0).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span
        className="pointer-events-none absolute right-0 top-1/2 h-3 w-1.5 -translate-y-1/2 border-y-[6px] border-r-[6px] border-y-transparent border-r-[#B3E9EA]"
        aria-hidden
      />
    </button>
  );
};

export default TicketClosedCard;
