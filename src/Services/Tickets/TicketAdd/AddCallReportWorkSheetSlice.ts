import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface AddCallReportWorkSheetType {
    AddCallReportWorkSheetFetching: boolean;
    AddCallReportWorkSheetSuccess: boolean;
    AddCallReportWorkSheetError: boolean;
    AddCallReportWorkSheetErrorMessage: string;
    AddCallReportWorkSheetData: any[];
}

interface AddCallReportWorkSheetPayload {
    nFollowupId: number;
    nTicketId: number;
    nCompanyId: number;
    nCustomerId: number;
    nCallMode: number;
    cContactPerson: string;
    cContactNumber: string;
    cEmail: string;
    cSummary: string;
    cComments: string;
    bClosedTrip: boolean;
    nCloseStatus: number;
    bOnSite: boolean;
    nStatus: number;
    cTodo: string;
    dNextFollowupDate: string;
    nCreatedBy: number;
    cSchemaName: string;
    cDbName: string;
}

interface RejectedValue {
    message: string;
}

export const AddCallReportWorkSheet = createAsyncThunk<
    any,
    AddCallReportWorkSheetPayload,
    { rejectValue: RejectedValue }
>("list/AddCallReportWorkSheet", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.AddCallReportWorkSheetURL,
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

const initialState: AddCallReportWorkSheetType = {
    AddCallReportWorkSheetFetching: false,
    AddCallReportWorkSheetSuccess: false,
    AddCallReportWorkSheetError: false,
    AddCallReportWorkSheetData: [],
    AddCallReportWorkSheetErrorMessage: "",
};

const AddCallReportWorkSheetSlice = createSlice({
    name: "list/AddCallReportWorkSheet",
    initialState,
    reducers: {
        clearAddCallReportWorkSheetSlice: (state) => {
            state.AddCallReportWorkSheetError = false;
            state.AddCallReportWorkSheetSuccess = false;
            state.AddCallReportWorkSheetFetching = false;
            state.AddCallReportWorkSheetErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(AddCallReportWorkSheet.pending, (state) => {
                state.AddCallReportWorkSheetFetching = true;
                state.AddCallReportWorkSheetSuccess = false;
                state.AddCallReportWorkSheetError = false;
                state.AddCallReportWorkSheetErrorMessage = "";
            })
            .addCase(AddCallReportWorkSheet.fulfilled, (state, action) => {
                state.AddCallReportWorkSheetFetching = false;
                state.AddCallReportWorkSheetSuccess = true;
                state.AddCallReportWorkSheetError = false;
                state.AddCallReportWorkSheetData = action.payload?.message || [];
            })
            .addCase(AddCallReportWorkSheet.rejected, (state, action) => {
                state.AddCallReportWorkSheetFetching = false;
                state.AddCallReportWorkSheetSuccess = false;
                state.AddCallReportWorkSheetError = true;
                state.AddCallReportWorkSheetErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearAddCallReportWorkSheetSlice } = AddCallReportWorkSheetSlice.actions;

export default AddCallReportWorkSheetSlice.reducer;
