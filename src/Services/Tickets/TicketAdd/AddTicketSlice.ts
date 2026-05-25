import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AddTicketType {
    AddTicketFetching: boolean;
    AddTicketSuccess: boolean;
    AddTicketError: boolean;
    AddTicketErrorMessage: string;
    AddTicketData: any[];
}

interface AddTicketPayload {
    nCustomerId: number;
    cCustomerName: string;
    nSourceId: number;
    cContactPerson: string;
    cContactNumber: string;
    cEmail: string;
    cTicketSummary: string;
    cDescription: string;
    cAssignedId: any;
    nTicketStatus: number;
    nAssetId: number;
    nPriority: number;
    nGroupId: number;
    bOnSite: boolean;
    dFollowupDate: string;
    nCreatedBy: any;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
    nServiceType?: number;
    cRepairPartList?: string;
    cFileMappings?: string;
    bAddItemRepair?: boolean;
}

interface RejectedValue {
    message: string;
}

export const AddTicket = createAsyncThunk<
    any,
    AddTicketPayload,
    { rejectValue: RejectedValue }
>("list/AddTicket", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.AddTicketURL,
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

const initialState: AddTicketType = {
    AddTicketFetching: false,
    AddTicketSuccess: false,
    AddTicketError: false,
    AddTicketData: [],
    AddTicketErrorMessage: "",
};

const AddTicketSlice = createSlice({
    name: "list/AddTicket",
    initialState,
    reducers: {
        clearAddTicketSlice: (state) => {
            state.AddTicketError = false;
            state.AddTicketSuccess = false;
            state.AddTicketFetching = false;
            state.AddTicketErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(AddTicket.pending, (state) => {
                state.AddTicketFetching = true;
                state.AddTicketSuccess = false;
                state.AddTicketError = false;
                state.AddTicketErrorMessage = "";
            })
            .addCase(AddTicket.fulfilled, (state, action) => {
                state.AddTicketFetching = false;
                state.AddTicketSuccess = true;
                state.AddTicketError = false;
                state.AddTicketData = action.payload?.message || [];
            })
            .addCase(AddTicket.rejected, (state, action) => {
                state.AddTicketFetching = false;
                state.AddTicketSuccess = false;
                state.AddTicketError = true;
                state.AddTicketErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearAddTicketSlice } = AddTicketSlice.actions;

export default AddTicketSlice.reducer;
