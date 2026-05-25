import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AssignTicketType {
    AssignTicketFetching: boolean;
    AssignTicketSuccess: boolean;
    AssignTicketError: boolean;
    AssignTicketErrorMessage: string;
    AssignTicketData: any[];
}

interface AssignTicketPayload {
    nTicketId: number;
    nAgentId: number;
    assignData: any[];
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
    message: string;
}

export const AssignTicket = createAsyncThunk<
    any,
    AssignTicketPayload,
    { rejectValue: RejectedValue }
>("list/AssignTicket", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.AssignTicketURL,
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

const initialState: AssignTicketType = {
    AssignTicketFetching: false,
    AssignTicketSuccess: false,
    AssignTicketError: false,
    AssignTicketData: [],
    AssignTicketErrorMessage: "",
};

const AssignTicketSlice = createSlice({
    name: "list/AssignTicket",
    initialState,
    reducers: {
        clearAssignTicketSlice: (state) => {
            state.AssignTicketError = false;
            state.AssignTicketSuccess = false;
            state.AssignTicketFetching = false;
            state.AssignTicketErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(AssignTicket.pending, (state) => {
                state.AssignTicketFetching = true;
                state.AssignTicketSuccess = false;
                state.AssignTicketError = false;
                state.AssignTicketErrorMessage = "";
            })
            .addCase(AssignTicket.fulfilled, (state, action) => {
                state.AssignTicketFetching = false;
                state.AssignTicketSuccess = true;
                state.AssignTicketError = false;
                state.AssignTicketData = action.payload?.message || [];
            })
            .addCase(AssignTicket.rejected, (state, action) => {
                state.AssignTicketFetching = false;
                state.AssignTicketSuccess = false;
                state.AssignTicketError = true;
                state.AssignTicketErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearAssignTicketSlice } = AssignTicketSlice.actions;

export default AssignTicketSlice.reducer;
