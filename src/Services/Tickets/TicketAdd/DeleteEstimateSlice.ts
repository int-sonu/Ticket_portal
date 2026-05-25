import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface DeleteEstimateType {
    DeleteEstimateFetching: boolean;
    DeleteEstimateSuccess: boolean;
    DeleteEstimateError: boolean;
    DeleteEstimateErrorMessage: string;
    DeleteEstimateData: any[];
}

interface DeleteEstimatePayload {
    nAgentId: number;
    nEstimateId: number;
    cReason: string;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
    message: string;
}

export const DeleteEstimate = createAsyncThunk<
    any,
    DeleteEstimatePayload,
    { rejectValue: RejectedValue }
>("list/DeleteEstimate", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.DeleteEstimateURL,
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

const initialState: DeleteEstimateType = {
    DeleteEstimateFetching: false,
    DeleteEstimateSuccess: false,
    DeleteEstimateError: false,
    DeleteEstimateData: [],
    DeleteEstimateErrorMessage: "",
};

const DeleteEstimateSlice = createSlice({
    name: "list/DeleteEstimate",
    initialState,
    reducers: {
        clearDeleteEstimateSlice: (state) => {
            state.DeleteEstimateError = false;
            state.DeleteEstimateSuccess = false;
            state.DeleteEstimateFetching = false;
            state.DeleteEstimateErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(DeleteEstimate.pending, (state) => {
                state.DeleteEstimateFetching = true;
                state.DeleteEstimateSuccess = false;
                state.DeleteEstimateError = false;
                state.DeleteEstimateErrorMessage = "";
            })
            .addCase(DeleteEstimate.fulfilled, (state, action) => {
                state.DeleteEstimateFetching = false;
                state.DeleteEstimateSuccess = true;
                state.DeleteEstimateError = false;
                state.DeleteEstimateData = action.payload?.message || [];
            })
            .addCase(DeleteEstimate.rejected, (state, action) => {
                state.DeleteEstimateFetching = false;
                state.DeleteEstimateSuccess = false;
                state.DeleteEstimateError = true;
                state.DeleteEstimateErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearDeleteEstimateSlice } = DeleteEstimateSlice.actions;

export default DeleteEstimateSlice.reducer;
