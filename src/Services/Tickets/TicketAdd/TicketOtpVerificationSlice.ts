import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface TicketOtpVerificationType {
    TicketOtpVerificationFetching: boolean;
    TicketOtpVerificationSuccess: boolean;
    TicketOtpVerificationError: boolean;
    TicketOtpVerificationErrorMessage: string;
    TicketOtpVerificationData: any[];
}

interface TicketOtpVerificationPayload {
    idToken: any
}

interface RejectedValue {
    message: string;
}

export const TicketOtpVerification = createAsyncThunk<
    any,
    TicketOtpVerificationPayload,
    { rejectValue: RejectedValue }
>("list/TicketOtpVerification", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.TicketOtpVerificationURL,
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

const initialState: TicketOtpVerificationType = {
    TicketOtpVerificationFetching: false,
    TicketOtpVerificationSuccess: false,
    TicketOtpVerificationError: false,
    TicketOtpVerificationData: [],
    TicketOtpVerificationErrorMessage: "",
};

const TicketOtpVerificationSlice = createSlice({
    name: "list/TicketOtpVerification",
    initialState,
    reducers: {
        clearTicketOtpVerificationSlice: (state) => {
            state.TicketOtpVerificationError = false;
            state.TicketOtpVerificationSuccess = false;
            state.TicketOtpVerificationFetching = false;
            state.TicketOtpVerificationErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(TicketOtpVerification.pending, (state) => {
                state.TicketOtpVerificationFetching = true;
                state.TicketOtpVerificationSuccess = false;
                state.TicketOtpVerificationError = false;
                state.TicketOtpVerificationErrorMessage = "";
            })
            .addCase(TicketOtpVerification.fulfilled, (state, action) => {
                state.TicketOtpVerificationFetching = false;
                state.TicketOtpVerificationSuccess = true;
                state.TicketOtpVerificationError = false;
                state.TicketOtpVerificationData = action.payload?.message || [];
            })
            .addCase(TicketOtpVerification.rejected, (state, action) => {
                state.TicketOtpVerificationFetching = false;
                state.TicketOtpVerificationSuccess = false;
                state.TicketOtpVerificationError = true;
                state.TicketOtpVerificationErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearTicketOtpVerificationSlice } = TicketOtpVerificationSlice.actions;

export default TicketOtpVerificationSlice.reducer;