import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface OverdueticketListType {
  OverdueticketListFetching: boolean;
  OverdueticketListSuccess: boolean;
  OverdueticketListError: boolean;
  OverdueticketListErrorMessage: string;
  OverdueticketListData: any[];
}

interface OverdueticketListPayload {
  nCompanyId: number;
  cDBName: string;
  cSchemaName: string;
}

interface RejectedValue {
  message: string;
}

export const OverdueticketList = createAsyncThunk<
  any,
  OverdueticketListPayload,
  { rejectValue: RejectedValue }
>("list/OverdueticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.OverdueTicketsListURL,
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

const initialState: OverdueticketListType = {
  OverdueticketListFetching: false,
  OverdueticketListSuccess: false,
  OverdueticketListError: false,
  OverdueticketListData: [],
  OverdueticketListErrorMessage: "",
};

const OverdueticketListSlice = createSlice({
  name: "list/OverdueticketList",
  initialState,
  reducers: {
    clearOverdueTicketListSlice: (state) => {
      state.OverdueticketListError = false;
      state.OverdueticketListSuccess = false;
      state.OverdueticketListFetching = false;
      state.OverdueticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(OverdueticketList.pending, (state) => {
        state.OverdueticketListFetching = true;
        state.OverdueticketListSuccess = false;
        state.OverdueticketListError = false;
        state.OverdueticketListErrorMessage = "";
      })
      .addCase(OverdueticketList.fulfilled, (state, action) => {
        state.OverdueticketListFetching = false;
        state.OverdueticketListSuccess = true;
        state.OverdueticketListError = false;
        state.OverdueticketListData = action.payload?.data || [];
      })
      .addCase(OverdueticketList.rejected, (state, action) => {
        state.OverdueticketListFetching = false;
        state.OverdueticketListSuccess = false;
        state.OverdueticketListError = true;
        state.OverdueticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearOverdueTicketListSlice } = OverdueticketListSlice.actions;

export default OverdueticketListSlice.reducer;
