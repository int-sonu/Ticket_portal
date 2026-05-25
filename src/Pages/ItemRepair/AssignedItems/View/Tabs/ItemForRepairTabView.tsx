import { Tabs, TabsProps } from "antd";
import CallReportTabFields from "../../../../../Components/ItemRepair/AssignItemForRepair/Add/CallReportTabFields";
import ActivityTabFieldsView from "../../../../../Components/ItemRepair/AssignItemForRepair/View/ActivityTabFieldsView";

interface Props {
  selectedRow: any;
  item: any;
  isFrom: string;
}

const ItemForRepairTabView: React.FC<Props> = ({
  selectedRow,
  item,
  isFrom,
}) => {
  const renderTabBar: TabsProps["renderTabBar"] = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} style={{ backgroundColor: "transparent" }} />
  );

  const items = [
    {
      key: "1",
      label: "Activity",
      children: (
        <ActivityTabFieldsView
          selectedRow={selectedRow}
          item={item}
          isFrom={isFrom}
          currentTab="Activity"
        />
      ),
    },
    {
      key: "2",
      label: "Call Reports",
      children: <CallReportTabFields />,
    },
  ];

  return (
    <div className="part-master-wrap">
      <Tabs
        defaultActiveKey="1"
        renderTabBar={renderTabBar}
        items={items}
        className="customer-tabs"
      />
    </div>
  );
};

export default ItemForRepairTabView;
