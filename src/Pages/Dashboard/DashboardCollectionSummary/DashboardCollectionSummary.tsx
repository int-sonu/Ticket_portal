import type { FC } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";

interface CollectionSummaryItem {
  nPaymode?: number | string;
  nTotalAmount?: number | string;
  nAmount?: number | string;
  Amount?: number | string;
  amount?: number | string;
  TotalAmount?: number | string;
}

interface CollectionChartItem {
  name: string;
  value: number;
  fill: string;
}

interface DashboardCollectionSummaryProps {
  amount?: string;
  className?: string;
  onClick?: () => void;
  data?: CollectionSummaryItem[];
}

const DashboardCollectionSummary: FC<DashboardCollectionSummaryProps> = ({
  amount = "₹ 0.00",
  className = "",
  onClick,
  data = [],
}) => {
  const navigate = useNavigate();

  const getPaymentMode = (paymentMode: number) => {
    switch (paymentMode) {
      case 1:
        return "Cash";
      case 2:
        return "QR";
      case 3:
        return "Complementary";
      case 4:
        return "UPI";
      case 5:
        return "Net Banking";
      case 6:
        return "Cheque";
      case 7:
        return "Card";
      case 8:
        return "Company Credit";
      case 9:
        return "Split";
      default:
        return "";
    }
  };

  const getPaymentModeColor = (name: string) => {
    switch (name) {
      case "Cash":
        return "#09486C";
      case "Cheque":
        return "#5FC16A";
      case "Card":
        return "#E35D29";
      case "Net Banking":
        return "#1296E3";
      case "UPI":
        return "#E3BA29";
      case "QR":
        return "#06D7B3";
      case "Complementary":
        return "#FFD700";
      case "Company Credit":
        return "#9932CC";
      case "Split":
        return "#FF69B4";
      default:
        return "#94A3B8";
    }
  };

  const chartData: CollectionChartItem[] = data
    .map((item) => {
      const name = getPaymentMode(Number(item.nPaymode));
      const rawValue =
        item.nTotalAmount ??
        item.nAmount ??
        item.Amount ??
        item.amount ??
        item.TotalAmount ??
        0;

      return {
        name,
        value: Number(rawValue) || 0,
        fill: getPaymentModeColor(name),
      };
    })
    .filter((item) => Boolean(item.name));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const hasData = chartData.length > 0 && total > 0;
  const formatCompactAmount = (value: number) => {
    if (value >= 10000000) {
      return `${Number((value / 10000000).toFixed(1))} Cr`;
    }
    if (value >= 100000) {
      return `${Number((value / 100000).toFixed(1))} L`;
    }
    if (value >= 1000) {
      return `${Number((value / 1000).toFixed(1))} K`;
    }
    return value.toLocaleString("en-IN");
  };
  const formatLegendAmount = (value: number) => value.toFixed(2);

  return (
    <button
      type="button"
      onClick={onClick ?? (() => navigate("/more/collectionsummary"))}
      className={`mt-3 flex min-h-[290px] w-full cursor-pointer flex-col rounded-md border border-[#f3f3f3] bg-white px-5 py-3 text-left shadow-[0_2px_4px_0_#bebebe14] transition-all duration-300 hover:shadow-md active:scale-[0.995] ${className}`}
    >
      <div className="mb-3 flex w-full items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-black">
          Collection Summary
        </h3>
        <span className="shrink-0 text-lg font-semibold text-[#e9a12d]">
          {amount}
        </span>
      </div>

      {!hasData ? (
        <div className="flex min-h-[220px] flex-1 items-center justify-center">
          <span className="text-lg font-semibold text-[#e9a12d]">
          No Data Available
          </span>
        </div>
      ) : (
        <div className="grid w-full flex-1 grid-cols-1 items-center gap-4 md:grid-cols-[minmax(280px,56%)_minmax(0,1fr)]">
          <div className="h-[220px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={chartData.length > 1 ? 3 : 0}
                  labelLine={{ stroke: "#09486c", strokeWidth: 1 }}
                  isAnimationActive={false}
                  label={({ percent }) =>
                    percent && percent >= 0.05
                      ? `${(percent * 100).toFixed(1)}%`
                      : ""
                  }
                >
                  {chartData.map((item) => (
                    <Cell key={item.name} fill={item.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `₹ ${formatLegendAmount(Number(value) || 0)}`,
                    "Amount",
                  ]}
                  contentStyle={{
                    borderRadius: 9,
                    borderColor: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fill="#84a6b9"
                >
                  Total
                </text>
                <text
                  x="50%"
                  y="56%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="#09486c"
                >
                  {formatCompactAmount(total)}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid min-w-0 w-full grid-cols-1 gap-2.5 pb-3 sm:grid-cols-2 md:grid-cols-1 md:pr-5">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex min-w-0 items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-[13px] text-[#60719d]">
                  <i
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-[#09486c]">
                  ₹ {formatLegendAmount(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
};

export default DashboardCollectionSummary;
