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

export interface TaxPayload {
  [key: string]: any;
}


export interface StatusPayload {
  [key: string]: any;
}


export interface PartsPayload {
  [key: string]: any;
}


export interface CustomerPayload {
  [key: string]: any;
}

export interface ServiceTypePayload {
  [key: string]: any;
}

export interface CurrencyPayload {
  [key: string]: any;
}

export interface AssetMasterPayload {
  [key: string]: any;
}

export interface IssueSummaryPayload {
  [key: string]: any;
}

export interface DepartmentPayload {
  [key: string]: any;
}

export interface BrandPayload {
  [key: string]: any;
}

export interface TicketSourcePayload {
  [key: string]: any;
}

export interface VendorPayload {
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
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AgentUpdate',
      payload
    );

    return response.data;
  },

  agentDelete: async (payload: AgentPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Agent/AgentDelete',
      payload
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
    const response = await axiosInstance.post(
      '/Api/V1/Group/GroupUpdate',
      payload
    );

    return response.data;
  },

  groupDelete: async (
  payload: GroupPayload
) => {
  const response =
    await axiosInstance.post(
      '/Api/V1/Group/GroupDelete',
      payload
    );

  return response.data;
},

  groupView: async (payload: GroupPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Group/GroupView',
      payload
    );

    return response.data;
  },

  groupDropDown: async (payload: GroupPayload) => {
    const response = await axiosInstance.post(
      '/Api/V1/Group/GroupDropDown',
      payload
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
    const response = await axiosInstance.post(
      '/Api/V1/TripMode/TripModeDelete',
      payload
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
    const response = await axiosInstance.post(
      '/Api/V1/CallreportMode/CallreportModeDelete',
      payload
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
    const response = await axiosInstance.post(
      '/Api/V1/FinancialYear/FinancialYearDelete',
      payload
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
      '/Api/V1/TaxMaster/TaxMasterList',
      payload
    );

    return response.data;
  },

  taxSave: async (
    payload: TaxPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/TaxMaster/TaxMasterSave',
      payload
    );

    return response.data;
  },

  taxUpdate: async (
    payload: TaxPayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/TaxMaster/TaxMasterUpdate',
      payload
    );

    return response.data;
  },

  taxDelete: async (
    payload: TaxPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/TaxMaster/TaxMasterDelete',
      payload
    );

    return response.data;
  },
};

// ============================
// STATUS APIS
// ============================

export const statusApis = {
  statusList: async (
    payload: StatusPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/TicketStatus/TicketStatusList',
      payload
    );

    return response.data;
  },

  statusSave: async (
    payload: StatusPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/TicketStatus/TicketStatusSave',
      payload
    );

    return response.data;
  },

  statusUpdate: async (
    payload: StatusPayload
  ) => {
    // Backend procedure pr_tm_ticketstatusmasterupdate does not accept cDbName
    // Sending it causes an "inserted_data => unknown" mapping error
    const { cDbName, ...restPayload } = payload;
    const response = await axiosInstance.put(
      '/Api/V1/TicketStatus/TicketStatusUpdate',
      restPayload
    );

    return response.data;
  },

  statusDelete: async (
    payload: StatusPayload
  ) => {
    const response = await axiosInstance.delete(
      '/Api/V1/TicketStatus/TicketStatusDelete',
      {
        data: payload,
      }
    );

    return response.data;
  },
};

// ============================
// PARTS APIS
// ============================

export const partsApis = {
  partsList: async (
    payload: PartsPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Part/PartsList',
      payload
    );

    return response.data;
  },

  partsSave: async (
    payload: PartsPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Part/PartsSave',
      payload
    );

    return response.data;
  },

  partsUpdate: async (
    payload: PartsPayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/Part/PartsUpdate',
      payload
    );

    return response.data;
  },

  partsDelete: async (
    payload: PartsPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Part/PartsDelete',
      payload
    );

    return response.data;
  },
};



