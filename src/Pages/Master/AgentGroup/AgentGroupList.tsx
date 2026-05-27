import { useMemo } from 'react';

import SimpleMasterList from '../Common/SimpleMasterList';

import type { SimpleMasterRow } from '../Common/SimpleMasterUtils';

import {
  useDeleteGroup,
  useGetGroups,
  useSaveGroup,
  useUpdateGroup,
} from './Hooks';



// TABLE DATA MAPPING

const mapGroupRow = (
  group: any,
  index: number,
): SimpleMasterRow => ({
  id:
    group?.nGroupId ??
    index + 1,

  key:
    group?.nGroupId ??
    index + 1,

  srl:
    index + 1,

  name:
    group?.cGroupName ??
    group?.cAgentGroupName ??
    group?.groupName ??
    'N/A',

  shortName:
    group?.cGroupShName ??
    group?.cGroupShname ??
    group?.cShName ??
    '',

  active:
    group?.bActive !== false &&
    group?.bActive !== 'false' &&
    group?.bCancelled !== true &&
    group?.bCancelled !== 'true',

  raw: group,
});
// SAVE / UPDATE PAYLOAD

const buildGroupPayload = (
  values: any,
  selectedRow: SimpleMasterRow | null,
) => ({
  nGroupId:
    selectedRow?.id,

  cGroupName:
    String(
      values.name ?? '',
    ).trim(),

  cGroupShName:
    String(
      values.shortName ?? '',
    ).trim(),

  bActive:
    values.active ?? true,
});
const AgentGroupList = () => {

  // SAVE

  const {
    mutate: saveGroup,

    isPending: isSaving,
  } = useSaveGroup();
  // UPDATE

  const {
    mutate: updateGroup,

    isPending: isUpdating,
  } = useUpdateGroup();
  // DELETE

  const {
    mutate: deleteGroup,
  } = useDeleteGroup()

  // LIST CONFIG

  const listProps = useMemo(
    () => ({
      title:
        'Agent Group Master',

      entityName:
        'Group',

      nameColumnTitle:
        'Group Name',

      drawerDescription:
        'This section allows you to manage agent groups, which includes adding, editing, and viewing.',

      idKey:
        'nGroupId',

      useListQuery:
        useGetGroups,

      saveMutation:
        saveGroup,

      updateMutation:
        updateGroup,

      deleteMutation:
        deleteGroup,

      isSaving:
        isSaving || isUpdating,

      mapRow:
        mapGroupRow,

      buildPayload:
        buildGroupPayload,
      // ENABLE SHORT NAME

      hasShortName:
        true,
     // REQUIRED FIELD VALIDATION

      requiredFields: {
        name:
          'Please enter group name',

        shortName:
          'Please enter short name',
      },



      // DUPLICATE VALIDATION

      duplicateValidation: {
        shortName:
          'Short name already exists',
      },

    }),

    [
      deleteGroup,
      isSaving,
      isUpdating,
      saveGroup,
      updateGroup,
    ],
  );





  return (
    <SimpleMasterList
      {...listProps}
    />
  );
};

export default AgentGroupList;