import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface ViewTicketType {
  ViewTicketFetching: boolean;
  ViewTicketSuccess: boolean;
  ViewTicketError: boolean;
  ViewTicketErrorMessage: string;
  ViewTicketData: any;
}

interface ViewTicketPayload {
  nCompanyId: number;
  nTicketId: number;
  cSchemaName: string;
  cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const ViewTicket = createAsyncThunk<
  any,
  ViewTicketPayload,
  { rejectValue: RejectedValue }
>("list/ViewTicket", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.ViewTicketUrl,
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

const initialState: ViewTicketType = {
  ViewTicketFetching: false,
  ViewTicketSuccess: false,
  ViewTicketError: false,
  ViewTicketData: null,
  ViewTicketErrorMessage: "",
};

const ViewTicketSlice = createSlice({
  name: "list/ViewTicket",
  initialState,
  reducers: {
    clearViewTicketSlice: (state) => {
      state.ViewTicketError = false;
      state.ViewTicketSuccess = false;
      state.ViewTicketFetching = false;
      state.ViewTicketErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(ViewTicket.pending, (state) => {
        state.ViewTicketFetching = true;
        state.ViewTicketSuccess = false;
        state.ViewTicketError = false;
        state.ViewTicketErrorMessage = "";
        state.ViewTicketData = null;
      })
      .addCase(ViewTicket.fulfilled, (state, action) => {
        state.ViewTicketFetching = false;
        state.ViewTicketSuccess = true;
        state.ViewTicketError = false;
        state.ViewTicketData = action.payload?.data || null;
      })
      .addCase(ViewTicket.rejected, (state, action) => {
        state.ViewTicketFetching = false;
        state.ViewTicketSuccess = false;
        state.ViewTicketError = true;
        state.ViewTicketErrorMessage =
          action.payload?.message || "Unknown error";
        state.ViewTicketData = null;
      });
  },
});

export const { clearViewTicketSlice } = ViewTicketSlice.actions;

export default ViewTicketSlice.reducer;