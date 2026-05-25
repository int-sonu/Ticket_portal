import { useEffect, useState } from "react";
import { CommonViewTabs } from "../../../../Components/ui/Index";
import { useLocation, useNavigate } from "react-router-dom";
import CustomerProfile from "../Profile/CustomerProfile";
import CustomerAssetList from "../CustomerAssets/CustomerAssetList";
import CustomerBillsList from "../Bills/CustomerBillList";
import CustomerTicketsList from "../Tickets/CustomerTicketsList";
import { useAppSelector } from "../../../../store/hooks";
import { RootState } from "../../../../store";
import { useFetchAllCustomerList } from "./Hooks";
import { useFetchFeatures } from "../../../Settings/Features/Hooks";
import { usePermissions } from "../../../../common/sidebar/usePermissions";

interface itemType {
  key: string;
  label: string;
  children: React.ReactNode;
}

const CustomerDetailsView = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { hasPermission } = usePermissions();

  const [activeKey, setActiveKey] = useState<string>("1");

  const handleBack = () => {
    navigate("/more/customerdetails");
  };


  const { state } = location;

  const { FeaturesSettingsGetData } = useAppSelector(
    (state: RootState) => state.FeaturesSettingsGetSlice
  );

  const isAssetEnabled = FeaturesSettingsGetData?.[0]?.bShowAsset;
  const isBillsEnabled = FeaturesSettingsGetData?.[0]?.bEnableBilling;

  const ticketTabHasPermission = hasPermission("more-customer-details-view-tickets") ? true : false;
  const billsTabHasPermission = hasPermission("more-customer-details-view-bills") ? true : false;
  const assetTabHasPermission = hasPermission("more-customer-details-view-assets") ? true : false;

  useFetchAllCustomerList(Number(activeKey), state?.customerData?.nCustomerId);

  const { CustomerProfileViewData, CustomerProfileViewFetching } =
    useAppSelector((state: RootState) => state.CustomerProfileViewSlice);

  const { CustomerAlterContactsListData } = useAppSelector(
    (state: RootState) => state.CustomerAlterContactsListSlice
  );

  const { CustomerTicketListData, CustomerTicketListFetching } = useAppSelector(
    (state: RootState) => state.CustomerTicketListSlice
  );

  const { CustomerBillListData, CustomerBillListFetching } = useAppSelector(
    (state: RootState) => state.CustomerBillListSlice
  );

  const items: itemType[] = [
    {
      key: "1",
      label: "Profile",
      children: (
        <CustomerProfile
          activeKey={activeKey}
          customerProfileData={CustomerProfileViewData}
          CustomerProfileViewFetching={CustomerProfileViewFetching}
          alterContactsData={CustomerAlterContactsListData}
        />
      ),
    },
    ticketTabHasPermission ? {
      key: "2",
      label: "Tickets",
      children: (
        <CustomerTicketsList
          activeKey={activeKey}
          customerTicketsData={CustomerTicketListData}
          CustomerTicketListFetching={CustomerTicketListFetching}
        />
      ),
    } : null,
    billsTabHasPermission && isBillsEnabled
      ? {
        key: "3",
        label: "Bills",
        children: (
          <CustomerBillsList
            activeKey={activeKey}
            customerBillsData={CustomerBillListData}
            CustomerBillListFetching={CustomerBillListFetching}
          />
        ),
      }
      : null,
    assetTabHasPermission && isAssetEnabled
      ? {
        key: "4",
        label: "Asset",
        children: (
          <CustomerAssetList
            customerId={state?.customerData?.nCustomerId}
            customerBillsData={CustomerBillListData}
          />
        ),
      }
      : null,
  ].filter(Boolean) as itemType[];

  return (
    <div className="main-padding">
      <CommonViewTabs
        defaultActiveKey={activeKey}
        items={items}
        onChange={(key) => {
          setActiveKey(key);
          localStorage.setItem("activeKey", key.toString());
        }}
        onClose={handleBack}
      />
    </div>
  );
};

export default CustomerDetailsView;
