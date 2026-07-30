import type { FC } from 'react';

interface SideStatCardProps {
  label: string;
  value: number;
  image: string;
  className?: string;
  onClick?: () => void;
}

const SideStatCard: FC<SideStatCardProps> = ({
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
      className={`relative flex h-[120px] w-full shrink-0 overflow-hidden bg-[#eff9fd] px-4 py-6 text-left transition-colors hover:bg-[#e8f6fc] ${className}`}
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <p className="max-w-[145px] whitespace-normal text-[14px] font-normal leading-tight text-black">
          {label}
        </p>
        <hr className="my-2 border-0 border-t border-[#b8dff5]" />
        <p className="text-[26px] font-normal leading-none tracking-tight text-[#2394f2]">
          {String(value ?? 0).padStart(2, '0')}
        </p>
      </div>
      <img
        src={image}
        alt=""
        className="absolute bottom-0 right-2 h-[88px] w-[88px] shrink-0 object-contain object-bottom"
      />
    </button>
  );
};

export default SideStatCard;
