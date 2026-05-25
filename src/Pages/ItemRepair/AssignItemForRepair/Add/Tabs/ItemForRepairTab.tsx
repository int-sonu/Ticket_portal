import { Tabs, TabsProps } from "antd";
import ActivityTabFields from "../../../../../Components/ItemRepair/AssignItemForRepair/Add/ActivityTabFields";
import CallReportTabFields from "../../../../../Components/ItemRepair/AssignItemForRepair/Add/CallReportTabFields";

interface Props {
  selectedRow: any;
  item?: any;
}

const ItemForRepairTab: React.FC<Props> = ({ selectedRow, item }) => {
  const renderTabBar: TabsProps["renderTabBar"] = (props, DefaultTabBar) => (
    <DefaultTabBar {...props} style={{ backgroundColor: "transparent" }} />
  );

  const items = [
    {
      key: "1",
      label: "Activity",
        children: (
          <ActivityTabFields selectedRow={selectedRow} item={item} />
        ),
    },
    {
      key: "2",
      label: "Call Reports",
        children: (
          <CallReportTabFields selectedRow={selectedRow} item={item} />
        ),
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

export default ItemForRepairTab;
