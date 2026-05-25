import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketAssetAddEditType {
    TicketAssetAddEditFetching: boolean;
    TicketAssetAddEditSuccess: boolean;
    TicketAssetAddEditError: boolean;
    TicketAssetAddEditErrorMessage: string;
    TicketAssetAddEditData: any[];
}

interface TicketAssetAddEditPayload {
    nAssetId: number;
    nTicketId: number;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
    message: string;
}

export const TicketAssetAddEdit = createAsyncThunk<
    any,
    TicketAssetAddEditPayload,
    { rejectValue: RejectedValue }
>("list/TicketAssetAddEdit", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketAssetAddEditURL,
            method: "PUT",
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

const initialState: TicketAssetAddEditType = {
    TicketAssetAddEditFetching: false,
    TicketAssetAddEditSuccess: false,
    TicketAssetAddEditError: false,
    TicketAssetAddEditData: [],
    TicketAssetAddEditErrorMessage: "",
};

const TicketAssetAddEditSlice = createSlice({
    name: "list/TicketAssetAddEdit",
    initialState,
    reducers: {
        clearTicketAssetAddEditSlice: (state) => {
            state.TicketAssetAddEditError = false;
            state.TicketAssetAddEditSuccess = false;
            state.TicketAssetAddEditFetching = false;
            state.TicketAssetAddEditErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketAssetAddEdit.pending, (state) => {
                state.TicketAssetAddEditFetching = true;
                state.TicketAssetAddEditSuccess = false;
                state.TicketAssetAddEditError = false;
                state.TicketAssetAddEditErrorMessage = "";
            })
            .addCase(TicketAssetAddEdit.fulfilled, (state, action) => {
                state.TicketAssetAddEditFetching = false;
                state.TicketAssetAddEditSuccess = true;
                state.TicketAssetAddEditError = false;
                state.TicketAssetAddEditData = action.payload?.message || [];
            })
            .addCase(TicketAssetAddEdit.rejected, (state, action) => {
                state.TicketAssetAddEditFetching = false;
                state.TicketAssetAddEditSuccess = false;
                state.TicketAssetAddEditError = true;
                state.TicketAssetAddEditErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketAssetAddEditSlice } = TicketAssetAddEditSlice.actions;

export default TicketAssetAddEditSlice.reducer;