import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketAttachmentUploadType {
  TicketAttachmentUploadFetching: boolean;
  TicketAttachmentUploadSuccess: boolean;
  TicketAttachmentUploadError: boolean;
  TicketAttachmentUploadErrorMessage: string;
  TicketAttachmentUploadData: any[];
}

interface TicketAttachmentUploadPayload {
  nCompanyId: number;
  nTicketId: number;
  cSchemaName: string;
  cDbName: string;
  files: any[];
}

interface RejectedValue {
  message: string;
}

export const TicketAttachmentUpload = createAsyncThunk<
  any,
  FormData,
  { rejectValue: RejectedValue }
>("list/TicketAttachmentUpload", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.TicketAttachmentUploadURL,
      method: "POST",
      data: payload,
      params: {
        nCompanyId: parseInt(payload.get("nCompanyId") as string),
        nTicketId: parseInt(payload.get("nTicketId") as string),
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

const initialState: TicketAttachmentUploadType = {
  TicketAttachmentUploadFetching: false,
  TicketAttachmentUploadSuccess: false,
  TicketAttachmentUploadError: false,
  TicketAttachmentUploadData: [],
  TicketAttachmentUploadErrorMessage: "",
};

const TicketAttachmentUploadSlice = createSlice({
  name: "list/TicketAttachmentUpload",
  initialState,
  reducers: {
    clearTicketAttachmentUploadSlice: (state) => {
      state.TicketAttachmentUploadError = false;
      state.TicketAttachmentUploadSuccess = false;
      state.TicketAttachmentUploadFetching = false;
      state.TicketAttachmentUploadErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(TicketAttachmentUpload.pending, (state) => {
        state.TicketAttachmentUploadFetching = true;
        state.TicketAttachmentUploadSuccess = false;
        state.TicketAttachmentUploadError = false;
        state.TicketAttachmentUploadErrorMessage = "";
      })
      .addCase(TicketAttachmentUpload.fulfilled, (state, action) => {
        state.TicketAttachmentUploadFetching = false;
        state.TicketAttachmentUploadSuccess = true;
        state.TicketAttachmentUploadError = false;
        state.TicketAttachmentUploadData = action.payload?.message || [];
      })
      .addCase(TicketAttachmentUpload.rejected, (state, action) => {
        state.TicketAttachmentUploadFetching = false;
        state.TicketAttachmentUploadSuccess = false;
        state.TicketAttachmentUploadError = true;
        state.TicketAttachmentUploadErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearTicketAttachmentUploadSlice } =
  TicketAttachmentUploadSlice.actions;

export default TicketAttachmentUploadSlice.reducer;
