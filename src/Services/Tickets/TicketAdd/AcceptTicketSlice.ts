import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AcceptTicketType {
    AcceptTicketFetching: boolean;
    AcceptTicketSuccess: boolean;
    AcceptTicketError: boolean;
    AcceptTicketErrorMessage: string;
    AcceptTicketData: any[];
}

interface AcceptTicketPayload {
    nTicketId: number;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
    nAgentId: number;
}

interface RejectedValue {
    message: string;
}

export const AcceptTicket = createAsyncThunk<
    any,
    AcceptTicketPayload,
    { rejectValue: RejectedValue }
>("list/AcceptTicket", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.AcceptTicketURL,
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

const initialState: AcceptTicketType = {
    AcceptTicketFetching: false,
    AcceptTicketSuccess: false,
    AcceptTicketError: false,
    AcceptTicketData: [],
    AcceptTicketErrorMessage: "",
};

const AcceptTicketSlice = createSlice({
    name: "list/AcceptTicket",
    initialState,
    reducers: {
        clearAcceptTicketSlice: (state) => {
            state.AcceptTicketError = false;
            state.AcceptTicketSuccess = false;
            state.AcceptTicketFetching = false;
            state.AcceptTicketErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(AcceptTicket.pending, (state) => {
                state.AcceptTicketFetching = true;
                state.AcceptTicketSuccess = false;
                state.AcceptTicketError = false;
                state.AcceptTicketErrorMessage = "";
            })
            .addCase(AcceptTicket.fulfilled, (state, action) => {
                state.AcceptTicketFetching = false;
                state.AcceptTicketSuccess = true;
                state.AcceptTicketError = false;
                state.AcceptTicketData = action.payload?.message || [];
            })
            .addCase(AcceptTicket.rejected, (state, action) => {
                state.AcceptTicketFetching = false;
                state.AcceptTicketSuccess = false;
                state.AcceptTicketError = true;
                state.AcceptTicketErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearAcceptTicketSlice } = AcceptTicketSlice.actions;

export default AcceptTicketSlice.reducer;
