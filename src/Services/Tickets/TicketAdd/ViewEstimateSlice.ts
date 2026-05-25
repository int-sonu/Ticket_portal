import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface ViewEstimateType {
    ViewEstimateFetching: boolean;
    ViewEstimateSuccess: boolean;
    ViewEstimateError: boolean;
    ViewEstimateErrorMessage: string;
    ViewEstimateData: any;
}

interface ViewEstimatePayload {
    nCompanyId: number;
    nEstimateId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
    message: string;
}

export const ViewEstimate = createAsyncThunk<
    any,
    ViewEstimatePayload,
    { rejectValue: RejectedValue }
>("list/ViewEstimate", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.ViewEstimateUrl,
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

const initialState: ViewEstimateType = {
    ViewEstimateFetching: false,
    ViewEstimateSuccess: false,
    ViewEstimateError: false,
    ViewEstimateData: null,
    ViewEstimateErrorMessage: "",
};

const ViewEstimateSlice = createSlice({
    name: "list/ViewEstimate",
    initialState,
    reducers: {
        clearViewEstimateSlice: (state) => {
            state.ViewEstimateError = false;
            state.ViewEstimateSuccess = false;
            state.ViewEstimateFetching = false;
            state.ViewEstimateErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(ViewEstimate.pending, (state) => {
                state.ViewEstimateFetching = true;
                state.ViewEstimateSuccess = false;
                state.ViewEstimateError = false;
                state.ViewEstimateErrorMessage = "";
                state.ViewEstimateData = null;
            })
            .addCase(ViewEstimate.fulfilled, (state, action) => {
                state.ViewEstimateFetching = false;
                state.ViewEstimateSuccess = true;
                state.ViewEstimateError = false;
                state.ViewEstimateData = action.payload?.data || null;
            })
            .addCase(ViewEstimate.rejected, (state, action) => {
                state.ViewEstimateFetching = false;
                state.ViewEstimateSuccess = false;
                state.ViewEstimateError = true;
                state.ViewEstimateErrorMessage =
                    action.payload?.message || "Unknown error";
                state.ViewEstimateData = null;
            });
    },
});

export const { clearViewEstimateSlice } = ViewEstimateSlice.actions;

export default ViewEstimateSlice.reducer;