import { useMemo } from 'react';
import SimpleMasterList from '../Common/SimpleMasterList';
import type { SimpleMasterRow } from '../Common/SimpleMasterUtils';
import { useDeleteGroup, useGetGroups, useSaveGroup, useUpdateGroup } from './Hooks';

const mapGroupRow = (group: any, index: number): SimpleMasterRow => ({
  id: group?.nGroupId ?? index + 1,
  key: group?.nGroupId ?? index + 1,
  srl: index + 1,
  name: group?.cGroupName ?? 'N/A',
  shortName: group?.cGroupShName ?? '',
  active: group?.bActive !== false && group?.bCancelled !== true,
  raw: group,
});

const buildGroupPayload = (values: any, selectedRow: SimpleMasterRow | null) => ({
  nGroupId: selectedRow?.id,
  cGroupName: values.name,
  cGroupShName: values.shortName,
  bActive: values.active ?? true,
});

const AgentGroupList = () => {
  const { mutate: saveGroup, isPending: isSaving } = useSaveGroup();
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup();
  const { mutate: deleteGroup } = useDeleteGroup();

  const listProps = useMemo(() => ({
    title: 'Agent Group Master',
    entityName: 'Group',
    nameColumnTitle: 'Group Name',
    drawerDescription: 'This section allows you to manage agent groups, which includes adding, editing, and viewing.',
    idKey: 'nGroupId',
    useListQuery: useGetGroups,
    saveMutation: saveGroup,
    updateMutation: updateGroup,
    deleteMutation: deleteGroup,
    isSaving: isSaving || isUpdating,
    mapRow: mapGroupRow,
    buildPayload: buildGroupPayload,
  }), [deleteGroup, isSaving, isUpdating, saveGroup, updateGroup]);

  return <SimpleMasterList {...listProps} />;
};

export default AgentGroupList;
