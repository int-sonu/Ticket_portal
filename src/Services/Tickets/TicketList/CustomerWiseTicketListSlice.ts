import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface CustomerWiseActiveTicketListType {
  CustomerWiseActiveTicketListFetching: boolean;
  CustomerWiseActiveTicketListSuccess: boolean;
  CustomerWiseActiveTicketListError: boolean;
  CustomerWiseActiveTicketListErrorMessage: string;
  CustomerWiseActiveTicketListData: any[];
}

interface CustomerWiseActiveTicketListPayload {
    nCompanyId: number;
    nAgentId: number;
    nCustomerId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const CustomerWiseActiveTicketList = createAsyncThunk<
  any,
  CustomerWiseActiveTicketListPayload,
  { rejectValue: RejectedValue }
>("list/CustomerWiseActiveTicketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.CustomerWiseActiveTicketUrl,
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

const initialState: CustomerWiseActiveTicketListType = {
  CustomerWiseActiveTicketListFetching: false,
  CustomerWiseActiveTicketListSuccess: false,
  CustomerWiseActiveTicketListError: false,
  CustomerWiseActiveTicketListData: [],
  CustomerWiseActiveTicketListErrorMessage: "",
};

const CustomerWiseActiveTicketListSlice = createSlice({
  name: "list/CustomerWiseActiveTicketList",
  initialState,
  reducers: {
    clearCustomerWiseActiveTicketListSlice: (state) => {
      state.CustomerWiseActiveTicketListError = false;
      state.CustomerWiseActiveTicketListSuccess = false;
      state.CustomerWiseActiveTicketListFetching = false;
      state.CustomerWiseActiveTicketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(CustomerWiseActiveTicketList.pending, (state) => {
        state.CustomerWiseActiveTicketListFetching = true;
        state.CustomerWiseActiveTicketListSuccess = false;
        state.CustomerWiseActiveTicketListError = false;
        state.CustomerWiseActiveTicketListErrorMessage = "";
      })
      .addCase(CustomerWiseActiveTicketList.fulfilled, (state, action) => {
        state.CustomerWiseActiveTicketListFetching = false;
        state.CustomerWiseActiveTicketListSuccess = true;
        state.CustomerWiseActiveTicketListError = false;
        state.CustomerWiseActiveTicketListData = action.payload?.data || [];
      })
      .addCase(CustomerWiseActiveTicketList.rejected, (state, action) => {
        state.CustomerWiseActiveTicketListFetching = false;
        state.CustomerWiseActiveTicketListSuccess = false;
        state.CustomerWiseActiveTicketListError = true;
        state.CustomerWiseActiveTicketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearCustomerWiseActiveTicketListSlice } = CustomerWiseActiveTicketListSlice.actions;

export default CustomerWiseActiveTicketListSlice.reducer;
