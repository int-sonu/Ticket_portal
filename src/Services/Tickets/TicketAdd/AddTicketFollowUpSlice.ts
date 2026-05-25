import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AddTicketFollowUpType {
  AddTicketFollowUpFetching: boolean;
  AddTicketFollowUpSuccess: boolean;
  AddTicketFollowUpError: boolean;
  AddTicketFollowUpErrorMessage: string;
  AddTicketFollowUpData: any[];
}

type AssignedAgent = {
  nAgentId: number;
  nRole: number;
};
interface AddTicketFollowUpPayload {
  nTicketId: number;
  nTicketNo: number;
  nCustomerId: number;
  nTicketStatus: number;
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

export const AddTicketFollowUp = createAsyncThunk<
  any,
  AddTicketFollowUpPayload,
  { rejectValue: RejectedValue }
>("list/AddTicketFollowUp", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.AddTicketFollowUpURL,
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

const initialState: AddTicketFollowUpType = {
  AddTicketFollowUpFetching: false,
  AddTicketFollowUpSuccess: false,
  AddTicketFollowUpError: false,
  AddTicketFollowUpData: [],
  AddTicketFollowUpErrorMessage: "",
};

const AddTicketFollowUpSlice = createSlice({
  name: "list/AddTicketFollowUp",
  initialState,
  reducers: {
    clearAddTicketFollowUpSlice: (state) => {
      state.AddTicketFollowUpError = false;
      state.AddTicketFollowUpSuccess = false;
      state.AddTicketFollowUpFetching = false;
      state.AddTicketFollowUpErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(AddTicketFollowUp.pending, (state) => {
        state.AddTicketFollowUpFetching = true;
        state.AddTicketFollowUpSuccess = false;
        state.AddTicketFollowUpError = false;
        state.AddTicketFollowUpErrorMessage = "";
      })
      .addCase(AddTicketFollowUp.fulfilled, (state, action) => {
        state.AddTicketFollowUpFetching = false;
        state.AddTicketFollowUpSuccess = true;
        state.AddTicketFollowUpError = false;
        state.AddTicketFollowUpData = action.payload?.message || [];
      })
      .addCase(AddTicketFollowUp.rejected, (state, action) => {
        state.AddTicketFollowUpFetching = false;
        state.AddTicketFollowUpSuccess = false;
        state.AddTicketFollowUpError = true;
        state.AddTicketFollowUpErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearAddTicketFollowUpSlice } = AddTicketFollowUpSlice.actions;

export default AddTicketFollowUpSlice.reducer;
