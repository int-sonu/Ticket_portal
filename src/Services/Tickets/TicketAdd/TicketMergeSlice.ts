import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketMergeType {
    TicketMergeFetching: boolean;
    TicketMergeSuccess: boolean;
    TicketMergeError: boolean;
    TicketMergeErrorMessage: string;
    TicketMergeData: any[];
}

interface TicketMergePayload {
    nPrimaryTicketId: number;
    nMergedTicketId: number;
    nPrimaryTicketNo: number;
    nMergedTicketNo: number;
    nMergedBy: number | undefined;
    nCompanyId: number | undefined;
    cSchemaName: string | undefined;
    cDbName: string | undefined;
}

interface RejectedValue {
    message: string;
}

export const TicketMerge = createAsyncThunk<
    any,
    TicketMergePayload,
    { rejectValue: RejectedValue }
>("list/TicketMerge", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketMergeURL,
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

const initialState: TicketMergeType = {
    TicketMergeFetching: false,
    TicketMergeSuccess: false,
    TicketMergeError: false,
    TicketMergeData: [],
    TicketMergeErrorMessage: "",
};

const TicketMergeSlice = createSlice({
    name: "list/TicketMerge",
    initialState,
    reducers: {
        clearTicketMergeSlice: (state) => {
            state.TicketMergeError = false;
            state.TicketMergeSuccess = false;
            state.TicketMergeFetching = false;
            state.TicketMergeErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketMerge.pending, (state) => {
                state.TicketMergeFetching = true;
                state.TicketMergeSuccess = false;
                state.TicketMergeError = false;
                state.TicketMergeErrorMessage = "";
            })
            .addCase(TicketMerge.fulfilled, (state, action) => {
                state.TicketMergeFetching = false;
                state.TicketMergeSuccess = true;
                state.TicketMergeError = false;
                state.TicketMergeData = action.payload?.message || [];
            })
            .addCase(TicketMerge.rejected, (state, action) => {
                state.TicketMergeFetching = false;
                state.TicketMergeSuccess = false;
                state.TicketMergeError = true;
                state.TicketMergeErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketMergeSlice } = TicketMergeSlice.actions;

export default TicketMergeSlice.reducer;
