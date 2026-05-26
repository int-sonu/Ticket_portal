import { useMemo } from "react";

import SimpleMasterList from "../Common/SimpleMasterList";

import type { SimpleMasterRow } from "../Common/SimpleMasterUtils";

import {
  useDeleteFollowupMode,
  useGetFollowupModes,
  useSaveFollowupMode,
  useUpdateFollowupMode,
} from "./Hooks";

const mapFollowupModeRow = (
  item: any,
  index: number
): SimpleMasterRow => ({
  id: item?.nCallModeId ?? index + 1,

  key: item?.nCallModeId ?? index + 1,

  srl: index + 1,

  name: item?.cCallModeName ?? "N/A",

  shortName: item?.cModeShName ?? "",

  active:
    item?.bActive !== false &&
    item?.bCancelled !== true,

  raw: item,
});

const buildFollowupModePayload = (
  values: any,
  selectedRow: SimpleMasterRow | null
) => ({
  nCallModeId: selectedRow?.id,

  cCallModeName: values.name,

  cCallModeShName: values.shortName,

  bActive: values.active ?? true,
});

const FollowupModeList = () => {
  const {
    mutate: saveFollowupMode,
    isPending: isSaving,
  } = useSaveFollowupMode();

  const {
    mutate: updateFollowupMode,
    isPending: isUpdating,
  } = useUpdateFollowupMode();

  const {
    mutate: deleteFollowupMode,
  } = useDeleteFollowupMode();

  const listProps = useMemo(
    () => ({
      title: "Followup Mode Master",

      entityName: "Followup Mode",

      nameColumnTitle: "Followup Mode Name",

      drawerDescription:
        "This section allows you to manage Followup Mode.",

      idKey: "nCallModeId",

      useListQuery: useGetFollowupModes,

      saveMutation: saveFollowupMode,

      updateMutation: updateFollowupMode,

      deleteMutation: deleteFollowupMode,

      isSaving: isSaving || isUpdating,

      mapRow: mapFollowupModeRow,

      buildPayload: buildFollowupModePayload,
    }),
    [
      deleteFollowupMode,
      isSaving,
      isUpdating,
      saveFollowupMode,
      updateFollowupMode,
    ]
  );

  return <SimpleMasterList {...listProps} />;
};

export default FollowupModeList;
