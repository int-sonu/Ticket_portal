import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketShareType {
    TicketShareFetching: boolean;
    TicketShareSuccess: boolean;
    TicketShareError: boolean;
    TicketShareErrorMessage: string;
    TicketShareData: any[];
}

interface TicketSharePayload {
    nSharedByAgentId: number | undefined;
    nSharedToAgentId: number;
    nTicketId: number;
    cShareReason: string;
    nCompanyId: number | undefined;
    cSchemaName: string | undefined;
    cDbName: string | undefined;
}

interface RejectedValue {
    message: string;
}

export const TicketShare = createAsyncThunk<
    any,
    TicketSharePayload,
    { rejectValue: RejectedValue }
>("list/TicketShare", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketShareURL,
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

const initialState: TicketShareType = {
    TicketShareFetching: false,
    TicketShareSuccess: false,
    TicketShareError: false,
    TicketShareData: [],
    TicketShareErrorMessage: "",
};

const TicketShareSlice = createSlice({
    name: "list/TicketShare",
    initialState,
    reducers: {
        clearTicketShareSlice: (state) => {
            state.TicketShareError = false;
            state.TicketShareSuccess = false;
            state.TicketShareFetching = false;
            state.TicketShareErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketShare.pending, (state) => {
                state.TicketShareFetching = true;
                state.TicketShareSuccess = false;
                state.TicketShareError = false;
                state.TicketShareErrorMessage = "";
            })
            .addCase(TicketShare.fulfilled, (state, action) => {
                state.TicketShareFetching = false;
                state.TicketShareSuccess = true;
                state.TicketShareError = false;
                state.TicketShareData = action.payload?.message || [];
            })
            .addCase(TicketShare.rejected, (state, action) => {
                state.TicketShareFetching = false;
                state.TicketShareSuccess = false;
                state.TicketShareError = true;
                state.TicketShareErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketShareSlice } = TicketShareSlice.actions;

export default TicketShareSlice.reducer;
