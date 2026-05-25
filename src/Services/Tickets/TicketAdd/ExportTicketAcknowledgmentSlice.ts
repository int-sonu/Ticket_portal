import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface ExportTicketAcknowledgmentType {
  ExportTicketAcknowledgmentFetching: boolean;
  ExportTicketAcknowledgmentSuccess: boolean;
  ExportTicketAcknowledgmentError: boolean;
  ExportTicketAcknowledgmentErrorMessage: string;
  ExportTicketAcknowledgmentData: any[];
}

interface RejectedValue {
  message: string;
}

export const ExportTicketAcknowledgment = createAsyncThunk<
  any,
  { formData: FormData; nTicketId: number },
  { rejectValue: RejectedValue }
>(
  "list/ExportTicketAcknowledgment",
  async ({ formData, nTicketId }, { rejectWithValue }) => {
    try {
      const response = await api.actionHandler({
        url: api.TicketsApi.ExportTicketAcknowledgmentURL,
        method: "POST",
        data: formData, 
        params: {
          nTicketId,        
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
  }
);


const initialState: ExportTicketAcknowledgmentType = {
  ExportTicketAcknowledgmentFetching: false,
  ExportTicketAcknowledgmentSuccess: false,
  ExportTicketAcknowledgmentError: false,
  ExportTicketAcknowledgmentData: [],
  ExportTicketAcknowledgmentErrorMessage: "",
};

const ExportTicketAcknowledgmentSlice = createSlice({
  name: "list/ExportTicketAcknowledgment",
  initialState,
  reducers: {
    clearExportTicketAcknowledgmentSlice: (state) => {
      state.ExportTicketAcknowledgmentError = false;
      state.ExportTicketAcknowledgmentSuccess = false;
      state.ExportTicketAcknowledgmentFetching = false;
      state.ExportTicketAcknowledgmentErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(ExportTicketAcknowledgment.pending, (state) => {
        state.ExportTicketAcknowledgmentFetching = true;
        state.ExportTicketAcknowledgmentSuccess = false;
        state.ExportTicketAcknowledgmentError = false;
        state.ExportTicketAcknowledgmentErrorMessage = "";
      })
      .addCase(ExportTicketAcknowledgment.fulfilled, (state, action) => {
        state.ExportTicketAcknowledgmentFetching = false;
        state.ExportTicketAcknowledgmentSuccess = true;
        state.ExportTicketAcknowledgmentError = false;
        state.ExportTicketAcknowledgmentData = action.payload?.message || [];
      })
      .addCase(ExportTicketAcknowledgment.rejected, (state, action) => {
        state.ExportTicketAcknowledgmentFetching = false;
        state.ExportTicketAcknowledgmentSuccess = false;
        state.ExportTicketAcknowledgmentError = true;
        state.ExportTicketAcknowledgmentErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearExportTicketAcknowledgmentSlice } =
  ExportTicketAcknowledgmentSlice.actions;

export default ExportTicketAcknowledgmentSlice.reducer;
