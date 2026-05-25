import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface CreatedticketListType {
  CreatedticketListFetching: boolean;
  CreatedticketListSuccess: boolean;
  CreatedticketListError: boolean;
  CreatedticketListErrorMessage: string;
  CreatedticketListData: any[];
}

interface CreatedticketListPayload {
  cAgentId: string;
  nMode: number;
  dFromDate: string;
  dToDate: string;
  nCompanyId: number;
  cDBName: string;
  cSchemaName: string;
}

interface RejectedValue {
  message: string;
}

export const CreatedticketList = createAsyncThunk<
  any,
  CreatedticketListPayload,
  { rejectValue: RejectedValue }
>("list/CreatedticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.CreatedTicketsListURL,
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

const initialState: CreatedticketListType = {
  CreatedticketListFetching: false,
  CreatedticketListSuccess: false,
  CreatedticketListError: false,
  CreatedticketListData: [],
  CreatedticketListErrorMessage: "",
};

const CreatedticketListSlice = createSlice({
  name: "list/CreatedticketList",
  initialState,
  reducers: {
    clearCreatedTicketListSlice: (state) => {
      state.CreatedticketListError = false;
      state.CreatedticketListSuccess = false;
      state.CreatedticketListFetching = false;
      state.CreatedticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(CreatedticketList.pending, (state) => {
        state.CreatedticketListFetching = true;
        state.CreatedticketListSuccess = false;
        state.CreatedticketListError = false;
        state.CreatedticketListErrorMessage = "";
      })
      .addCase(CreatedticketList.fulfilled, (state, action) => {
        state.CreatedticketListFetching = false;
        state.CreatedticketListSuccess = true;
        state.CreatedticketListError = false;
        state.CreatedticketListData = action.payload?.data || [];
      })
      .addCase(CreatedticketList.rejected, (state, action) => {
        state.CreatedticketListFetching = false;
        state.CreatedticketListSuccess = false;
        state.CreatedticketListError = true;
        state.CreatedticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearCreatedTicketListSlice } = CreatedticketListSlice.actions;

export default CreatedticketListSlice.reducer;
