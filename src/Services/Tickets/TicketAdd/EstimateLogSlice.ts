import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface EstimateLogType {
  EstimateLogFetching: boolean;
  EstimateLogSuccess: boolean;
  EstimateLogError: boolean;
  EstimateLogErrorMessage: string;
  EstimateLogData: any[];
}

interface EstimateLogPayload {
  nEstimateId: number;
  nSharedBy: number;
  cMethod: string;
  cSharedTo: string;
  nCompanyId: number;
  cSchemaName: string;
  cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const EstimateLog = createAsyncThunk<
  any,
  EstimateLogPayload,
  { rejectValue: RejectedValue }
>("list/EstimateLog", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.EstimateLogUrl,
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

const initialState: EstimateLogType = {
  EstimateLogFetching: false,
  EstimateLogSuccess: false,
  EstimateLogError: false,
  EstimateLogData: [],
  EstimateLogErrorMessage: "",
};

const EstimateLogSlice = createSlice({
  name: "list/EstimateLog",
  initialState,
  reducers: {
    clearEstimateLogSlice: (state) => {
      state.EstimateLogError = false;
      state.EstimateLogSuccess = false;
      state.EstimateLogFetching = false;
      state.EstimateLogErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(EstimateLog.pending, (state) => {
        state.EstimateLogFetching = true;
        state.EstimateLogSuccess = false;
        state.EstimateLogError = false;
        state.EstimateLogErrorMessage = "";
      })
      .addCase(EstimateLog.fulfilled, (state, action) => {
        state.EstimateLogFetching = false;
        state.EstimateLogSuccess = true;
        state.EstimateLogError = false;
        state.EstimateLogData = action.payload?.message || [];
      })
      .addCase(EstimateLog.rejected, (state, action) => {
        state.EstimateLogFetching = false;
        state.EstimateLogSuccess = false;
        state.EstimateLogError = true;
        state.EstimateLogErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearEstimateLogSlice } = EstimateLogSlice.actions;

export default EstimateLogSlice.reducer;
