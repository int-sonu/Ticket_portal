import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface UpdateEstimateType {
    UpdateEstimateFetching: boolean;
    UpdateEstimateSuccess: boolean;
    UpdateEstimateError: boolean;
    UpdateEstimateErrorMessage: string;
    UpdateEstimateData: any[];
}

interface ItemDetail {
    nPartId: number;
    nQty: number;
    nRate: number;
    nDiscAmt: number;
    nTaxAmount: number;
    cNarration: string;
    nCompanyId: number;
}

interface UpdateEstimatePayload {
    nEstimateId: number;
    nGrossAmount: number;
    nTaxAmount: number;
    nRoundoffAmount: number;
    nDiscountAmt: number;
    nTotalAmount: number;
    nModifiedBy: number;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
    itemDtls: ItemDetail[];
}

interface RejectedValue {
    message: string;
}

export const UpdateEstimate = createAsyncThunk<
    any,
    UpdateEstimatePayload,
    { rejectValue: RejectedValue }
>("list/UpdateEstimate", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.UpdateEstimateURL,
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

const initialState: UpdateEstimateType = {
    UpdateEstimateFetching: false,
    UpdateEstimateSuccess: false,
    UpdateEstimateError: false,
    UpdateEstimateData: [],
    UpdateEstimateErrorMessage: "",
};

const UpdateEstimateSlice = createSlice({
    name: "list/UpdateEstimate",
    initialState,
    reducers: {
        clearUpdateEstimateSlice: (state) => {
            state.UpdateEstimateError = false;
            state.UpdateEstimateSuccess = false;
            state.UpdateEstimateFetching = false;
            state.UpdateEstimateErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(UpdateEstimate.pending, (state) => {
                state.UpdateEstimateFetching = true;
                state.UpdateEstimateSuccess = false;
                state.UpdateEstimateError = false;
                state.UpdateEstimateErrorMessage = "";
            })
            .addCase(UpdateEstimate.fulfilled, (state, action) => {
                state.UpdateEstimateFetching = false;
                state.UpdateEstimateSuccess = true;
                state.UpdateEstimateError = false;
                state.UpdateEstimateData = action.payload?.message || [];
            })
            .addCase(UpdateEstimate.rejected, (state, action) => {
                state.UpdateEstimateFetching = false;
                state.UpdateEstimateSuccess = false;
                state.UpdateEstimateError = true;
                state.UpdateEstimateErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearUpdateEstimateSlice } = UpdateEstimateSlice.actions;

export default UpdateEstimateSlice.reducer;
