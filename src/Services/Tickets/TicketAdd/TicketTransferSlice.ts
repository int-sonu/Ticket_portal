import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketTransferType {
    TicketTransferFetching: boolean;
    TicketTransferSuccess: boolean;
    TicketTransferError: boolean;
    TicketTransferErrorMessage: string;
    TicketTransferData: any[];
}

interface TicketTransferPayload {
    nTransferByAgentId: number | undefined;
    nTransferToAgentId: number;
    nTicketId: number;
    cTransferReason: string;
    nCompanyId: number | undefined;
    cSchemaName: string | undefined;
    cDbName: string | undefined;
}

interface RejectedValue {
    message: string;
}

export const TicketTransfer = createAsyncThunk<
    any,
    TicketTransferPayload,
    { rejectValue: RejectedValue }
>("list/TicketTransfer", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketTransferURL,
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

const initialState: TicketTransferType = {
    TicketTransferFetching: false,
    TicketTransferSuccess: false,
    TicketTransferError: false,
    TicketTransferData: [],
    TicketTransferErrorMessage: "",
};

const TicketTransferSlice = createSlice({
    name: "list/TicketTransfer",
    initialState,
    reducers: {
        clearTicketTransferSlice: (state) => {
            state.TicketTransferError = false;
            state.TicketTransferSuccess = false;
            state.TicketTransferFetching = false;
            state.TicketTransferErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketTransfer.pending, (state) => {
                state.TicketTransferFetching = true;
                state.TicketTransferSuccess = false;
                state.TicketTransferError = false;
                state.TicketTransferErrorMessage = "";
            })
            .addCase(TicketTransfer.fulfilled, (state, action) => {
                state.TicketTransferFetching = false;
                state.TicketTransferSuccess = true;
                state.TicketTransferError = false;
                state.TicketTransferData = action.payload?.message || [];
            })
            .addCase(TicketTransfer.rejected, (state, action) => {
                state.TicketTransferFetching = false;
                state.TicketTransferSuccess = false;
                state.TicketTransferError = true;
                state.TicketTransferErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketTransferSlice } = TicketTransferSlice.actions;

export default TicketTransferSlice.reducer;
