import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../../Axios/api";

interface PostponedticketListType {
  PostponedticketListFetching: boolean;
  PostponedticketListSuccess: boolean;
  PostponedticketListError: boolean;
  PostponedticketListErrorMessage: string;
  PostponedticketListData: any[];
}

interface PostponedticketListPayload {
  nCompanyId: number;
  cDBName: string;
  cSchemaName: string;
}

interface RejectedValue {
  message: string;
}

export const PostponedticketList = createAsyncThunk<
  any,
  PostponedticketListPayload,
  { rejectValue: RejectedValue }
>("list/PostponedticketList", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.actionHandler({
      url: api.TicketsApi.PostponedTicketsListURL,
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

const initialState: PostponedticketListType = {
  PostponedticketListFetching: false,
  PostponedticketListSuccess: false,
  PostponedticketListError: false,
  PostponedticketListData: [],
  PostponedticketListErrorMessage: "",
};

const PostponedticketListSlice = createSlice({
  name: "list/PostponedticketList",
  initialState,
  reducers: {
    clearPostponedTicketListSlice: (state) => {
      state.PostponedticketListError = false;
      state.PostponedticketListSuccess = false;
      state.PostponedticketListFetching = false;
      state.PostponedticketListErrorMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(PostponedticketList.pending, (state) => {
        state.PostponedticketListFetching = true;
        state.PostponedticketListSuccess = false;
        state.PostponedticketListError = false;
        state.PostponedticketListErrorMessage = "";
      })
      .addCase(PostponedticketList.fulfilled, (state, action) => {
        state.PostponedticketListFetching = false;
        state.PostponedticketListSuccess = true;
        state.PostponedticketListError = false;
        state.PostponedticketListData = action.payload?.data || [];
      })
      .addCase(PostponedticketList.rejected, (state, action) => {
        state.PostponedticketListFetching = false;
        state.PostponedticketListSuccess = false;
        state.PostponedticketListError = true;
        state.PostponedticketListErrorMessage =
          action.payload?.message || "Unknown error";
      });
  },
});

export const { clearPostponedTicketListSlice } = PostponedticketListSlice.actions;

export default PostponedticketListSlice.reducer;
