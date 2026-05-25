import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface RepairPartAttachmentUploadType {
  RepairPartAttachmentUploadFetching: boolean;
  RepairPartAttachmentUploadSuccess: boolean;
  RepairPartAttachmentUploadError: boolean;
  RepairPartAttachmentUploadErrorMessage: string;
  RepairPartAttachmentUploadData: any;
}

interface RejectedValue {
  message: string;
}

export const RepairPartAttachmentUpload = createAsyncThunk<
  any,
  FormData,
  { rejectValue: RejectedValue }
>(
  "list/RepairPartAttachmentUpload",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.actionHandler({
        url: api.TicketsApi.TicketRepairPartAttachmentUploadURL,
        method: "POST",
        data: payload,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        return response.data;
      }

      return rejectWithValue({
        message: "Failed to upload repair attachment",
      });
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Repair attachment upload failed";
      return rejectWithValue({ message });
    }
  }
);

const initialState: RepairPartAttachmentUploadType = {
  RepairPartAttachmentUploadFetching: false,
  RepairPartAttachmentUploadSuccess: false,
  RepairPartAttachmentUploadError: false,
  RepairPartAttachmentUploadData: null,
  RepairPartAttachmentUploadErrorMessage: "",
};

const RepairPartAttachmentUploadSlice = createSlice({
  name: "list/RepairPartAttachmentUpload",
  initialState,
  reducers: {
    clearRepairPartAttachmentUploadSlice: (state) => {
      state.RepairPartAttachmentUploadError = false;
      state.RepairPartAttachmentUploadSuccess = false;
      state.RepairPartAttachmentUploadFetching = false;
      state.RepairPartAttachmentUploadErrorMessage = "";
      state.RepairPartAttachmentUploadData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(RepairPartAttachmentUpload.pending, (state) => {
        state.RepairPartAttachmentUploadFetching = true;
        state.RepairPartAttachmentUploadSuccess = false;
        state.RepairPartAttachmentUploadError = false;
        state.RepairPartAttachmentUploadErrorMessage = "";
      })
      .addCase(RepairPartAttachmentUpload.fulfilled, (state, action) => {
        state.RepairPartAttachmentUploadFetching = false;
        state.RepairPartAttachmentUploadSuccess = true;
        state.RepairPartAttachmentUploadError = false;
        state.RepairPartAttachmentUploadData = action.payload;
      })
      .addCase(RepairPartAttachmentUpload.rejected, (state, action) => {
        state.RepairPartAttachmentUploadFetching = false;
        state.RepairPartAttachmentUploadSuccess = false;
        state.RepairPartAttachmentUploadError = true;
        state.RepairPartAttachmentUploadErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearRepairPartAttachmentUploadSlice } =
  RepairPartAttachmentUploadSlice.actions;

export default RepairPartAttachmentUploadSlice.reducer;