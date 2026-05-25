import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AddQuickCallReportType {
    AddQuickCallReportFetching: boolean;
    AddQuickCallReportSuccess: boolean;
    AddQuickCallReportError: boolean;
    AddQuickCallReportErrorMessage: string;
    AddQuickCallReportData: any[];
}

interface AddQuickCallReportPayload {
    nCustomerId: number;
    cCustomerName: string;
    nSourceId: number;
    cContactPerson: string;
    cContactNumber: string;
    cEmail: string;
    cTicketSummary: string;
    cDescription: string;
    cAssignedId: any;
    nTicketStatus: number;
    nAssetId: number;
    nPriority: number;
    nGroupId: number;
    bOnSite: boolean;
    dFollowupDate: string;
    cCallSummary: string;
    cCallComment: string;
    nCreatedBy: any;
    nCompanyId: number;
    cSchemaName: string;
    cDbName: string;  
}

interface RejectedValue {
    message: string;
}

export const AddQuickCallReport = createAsyncThunk<
    any,
    AddQuickCallReportPayload,
    { rejectValue: RejectedValue }
>("list/AddQuickCallReport", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.AddQuickCallReportURL,
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

const initialState: AddQuickCallReportType = {
    AddQuickCallReportFetching: false,
    AddQuickCallReportSuccess: false,
    AddQuickCallReportError: false,
    AddQuickCallReportData: [],
    AddQuickCallReportErrorMessage: "",
};

const AddQuickCallReportSlice = createSlice({
    name: "list/AddQuickCallReport",
    initialState,
    reducers: {
        clearAddQuickCallReportSlice: (state) => {
            state.AddQuickCallReportError = false;
            state.AddQuickCallReportSuccess = false;
            state.AddQuickCallReportFetching = false;
            state.AddQuickCallReportErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(AddQuickCallReport.pending, (state) => {
                state.AddQuickCallReportFetching = true;
                state.AddQuickCallReportSuccess = false;
                state.AddQuickCallReportError = false;
                state.AddQuickCallReportErrorMessage = "";
            })
            .addCase(AddQuickCallReport.fulfilled, (state, action) => {
                state.AddQuickCallReportFetching = false;
                state.AddQuickCallReportSuccess = true;
                state.AddQuickCallReportError = false;
                state.AddQuickCallReportData = action.payload?.message || [];
            })
            .addCase(AddQuickCallReport.rejected, (state, action) => {
                state.AddQuickCallReportFetching = false;
                state.AddQuickCallReportSuccess = false;
                state.AddQuickCallReportError = true;
                state.AddQuickCallReportErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearAddQuickCallReportSlice } = AddQuickCallReportSlice.actions;

export default AddQuickCallReportSlice.reducer;
