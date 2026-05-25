import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface CallReportWorkSheetImgUploadType {
    CallReportWorkSheetImgUploadFetching: boolean;
    CallReportWorkSheetImgUploadSuccess: boolean;
    CallReportWorkSheetImgUploadError: boolean;
    CallReportWorkSheetImgUploadErrorMessage: string;
    CallReportWorkSheetImgUploadData: any[];
}

interface CallReportWorkSheetImgUploadPayload {
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

export const CallReportWorkSheetImgUpload = createAsyncThunk<
    any,
    FormData,
    { rejectValue: RejectedValue }
>("list/CallReportWorkSheetImgUpload", async (payload, { rejectWithValue }) => {
    try {
        const response = await api.actionHandler({
            url: api.TicketsApi.CallReportWorkSheetImgUploadURL,
            method: "POST",
            data: payload,
            params: {
                nFollowUpId: parseInt(payload.get("nFollowUpId") as string),
                nWorksheetId: parseInt(payload.get("nWorksheetId") as string),
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

const initialState: CallReportWorkSheetImgUploadType = {
    CallReportWorkSheetImgUploadFetching: false,
    CallReportWorkSheetImgUploadSuccess: false,
    CallReportWorkSheetImgUploadError: false,
    CallReportWorkSheetImgUploadData: [],
    CallReportWorkSheetImgUploadErrorMessage: "",
};

const CallReportWorkSheetImgUploadSlice = createSlice({
    name: "list/CallReportWorkSheetImgUpload",
    initialState,
    reducers: {
        clearCallReportWorkSheetImgUploadSlice: (state) => {
            state.CallReportWorkSheetImgUploadError = false;
            state.CallReportWorkSheetImgUploadSuccess = false;
            state.CallReportWorkSheetImgUploadFetching = false;
            state.CallReportWorkSheetImgUploadErrorMessage = "";
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(CallReportWorkSheetImgUpload.pending, (state) => {
                state.CallReportWorkSheetImgUploadFetching = true;
                state.CallReportWorkSheetImgUploadSuccess = false;
                state.CallReportWorkSheetImgUploadError = false;
                state.CallReportWorkSheetImgUploadErrorMessage = "";
            })
            .addCase(CallReportWorkSheetImgUpload.fulfilled, (state, action) => {
                state.CallReportWorkSheetImgUploadFetching = false;
                state.CallReportWorkSheetImgUploadSuccess = true;
                state.CallReportWorkSheetImgUploadError = false;
                state.CallReportWorkSheetImgUploadData = action.payload?.message || [];
            })
            .addCase(CallReportWorkSheetImgUpload.rejected, (state, action) => {
                state.CallReportWorkSheetImgUploadFetching = false;
                state.CallReportWorkSheetImgUploadSuccess = false;
                state.CallReportWorkSheetImgUploadError = true;
                state.CallReportWorkSheetImgUploadErrorMessage =
                    action.payload?.message || "Unknown error";
            });
    },
});

export const { clearCallReportWorkSheetImgUploadSlice } = CallReportWorkSheetImgUploadSlice.actions;

export default CallReportWorkSheetImgUploadSlice.reducer;
