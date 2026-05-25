import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface OngoingticketListType {
  OngoingticketListFetching: boolean;
  OngoingticketListSuccess: boolean;
  OngoingticketListError: boolean;
  OngoingticketListErrorMessage: string;
  OngoingticketListData: any[];
}

interface OngoingticketListPayload {
  nCompanyId: number;
  cDBName: string;
  cSchemaName: string;
}

interface RejectedValue {
  message: string;
}

export const OngoingticketList = createAsyncThunk<
  any,
  OngoingticketListPayload,
  { rejectValue: RejectedValue }
>("list/OngoingticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.OngoingTicketsListURL,
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

const initialState: OngoingticketListType = {
  OngoingticketListFetching: false,
  OngoingticketListSuccess: false,
  OngoingticketListError: false,
  OngoingticketListData: [],
  OngoingticketListErrorMessage: "",
};

const OngoingticketListSlice = createSlice({
  name: "list/OngoingticketList",
  initialState,
  reducers: {
    clearOngoingTicketListSlice: (state) => {
      state.OngoingticketListError = false;
      state.OngoingticketListSuccess = false;
      state.OngoingticketListFetching = false;
      state.OngoingticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(OngoingticketList.pending, (state) => {
        state.OngoingticketListFetching = true;
        state.OngoingticketListSuccess = false;
        state.OngoingticketListError = false;
        state.OngoingticketListErrorMessage = "";
      })
      .addCase(OngoingticketList.fulfilled, (state, action) => {
        state.OngoingticketListFetching = false;
        state.OngoingticketListSuccess = true;
        state.OngoingticketListError = false;
        state.OngoingticketListData = action.payload?.data || [];
      })
      .addCase(OngoingticketList.rejected, (state, action) => {
        state.OngoingticketListFetching = false;
        state.OngoingticketListSuccess = false;
        state.OngoingticketListError = true;
        state.OngoingticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearOngoingTicketListSlice } = OngoingticketListSlice.actions;

export default OngoingticketListSlice.reducer;
