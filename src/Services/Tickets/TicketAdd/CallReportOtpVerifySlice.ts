import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface CallReportOtpVerifyType {
  CallReportOtpVerifyFetching: boolean;
  CallReportOtpVerifySuccess: boolean;
  CallReportOtpVerifyError: boolean;
  CallReportOtpVerifyErrorMessage: string;
  CallReportOtpVerifyData: any[];
}


export interface CallReportOtpVerifyPayload {
 nCompanyId: number;
 nOtpId: number;
 cOtp: string;
 nTicketId: number;
 nTicketStatus: number;
 nModifiedBy: number;
 cSchemaName: string;
 cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const CallReportOtpVerify = createAsyncThunk<
  any,
  CallReportOtpVerifyPayload,
  { rejectValue: RejectedValue }
>("list/CallReportOtpVerify", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.TicketCallReportOtpVerifyURL,
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

const initialState: CallReportOtpVerifyType = {
  CallReportOtpVerifyFetching: false,
  CallReportOtpVerifySuccess: false,
  CallReportOtpVerifyError: false,
  CallReportOtpVerifyData: [],
  CallReportOtpVerifyErrorMessage: "",
};

const CallReportOtpVerifySlice = createSlice({
  name: "list/CallReportOtpVerify",
  initialState,
  reducers: {
    clearCallReportOtpVerifySlice: (state) => {
      state.CallReportOtpVerifyError = false;
      state.CallReportOtpVerifySuccess = false;
      state.CallReportOtpVerifyFetching = false;
      state.CallReportOtpVerifyErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(CallReportOtpVerify.pending, (state) => {
        state.CallReportOtpVerifyFetching = true;
        state.CallReportOtpVerifySuccess = false;
        state.CallReportOtpVerifyError = false;
        state.CallReportOtpVerifyErrorMessage = "";
      })
      .addCase(CallReportOtpVerify.fulfilled, (state, action) => {
        state.CallReportOtpVerifyFetching = false;
        state.CallReportOtpVerifySuccess = true;
        state.CallReportOtpVerifyError = false;
        state.CallReportOtpVerifyData = action.payload?.message || [];
      })
      .addCase(CallReportOtpVerify.rejected, (state, action) => {
        state.CallReportOtpVerifyFetching = false;
        state.CallReportOtpVerifySuccess = false;
        state.CallReportOtpVerifyError = true;
        state.CallReportOtpVerifyErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearCallReportOtpVerifySlice } = CallReportOtpVerifySlice.actions;

export default CallReportOtpVerifySlice.reducer;
