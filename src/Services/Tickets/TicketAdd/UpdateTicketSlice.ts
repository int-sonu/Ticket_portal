import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface UpdateTicketType {
    UpdateTicketFetching: boolean;
    UpdateTicketSuccess: boolean;
    UpdateTicketError: boolean;
    UpdateTicketErrorMessage: string;
    UpdateTicketData: any[];
}

interface UpdateTicketPayload {
    nTicketId: number;
    nTicketNo: number;
    nCustomerId: number;
    cCustomerName: string;
    nSourceId: number;
    nServiceType: number;
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
    nModifiedBy: number;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
    cRepairPartList?: string;
    cDeleteCallPartIds?: number[];
}

interface RejectedValue {
    message: string;
}

export const UpdateTicket = createAsyncThunk<
    any,
    UpdateTicketPayload,
    { rejectValue: RejectedValue }
>("list/UpdateTicket", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.UpdateTicketURL,
            method: "PUT",
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

const initialState: UpdateTicketType = {
    UpdateTicketFetching: false,
    UpdateTicketSuccess: false,
    UpdateTicketError: false,
    UpdateTicketData: [],
    UpdateTicketErrorMessage: "",
};

const UpdateTicketSlice = createSlice({
    name: "list/UpdateTicket",
    initialState,
    reducers: {
        clearUpdateTicketSlice: (state) => {
            state.UpdateTicketError = false;
            state.UpdateTicketSuccess = false;
            state.UpdateTicketFetching = false;
            state.UpdateTicketErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(UpdateTicket.pending, (state) => {
                state.UpdateTicketFetching = true;
                state.UpdateTicketSuccess = false;
                state.UpdateTicketError = false;
                state.UpdateTicketErrorMessage = "";
            })
            .addCase(UpdateTicket.fulfilled, (state, action) => {
                state.UpdateTicketFetching = false;
                state.UpdateTicketSuccess = true;
                state.UpdateTicketError = false;
                state.UpdateTicketData = action.payload?.message || [];
            })
            .addCase(UpdateTicket.rejected, (state, action) => {
                state.UpdateTicketFetching = false;
                state.UpdateTicketSuccess = false;
                state.UpdateTicketError = true;
                state.UpdateTicketErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearUpdateTicketSlice } = UpdateTicketSlice.actions;

export default UpdateTicketSlice.reducer;
