import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketPostponeType {
    TicketPostponeFetching: boolean;
    TicketPostponeSuccess: boolean;
    TicketPostponeError: boolean;
    TicketPostponeErrorMessage: string;
    TicketPostponeData: any[];
}

interface TicketPostponePayload {
    nAgentId: number | undefined;
    nTicketId: number;
    dPostponeDate: string;
    cPostponeNote: string;
    nCompanyId: number | undefined;
    cSchemaName: string | undefined;
    cDbName: string | undefined;
}

interface RejectedValue {
    message: string;
}

export const TicketPostpone = createAsyncThunk<
    any,
    TicketPostponePayload,
    { rejectValue: RejectedValue }
>("list/TicketPostpone", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketPostponeURL,
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

const initialState: TicketPostponeType = {
    TicketPostponeFetching: false,
    TicketPostponeSuccess: false,
    TicketPostponeError: false,
    TicketPostponeData: [],
    TicketPostponeErrorMessage: "",
};

const TicketPostponeSlice = createSlice({
    name: "list/TicketPostpone",
    initialState,
    reducers: {
        clearTicketPostponeSlice: (state) => {
            state.TicketPostponeError = false;
            state.TicketPostponeSuccess = false;
            state.TicketPostponeFetching = false;
            state.TicketPostponeErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketPostpone.pending, (state) => {
                state.TicketPostponeFetching = true;
                state.TicketPostponeSuccess = false;
                state.TicketPostponeError = false;
                state.TicketPostponeErrorMessage = "";
            })
            .addCase(TicketPostpone.fulfilled, (state, action) => {
                state.TicketPostponeFetching = false;
                state.TicketPostponeSuccess = true;
                state.TicketPostponeError = false;
                state.TicketPostponeData = action.payload?.message || [];
            })
            .addCase(TicketPostpone.rejected, (state, action) => {
                state.TicketPostponeFetching = false;
                state.TicketPostponeSuccess = false;
                state.TicketPostponeError = true;
                state.TicketPostponeErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketPostponeSlice } = TicketPostponeSlice.actions;

export default TicketPostponeSlice.reducer;
