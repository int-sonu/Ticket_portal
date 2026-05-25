import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface UpcomingticketListType {
  UpcomingticketListFetching: boolean;
  UpcomingticketListSuccess: boolean;
  UpcomingticketListError: boolean;
  UpcomingticketListErrorMessage: string;
  UpcomingticketListData: any[];
}

interface UpcomingticketListPayload {
  nCompanyId: number;
  cDBName: string;
  cSchemaName: string;
}

interface RejectedValue {
  message: string;
}

export const UpcomingticketList = createAsyncThunk<
  any,
  UpcomingticketListPayload,
  { rejectValue: RejectedValue }
>("list/UpcomingticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.UpcomingTicketsListURL,
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

const initialState: UpcomingticketListType = {
  UpcomingticketListFetching: false,
  UpcomingticketListSuccess: false,
  UpcomingticketListError: false,
  UpcomingticketListData: [],
  UpcomingticketListErrorMessage: "",
};

const UpcomingticketListSlice = createSlice({
  name: "list/UpcomingticketList",
  initialState,
  reducers: {
    clearUpcomingTicketListSlice: (state) => {
      state.UpcomingticketListError = false;
      state.UpcomingticketListSuccess = false;
      state.UpcomingticketListFetching = false;
      state.UpcomingticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(UpcomingticketList.pending, (state) => {
        state.UpcomingticketListFetching = true;
        state.UpcomingticketListSuccess = false;
        state.UpcomingticketListError = false;
        state.UpcomingticketListErrorMessage = "";
      })
      .addCase(UpcomingticketList.fulfilled, (state, action) => {
        state.UpcomingticketListFetching = false;
        state.UpcomingticketListSuccess = true;
        state.UpcomingticketListError = false;
        state.UpcomingticketListData = action.payload?.data || [];
      })
      .addCase(UpcomingticketList.rejected, (state, action) => {
        state.UpcomingticketListFetching = false;
        state.UpcomingticketListSuccess = false;
        state.UpcomingticketListError = true;
        state.UpcomingticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearUpcomingTicketListSlice } = UpcomingticketListSlice.actions;

export default UpcomingticketListSlice.reducer;
