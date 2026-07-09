import axiosInstance from './axios';

type HttpMethod = 'post' | 'put' | 'delete';

const methodFromAllowHeader = (allowHeader?: string): HttpMethod | undefined => {
  const allowed = String(allowHeader ?? '').toLowerCase();

  if (allowed.includes('put')) return 'put';
  if (allowed.includes('delete')) return 'delete';
  if (allowed.includes('post')) return 'post';

  return undefined;
};

const sendPayload = async (method: HttpMethod, url: string, payload: any) => {
  switch (method) {
    case 'post':
      return axiosInstance.post(url, payload);
    case 'put':
      return axiosInstance.put(url, payload);
    case 'delete':
      return axiosInstance.delete(url, {
        data: payload,
      });
    default:
      return axiosInstance.post(url, payload);
  }
};

const sendWithMethodFallback = async (
  method: HttpMethod,
  url: string,
  payload: any,
  fallbackMethods: HttpMethod[] = []
) => {
  try {
    return await sendPayload(method, url, payload);
  } catch (error: any) {
    const status = error?.response?.status;
    const allowMethod = methodFromAllowHeader(error?.response?.headers?.allow);
    const retryMethods = [
      allowMethod,
      ...fallbackMethods,
    ].filter((item): item is HttpMethod => !!item && item !== method);

    if (status !== 405 || !retryMethods.length) {
      throw error;
    }

    return sendPayload(retryMethods[0], url, payload);
  }
};

const postWithUrlFallback = async (
  urls: string[],
  payload: any
) => {
  let lastError: any;

  for (const url of urls) {
    try {
      const response = await axiosInstance.post(url, payload);
      return response;
    } catch (error: any) {
      lastError = error;

      const status = error?.response?.status;
      if (![404, 405].includes(status)) {
        throw error;
      }
    }
  }

  throw lastError;
};

