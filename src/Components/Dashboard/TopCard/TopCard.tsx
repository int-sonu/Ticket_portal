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
      className={`flex h-full w-full flex-col items-start justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-left shadow-sm transition-shadow hover:border-sky-200 hover:shadow-md ${className}`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${iconBg}`}
        >
          <img src={icon} alt="" className="h-3.5 w-3.5" />
        </div>
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-1 text-xl font-medium leading-none text-slate-950">
        {String(value ?? 0).padStart(2, '0')}
      </p>
    </button>
  );
};

export default TopCard;
