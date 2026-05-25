import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface ClosedticketListType {
  ClosedticketListFetching: boolean;
  ClosedticketListSuccess: boolean;
  ClosedticketListError: boolean;
  ClosedticketListErrorMessage: string;
  ClosedticketListData: any[];
}

interface ClosedticketListPayload {
  nCompanyId: number;
  cDBName: string;
  cSchemaName: string;
}

interface RejectedValue {
  message: string;
}

export const ClosedticketList = createAsyncThunk<
  any,
  ClosedticketListPayload,
  { rejectValue: RejectedValue }
>("list/ClosedticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.ClosedTicketsListURL,
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

const initialState: ClosedticketListType = {
  ClosedticketListFetching: false,
  ClosedticketListSuccess: false,
  ClosedticketListError: false,
  ClosedticketListData: [],
  ClosedticketListErrorMessage: "",
};

const ClosedticketListSlice = createSlice({
  name: "list/ClosedticketList",
  initialState,
  reducers: {
    clearClosedTicketListSlice: (state) => {
      state.ClosedticketListError = false;
      state.ClosedticketListSuccess = false;
      state.ClosedticketListFetching = false;
      state.ClosedticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(ClosedticketList.pending, (state) => {
        state.ClosedticketListFetching = true;
        state.ClosedticketListSuccess = false;
        state.ClosedticketListError = false;
        state.ClosedticketListErrorMessage = "";
      })
      .addCase(ClosedticketList.fulfilled, (state, action) => {
        state.ClosedticketListFetching = false;
        state.ClosedticketListSuccess = true;
        state.ClosedticketListError = false;
        state.ClosedticketListData = action.payload?.data || [];
      })
      .addCase(ClosedticketList.rejected, (state, action) => {
        state.ClosedticketListFetching = false;
        state.ClosedticketListSuccess = false;
        state.ClosedticketListError = true;
        state.ClosedticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearClosedTicketListSlice } = ClosedticketListSlice.actions;

export default ClosedticketListSlice.reducer;
