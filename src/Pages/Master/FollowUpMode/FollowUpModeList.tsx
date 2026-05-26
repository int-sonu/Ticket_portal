import { useEffect, useMemo, useRef, useState } from "react";
import {
  AntTable,
  InputSearch,
  PrimaryButton,
  SliderMenu,
  TableButton,
  ToggleButton,
} from "../../../Components/ui/Index";
import { TripModeFields } from "../../../Components/Master/Index";
import {
  formType,
  getInvalidFields,
  initialFormValues,
  TripModeDataType,
  TripModeDataTypeWithkey,
  TripModeDeletePayload,
  TripModeEditPayload,
  TripModeSavePayload,
} from "./Utils";
import { SwalAlert } from "../../../Components/ui/swalAlert/SwalAlert";
import useSetUserCreds from "../../../Hooks/useSetUserCreds";
import useSuperUser from "../../../Hooks/useSuperUser";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store";
import { useFetchTripModeList, useFetchTripModeView } from "./Hooks";
import { toast } from "react-toastify";
import {
  clearTripModeSaveSlice,
  TripModeSave,
} from "../../../store/Master/TripMode/TripModeSaveSlice";
import { clearTripModeViewSlice } from "../../../store/Master/TripMode/TripModeViewSlice";
import {
  clearTripModeEditSlice,
  TripModeEdit,
} from "../../../store/Master/TripMode/TripModeEditSlice";
import {
  clearTripModeDeleteSlice,
  TripModeDelete,
} from "../../../store/Master/TripMode/TripModeDeleteSlice";
import { focusInputByName } from "../../../Components/utils/Utils";
import { usePermissions } from "../../../common/sidebar/usePermissions";

