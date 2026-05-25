import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketUnShareType {
    TicketUnShareFetching: boolean;
    TicketUnShareSuccess: boolean;
    TicketUnShareError: boolean;
    TicketUnShareErrorMessage: string;
    TicketUnShareData: any[];
}

interface TicketUnSharePayload {
    nSharedId: number;
    nAgentId: number | undefined;
    nTicketId: number;
    nCompanyId: number | undefined;
    cSchemaName: string | undefined;
    cDbName: string | undefined;
}

interface RejectedValue {
    message: string;
}

export const TicketUnShare = createAsyncThunk<
    any,
    TicketUnSharePayload,
    { rejectValue: RejectedValue }
>("list/TicketUnShare", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketUnShareURL,
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

const initialState: TicketUnShareType = {
    TicketUnShareFetching: false,
    TicketUnShareSuccess: false,
    TicketUnShareError: false,
    TicketUnShareData: [],
    TicketUnShareErrorMessage: "",
};

const TicketUnShareSlice = createSlice({
    name: "list/TicketUnShare",
    initialState,
    reducers: {
        clearTicketUnShareSlice: (state) => {
            state.TicketUnShareError = false;
            state.TicketUnShareSuccess = false;
            state.TicketUnShareFetching = false;
            state.TicketUnShareErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketUnShare.pending, (state) => {
                state.TicketUnShareFetching = true;
                state.TicketUnShareSuccess = false;
                state.TicketUnShareError = false;
                state.TicketUnShareErrorMessage = "";
            })
            .addCase(TicketUnShare.fulfilled, (state, action) => {
                state.TicketUnShareFetching = false;
                state.TicketUnShareSuccess = true;
                state.TicketUnShareError = false;
                state.TicketUnShareData = action.payload?.message || [];
            })
            .addCase(TicketUnShare.rejected, (state, action) => {
                state.TicketUnShareFetching = false;
                state.TicketUnShareSuccess = false;
                state.TicketUnShareError = true;
                state.TicketUnShareErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketUnShareSlice } = TicketUnShareSlice.actions;

export default TicketUnShareSlice.reducer;
