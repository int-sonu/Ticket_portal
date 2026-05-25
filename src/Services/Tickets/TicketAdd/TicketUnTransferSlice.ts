import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketUnTransferType {
    TicketUnTransferFetching: boolean;
    TicketUnTransferSuccess: boolean;
    TicketUnTransferError: boolean;
    TicketUnTransferErrorMessage: string;
    TicketUnTransferData: any[];
}

interface TicketUnTransferPayload {
    nTransferId: number;
    nAgentId: number | undefined;
    nTicketId: number;
    nCompanyId: number | undefined;
    cSchemaName: string | undefined;
    cDbName: string | undefined;
}

interface RejectedValue {
    message: string;
}

export const TicketUnTransfer = createAsyncThunk<
    any,
    TicketUnTransferPayload,
    { rejectValue: RejectedValue }
>("list/TicketUnTransfer", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketUnTransferURL,
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

const initialState: TicketUnTransferType = {
    TicketUnTransferFetching: false,
    TicketUnTransferSuccess: false,
    TicketUnTransferError: false,
    TicketUnTransferData: [],
    TicketUnTransferErrorMessage: "",
};

const TicketUnTransferSlice = createSlice({
    name: "list/TicketUnTransfer",
    initialState,
    reducers: {
        clearTicketUnTransferSlice: (state) => {
            state.TicketUnTransferError = false;
            state.TicketUnTransferSuccess = false;
            state.TicketUnTransferFetching = false;
            state.TicketUnTransferErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketUnTransfer.pending, (state) => {
                state.TicketUnTransferFetching = true;
                state.TicketUnTransferSuccess = false;
                state.TicketUnTransferError = false;
                state.TicketUnTransferErrorMessage = "";
            })
            .addCase(TicketUnTransfer.fulfilled, (state, action) => {
                state.TicketUnTransferFetching = false;
                state.TicketUnTransferSuccess = true;
                state.TicketUnTransferError = false;
                state.TicketUnTransferData = action.payload?.message || [];
            })
            .addCase(TicketUnTransfer.rejected, (state, action) => {
                state.TicketUnTransferFetching = false;
                state.TicketUnTransferSuccess = false;
                state.TicketUnTransferError = true;
                state.TicketUnTransferErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketUnTransferSlice } = TicketUnTransferSlice.actions;

export default TicketUnTransferSlice.reducer;
