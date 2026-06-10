type Props = {
  handleIdClick: (id: number) => void;
  nAgent: number;
  nSupervisor: number;
};

const ViewAllCard = ({ handleIdClick, nAgent, nSupervisor }: Props) => {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 text-left transition-colors hover:bg-sky-50"
      onClick={() => handleIdClick(0)}
    >
      <span className="text-sm font-medium text-slate-900">
        View All
      </span>
      <span className="text-xs text-slate-500">
        {nAgent} Agents, {nSupervisor} Supervisors
      </span>
    </button>
  );
};

export default ViewAllCard;
