import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AddTicketReopenType {
  AddTicketReopenFetching: boolean;
  AddTicketReopenSuccess: boolean;
  AddTicketReopenError: boolean;
  AddTicketReopenErrorMessage: string;
  AddTicketReopenData: any[];
}

type AssignedAgent = {
  nAgentId: number;
  nRole: number;
};
interface AddTicketReopenPayload {
  nTicketId: number;
  nTicketNo: number;
  nCustomerId: number;
  nSourceId: number;
  nServiceType: number;
  cContactPerson: string;
  cContactNumber: string;
  cEmail: string;
  cDescription: string;
  cAssignedId: AssignedAgent[];
  nAssetId: number;
  nPriority: number;
  nGroupId: number;
  bOnSite: boolean;
  dFollowupDate: string; // This is a string, likely ISO 8601 format
  nModifiedBy: number;
  nCompanyId: number;
  cSchemaName: string;
  cDbName: string;
}

interface RejectedValue {
  message: string;
}

export const AddTicketReopen = createAsyncThunk<
  any,
  AddTicketReopenPayload,
  { rejectValue: RejectedValue }
>("list/AddTicketReopen", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.TicketReopenURL,
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

const initialState: AddTicketReopenType = {
  AddTicketReopenFetching: false,
  AddTicketReopenSuccess: false,
  AddTicketReopenError: false,
  AddTicketReopenData: [],
  AddTicketReopenErrorMessage: "",
};

const AddTicketReopenSlice = createSlice({
  name: "list/AddTicketReopen",
  initialState,
  reducers: {
    clearAddTicketReopenSlice: (state) => {
      state.AddTicketReopenError = false;
      state.AddTicketReopenSuccess = false;
      state.AddTicketReopenFetching = false;
      state.AddTicketReopenErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AddTicketReopen.pending, (state) => {
        state.AddTicketReopenFetching = true;
        state.AddTicketReopenSuccess = false;
        state.AddTicketReopenError = false;
        state.AddTicketReopenErrorMessage = "";
      })
      .addCase(AddTicketReopen.fulfilled, (state, action) => {
        state.AddTicketReopenFetching = false;
        state.AddTicketReopenSuccess = true;
        state.AddTicketReopenError = false;
        state.AddTicketReopenData = action.payload?.message || [];
      })
      .addCase(AddTicketReopen.rejected, (state, action) => {
        state.AddTicketReopenFetching = false;
        state.AddTicketReopenSuccess = false;
        state.AddTicketReopenError = true;
        state.AddTicketReopenErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearAddTicketReopenSlice } = AddTicketReopenSlice.actions;

export default AddTicketReopenSlice.reducer;
