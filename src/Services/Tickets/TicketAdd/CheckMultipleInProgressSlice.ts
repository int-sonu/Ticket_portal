import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface CheckMultipleInProgressType {
  CheckMultipleInProgressFetching: boolean;
  CheckMultipleInProgressSuccess: boolean;
  CheckMultipleInProgressError: boolean;
  CheckMultipleInProgressErrorMessage: string;
  CheckMultipleInProgressData: any[];
}

interface CheckMultipleInProgressPayload {
  nCompanyId: number | undefined;
  nAgentId: number | undefined;
  cSchemaName: string | undefined;
  cDbName: string | undefined;
}

interface RejectedValue {
  message: string;
}

export const CheckMultipleInProgress = createAsyncThunk<
  any,
  CheckMultipleInProgressPayload,
  { rejectValue: RejectedValue }
>("list/CheckMultipleInProgress", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.CheckMultipleInProgressURL,
      method: "POST",
      data: payload,
    });
    if (response.status === 200) {
      return response.data;
    } else {
      return rejectWithValue({
        message: "Failed to check in-progress tickets",
      });
    }
  } catch (e: any) {
    const message =
      (e.response && e.response.data.message) || e.message || e.toString();
    return rejectWithValue({ message });
  }
});

const initialState: CheckMultipleInProgressType = {
  CheckMultipleInProgressFetching: false,
  CheckMultipleInProgressSuccess: false,
  CheckMultipleInProgressError: false,
  CheckMultipleInProgressData: [],
  CheckMultipleInProgressErrorMessage: "",
};

const CheckMultipleInProgressSlice = createSlice({
  name: "list/CheckMultipleInProgress",
  initialState,
  reducers: {
    clearCheckMultipleInProgressSlice: (state) => {
      state.CheckMultipleInProgressError = false;
      state.CheckMultipleInProgressSuccess = false;
      state.CheckMultipleInProgressFetching = false;
      state.CheckMultipleInProgressErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(CheckMultipleInProgress.pending, (state) => {
        state.CheckMultipleInProgressFetching = true;
        state.CheckMultipleInProgressSuccess = false;
        state.CheckMultipleInProgressError = false;
        state.CheckMultipleInProgressErrorMessage = "";
      })
      .addCase(CheckMultipleInProgress.fulfilled, (state, action) => {
        state.CheckMultipleInProgressFetching = false;
        state.CheckMultipleInProgressSuccess = true;
        state.CheckMultipleInProgressError = false;
        state.CheckMultipleInProgressData = action.payload?.message || [];
      })
      .addCase(CheckMultipleInProgress.rejected, (state, action) => {
        state.CheckMultipleInProgressFetching = false;
        state.CheckMultipleInProgressSuccess = false;
        state.CheckMultipleInProgressError = true;
        state.CheckMultipleInProgressErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearCheckMultipleInProgressSlice } =
  CheckMultipleInProgressSlice.actions;

export default CheckMultipleInProgressSlice.reducer;
