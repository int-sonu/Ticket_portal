type Props = {
  Name: string;
  Role: number;
  onClick: () => void;
};

const AgentCard = ({ Name, Role, onClick }: Props) => {
  const initials = String(Name || "A")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 text-left transition-colors hover:bg-sky-50"
      onClick={onClick}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-300 text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="text-sm font-medium text-slate-900">
          {Name}
        </span>
      </span>
      <span className="text-xs text-slate-400">Role {Role}</span>
    </button>
  );
};

export default AgentCard;
