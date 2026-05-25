import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface SendEstimateMailType {
  SendEstimateMailFetching: boolean;
  SendEstimateMailSuccess: boolean;
  SendEstimateMailError: boolean;
  SendEstimateMailErrorMessage: string;
  SendEstimateMailData: any[];
}

export interface SendEstimateMailPayload {
  toEmail: string;
  subject: string;
  body: string;
  attachmentUrl: string;
  cType: string;
  nAgentId: number | undefined;
  nCompanyId: number | undefined;
  cSchemaName: string | undefined;
  cDbName: string | undefined;
}

interface RejectedValue {
  message: string;
}

export const SendEstimateMail = createAsyncThunk<
  any,
  SendEstimateMailPayload,
  { rejectValue: RejectedValue }
>("list/SendEstimateMail", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.SendEstimateMailURL,
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

const initialState: SendEstimateMailType = {
  SendEstimateMailFetching: false,
  SendEstimateMailSuccess: false,
  SendEstimateMailError: false,
  SendEstimateMailData: [],
  SendEstimateMailErrorMessage: "",
};

const SendEstimateMailSlice = createSlice({
  name: "list/SendEstimateMail",
  initialState,
  reducers: {
    clearSendEstimateMailSlice: (state) => {
      state.SendEstimateMailError = false;
      state.SendEstimateMailSuccess = false;
      state.SendEstimateMailFetching = false;
      state.SendEstimateMailErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(SendEstimateMail.pending, (state) => {
        state.SendEstimateMailFetching = true;
        state.SendEstimateMailSuccess = false;
        state.SendEstimateMailError = false;
        state.SendEstimateMailErrorMessage = "";
      })
      .addCase(SendEstimateMail.fulfilled, (state, action) => {
        state.SendEstimateMailFetching = false;
        state.SendEstimateMailSuccess = true;
        state.SendEstimateMailError = false;
        state.SendEstimateMailData = action.payload?.message || [];
      })
      .addCase(SendEstimateMail.rejected, (state, action) => {
        state.SendEstimateMailFetching = false;
        state.SendEstimateMailSuccess = false;
        state.SendEstimateMailError = true;
        state.SendEstimateMailErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearSendEstimateMailSlice } = SendEstimateMailSlice.actions;

export default SendEstimateMailSlice.reducer;
