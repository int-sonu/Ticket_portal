import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface CallReportWorkSheetAudioUploadType {
    CallReportWorkSheetAudioUploadFetching: boolean;
    CallReportWorkSheetAudioUploadSuccess: boolean;
    CallReportWorkSheetAudioUploadError: boolean;
    CallReportWorkSheetAudioUploadErrorMessage: string;
    CallReportWorkSheetAudioUploadData: any[];
}

interface CallReportWorkSheetAudioUploadPayload {
    nFollowUpId: number | string;
    nWorksheetId: number;
    nCompanyId: number | string;
    cSchemaName: string;
    cDbName: string;
    imageFiles: File[];
}

interface RejectedValue {
    message: string;
}

export const CallReportWorkSheetAudioUpload = createAsyncThunk<
    any,
    FormData,
    { rejectValue: RejectedValue }
>("list/CallReportWorkSheetAudioUpload", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.CallReportWorkSheetAudioUploadURL,
            method: "POST",
            data: payload,
               params: {
                nFollowUpId: parseInt(payload.get("nFollowUpId") as string),
                nWorksheetId: parseInt(payload.get("nWorksheetId") as string),
                nCompanyId: parseInt(payload.get("nCompanyId") as string),
            }
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

const initialState: CallReportWorkSheetAudioUploadType = {
    CallReportWorkSheetAudioUploadFetching: false,
    CallReportWorkSheetAudioUploadSuccess: false,
    CallReportWorkSheetAudioUploadError: false,
    CallReportWorkSheetAudioUploadData: [],
    CallReportWorkSheetAudioUploadErrorMessage: "",
};

const CallReportWorkSheetAudioUploadSlice = createSlice({
    name: "list/CallReportWorkSheetAudioUpload",
    initialState,
    reducers: {
        clearCallReportWorkSheetAudioUploadSlice: (state) => {
            state.CallReportWorkSheetAudioUploadError = false;
            state.CallReportWorkSheetAudioUploadSuccess = false;
            state.CallReportWorkSheetAudioUploadFetching = false;
            state.CallReportWorkSheetAudioUploadErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(CallReportWorkSheetAudioUpload.pending, (state) => {
                state.CallReportWorkSheetAudioUploadFetching = true;
                state.CallReportWorkSheetAudioUploadSuccess = false;
                state.CallReportWorkSheetAudioUploadError = false;
                state.CallReportWorkSheetAudioUploadErrorMessage = "";
            })
            .addCase(CallReportWorkSheetAudioUpload.fulfilled, (state, action) => {
                state.CallReportWorkSheetAudioUploadFetching = false;
                state.CallReportWorkSheetAudioUploadSuccess = true;
                state.CallReportWorkSheetAudioUploadError = false;
                state.CallReportWorkSheetAudioUploadData = action.payload?.message || [];
            })
            .addCase(CallReportWorkSheetAudioUpload.rejected, (state, action) => {
                state.CallReportWorkSheetAudioUploadFetching = false;
                state.CallReportWorkSheetAudioUploadSuccess = false;
                state.CallReportWorkSheetAudioUploadError = true;
                state.CallReportWorkSheetAudioUploadErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearCallReportWorkSheetAudioUploadSlice } = CallReportWorkSheetAudioUploadSlice.actions;

export default CallReportWorkSheetAudioUploadSlice.reducer;