// ============================
// CUSTOMER APIS
// ============================

export const customerApis = {

  customerList: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerList',
      payload
    );

    return response.data;
  },



  customerView: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerView',
      payload
    );

    return response.data;
  },



  customerDropDown: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerDropDown',
      payload
    );

    return response.data;
  },



  customerSave: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerSave',
      payload
    );

    return response.data;
  },



  customerSaveWithAssets: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerSaveWithAssets',
      payload
    );

    return response.data;
  },



  customerUpdate: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/Customer/CustomerUpdate',
      payload
    );

    return response.data;
  },



  customerUpdateWithAssets: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerUpdateWithAssets',
      payload
    );

    return response.data;
  },



  customerDelete: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerDelete',
      payload
    );

    return response.data;
  },



  checkAmcExpiry: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CheckAmcExpiry',
      payload
    );

    return response.data;
  },



  alternativeContactList: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Customer/CustomerAlteranativeContacts',
      payload
    );

    return response.data;
  },



  assetMasterSuggest: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/AssetMaster/AssetMasterSuggest',
      payload
    );

    return response.data;
  },
};



// ============================
// ASSET MASTER APIS
// ============================

export const assetMasterApis = {
  assetMasterList: async (
    payload: AssetMasterPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/AssetMaster/AssetMasterList',
      payload
    );

    return response.data;
  },

  assetMasterSave: async (
    payload: AssetMasterPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/AssetMaster/AssetMasterSave',
      payload
    );

    return response.data;
  },

  assetMasterUpdate: async (
    payload: AssetMasterPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/AssetMaster/AssetMasterUpdate',
      payload
    );

    return response.data;
  },

  assetMasterDelete: async (
    payload: AssetMasterPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/AssetMaster/AssetMasterDelete',
      payload
    );

    return response.data;
  },

  assetMasterSuggest: async (
    payload: AssetMasterPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/AssetMaster/AssetMasterSuggest',
      payload
    );

    return response.data;
  },
};



// ============================
// ISSUE SUMMARY APIS
// ============================

export const issueSummaryApis = {
  issueSummaryList: async (
    payload: IssueSummaryPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/IssueSummary/IssueSummaryList',
      payload
    );

    return response.data;
  },

  issueSummarySave: async (
    payload: IssueSummaryPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/IssueSummary/IssueSave',
      payload
    );

    return response.data;
  },

  issueSummaryUpdate: async (
    payload: IssueSummaryPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/IssueSummary/IssueUpdate',
      payload
    );

    return response.data;
  },

  issueSummaryDelete: async (
    payload: IssueSummaryPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/IssueSummary/IssueDelete',
      payload
    );

    return response.data;
  },

  issueSuggestionList: async (
    payload: IssueSummaryPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/IssueSummary/IssueSuggestionList',
      payload
    );

    return response.data;
  },

  issueSummaryDropDown: async (
    payload: IssueSummaryPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/IssueSummary/IssueSummaryDropDown',
      payload
    );

    return response.data;
  },
};



// ============================
// SERVICE TYPE APIS
// ============================

export const serviceTypeApis = {
  serviceTypeList: async (
    payload: ServiceTypePayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/ServiceType/ServiceTypeList',
      payload
    );

    return response.data;
  },

  serviceTypeDropDown: async (
    payload: ServiceTypePayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/ServiceType/ServiceTypeDropDown',
      payload
    );

    return response.data;
  },

  serviceTypeSave: async (
    payload: ServiceTypePayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/ServiceType/ServiceTypeSave',
      payload
    );

    return response.data;
  },

  serviceTypeUpdate: async (
    payload: ServiceTypePayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/ServiceType/ServiceTypeUpdate',
      payload
    );

    return response.data;
  },

  serviceTypeDelete: async (
    payload: ServiceTypePayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/ServiceType/ServiceTypeDelete',
      payload
    );

    return response.data;
  },
};



