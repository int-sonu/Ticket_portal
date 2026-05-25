import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AgentwiseticketListType {
  AgentwiseticketListFetching: boolean;
  AgentwiseticketListSuccess: boolean;
  AgentwiseticketListError: boolean;
  AgentwiseticketListErrorMessage: string;
  AgentwiseticketListData: any[];
}

interface AgentwiseticketListPayload {
    nCompanyId: number;
    nAgentId: number;
    dDate: string;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const AgentwiseticketList = createAsyncThunk<
  any,
  AgentwiseticketListPayload,
  { rejectValue: RejectedValue }
>("list/AgentwiseticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.AgentwiseTicketsListURL,
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

const initialState: AgentwiseticketListType = {
  AgentwiseticketListFetching: false,
  AgentwiseticketListSuccess: false,
  AgentwiseticketListError: false,
  AgentwiseticketListData: [],
  AgentwiseticketListErrorMessage: "",
};

const AgentwiseticketListSlice = createSlice({
  name: "list/AgentwiseticketList",
  initialState,
  reducers: {
    clearAgentwiseTicketListSlice: (state) => {
      state.AgentwiseticketListError = false;
      state.AgentwiseticketListSuccess = false;
      state.AgentwiseticketListFetching = false;
      state.AgentwiseticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AgentwiseticketList.pending, (state) => {
        state.AgentwiseticketListFetching = true;
        state.AgentwiseticketListSuccess = false;
        state.AgentwiseticketListError = false;
        state.AgentwiseticketListErrorMessage = "";
      })
      .addCase(AgentwiseticketList.fulfilled, (state, action) => {
        state.AgentwiseticketListFetching = false;
        state.AgentwiseticketListSuccess = true;
        state.AgentwiseticketListError = false;
        state.AgentwiseticketListData = action.payload?.data || [];
      })
      .addCase(AgentwiseticketList.rejected, (state, action) => {
        state.AgentwiseticketListFetching = false;
        state.AgentwiseticketListSuccess = false;
        state.AgentwiseticketListError = true;
        state.AgentwiseticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearAgentwiseTicketListSlice } = AgentwiseticketListSlice.actions;

export default AgentwiseticketListSlice.reducer;