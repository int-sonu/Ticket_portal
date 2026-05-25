import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketUnMergeType {
    TicketUnMergeFetching: boolean;
    TicketUnMergeSuccess: boolean;
    TicketUnMergeError: boolean;
    TicketUnMergeErrorMessage: string;
    TicketUnMergeData: any[];
}

interface TicketUnMergePayload {
    nMergeId: number;
    nAgentId: number | undefined;
    nPrimaryTicketId: number;
    nMergedTicketId: number;
    nCompanyId: number | undefined;
    cSchemaName: string | undefined;
    cDbName: string | undefined;
}

interface RejectedValue {
    message: string;
}

export const TicketUnMerge = createAsyncThunk<
    any,
    TicketUnMergePayload,
    { rejectValue: RejectedValue }
>("list/TicketUnMerge", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketUnMergeURL,
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

const initialState: TicketUnMergeType = {
    TicketUnMergeFetching: false,
    TicketUnMergeSuccess: false,
    TicketUnMergeError: false,
    TicketUnMergeData: [],
    TicketUnMergeErrorMessage: "",
};

const TicketUnMergeSlice = createSlice({
    name: "list/TicketUnMerge",
    initialState,
    reducers: {
        clearTicketUnMergeSlice: (state) => {
            state.TicketUnMergeError = false;
            state.TicketUnMergeSuccess = false;
            state.TicketUnMergeFetching = false;
            state.TicketUnMergeErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketUnMerge.pending, (state) => {
                state.TicketUnMergeFetching = true;
                state.TicketUnMergeSuccess = false;
                state.TicketUnMergeError = false;
                state.TicketUnMergeErrorMessage = "";
            })
            .addCase(TicketUnMerge.fulfilled, (state, action) => {
                state.TicketUnMergeFetching = false;
                state.TicketUnMergeSuccess = true;
                state.TicketUnMergeError = false;
                state.TicketUnMergeData = action.payload?.message || [];
            })
            .addCase(TicketUnMerge.rejected, (state, action) => {
                state.TicketUnMergeFetching = false;
                state.TicketUnMergeSuccess = false;
                state.TicketUnMergeError = true;
                state.TicketUnMergeErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketUnMergeSlice } = TicketUnMergeSlice.actions;

export default TicketUnMergeSlice.reducer;
