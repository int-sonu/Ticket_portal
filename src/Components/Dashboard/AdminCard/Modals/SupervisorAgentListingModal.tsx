import React from "react";
import { AgentDetails } from "../Utils";
import { Modal } from "antd";
import { InputSearch } from "../../../ui/Index";
import ViewAllCard from "../ChildCards/ViewAllCard";
import AgentCard from "../ChildCards/AgentCard";
import useSetUserCreds from "../../../../Hooks/useSetUserCreds";
import useSuperUser from "../../../../Hooks/useSuperUser";

interface Props {
  isOpen: boolean;
  onClose: VoidFunction;
  agentList: AgentDetails[];
  handleIdChange: (newId: number) => void;
  cAgentId: string;
  handleAgentId: (id: string) => void;
  NoViewAll?: boolean;
}

const SupervisorAgentListingModal: React.FC<Props> = (props: Props) => {
  const [search, setSearch] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");

  const userCreds = useSetUserCreds();
  const { isSuperUser } = useSuperUser();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Super User's userCreds.id is the view / connected agent — that's a
  // real agent the SU should see in the list. Skip the "remove me" filter.
  const removedSelfList = React.useMemo(
    () =>
      isSuperUser
        ? props.agentList
        : props.agentList.filter((agent) => agent.nAgentId !== userCreds?.id),
    [props.agentList, userCreds?.id, isSuperUser]
  );

  const filteredAgentList = React.useMemo(
    () =>
      removedSelfList.filter((agent) =>
        agent.cAgentName.toLowerCase().includes(debouncedSearch.toLowerCase())
      ),
    [removedSelfList, debouncedSearch]
  );

  const AgentCount = React.useMemo(
    () => props.agentList.filter((agent) => agent.nType === 3).length,
    [props.agentList]
  );

  const SupervisorCount = React.useMemo(() => {
    let count = props.agentList.filter((agent) => agent.nType === 2).length;

    if (userCreds?.nType === 2) {
      const selfAlreadyInList = props.agentList.some(
        (agent) => agent.nAgentId === userCreds.id
      );

      if (!selfAlreadyInList) {
        count += 1;
      }
    }

    return count;
  }, [props.agentList, userCreds]);

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
        {!props.NoViewAll && (
          <ViewAllCard
            handleIdClick={props.handleIdChange}
            nAgent={AgentCount}
            nSupervisor={SupervisorCount}
          />
        )}

        {!isSuperUser && (
          <AgentCard
            Name="Self"
            Role={userCreds?.nType || 0}
            onClick={() => props.handleIdChange(userCreds?.id || 0)}
          />
        )}

        {filteredAgentList.map((agent) => (
          <AgentCard
            key={agent.nAgentId}
            Name={agent.cAgentName}
            Role={agent.nType}
            onClick={() => props.handleIdChange(agent.nAgentId)}
          />
        ))}
      </div>
    </Modal>
  );
};

export default SupervisorAgentListingModal;