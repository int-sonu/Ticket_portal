import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface SignedCallReportPdfType {
  SignedCallReportPdfFetching: boolean;
  SignedCallReportPdfSuccess: boolean;
  SignedCallReportPdfError: boolean;
  SignedCallReportPdfErrorMessage: string;
  SignedCallReportPdfData: any[];
}

interface RejectedValue {
  message: string;
}

export const SignedCallReportPdf = createAsyncThunk<
  any,
  FormData,
  { rejectValue: RejectedValue }
>("list/SignedCallReportPdf", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.SignedCallReportPdfURL,
      method: "POST",
      data: payload,
      params: {
        nFollowUpId: parseInt(payload.get("nFollowUpId") as string),
      },
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

const initialState: SignedCallReportPdfType = {
  SignedCallReportPdfFetching: false,
  SignedCallReportPdfSuccess: false,
  SignedCallReportPdfError: false,
  SignedCallReportPdfData: [],
  SignedCallReportPdfErrorMessage: "",
};

const SignedCallReportPdfSlice = createSlice({
  name: "list/SignedCallReportPdf",
  initialState,
  reducers: {
    clearSignedCallReportPdfSlice: (state) => {
      state.SignedCallReportPdfError = false;
      state.SignedCallReportPdfSuccess = false;
      state.SignedCallReportPdfFetching = false;
      state.SignedCallReportPdfErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(SignedCallReportPdf.pending, (state) => {
        state.SignedCallReportPdfFetching = true;
        state.SignedCallReportPdfSuccess = false;
        state.SignedCallReportPdfError = false;
        state.SignedCallReportPdfErrorMessage = "";
      })
      .addCase(SignedCallReportPdf.fulfilled, (state, action) => {
        state.SignedCallReportPdfFetching = false;
        state.SignedCallReportPdfSuccess = true;
        state.SignedCallReportPdfError = false;
        state.SignedCallReportPdfData = action.payload?.message || [];
      })
      .addCase(SignedCallReportPdf.rejected, (state, action) => {
        state.SignedCallReportPdfFetching = false;
        state.SignedCallReportPdfSuccess = false;
        state.SignedCallReportPdfError = true;
        state.SignedCallReportPdfErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearSignedCallReportPdfSlice } =
  SignedCallReportPdfSlice.actions;

export default SignedCallReportPdfSlice.reducer;
