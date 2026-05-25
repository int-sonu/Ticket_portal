import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketFilesType {
  TicketFilesFetching: boolean;
  TicketFilesSuccess: boolean;
  TicketFilesError: boolean;
  TicketFilesErrorMessage: string;
  TicketFilesData: any;
}

interface TicketFilesPayload {
    nCompanyId: number;
    nTicketId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const TicketFiles = createAsyncThunk<
  any,
  TicketFilesPayload,
  { rejectValue: RejectedValue }
>("list/TicketFiles", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.TicketFilesUrl,
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

const initialState: TicketFilesType = {
  TicketFilesFetching: false,
  TicketFilesSuccess: false,
  TicketFilesError: false,
  TicketFilesData: null,
  TicketFilesErrorMessage: "",
};

const TicketFilesSlice = createSlice({
  name: "list/TicketFiles",
  initialState,
  reducers: {
    clearTicketFilesSlice: (state) => {
      state.TicketFilesError = false;
      state.TicketFilesSuccess = false;
      state.TicketFilesFetching = false;
      state.TicketFilesErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(TicketFiles.pending, (state) => {
        state.TicketFilesFetching = true;
        state.TicketFilesSuccess = false;
        state.TicketFilesError = false;
        state.TicketFilesErrorMessage = "";
      })
      .addCase(TicketFiles.fulfilled, (state, action) => {
        state.TicketFilesFetching = false;
        state.TicketFilesSuccess = true;
        state.TicketFilesError = false;
        state.TicketFilesData = action.payload?.data || null;
      })
      .addCase(TicketFiles.rejected, (state, action) => {
        state.TicketFilesFetching = false;
        state.TicketFilesSuccess = false;
        state.TicketFilesError = true;
        state.TicketFilesErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearTicketFilesSlice } = TicketFilesSlice.actions;

export default TicketFilesSlice.reducer;