import React from "react";
import { AgentDetails } from "../Utils";
import { Modal } from "antd";
import CardSwitcher from "../CardSwitcher";
import { InputSearch } from "../../../ui/Index";
import ViewAllCard from "../ChildCards/ViewAllCard";
import useSetUserCreds from "../../../../Hooks/useSetUserCreds";
import useSuperUser from "../../../../Hooks/useSuperUser";
import AgentCard from "../ChildCards/AgentCard";

interface Props {
  isOpen: boolean;
  onClose: VoidFunction;
  agentList: AgentDetails[];
  handleIdChange: (newId: number) => void;
  cAgentId: string;
  handleAgentId: (id: string) => void;
  NoViewAll?: boolean;
  setAgentUnderSupervisorCount?: React.Dispatch<React.SetStateAction<number>>;
}
  
const AdminAgentListingModal: React.FC<Props> = (props: Props) => {
  const [search, setSearch] = React.useState<string>("");
  const userCreds = useSetUserCreds();
  const { isSuperUser } = useSuperUser();
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // For Super Users, userCreds.id is either the view agent (view-only)
  // or the connected agent — both are real agents in the company that
  // the SU should see in the list. Skip the "remove me" filter.
  const removedAdminList = React.useMemo(
    () =>
      isSuperUser
        ? props.agentList
        : props.agentList.filter((agent) => agent.nAgentId !== userCreds?.id),
    [props.agentList, userCreds?.id, isSuperUser]
  );

  const filteredAgentList = React.useMemo(
    () =>
      removedAdminList.filter((agent) =>
        agent.cAgentName.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [removedAdminList, debouncedSearch]
  );

  const AgentCount = React.useMemo(
    () => props.agentList.filter((agent) => agent.nType === 3).length,
    [props.agentList]
  );

  const SupervisorCount = React.useMemo(
    () => props.agentList.filter((agent) => agent.nType === 2).length,
    [props.agentList]
  );

  return (
    <Modal
      className="selector-modal"
      open={props.isOpen}
      onClose={props.onClose}
      onCancel={props.onClose}
      title="Select Agent"
      footer={null}
    >
      <InputSearch value={search} onChange={setSearch} />
      <div className="flex flex-col gap-2 mt-2 overflow-auto max-h-[30vh]">
       {!props.NoViewAll && <ViewAllCard
          handleIdClick={props.handleIdChange}
          nAgent={AgentCount}
          nSupervisor={SupervisorCount}
        />}
        {!isSuperUser && (
          <AgentCard
            Name="Self"
            Role={userCreds?.nType || 0}
            onClick={() => props.handleIdChange(userCreds?.id || 0)}
          />
        )}
        {filteredAgentList.map((agent) => (
          <CardSwitcher
            key={agent.nAgentId}
            agentDetails={agent}
            cAgentId={props.cAgentId}
            setAgentUnderSupervisorCount={props.setAgentUnderSupervisorCount}
            handleIdChange={props.handleIdChange}
            handleAgentId={props.handleAgentId}
            NoViewAll={props.NoViewAll}
          />
        ))}
      </div>
    </Modal>
  );
};

export default AdminAgentListingModal;
