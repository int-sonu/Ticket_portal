import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface UpdateTicketStatusType {
  UpdateTicketStatusFetching: boolean;
  UpdateTicketStatusSuccess: boolean;
  UpdateTicketStatusError: boolean;
  UpdateTicketStatusErrorMessage: string;
  UpdateTicketStatusData: any[];
}

interface UpdateTicketStatusPayload {
nTicketId: number;
nTicketStatus: number;
nModifiedBy: number;
nCompanyId: number;
cSchemaName: string;
cDbName: string
}

interface RejectedValue {
  message: string;
}

export const UpdateTicketStatus = createAsyncThunk<
  any,
  UpdateTicketStatusPayload,
  { rejectValue: RejectedValue }
>("list/UpdateTicketStatus", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.UpdateTicketStatusURL,
      method: "PUT",
      data: payload,
    });
    if (response.status === 200) {
      return response.data;
    } else {
      return rejectWithValue({
        message: "Failed to fetch state",
      });
    }
  } catch (e: any) {
    const message =
      (e.response && e.response.data.message) || e.message || e.toString();
    return rejectWithValue({ message });
  }
});

const initialState: UpdateTicketStatusType = {
  UpdateTicketStatusFetching: false,
  UpdateTicketStatusSuccess: false,
  UpdateTicketStatusError: false,
  UpdateTicketStatusData: [],
  UpdateTicketStatusErrorMessage: "",
};

const UpdateTicketStatusSlice = createSlice({
  name: "list/UpdateTicketStatus",
  initialState,
  reducers: {
    clearUpdateTicketStatusSlice: (state) => {
      state.UpdateTicketStatusError = false;
      state.UpdateTicketStatusSuccess = false;
      state.UpdateTicketStatusFetching = false;
      state.UpdateTicketStatusErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(UpdateTicketStatus.pending, (state) => {
        state.UpdateTicketStatusFetching = true;
        state.UpdateTicketStatusSuccess = false;
        state.UpdateTicketStatusError = false;
        state.UpdateTicketStatusErrorMessage = "";
      })
      .addCase(UpdateTicketStatus.fulfilled, (state, action) => {
        state.UpdateTicketStatusFetching = false;
        state.UpdateTicketStatusSuccess = true;
        state.UpdateTicketStatusError = false;
        state.UpdateTicketStatusData = action.payload?.message || [];
      })
      .addCase(UpdateTicketStatus.rejected, (state, action) => {
        state.UpdateTicketStatusFetching = false;
        state.UpdateTicketStatusSuccess = false;
        state.UpdateTicketStatusError = true;
        state.UpdateTicketStatusErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearUpdateTicketStatusSlice } = UpdateTicketStatusSlice.actions;

export default UpdateTicketStatusSlice.reducer;