const TripMode = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<React.Key[]>([]);
  const [selectedRowItem, setSelectedRowItem] = useState<
    TripModeDataTypeWithkey[]
  >([]);
  const [sliderOpen, setSliderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchId, setFetchId] = useState(0);
  const userCreds = useSetUserCreds();
  const { canWrite: suCanWrite } = useSuperUser();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermissions();

  const [pendingAction, setPendingAction] = useState<
    "view" | "edit" | "toggle" | null
  >(null);

  const { TripModeSaveErrorMessage, TripModeSaveSuccess } = useAppSelector(
    (state: RootState) => state.TripModeSaveSlice,
  );

  const { TripModeEditSuccess, TripModeEditErrorMessage } = useAppSelector(
    (state: RootState) => state.TripModeEditSlice,
  );
  const { TripModeDeleteSuccess, TripModeDeleteErrorMessage } = useAppSelector(
    (state: RootState) => state.TripModeDeleteSlice,
  );

  useFetchTripModeList(
    userCreds,
    TripModeSaveSuccess,
    TripModeDeleteSuccess,
    TripModeEditSuccess,
  );

  const { TripModeListData, TripModeListFetching } = useAppSelector(
    (state: RootState) => state.TripModeListSlice,
  );

  useFetchTripModeView(userCreds, fetchId);

  const { TripModeViewData } = useAppSelector(
    (state: RootState) => state.TripModeViewSlice,
  );

  const data = useMemo(
    () =>
      TripModeListData?.filter(
        (item: TripModeDataType) =>
          item.cTripModeNmae
            ?.toLowerCase()
            ?.includes(searchTerm?.toLowerCase()) && item.bCancelled === false,
      )
        .sort((a: any, b: any) => b.nTripModeId - a.nTripModeId)
        .map((item: TripModeDataType, index: number) => ({
          ...item,
          key: item.nTripModeId.toString(),
          srl: (index + 1).toString(),
        })),
    [TripModeListData, searchTerm],
  );

  const [tableData, setTableData] = useState<TripModeDataTypeWithkey[]>(data);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    if (
      TripModeViewData &&
      TripModeViewData.message === "Data Loaded Successfully"
    ) {
      const item = TripModeViewData.data;
      if (!item || item.nTripModeId !== fetchId) return;

      const newValues = {
        ...formValues,
        name: item.cTripModeNmae,
        shortName: item.cModeShName,
        bActive: item.bActive,
        nTripModeId: item.nTripModeId,
      };
      setFormValues(newValues);

      if (pendingAction === "edit") {
        setEditMode(true);
        setSliderOpen(true);
        setViewMode(false);
      } else if (pendingAction === "view") {
        setSliderOpen(true);
        setViewMode(true);
        setEditMode(false);
      } else if (pendingAction === "toggle") {
        setFormValues({ ...newValues, bActive: !item.bActive });
        setTimeout(() => handleEditSave(), 100);
      }

      dispatch(clearTripModeViewSlice());
      setPendingAction(null);
    }
  }, [TripModeViewData]);

  const [formValues, setFormValues] = useState<formType>(initialFormValues);
  const inputRefs = {
    name: useRef<HTMLInputElement>(null),
    shortName: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (sliderOpen) {
      setTimeout(() => {
        focusInputByName("name", inputRefs);
      }, 600);
    }
  }, [sliderOpen]);

  const handleFormChange = (key: string, value: string | boolean) => {
    setFormValues({ ...formValues, [key]: value });
  };

  const ToggleEdit = () => {
    if (!hasPermission("master-tripmode-edit")) {
      toast.error("You don't have permission to edit Trip Mode");
      return;
    }
    setViewMode(false);
    setEditMode(true);
  };

  const handleSliderOpen = () => {
    if (!suCanWrite()) return;
    if (!hasPermission("master-tripmode-add")) {
      toast.error("You don't have permission to add Trip Mode");
      return;
    }
    setFormValues(initialFormValues);
    setSliderOpen(true);
  };

  const handleSliderClose = () => {
    setFormValues(initialFormValues);
    setSliderOpen(false);
    setViewMode(false);
    setEditMode(false);
    setFetchId(0);
  };

  const handleSave = () => {
    if (!suCanWrite()) return;
    formValues.name = formValues.name.trim();
    formValues.shortName = formValues.shortName.trim();
    if (!formValues.name) {
      toast.error("Name is required");
      focusInputByName("name", inputRefs);
      return;
    }

    if (formValues.name.length < 3) {
      toast.error("Name should be at least 3 characters");
      focusInputByName("name", inputRefs);
      return;
    }

    if (!formValues.shortName) {
      toast.error("Short Name is required");
      focusInputByName("shortName", inputRefs);
      return;
    }

    if (formValues.shortName.length > 5) {
      toast.error("Short Name should be at most 5 characters");
      focusInputByName("shortName", inputRefs);
      return;
    }

    let error: string = "";

    const invalidField = getInvalidFields(formValues);
    if (invalidField.length > 0) {
      error = `Invalid fields: ${invalidField.join(" , ")}`;
    }

    if (error) {
      toast.error(error);
      return;
    }

    if (!userCreds) return;

    if (isSaving) return;
    setIsSaving(true);

    const savePayload: TripModeSavePayload = {
      cDbName: userCreds.dbName,
      cSchemaName: userCreds.cSchemaName,
      nCompanyId: userCreds.nCompanyId,
      cModeName: formValues.name,
      cShName: formValues.shortName,
      bActive: formValues.bActive,
    };

    dispatch(TripModeSave(savePayload))
      .unwrap()
      .then(() => {
        toast.success("Trip Mode saved successfully");
        setSliderOpen(false);
        setViewMode(false);
      })
      .catch((res) => {
        toast.error(
          res.message || TripModeSaveErrorMessage || "Failed to save Trip Mode",
        );
      })
      .finally(() => {
        dispatch(clearTripModeSaveSlice());
        setIsSaving(false);
      });
  };

  const handleEdit = (data: TripModeDataTypeWithkey) => {
    if (!suCanWrite()) return;
    if (!hasPermission("master-tripmode-edit")) {
      toast.error("You don't have permission to edit Trip Mode");
      return;
    }
    setFetchId(0);
    setTimeout(() => {
      setFetchId(data.nTripModeId);
      setPendingAction("edit");
      setEditMode(false);
      setViewMode(false);
    }, 0);
  };

  const handleEditSave = () => {
    if (!suCanWrite()) return;
    let error: string = "";
    if (!formValues.name) {
      toast.error("Name is required");
      focusInputByName("name", inputRefs);
      return;
    }

    if (formValues.name.length < 3) {
      toast.error("Name should be at least 3 characters");
      focusInputByName("name", inputRefs);
      return;
    }

    if (!formValues.shortName) {
      toast.error("Short Name is required");
      focusInputByName("shortName", inputRefs);
      return;
    }

    if (formValues.shortName.length > 5) {
      toast.error("Short Name should be at most 5 characters");
      focusInputByName("shortName", inputRefs);
      return;
    }

    const invalidField = getInvalidFields(formValues);
    if (invalidField.length > 0) {
      error = `Invalid fields: ${invalidField.join(" , ")}`;
    }

    if (error) {
      toast.error(error);
      return;
    }

    if (!userCreds) return;

    if (isSaving) return;
    setIsSaving(true);

    const editPayload: TripModeEditPayload = {
      cSchemaName: userCreds?.cSchemaName,
      cDbName: userCreds?.dbName,
      nCompanyId: userCreds?.nCompanyId,
      cModeName: formValues.name,
      cShName: formValues.shortName,
      nTripmodeId: fetchId,
      bActive: formValues.bActive,
    };

    dispatch(TripModeEdit(editPayload))
      .unwrap()
      .then(() => {
        toast.success("Trip Mode edited successfully");
        setSliderOpen(false);
        setViewMode(false);
        setEditMode(false);
      })
      .catch(() => {
        toast.error(TripModeEditErrorMessage || "Failed to Edit Trip Mode");
      })
      .finally(() => {
        dispatch(clearTripModeEditSlice());
        setIsSaving(false);
      });
  };

  const handleDelete = (nTripModeId: number) => {
    if (!suCanWrite()) return;
    if (!hasPermission("master-tripmode-delete")) {
      toast.error("You don't have permission to delete Trip Mode");
      return;
    }
    SwalAlert({
      title: "Are you sure?",
      text: "Do you really want to delete this record? This process cannot be undone.",
      showCancelButton: false,
      onConfirm: () => {
        if (!userCreds) return;

        const deletePayload: any = {
          cSchemaName: userCreds.cSchemaName,
          cDbName: userCreds.dbName,
          nCompanyId: userCreds.nCompanyId,
          nTripModeId: nTripModeId,
        };

        dispatch(TripModeDelete(deletePayload))
          .unwrap()
          .then(() => {
            toast.success("Trip Mode deleted successfully");
            setSliderOpen(false);
            setViewMode(false);
            setEditMode(false);
          })
          .catch(() => {
            toast.error(
              TripModeDeleteErrorMessage || "Failed to Delete Trip Mode",
            );
          })
          .finally(() => {
            dispatch(clearTripModeDeleteSlice());
          });
      },
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      row: nTripModeId.toString(),
    });
  };

  const handleToggle = (data: TripModeDataTypeWithkey) => {
    if (!suCanWrite()) return;
    if (!hasPermission("master-tripmode-edit")) {
      toast.error("You don't have permission to edit Trip Mode");
      return;
    }
    if (!userCreds) return;
    const editPayload: any = {
      cSchemaName: userCreds.cSchemaName,
      cDbName: userCreds.dbName,
      nCompanyId: userCreds.nCompanyId,
      nTripmodeId: data.nTripModeId,
      cModeName: data.cTripModeNmae,
      cShName: data.cModeShName,
      bActive: !data.bActive,
    };

    dispatch(TripModeEdit(editPayload))
      .unwrap()
      .then(() => {
        toast.success("Status updated successfully");
      })
      .catch((res) => {
        toast.error(
          res.message || TripModeEditErrorMessage || "Failed to update status",
        );
      })
      .finally(() => {
        dispatch(clearTripModeEditSlice());
      });
  };

  const handleTableView = (data: TripModeDataTypeWithkey) => {
    if (!hasPermission("master-tripmode-view")) {
      toast.error("You don't have permission to view Trip Mode");
      return;
    }
    setFetchId(0);
    setTimeout(() => {
      setFetchId(data.nTripModeId);
      setPendingAction("view");
    }, 0);
  };

  const columns = [
    {
      title: "Srl",
      dataIndex: "srl",
      key: "srl",
      width: 50,
      render: (index: number, record: TripModeDataTypeWithkey) => (
        <p
          onClick={() => handleTableView(record)}
          className="w-full cursor-pointer"
          key={index}
        >
          {record.srl}
        </p>
      ),
    },
    {
      title: "Trip Mode Name",
      dataIndex: "tripModeName",
      key: "tripName",
      width: 300,
      render: (index: number, record: TripModeDataTypeWithkey) => (
        <p
          onClick={() => handleTableView(record)}
          className="w-full cursor-pointer"
          key={index}
        >
          {record.cTripModeNmae}
        </p>
      ),
    },
    {
      title: "Short Name",
      dataIndex: "shortName",
      key: "shortName",
      render: (index: number, record: TripModeDataTypeWithkey) => (
        <p
          onClick={() => handleTableView(record)}
          className="w-full cursor-pointer"
          key={index}
        >
          {record.cModeShName}
        </p>
      ),
    },
    {
      title: "Active",
      dataIndex: "active",
      key: "active",
      render: (index: number, record: TripModeDataTypeWithkey) => (
        <ToggleButton
          key={index}
          onChange={() => {
            handleToggle(record);
          }}
          checked={record.bActive}
        />
      ),
      width: 60,
    },
    {
      title: "Edit",
      width: 60,

      dataIndex: "edit",
      render: (index: number, record: TripModeDataTypeWithkey) => (
        <TableButton
          key={index}
          editButton
          onClick={() => handleEdit(record)}
        />
      ),
    },
    {
      title: "Delete",
      dataIndex: "delete",
      render: (index: number, record: TripModeDataTypeWithkey) => (
        <TableButton
          key={index}
          deleteButton
          onClick={() => handleDelete(record.nTripModeId)}
        />
      ),
      width: 60,
    },
  ];

  return (
    <div className="bg-[#FBFBFB] main-padding">
      <div className="flex">
        <div className="w-3/5">
          <h2 className="text-lg font-medium">Trip Mode Master</h2>
        </div>
        <div className="w-full flex gap-2 items-center justify-end">
          <InputSearch
            value={searchTerm}
            onChange={setSearchTerm}
            width="300px"
          />
          {/* <PrimaryButton text="" deleteButton /> */}
          <PrimaryButton
            text="Add New"
            onClick={handleSliderOpen}
            // className="h-8"
          />
        </div>
      </div>
      <div>
        <AntTable
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          keyId="nTripModeId"
          setSelectedRowItem={setSelectedRowItem}
          scrollX="max-content"
          scrollY={400}
          additionalHeight={190}
          isCheckBox={false}
          pagination={true}
          loading={TripModeListFetching}
          setSelectedRows={setSelectedRows}
        />
      </div>
      {sliderOpen && (
        <SliderMenu
          Title="Trip Mode Master"
          description={
            fetchId
              ? ""
              : "This section allows you to manage Trip Mode, which includes adding, editing, and viewing."
          }
          isSaving={isSaving}
          viewOnly={viewMode}
          onSave={editMode ? handleEditSave : handleSave}
          sliderOpen={sliderOpen}
          onClose={handleSliderClose}
          onEdit={ToggleEdit}
          onDelete={() => {
            handleDelete(formValues.nTripModeId);
          }}
          isActive={formValues.bActive}
          toggleActive={(value) => {
            handleFormChange("bActive", value);
          }}
          innerComponents={
            <TripModeFields
              formValues={formValues}
              handleFormChange={handleFormChange}
              viewOnly={viewMode}
              inputRefs={inputRefs}
            />
          }
        />
      )}
    </div>
  );
};

export default TripMode;
