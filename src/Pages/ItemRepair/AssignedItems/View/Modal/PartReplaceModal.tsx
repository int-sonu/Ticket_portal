import { useEffect, useRef, useState } from "react";

import { DatePicker, Empty, Spin } from "antd";
import { CustomModal, InputSearch } from "../../../../../Components/ui/Index";
import useFetchPartList from "../../../../Master/Parts/Hooks";
import useSetUserCreds from "../../../../../Hooks/useSetUserCreds";
import { RootState } from "../../../../../store";
import { useAppSelector } from "../../../../../store/hooks";

interface Options {
  value: number | string;
  item: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  size: number;
  options?: Options[];
  handlePartClick: (item: any) => void;
}

const PartReplaceItemListModal = ({
  open,
  onClose,
  title,
  size,
  handlePartClick,
}: Props) => {
  const userCreds = useSetUserCreds();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parts, setParts] = useState<any>([]);
  const [searchText, setSearchText] = useState<string>("");

  useFetchPartList(false, false, false, userCreds);

  const { PartListData, PartListFetching } = useAppSelector(
    (state: RootState) => state.PartListSlice,
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (PartListData.length > 0) {
      setParts(
        PartListData?.filter((item: any) => item?.bServiceCharge === false),
      );
    }
  }, [PartListData, searchText]);

  const filteredParts = parts?.filter((item: any) => {
    return item?.cPartName?.toLowerCase().includes(searchText.toLowerCase());
  });

  if (PartListFetching) {
    return <Spin />;
  }

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      Closable
      title={title}
      children={
        <div className="w-full mt-2">
          <div className="px-4">
            <InputSearch
              value={searchText}
              onChange={setSearchText}
              className="w-60"
              inputRef={inputRef}
            />
          </div>
          <div className="h-60 overflow-y-scroll">
            {filteredParts?.length === 0 && (
              <p className="font-[500] text-[14px] text-[#4D3B3B] my-2 p-4">
                <Empty description="No parts found" />
              </p>
            )}
            {filteredParts?.length > 0 &&
              filteredParts?.map((item: any, index: number) => {
                return (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={handlePartClick.bind(null, item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePartClick(item);
                      }
                    }}
                    className="flex focus:outline-[#D1E8F7] cursor-pointer justify-between my-2 mx-4 rounded-md  items-center p-2 border border-[#D1E8F7] bg-[#E7F4FD]"
                  >
                    <div>
                      <p className="font-[500] text-[14px] text-[#494949]">
                        {item?.cPartName}
                      </p>
                      <p className="font-light text-[13px]  text-[#878181]">
                        {item?.cPartDescription}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-[13px] text-[#098CEB]">
                        {item?.nPartRate
                          ? `₹${item?.nPartRate?.toFixed(2)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      }
      size={size}
    />
  );
};

export default PartReplaceItemListModal;