const postMultipartWithUrlFallback = async (
  urls: string[],
  payload: FormData
) => {
  let lastError: any;

  for (const url of urls) {
    try {
      const response = await axiosInstance.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response;
    } catch (error: any) {
      lastError = error;

      const status = error?.response?.status;
      if (![404, 405].includes(status)) {
        throw error;
      }
    }
  }

  throw lastError;
};

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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/Agent/AgentUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  agentDelete: async (payload: AgentPayload) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/Agent/AgentDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/Group/GroupUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  groupDelete: async (
  payload: GroupPayload
) => {
  const response =
    await sendWithMethodFallback(
      'delete',
      '/Api/V1/Group/GroupDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/TripMode/TripModeUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  tripModeDelete: async (payload: TripModePayload) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/TripMode/TripModeDelete',
      payload,
      ['post']
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

  followupActiveList: async (payload: FollowupPayload) => {
    const response = await axiosInstance
      .post(
        '/Api/V1/CallreportMode/CallreportModeActiveList',
        payload
      )
      .catch((error) => {
        if ([404, 405].includes(error?.response?.status)) {
          return axiosInstance.post(
            '/Api/V1/CallreportMode/CallreportModeList',
            payload
          );
        }

        throw error;
      });

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
    const response = await sendWithMethodFallback(
      'post',
      '/Api/V1/CallreportMode/CallreportModeUpdate',
      payload,
      ['put']
    );

    return response.data;
  },

  followupDelete: async (payload: FollowupPayload) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/CallreportMode/CallreportModeDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/FinancialYear/FinancialYearUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  financialYearDelete: async (
    payload: FinancialYearPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/FinancialYear/FinancialYearDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/TaxMaster/TaxMasterUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  taxDelete: async (
    payload: TaxPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/TaxMaster/TaxMasterDelete',
      payload,
      ['post']
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
    const response = await axiosInstance
      .post(
        '/Api/V1/TicketStatus/TicketStatusDropDown',
        payload
      )
      .catch((error) => {
        if ([404, 405].includes(error?.response?.status)) {
          return axiosInstance.post(
            '/Api/V1/TicketStatus/TicketStatusDropDown',
            payload
          );
        }

        throw error;
      });

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
    const restPayload = { ...payload };
    delete restPayload.cDbName;

    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/TicketStatus/TicketStatusUpdate',
      restPayload,
      ['post']
    );

    return response.data;
  },

  statusDelete: async (
    payload: StatusPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/TicketStatus/TicketStatusDelete',
      payload,
      ['post']
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

  partsSaveWithTax: async (
    payload: PartsPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Part/PartsSaveWithTax',
      payload
    );

    return response.data;
  },

  multiplePartsWithAttachmentsSave: async (
    payload: FormData
  ) => {
    const response = await postMultipartWithUrlFallback(
      [
        '/Api/V1/Part/MultiplePartsWithAttachmentsSave',
        '/Api/V1/Part/MultiplePartWithAttachmentsSave',
        '/Api/V1/Part/PartsMultipleWithAttachmentsSave',
        '/Api/V1/Part/PartsWithAttachmentsSave',
        '/Api/V1/Part/PartWithAttachmentsSave',
      ],
      payload
    );

    return response.data;
  },

  partsAttachmentUpload: async (
    payload: FormData
  ) => {
    const response = await postMultipartWithUrlFallback(
      [
        '/Api/V1/Part/PartsAttachmentUpload',
        '/Api/V1/Part/PartAttachmentUpload',
        '/Api/V1/Part/PartsUploadAttachment',
        '/Api/V1/Part/PartUploadAttachment',
      ],
      payload
    );

    return response.data;
  },

  partsAttachmentDelete: async (
    payload: PartsPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/Part/PartsAttachmentDelete',
      payload,
      ['post']
    );

    return response.data;
  },

  partsViewWithTax: async (
    payload: PartsPayload
  ) => {
    const response = await postWithUrlFallback(
      [
        '/Api/V1/Part/PartsViewWithTax',
       
      ],
      payload
    );

    return response.data;
  },

  partsView: async (
    payload: PartsPayload
  ) => {
    const response = await postWithUrlFallback(
      [
        '/Api/V1/Part/PartsView',
      ],
      payload
    );

    return response.data;
  },

  partsUpdate: async (
    payload: PartsPayload
  ) => {
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/Part/PartsUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  partsUpdateWithTax: async (
    payload: PartsPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Part/PartsUpdateWithTax',
      payload
    );

    return response.data;
  },

  partsDelete: async (
    payload: PartsPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/Part/PartsDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/Customer/CustomerUpdate',
      payload,
      ['post']
    );

    return response.data;
  },



  customerUpdateWithAssets: async (
    payload: CustomerPayload
  ) => {
    const response = await sendWithMethodFallback(
      'post',
      '/Api/V1/Customer/CustomerUpdateWithAssets',
      payload,
      ['put']
    );

    return response.data;
  },



  customerDelete: async (
    payload: CustomerPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/Customer/CustomerDelete',
      payload,
      ['post']
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

  customerWiseAssetList: async (
    payload: CustomerPayload
  ) => {
    const response = await axiosInstance.post(
      '/Api/V1/Asset/CustomerWiseAssetList',
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/AssetMaster/AssetMasterUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  assetMasterDelete: async (
    payload: AssetMasterPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/AssetMaster/AssetMasterDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/IssueSummary/IssueUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  issueSummaryDelete: async (
    payload: IssueSummaryPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/IssueSummary/IssueDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/ServiceType/ServiceTypeUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  serviceTypeDelete: async (
    payload: ServiceTypePayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/ServiceType/ServiceTypeDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/Currency/CurrencyUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  currencyDelete: async (
    payload: CurrencyPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/Currency/CurrencyDelete',
      payload,
      ['post']
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
    const response = await sendWithMethodFallback(
      'put',
      '/Api/V1/Department/DepartmentUpdate',
      payload,
      ['post']
    );

    return response.data;
  },

  departmentDelete: async (
    payload: DepartmentPayload
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      '/Api/V1/Department/DepartmentDelete',
      payload,
      ['post']
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
    ).catch((error) => {
      if (error?.response?.status === 404) {
        return axiosInstance.post(
          "/Api/V1/Brand/BrandList",
          payload
        );
      }

      throw error;
    });

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
    const response = await sendWithMethodFallback(
      'put',
      "/Api/V1/Brand/BrandUpdate",
      payload,
      ['post']
    );

    return response.data;
  },

  brandDelete: async (
    payload: any
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      "/Api/V1/Brand/BrandDelete",
      payload,
      ['post']
    );

    return response.data;
  },

  brandDropDown: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Brand/BrandDropDown",
      payload
    ).catch((error) => {
      if (error?.response?.status === 404) {
        return axiosInstance.post(
          "/Api/V1/Brand/BrandListAll",
          payload
        );
      }

      throw error;
    });

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
      "/Api/V1/TicketSource/TicketSourceList",
      payload
    ).catch((error) => {
      if (error?.response?.status === 404) {
        return axiosInstance.post(
          "/Api/V1/TicketSource/TicketSourceList",
          payload
        );
      }

      throw error;
    });

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

  ticketSourceDropDown: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/TicketSource/TicketSourceDropDown",
      payload
    ).catch((error) => {
      if (error?.response?.status === 404) {
        return axiosInstance.post(
          "/Api/V1/TicketSource/TicketSourceList",
          payload
        );
      }

      throw error;
    });

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
    const response = await sendWithMethodFallback(
      'put',
      "/Api/V1/TicketSource/TicketSourceUpdate",
      payload,
      ['post']
    );

    return response.data;
  },

  ticketSourceDelete: async (
    payload: any
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      "/Api/V1/TicketSource/TicketSourceDelete",
      payload,
      ['post']
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
    ).catch((error) => {
      if (error?.response?.status === 404) {
        return axiosInstance.post(
          "/Api/V1/Vendor/VendorList",
          payload
        );
      }

      throw error;
    });

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

  vendorDropDown: async (
    payload: any
  ) => {
    const response = await axiosInstance.post(
      "/Api/V1/Vendor/VendorDropDown",
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
    const response = await sendWithMethodFallback(
      'put',
      "/Api/V1/Vendor/VendorUpdate",
      payload,
      ['post']
    );

    return response.data;
  },

  vendorDelete: async (
    payload: any
  ) => {
    const response = await sendWithMethodFallback(
      'delete',
      "/Api/V1/Vendor/VendorDelete",
      payload,
      ['post']
    );

    return response.data;
  },
};
