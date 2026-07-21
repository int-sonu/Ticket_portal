import { useMemo } from 'react';
import SimpleMasterList from '../Common/SimpleMasterList';
import type { SimpleMasterRow } from '../Common/SimpleMasterUtils';
import { isMasterRecordActive } from '../Common/SimpleMasterUtils';
import {
  useDeleteTripMode,
  useGetTripModes,
  useSaveTripMode,
  useUpdateTripMode,
} from './Hooks';

const mapTripModeRow = (tripMode: any, index: number): SimpleMasterRow => ({
  id: tripMode?.nTripModeId ?? tripMode?.nTripmodeId ?? index + 1,
  key: tripMode?.nTripModeId ?? tripMode?.nTripmodeId ?? index + 1,
  srl: index + 1,
  name: tripMode?.cTripModeNmae ?? tripMode?.cTripModeName ?? tripMode?.cModeName ?? 'N/A',
  shortName: tripMode?.cModeShName ?? tripMode?.cShName ?? '',
  active: isMasterRecordActive(tripMode),
  raw: tripMode,
});

const buildTripModePayload = (values: any, selectedRow: SimpleMasterRow | null) => ({
  nTripModeId: selectedRow?.id,
  nTripmodeId: selectedRow?.id,
  cModeName: values.name,
  cShName: values.shortName,
  bActive: values.active ?? true,
});

const formatTripModeSaveError = (serverMessage: string) => {
  if (/23505|duplicate key|tm_tripmode_cmodename_key/i.test(serverMessage)) {
    return 'Trip Mode name already exists. Please enter a different name.';
  }

  return serverMessage;
};

const TripModeList = () => {
  const { mutate: saveTripMode, isPending: isSaving } = useSaveTripMode();
  const { mutate: updateTripMode, isPending: isUpdating } = useUpdateTripMode();
  const { mutate: deleteTripMode } = useDeleteTripMode();

  const listProps = useMemo(() => ({
    title: 'Trip Mode Master',
    entityName: 'Trip Mode',
    nameColumnTitle: 'Trip Mode Name',
    drawerDescription: 'This section allows you to manage Trip Mode, which includes adding, editing, and viewing.',
    idKey: 'nTripModeId',
    useListQuery: useGetTripModes,
    saveMutation: saveTripMode,
    updateMutation: updateTripMode,
    deleteMutation: deleteTripMode,
    isSaving: isSaving || isUpdating,
    mapRow: mapTripModeRow,
    buildPayload: buildTripModePayload,
    formatSaveError: formatTripModeSaveError,
    addButtonClassName: 'h-9 !border-emerald-500 !bg-emerald-500 px-5 font-medium hover:!border-emerald-600 hover:!bg-emerald-600',
    showAddButtonIcon: false,
  }), [deleteTripMode, isSaving, isUpdating, saveTripMode, updateTripMode]);

  return <SimpleMasterList {...listProps} />;
};

export default TripModeList;
