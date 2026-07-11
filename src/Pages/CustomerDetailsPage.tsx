import { useMemo, useState } from "react";
import { Input, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import CustomPagination from "../ui/Table/CustomPagination";
import { useGetCustomers } from "./Master/CustomerMaster/Hooks";
import { extractList } from "./Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../Utils/requestPayload";

const display = (value: any, fallback: string) => String(value ?? "").trim() || fallback;

const CustomerDetailsPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const payload = useMemo(() => ({ ...getRequestPayload(), pageNumber: 1, pageSize: 1000 }), []);
  const { data, isLoading, isError } = useGetCustomers(payload);

  const customers = useMemo(() => extractList(data).map((item: any, index: number) => ({
    key: item?.nCustomerId ?? item?.CustomerId ?? item?.customerId ?? index,
    name: display(item?.cCustomerName ?? item?.CustomerName ?? item?.name, "N/A"),
    mobile: display(item?.cPhoneNo ?? item?.cMobile ?? item?.MobileNo ?? item?.mobile, "NIL"),
    email: display(item?.cEmail ?? item?.Email ?? item?.email, "N/A"),
  })), [data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((item) =>
      [item.name, item.mobile, item.email].some((value) => value.toLowerCase().includes(query)),
    );
  }, [customers, search]);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-4 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-xl font-medium text-slate-950">Customer Details</h1>
        <Input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          prefix={<SearchOutlined className="text-slate-500" />}
          placeholder="Search"
          allowClear
          className="w-full max-w-[300px]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-[40px_minmax(150px,1fr)_150px_minmax(200px,2fr)] border-y border-slate-200 px-2 py-3 text-sm font-medium text-slate-900">
          <div>Srl</div><div>Customer Name</div><div>Mobile No</div><div>Email</div>
        </div>
        {isLoading ? (
          <div className="flex h-52 items-center justify-center"><Spin /></div>
        ) : isError ? (
          <div className="flex h-52 items-center justify-center text-sm text-red-500">Unable to load customers</div>
        ) : rows.length ? rows.map((item, index) => (
          <div key={item.key} className="grid grid-cols-[40px_minmax(150px,1fr)_150px_minmax(200px,2fr)] border-b border-slate-100 px-2 py-4 text-sm text-slate-800">
            <div>{(page - 1) * pageSize + index + 1}</div>
            <div>{item.name}</div><div>{item.mobile}</div><div>{item.email}</div>
          </div>
        )) : (
          <div className="flex h-52 items-center justify-center text-sm text-slate-500">No customers found</div>
        )}
      </div>

      <CustomPagination
        className="mt-3"
        current={page}
        pageSize={pageSize}
        total={filtered.length}
        onChange={(nextPage) => setPage(nextPage)}
        onShowSizeChange={(_, size) => { setPageSize(size); setPage(1); }}
      />
    </div>
  );
};

export default CustomerDetailsPage;
