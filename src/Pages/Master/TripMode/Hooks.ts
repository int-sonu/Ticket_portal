import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripModeApis } from '../../../Axios/AgentApis';
import type { TripModePayload } from '../../../Axios/AgentApis';

export const TRIP_MODE_KEYS = {
  all: ['tripModes'] as const,
  lists: () => [...TRIP_MODE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...TRIP_MODE_KEYS.lists(), { filters }] as const,
};

export const useGetTripModes = (payload: TripModePayload) => {
  return useQuery({
    queryKey: TRIP_MODE_KEYS.list(JSON.stringify(payload)),
    queryFn: () => tripModeApis.tripModeList(payload),
    enabled: !!payload,
  });
};

export const useSaveTripMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TripModePayload) => tripModeApis.tripModeSave(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIP_MODE_KEYS.lists() });
    },
  });
};

export const useUpdateTripMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TripModePayload) => tripModeApis.tripModeUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIP_MODE_KEYS.lists() });
    },
  });
};

export const useDeleteTripMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TripModePayload) => tripModeApis.tripModeDelete(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRIP_MODE_KEYS.lists() });
    },
  });
};
