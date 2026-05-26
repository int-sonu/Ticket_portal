import axiosInstance from './axios';

export interface AgentPayload {
  [key: string]: any;
}

export interface GroupPayload {
  [key: string]: any;
}

export interface TripModePayload {
  [key: string]: any;
}

export interface FollowupPayload {
  [key: string]: any;
}

export interface FinancialYearPayload {
  [key: string]: any;
}






// ============================
// AGENT APIS
// ============================

export const agentApis = {
  agentSave: async (payload: AgentPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AgentSave',
      payload
    );

    return response.data;
  },

  agentListAll: async (payload: AgentPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AgentListAll',
      payload
    );

    return response.data;
  },

  agentDropDown: async (payload: AgentPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AgentDropDown',
      payload
    );

    return response.data;
  },

  agentToReportList: async (payload: AgentPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AgentToReportList',
      payload
    );

    return response.data;
  },

  assignAgentList: async (payload: AgentPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AssignAgentList',
      payload
    );

    return response.data;
  },

  agentUpdate: async (payload: AgentPayload) => {
    const response = await axiosInstance.put(
      '/Api/V1/Agent/AgentUpdate',
      payload
    );

    return response.data;
  },

  agentDelete: async (payload: AgentPayload) => {
    const response = await axiosInstance.delete(
      '/Api/V1/Agent/AgentDelete',
      {
        data: payload,
      }
    );

    return response.data;
  },

  agentView: async (payload: AgentPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AgentView',
      payload
    );

    return response.data;
  },
};






// ============================
// GROUP APIS
// ============================

export const groupApis = {
  groupList: async (payload: GroupPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Group/GroupList',
      payload
    );

    return response.data;
  },

  groupSave: async (payload: GroupPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Group/GroupSave',
      payload
    );

    return response.data;
  },

  groupUpdate: async (payload: GroupPayload) => {
    const response = await axiosInstance.put(
      '/Api/V1/Group/GroupUpdate',
      payload
    );

    return response.data;
  },

  groupDelete: async (payload: GroupPayload) => {
    const response = await axiosInstance.delete(
      '/Api/V1/Group/GroupDelete',
      {
        data: payload,
      }
    );

    return response.data;
  },
};






// ============================
// TRIP MODE APIS
// ============================

export const tripModeApis = {
  tripModeList: async (payload: TripModePayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/TripMode/TripModeList',
      payload
    );

    return response.data;
  },

  tripModeSave: async (payload: TripModePayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/TripMode/TripModeSave',
      payload
    );

    return response.data;
  },

  tripModeUpdate: async (payload: TripModePayload) => {
    const response = await axiosInstance.put(
      '/Api/V1/TripMode/TripModeUpdate',
      payload
    );

    return response.data;
  },

  tripModeDelete: async (payload: TripModePayload) => {
    const response = await axiosInstance.delete(
      '/Api/V1/TripMode/TripModeDelete',
      {
        data: payload,
      }
    );

    return response.data;
  },
};






// ============================
// FOLLOWUP MODE APIS
// ============================

export const followupApis = {
  followupList: async (payload: FollowupPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/CallreportMode/CallreportModeList',
      payload
    );

    return response.data;
  },

  followupSave: async (payload: FollowupPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/CallreportMode/CallreportModeSave',
      payload
    );

    return response.data;
  },

  followupUpdate: async (payload: FollowupPayload) => {
    const response = await axiosInstance.put(
      '/Api/V1/CallreportMode/CallreportModeUpdate',
      payload
    );

    return response.data;
  },

  followupDelete: async (payload: FollowupPayload) => {
    const response = await axiosInstance.delete(
      '/Api/V1/CallreportMode/CallreportModeDelete',
      {
        data: payload,
      }
    );

    return response.data;
  },
};






// ============================
// FINANCIAL YEAR APIS
// ============================

export const financialYearApis = {
  financialYearList: async (
    payload: FinancialYearPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/FinancialYear/FinancialYearList',
      payload
    );

    return response.data;
  },

  financialYearSave: async (
    payload: FinancialYearPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/FinancialYear/FinancialYearSave',
      payload
    );

    return response.data;
  },

  financialYearUpdate: async (
    payload: FinancialYearPayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/FinancialYear/FinancialYearUpdate',
      payload
    );

    return response.data;
  },

  financialYearDelete: async (
    payload: FinancialYearPayload
  ) => {
    const response = await axiosInstance.delete(
      '/Api/V1/FinancialYear/FinancialYearDelete',
      {
        data: payload,
      }
    );

    return response.data;
  },
};




// ============================
// TAX APIS
// ============================

export const taxApis = {
  taxList: async (
    payload: TaxPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Tax/TaxList',
      payload
    );

    return response.data;
  },

  taxSave: async (
    payload: TaxPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Tax/TaxSave',
      payload
    );

    return response.data;
  },

  taxUpdate: async (
    payload: TaxPayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/Tax/TaxUpdate',
      payload
    );

    return response.data;
  },

  taxDelete: async (
    payload: TaxPayload
  ) => {
    const response = await axiosInstance.delete(
      '/Api/V1/Tax/TaxDelete',
      {
        data: payload,
      }
    );

    return response.data;
  },
};