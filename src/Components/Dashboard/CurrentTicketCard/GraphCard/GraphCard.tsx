import upIcon from "../../../assets/icons/up-vector.svg";
import downIcon from "../../../assets/icons/down-vector.svg";
import waveIcon from "../../../assets/icons/wave-chart.png";

interface Props {
  type: string;
  number: number;
  amount: number|string;
  profit: boolean;
  className?: string;
  onClick?: VoidFunction;
}

const GraphCard: React.FC<Props> = ({
  amount,
  number,
  profit,
  type,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex bg-[#E3F2F2] border border-[#B3E9EA] rounded-md cursor-pointer hover:shadow-md active:scale-95 transition-all duration-300 ${className}`}
    >
      <div className="bg-[#55B4B7] text-white py-2 px-4 content-center text-lg font-medium rounded-tl-md rounded-bl-md">
        {String(number || 0).padStart(2, '0')}
      </div>
      <div className="flex flex-1 rounded-tr-md rounded-br-md justify-between py-2.5 px-2">
        <div className="px-2">
          <p className="text-[#356666] text-xs font-medium">{type}</p>
          <div className="flex flex-1 items-center gap-2">
            <p className="text-[#6FA1A1] text-xl font-medium">Rs. {amount}</p>
            {/* <img
              className="w-4 h-4"
              src={profit ? upIcon : downIcon}
              alt="arrow"
            /> */}
          </div>
        </div>
        <div className="content-end">
          <img src={waveIcon} alt="wave-icon" className="h-6" />
        </div>
      </div>
    </div>
  );
};

export default GraphCard;
