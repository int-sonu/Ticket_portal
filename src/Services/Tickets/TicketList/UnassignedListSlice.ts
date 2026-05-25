import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface UnassignedticketListType {
  UnassignedticketListFetching: boolean;
  UnassignedticketListSuccess: boolean;
  UnassignedticketListError: boolean;
  UnassignedticketListErrorMessage: string;
  UnassignedticketListData: any[];
}

interface UnassignedticketListPayload {
  nCompanyId: number;
  cDBName: string;
  cSchemaName: string;
}

interface RejectedValue {
  message: string;
}

export const UnassignedticketList = createAsyncThunk<
  any,
  UnassignedticketListPayload,
  { rejectValue: RejectedValue }
>("list/UnassignedticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.UnassignedTicketsListURL,
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

const initialState: UnassignedticketListType = {
  UnassignedticketListFetching: false,
  UnassignedticketListSuccess: false,
  UnassignedticketListError: false,
  UnassignedticketListData: [],
  UnassignedticketListErrorMessage: "",
};

const UnassignedticketListSlice = createSlice({
  name: "list/UnassignedticketList",
  initialState,
  reducers: {
    clearUnassignedTicketListSlice: (state) => {
      state.UnassignedticketListError = false;
      state.UnassignedticketListSuccess = false;
      state.UnassignedticketListFetching = false;
      state.UnassignedticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(UnassignedticketList.pending, (state) => {
        state.UnassignedticketListFetching = true;
        state.UnassignedticketListSuccess = false;
        state.UnassignedticketListError = false;
        state.UnassignedticketListErrorMessage = "";
      })
      .addCase(UnassignedticketList.fulfilled, (state, action) => {
        state.UnassignedticketListFetching = false;
        state.UnassignedticketListSuccess = true;
        state.UnassignedticketListError = false;
        state.UnassignedticketListData = action.payload?.data || [];
      })
      .addCase(UnassignedticketList.rejected, (state, action) => {
        state.UnassignedticketListFetching = false;
        state.UnassignedticketListSuccess = false;
        state.UnassignedticketListError = true;
        state.UnassignedticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearUnassignedTicketListSlice } = UnassignedticketListSlice.actions;

export default UnassignedticketListSlice.reducer;
