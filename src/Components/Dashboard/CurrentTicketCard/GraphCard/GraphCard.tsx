interface Props {
  type: string;
  number: number;
  amount: number | string;
  className?: string;
  onClick?: VoidFunction;
}

const WaveDecoration = () => (
  <svg
    viewBox="0 0 80 24"
    className="h-5 w-14 text-[#55B4B7]/50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M0 16 C10 8, 20 24, 30 12 S50 4, 60 14 S75 20, 80 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const GraphCard: React.FC<Props> = ({
  amount,
  number,
  type,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex h-full w-full min-h-[76px] cursor-pointer overflow-hidden rounded-lg border border-[#B3E9EA] bg-[#E3F2F2] transition-all duration-300 hover:shadow-md active:scale-[0.99] ${className}`}
    >
      <div className="flex w-16 shrink-0 items-center justify-center bg-[#55B4B7] text-base font-semibold text-white">
        {String(number || 0).padStart(2, '0')}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#356666]">{type}</p>
          <p className="truncate text-base font-semibold text-[#6FA1A1]">
            Rs. {amount}
          </p>
        </div>
        <WaveDecoration />
      </div>
    </div>
  );
};

export default GraphCard;
