import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketHistoryType {
  TicketHistoryFetching: boolean;
  TicketHistorySuccess: boolean;
  TicketHistoryError: boolean;
  TicketHistoryErrorMessage: string;
  TicketHistoryData: any;
}

interface TicketHistoryPayload {
  nCompanyId: number;
  nTicketId: number;
  cSchemaName: string;
  cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const TicketHistory = createAsyncThunk<
  any,
  TicketHistoryPayload,
  { rejectValue: RejectedValue }
>("list/TicketHistory", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.TicketHistoryUrl,
      method: "POST",
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

const initialState: TicketHistoryType = {
  TicketHistoryFetching: false,
  TicketHistorySuccess: false,
  TicketHistoryError: false,
  TicketHistoryData: null,
  TicketHistoryErrorMessage: "",
};

const TicketHistorySlice = createSlice({
  name: "list/TicketHistory",
  initialState,
  reducers: {
    clearTicketHistorySlice: (state) => {
      state.TicketHistoryError = false;
      state.TicketHistorySuccess = false;
      state.TicketHistoryFetching = false;
      state.TicketHistoryErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(TicketHistory.pending, (state) => {
        state.TicketHistoryFetching = true;
        state.TicketHistorySuccess = false;
        state.TicketHistoryError = false;
        state.TicketHistoryErrorMessage = "";
      })
      .addCase(TicketHistory.fulfilled, (state, action) => {
        state.TicketHistoryFetching = false;
        state.TicketHistorySuccess = true;
        state.TicketHistoryError = false;
        state.TicketHistoryData = action.payload?.data || null;
      })
      .addCase(TicketHistory.rejected, (state, action) => {
        state.TicketHistoryFetching = false;
        state.TicketHistorySuccess = false;
        state.TicketHistoryError = true;
        state.TicketHistoryErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearTicketHistorySlice } = TicketHistorySlice.actions;

export default TicketHistorySlice.reducer;