// ============================
// CURRENCY APIS
// ============================

export const currencyApis = {
  currencyListAll: async (
    payload: CurrencyPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Currency/CurrencyListAll',
      payload
    );

    return response.data;
  },

  currencySave: async (
    payload: CurrencyPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Currency/CurrencySave',
      payload
    );

    return response.data;
  },

  currencyUpdate: async (
    payload: CurrencyPayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/Currency/CurrencyUpdate',
      payload
    );

    return response.data;
  },

  currencyDelete: async (
    payload: CurrencyPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Currency/CurrencyDelete',
      payload
    );

    return response.data;
  },

  currencyView: async (
    payload: CurrencyPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Currency/CurrencyView',
      payload
    );

    return response.data;
  },

  currencyDropDown: async (
    payload: CurrencyPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Currency/CurrencyDropDown',
      payload
    );

    return response.data;
  },
};




// ============================
// DEPARTMENT APIS
// ============================

export const departmentApis = {
 departmentListAll: async (
  payload: DepartmentPayload
) => {
  const response = await axiosInstance.post(
    '/Api/V1/Department/DepartmentListAll',
    payload
  );

  return response.data;
},

 departmentList: async (
  payload: DepartmentPayload
) => {
  const response = await axiosInstance.post(
    '/Api/V1/Department/DepartmentList',
    payload
  );

  return response.data;
},

  departmentSave: async (
    payload: DepartmentPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Department/DepartmentSave',
      payload
    );

    return response.data;
  },

  departmentUpdate: async (
    payload: DepartmentPayload
  ) => {
    const response = await axiosInstance.put(
      '/Api/V1/Department/DepartmentUpdate',
      payload
    );

    return response.data;
  },

  departmentDelete: async (
    payload: DepartmentPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Department/DepartmentDelete',
      payload
    );

    return response.data;
  },

  departmentView: async (
    payload: DepartmentPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Department/DepartmentView',
      payload
    );

    return response.data;
  },

  departmentDropDown: async (
    payload: DepartmentPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Department/DepartmentDropDown',
      payload
    );

    return response.data;
  },
};


// ============================
// BRAND APIS
// ============================

export const brandApis = {

  brandListAll: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Brand/BrandListAll",
      payload
    );

    return response.data;
  },

  brandList: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Brand/BrandList",
      payload
    );

    return response.data;
  },

  brandSave: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Brand/BrandSave",
      payload
    );

    return response.data;
  },

  brandUpdate: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Brand/BrandUpdate",
      payload
    );

    return response.data;
  },

  brandDelete: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Brand/BrandDelete",
      payload
    );

    return response.data;
  },
};

// ============================
// TICKET SOURCE APIS
// ============================

export const ticketSourceApis = {

  ticketSourceListAll: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/TicketSource/TicketSourceListAll",
      payload
    );

    return response.data;
  },

  ticketSourceList: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/TicketSource/TicketSourceList",
      payload
    );

    return response.data;
  },

  ticketSourceSave: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/TicketSource/TicketSourceSave",
      payload
    );

    return response.data;
  },

  ticketSourceUpdate: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/TicketSource/TicketSourceUpdate",
      payload
    );

    return response.data;
  },

  ticketSourceDelete: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/TicketSource/TicketSourceDelete",
      payload
    );

    return response.data;
  },
};


// ============================
// VENDOR APIS
// ============================

export const vendorApis = {

  vendorListAll: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Vendor/VendorListAll",
      payload
    );

    return response.data;
  },

  vendorList: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Vendor/VendorList",
      payload
    );

    return response.data;
  },

  vendorSave: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Vendor/VendorSave",
      payload
    );

    return response.data;
  },

  vendorUpdate: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Vendor/VendorUpdate",
      payload
    );

    return response.data;
  },

  vendorDelete: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Vendor/VendorDelete",
      payload
    );

    return response.data;
  },
};
