import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface PartListEstimateType {
  PartListEstimateFetching: boolean;
  PartListEstimateSuccess: boolean;
  PartListEstimateError: boolean;
  PartListEstimateErrorMessage: string;
  PartListEstimateData: any[];
}

interface PartListEstimatePayload {
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const PartListEstimate = createAsyncThunk<
  any,
  PartListEstimatePayload,
  { rejectValue: RejectedValue }
>("list/PartListEstimate", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.PartListEstimateUrl,
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

const initialState: PartListEstimateType = {
  PartListEstimateFetching: false,
  PartListEstimateSuccess: false,
  PartListEstimateError: false,
  PartListEstimateData: [],
  PartListEstimateErrorMessage: "",
};

const PartListEstimateSlice = createSlice({
  name: "list/PartListEstimate",
  initialState,
  reducers: {
    clearPartListEstimateSlice: (state) => {
      state.PartListEstimateError = false;
      state.PartListEstimateSuccess = false;
      state.PartListEstimateFetching = false;
      state.PartListEstimateErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(PartListEstimate.pending, (state) => {
        state.PartListEstimateFetching = true;
        state.PartListEstimateSuccess = false;
        state.PartListEstimateError = false;
        state.PartListEstimateErrorMessage = "";
      })
      .addCase(PartListEstimate.fulfilled, (state, action) => {
        state.PartListEstimateFetching = false;
        state.PartListEstimateSuccess = true;
        state.PartListEstimateError = false;
        state.PartListEstimateData = action.payload?.data || [];
      })
      .addCase(PartListEstimate.rejected, (state, action) => {
        state.PartListEstimateFetching = false;
        state.PartListEstimateSuccess = false;
        state.PartListEstimateError = true;
        state.PartListEstimateErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearPartListEstimateSlice } = PartListEstimateSlice.actions;

export default PartListEstimateSlice.reducer;
