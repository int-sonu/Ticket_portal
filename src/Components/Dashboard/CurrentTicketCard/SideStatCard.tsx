interface SideStatCardProps {
  label: string;
  value: number;
  image: string;
  className?: string;
  onClick?: () => void;
}

const SideStatCard: React.FC<SideStatCardProps> = ({
  label,
  value,
  image,
  className = '',
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-[108px] w-full overflow-hidden rounded-lg border border-[#C5E8F7] bg-gradient-to-br from-[#EBF7FD] to-[#D6EEF9] px-4 py-3 text-left shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <p className="truncate text-xs font-medium text-[#4A7BA7]">{label}</p>
        <hr className="my-2 border-0 border-t border-[#B8DFF5]" />
        <p className="text-[32px] font-semibold leading-none tracking-tight text-[#3B9AE8]">
          {String(value ?? 0).padStart(2, '0')}
        </p>
      </div>
      <img
        src={image}
        alt=""
        className="absolute right-0 bottom-0 h-[76px] w-[76px] shrink-0 object-contain object-bottom"
      />
    </button>
  );
};

export default SideStatCard;
