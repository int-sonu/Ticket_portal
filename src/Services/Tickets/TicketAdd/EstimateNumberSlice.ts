import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface EstimateNumberType {
    EstimateNumberFetching: boolean;
    EstimateNumberSuccess: boolean;
    EstimateNumberError: boolean;
    EstimateNumberErrorMessage: string;
    EstimateNumberData: any;
}

interface EstimateNumberPayload {
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
    message: string;
}

export const EstimateNumber = createAsyncThunk<
    any,
    EstimateNumberPayload,
    { rejectValue: RejectedValue }
>("list/EstimateNumber", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.EstimateNumberUrl,
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

const initialState: EstimateNumberType = {
    EstimateNumberFetching: false,
    EstimateNumberSuccess: false,
    EstimateNumberError: false,
    EstimateNumberData: null,
    EstimateNumberErrorMessage: "",
};

const EstimateNumberSlice = createSlice({
    name: "list/EstimateNumber",
    initialState,
    reducers: {
        clearEstimateNumberSlice: (state) => {
            state.EstimateNumberError = false;
            state.EstimateNumberSuccess = false;
            state.EstimateNumberFetching = false;
            state.EstimateNumberErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(EstimateNumber.pending, (state) => {
                state.EstimateNumberFetching = true;
                state.EstimateNumberSuccess = false;
                state.EstimateNumberError = false;
                state.EstimateNumberErrorMessage = "";
                state.EstimateNumberData = null;
            })
            .addCase(EstimateNumber.fulfilled, (state, action) => {
                state.EstimateNumberFetching = false;
                state.EstimateNumberSuccess = true;
                state.EstimateNumberError = false;
                state.EstimateNumberData = action.payload?.data || null;
            })
            .addCase(EstimateNumber.rejected, (state, action) => {
                state.EstimateNumberFetching = false;
                state.EstimateNumberSuccess = false;
                state.EstimateNumberError = true;
                state.EstimateNumberErrorMessage =
                    action.payload?.message || "Unknown error";
                state.EstimateNumberData = null;
            });
    },
});

export const { clearEstimateNumberSlice } = EstimateNumberSlice.actions;

export default EstimateNumberSlice.reducer;