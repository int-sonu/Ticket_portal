interface TopCardProps {
  label: string;
  value: number;
  icon: string;
  iconBg: string;
  className?: string;
  onClick?: () => void;
}

const TopCard: React.FC<TopCardProps> = ({
  label,
  value,
  icon,
  iconBg,
  className = '',
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 text-left shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <img src={icon} alt="" className="h-5 w-5 brightness-0 invert" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-600">{label}</p>
        <p className="mt-0.5 text-[26px] font-semibold leading-none text-slate-800">
          {String(value ?? 0).padStart(2, '0')}
        </p>
      </div>
    </button>
  );
};

export default TopCard;
