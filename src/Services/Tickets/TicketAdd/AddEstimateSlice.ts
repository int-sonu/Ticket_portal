import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AddEstimateType {
    AddEstimateFetching: boolean;
    AddEstimateSuccess: boolean;
    AddEstimateError: boolean;
    AddEstimateErrorMessage: string;
    AddEstimateData: any[];
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

interface AddEstimatePayload {
    nTicketId: number;
    nCustomerId: number;
    cCustomerName: string;
    nGrossAmount: number;
    nTaxAmount: number;
    nRoundoffAmount: number;
    nDiscountAmt: number;
    nTotalAmount: number;
    nCreatedBy: number;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;
    itemDtls: ItemDetail[];
}

interface RejectedValue {
    message: string;
}

export const AddEstimate = createAsyncThunk<
    any,
    AddEstimatePayload,
    { rejectValue: RejectedValue }
>("list/AddEstimate", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.AddEstimateURL,
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

const initialState: AddEstimateType = {
    AddEstimateFetching: false,
    AddEstimateSuccess: false,
    AddEstimateError: false,
    AddEstimateData: [],
    AddEstimateErrorMessage: "",
};

const AddEstimateSlice = createSlice({
    name: "list/AddEstimate",
    initialState,
    reducers: {
        clearAddEstimateSlice: (state) => {
            state.AddEstimateError = false;
            state.AddEstimateSuccess = false;
            state.AddEstimateFetching = false;
            state.AddEstimateErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(AddEstimate.pending, (state) => {
                state.AddEstimateFetching = true;
                state.AddEstimateSuccess = false;
                state.AddEstimateError = false;
                state.AddEstimateErrorMessage = "";
            })
            .addCase(AddEstimate.fulfilled, (state, action) => {
                state.AddEstimateFetching = false;
                state.AddEstimateSuccess = true;
                state.AddEstimateError = false;
                state.AddEstimateData = action.payload?.message || [];
            })
            .addCase(AddEstimate.rejected, (state, action) => {
                state.AddEstimateFetching = false;
                state.AddEstimateSuccess = false;
                state.AddEstimateError = true;
                state.AddEstimateErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearAddEstimateSlice } = AddEstimateSlice.actions;

export default AddEstimateSlice.reducer;
