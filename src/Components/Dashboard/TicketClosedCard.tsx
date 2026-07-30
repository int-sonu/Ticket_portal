import resolvedIcon from '../../assets/icons/resolved.svg';
import unresolvedIcon from '../../assets/icons/unresolved.svg';

interface TicketClosedCardProps {
  closed: number;
  resolved: number;
  unresolved: number;
  className?: string;
  onClick?: (status: 'closed' | 'resolved' | 'unresolved') => void;
}

const TicketClosedCard: React.FC<TicketClosedCardProps> = ({
  closed,
  resolved,
  unresolved,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`relative flex h-full w-full min-h-[80px] items-stretch rounded-md border border-[#B7E5F7] bg-white text-left ${className}`}
    >
      <span
        className="pointer-events-none absolute -left-[7px] top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-r border-t border-[#B7E5F7] bg-white"
        aria-hidden
      />
      <button
        type="button"
        onClick={() => onClick?.('closed')}
        className="relative flex w-1/2 min-w-0 flex-col justify-center border-r border-[#edf1f5] px-7 py-2 text-left transition-colors hover:bg-slate-50"
      >
        <p className="text-sm font-medium leading-none text-[#364d6f]">Closed</p>
        <p className="mt-1.5 text-[26px] font-medium leading-none text-black">
          {String(closed ?? 0).padStart(2, '0')}
        </p>
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <button
          type="button"
          onClick={() => onClick?.('resolved')}
          className="flex min-h-0 flex-1 items-center justify-between gap-2 border-b border-[#e6ebf1] px-2.5 py-1 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex min-w-0 items-center gap-2">
            <img src={resolvedIcon} alt="" className="h-[23px] w-[23px] shrink-0" />
            <span className="text-[13px] font-medium text-[#60719d]">Resolved</span>
          </div>
          <span className="shrink-0 pr-4 text-base font-medium text-black">
            {String(resolved ?? 0).padStart(2, '0')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onClick?.('unresolved')}
          className="flex min-h-0 flex-1 items-center justify-between gap-2 px-2.5 py-1 text-left transition-colors hover:bg-slate-50"
        >
          <div className="flex min-w-0 items-center gap-2">
            <img src={unresolvedIcon} alt="" className="h-[23px] w-[23px] shrink-0" />
            <span className="text-[13px] font-medium text-[#60719d]">Unresolved</span>
          </div>
          <span className="shrink-0 pr-4 text-base font-medium text-black">
            {String(unresolved ?? 0).padStart(2, '0')}
          </span>
        </button>
      </div>
      <span
        className="pointer-events-none absolute -right-[7px] top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rotate-45 border-b border-l border-[#B7E5F7] bg-white"
        aria-hidden
      />
    </div>
  );
};

export default TicketClosedCard;
