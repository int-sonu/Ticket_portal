import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface DeleteTicketType {
    DeleteTicketFetching: boolean;
    DeleteTicketSuccess: boolean;
    DeleteTicketError: boolean;
    DeleteTicketErrorMessage: string;
    DeleteTicketData: any[];
}

interface DeleteTicketPayload {
    nAgentId: number;
    nTicketId: number;
    cReason: string;  
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
    message: string;
}

export const DeleteTicket = createAsyncThunk<
    any,
    DeleteTicketPayload,
    { rejectValue: RejectedValue }
>("list/DeleteTicket", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.DeleteTicketURL,
            method: "DELETE",
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

const initialState: DeleteTicketType = {
    DeleteTicketFetching: false,
    DeleteTicketSuccess: false,
    DeleteTicketError: false,
    DeleteTicketData: [],
    DeleteTicketErrorMessage: "",
};

const DeleteTicketSlice = createSlice({
    name: "list/DeleteTicket",
    initialState,
    reducers: {
        clearDeleteTicketSlice: (state) => {
            state.DeleteTicketError = false;
            state.DeleteTicketSuccess = false;
            state.DeleteTicketFetching = false;
            state.DeleteTicketErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(DeleteTicket.pending, (state) => {
                state.DeleteTicketFetching = true;
                state.DeleteTicketSuccess = false;
                state.DeleteTicketError = false;
                state.DeleteTicketErrorMessage = "";
            })
            .addCase(DeleteTicket.fulfilled, (state, action) => {
                state.DeleteTicketFetching = false;
                state.DeleteTicketSuccess = true;
                state.DeleteTicketError = false;
                state.DeleteTicketData = action.payload?.message || [];
            })
            .addCase(DeleteTicket.rejected, (state, action) => {
                state.DeleteTicketFetching = false;
                state.DeleteTicketSuccess = false;
                state.DeleteTicketError = true;
                state.DeleteTicketErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearDeleteTicketSlice } = DeleteTicketSlice.actions;

export default DeleteTicketSlice.reducer;
