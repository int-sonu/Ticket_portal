import { useMemo, useState } from "react";
import { Input, Spin } from "antd";
import { CloseOutlined, MailFilled, PhoneFilled, SearchOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import CustomPagination from "../ui/Table/CustomPagination";
import { useGetCustomerProfile, useGetCustomers } from "./Master/CustomerMaster/Hooks";
import { extractList } from "./Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../Utils/requestPayload";
import CustomerTicketChart from "./CustomerTicketChart";
import CustomerProfileTickets from "./CustomerProfileTickets";
import CustomerProfileBills from "./CustomerProfileBills";
import CustomerProfileAssets from "./CustomerProfileAssets";

const show = (value: any, fallback = "N/A") => String(value ?? "").trim() || fallback;

const findCustomerModes = (value: any, visited = new Set<any>()): any[] => {
  if (!value || typeof value !== "object" || visited.has(value)) return [];
  visited.add(value);

  if (
    Array.isArray(value) &&
    value.some((item) => item?.cCallModeName !== undefined)
  ) {
    return value;
  }

  if (Array.isArray(value?.Modes)) return value.Modes;

  for (const nestedValue of Object.values(value)) {
    const modes = findCustomerModes(nestedValue, visited);
    if (modes.length) return modes;
  }

  return [];
};

const findProfileNumber = (
  value: any,
  keys: string[],
  visited = new Set<any>(),
): number => {
  if (!value || typeof value !== "object" || visited.has(value)) return 0;
  visited.add(value);

  for (const key of keys) {
    const numberValue = Number(value?.[key]);
    if (Number.isFinite(numberValue)) return numberValue;
  }

  for (const nestedValue of Object.values(value)) {
    const result = findProfileNumber(nestedValue, keys, visited);
    if (result !== 0) return result;
  }

  return 0;
};

const CustomerProfileDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const returnState = (location.state ?? {}) as { selectedCustomer?: any; tab?: string };
  const selected = returnState.selectedCustomer;
  const tab = selected ? returnState.tab ?? "Profile" : "Profile";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const listPayload = useMemo(() => ({ ...getRequestPayload(), pageNumber: 1, pageSize: 1000 }), []);
  const { data, isLoading } = useGetCustomers(listPayload);
  const profilePayload = useMemo(() => ({ ...getRequestPayload(), nCustomerId: Number(selected?.id || 0), CustomerId: Number(selected?.id || 0) }), [selected]);
  const { data: profileResponse, isLoading: profileLoading } = useGetCustomerProfile(profilePayload, !!selected);

  const openCustomer = (customer: any) => {
    navigate(location.pathname, {
      state: { selectedCustomer: customer, tab: "Profile" },
    });
  };

  const changeTab = (nextTab: string) => {
    navigate(location.pathname, {
      replace: true,
      state: { selectedCustomer: selected, tab: nextTab },
    });
  };

  const backToCustomerList = () => {
    navigate(location.pathname, { replace: true, state: null });
  };

  const customers = useMemo(() => extractList(data).map((item: any, index: number) => ({
    id: item?.nCustomerId ?? item?.CustomerId ?? item?.customerId ?? index,
    name: show(item?.cCustomerName ?? item?.CustomerName),
    mobile: show(item?.cPhoneNo ?? item?.cMobile, "NIL"),
    email: show(item?.cEmail ?? item?.Email),
  })), [data]);
  const filtered = customers.filter((item) => !search.trim() || [item.name, item.mobile, item.email].some((value) => value.toLowerCase().includes(search.toLowerCase())));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (!selected) return <div className="flex h-full flex-col bg-white p-4 [&_*]:border-slate-200">
    <div className="mb-3 flex items-center justify-between"><h1 className="text-xl">Customer Details</h1><Input className="max-w-[300px]" prefix={<SearchOutlined />} placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
    <div className="flex-1 overflow-auto"><div className="grid grid-cols-[40px_1fr_150px_2fr] border-y px-2 py-3 text-sm font-medium"><span>Srl</span><span>Customer Name</span><span>Mobile No</span><span>Email</span></div>
      {isLoading ? <div className="flex h-52 items-center justify-center"><Spin /></div> : visible.map((item, index) => <button key={item.id} type="button" onClick={() => openCustomer(item)} className="grid w-full grid-cols-[40px_1fr_150px_2fr] border-b px-2 py-4 text-left text-sm hover:bg-slate-50"><span>{(page - 1) * pageSize + index + 1}</span><span>{item.name}</span><span>{item.mobile}</span><span>{item.email}</span></button>)}
    </div><CustomPagination current={page} pageSize={pageSize} total={filtered.length} onChange={setPage} onShowSizeChange={(_, size) => { setPageSize(size); setPage(1); }} />
  </div>;

  const response = profileResponse?.data?.data ?? profileResponse?.data ?? profileResponse ?? {};
  const profile = Array.isArray(response) ? response[0] ?? {} : response?.customerProfile?.[0] ?? response?.profile?.[0] ?? response;
  const name = show(profile?.cCustomerName ?? profile?.CustomerName ?? selected.name);
  const mobile = show(profile?.cPhoneNo ?? profile?.cMobile ?? selected.mobile, "NIL");
  const email = show(profile?.cEmail ?? selected.email);
  const initials = name.split(/\s+/).map((word: string) => word[0]).join("").slice(0, 2).toUpperCase();
  const reportedTotal = findProfileNumber(profileResponse, [
    "nTotalTicketCount",
    "nTotalAttendedTickets",
    "nTotalAttendedTicket",
    "nTotalAttendedCount",
    "TotalAttendedCount",
    "nAttendedTicketCount",
    "AttendedTicketCount",
    "nTotalAttendance",
    "nTotalTickets",
    "TotalTickets",
    "totalTickets",
  ]);
  const resolved = findProfileNumber(profileResponse, [
    "nResolvedTicketCount",
    "nResolvedCount",
    "nResolved",
    "ResolvedCount",
    "resolvedTickets",
    "nResolvedTickets",
    "ResolvedTickets",
    "resolvedCount",
  ]);
  const unresolved = findProfileNumber(profileResponse, [
    "nUnresolvedTicketCount",
    "nUnresolvedCount",
    "nUnResolvedCount",
    "nUnresolved",
    "UnresolvedCount",
    "unResolvedCount",
    "unresolvedTickets",
    "nUnresolvedTickets",
    "UnresolvedTickets",
    "unresolvedCount",
  ]);
  const total = reportedTotal || resolved + unresolved;
  const alternativeContacts = Array.isArray(profile?.alternativeContacts)
    ? profile.alternativeContacts
    : [];
  const rawModes = findCustomerModes(profileResponse);
  const getModeKey = (value: any) => {
    const key = String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return key === "email" || key === "mail" ? "mail" : key;
  };
  const modes = rawModes.reduce((result: any[], mode: any, index: number) => {
    const rawName = String(mode.cCallModeName ?? "").trim();
    const modeKey = getModeKey(rawName);
    const name = modeKey === "mail" ? "E-Mail" : rawName;
    const existingMode = result.find(
      (item) => getModeKey(item.name) === modeKey,
    );

    if (existingMode) {
      existingMode.count += Number(mode.nCallReportCount ?? 0);
    } else if (name) {
      result.push({
        key: mode.nCallModeId ?? index,
        name,
        count: Number(mode.nCallReportCount ?? 0),
      });
    }

    return result;
  }, []);

  const hasMode = (name: string) =>
    modes.some((mode: any) => getModeKey(mode.name) === getModeKey(name));

  if (!hasMode("Message")) {
    modes.push({ key: "message", name: "Message", count: 0 });
  }

  if (!hasMode("Mail") && !hasMode("Email")) {
    modes.push({ key: "mail", name: "E-Mail", count: 0 });
  }



  return <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white p-4 [&_*]:border-slate-200">
    <div className="flex flex-none border"><div className="flex">{["Profile", "Tickets", "Bills", "Asset"].map((name) => <button key={name} onClick={() => changeTab(name)} className={`px-4 py-2 ${tab === name ? "bg-sky-600 font-semibold text-white" : ""}`}>{name}</button>)}</div><button className="ml-auto px-4 text-xl" onClick={backToCustomerList}><CloseOutlined /></button></div>
    {profileLoading ? <div className="flex h-64 items-center justify-center"><Spin /></div> : tab === "Profile" ? <>
      <div className="min-h-0 flex-1 overflow-auto"><div className="flex items-center gap-7 p-6"><div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-300 text-3xl">{initials}</div><div className="flex-1"><div className="mb-3 text-lg">{name}</div><div className="grid grid-cols-4 rounded border text-sm"><span className="border-r p-2"><MailFilled className="mr-2" />{email}</span><span className="border-r p-2"><PhoneFilled className="mr-2" />{mobile}</span><span className="border-r p-2"><b>ID</b> {selected.id}</span><span className="p-2"><b>GST NO</b> {show(profile?.cGSTNo ?? profile?.cGstnNummber)}</span></div><div className="mt-3"><b>Address :</b> {show(profile?.cAddress)}</div></div></div>
      <div className="flex justify-between bg-sky-50 p-3 text-xs"><span>Customer from : {show(profile?.dCreatedDate)}</span><span>Last ticket created date : {show(profile?.dLastTicketCreatedDate)}</span></div>
      <div className="mt-3 grid min-h-[315px] gap-16 md:grid-cols-2"><CustomerTicketChart total={total} resolved={resolved} unresolved={unresolved} modes={modes} /><section className="rounded-2xl border p-5"><h2 className="text-lg">Contacts</h2><div className="flex rounded bg-sky-50 p-3"><div>{name}<div className="text-sm text-slate-500">{mobile}</div><div className="text-sm text-slate-500">{email}</div></div><span className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white"><PhoneFilled /></span></div><h3 className="mt-3 border-t pt-3">Alternative Contacts</h3>{alternativeContacts.length ? <div className="space-y-2 pt-2">{alternativeContacts.map((contact: any, index: number) => <div key={`${contact.contactNumber}-${index}`} className="flex rounded bg-sky-50 p-3"><div>{show(contact.contactPerson)}<div className="text-sm text-slate-500">{show(contact.contactNumber, "NIL")}</div><div className="text-sm text-slate-500">{show(contact.contactEmail)}</div></div><span className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white"><PhoneFilled /></span></div>)}</div> : <div className="text-center text-sm text-slate-500">No Alternative Contacts</div>}</section></div></div>
    </> : tab === "Tickets" ? (
      <CustomerProfileTickets customerId={selected.id} customerName={name} />
    ) : tab === "Bills" ? (
      <CustomerProfileBills customerId={selected.id} returnCustomer={selected} />
    ) : tab === "Asset" ? (
      <CustomerProfileAssets customerId={selected.id} />
    ) : <div className="flex h-72 items-center justify-center text-slate-500">No {tab.toLowerCase()} data available</div>}
  </div>;
};

export default CustomerProfileDetailsPage;
