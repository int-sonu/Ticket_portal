import { Button, Select } from "antd";
import type { PaginationProps } from "antd";

type TicketModulePaginationProps = PaginationProps & {
  className?: string;
  showSizeChanger?: boolean;
  elevated?: boolean;
};

const buildPageWindow = (current: number, maxPage: number) => {
  if (maxPage <= 7) {
    return Array.from({ length: maxPage }, (_, index) => index + 1);
  }

  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(maxPage - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < maxPage - 1) pages.push("...");
  pages.push(maxPage);

  return pages;
};

const TicketModulePagination = ({
  className = "",
  showSizeChanger = true,
  elevated = true,
  ...props
}: TicketModulePaginationProps) => {
  const total = props.total ?? 0;
  const current = props.current ?? 1;
  const pageSize = props.pageSize ?? 10;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const isFirstPage = current <= 1;
  const isLastPage = current >= maxPage;
  const pages = buildPageWindow(current, maxPage);

  const changePage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), maxPage);
    props.onChange?.(nextPage, pageSize);
  };

  const changePageSize = (size: number) => {
    if (props.onShowSizeChange) {
      props.onShowSizeChange(1, size);
      return;
    }

    props.onChange?.(1, size);
  };

  return (
    <div className={className || "w-full"}>
      <div className="overflow-x-auto">
        <div
          className={`flex w-full min-w-[820px] items-center justify-between gap-4 rounded-xl border border-slate-300 bg-white px-0 py-2 text-sm text-slate-700 ${
            elevated ? "shadow-[0_4px_20px_rgba(0,0,0,0.08)]" : "shadow-none"
          }`}
        >
          <div className="whitespace-nowrap px-2">
            Showing {start}-{end} of {total} entries
          </div>

          <div className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap">
            <Button disabled={isFirstPage} onClick={() => changePage(1)}>
              &lt;&lt; Prev
            </Button>
            <Button disabled={isFirstPage} onClick={() => changePage(current - 1)}>
              &lt; Prev
            </Button>

            {pages.map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="text-slate-400">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  type={page === current ? "primary" : "default"}
                  onClick={() => changePage(page)}
                  className="min-w-[32px] px-3"
                >
                  {page}
                </Button>
              )
            )}

            <Button disabled={isLastPage} onClick={() => changePage(current + 1)}>
              Next &gt;
            </Button>
            <Button disabled={isLastPage} onClick={() => changePage(maxPage)}>
              Next &gt;&gt;
            </Button>
          </div>

          {showSizeChanger ? (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Select
                value={pageSize}
                onChange={changePageSize}
                options={[10, 20, 50, 100].map((size) => ({
                  label: size,
                  value: size,
                }))}
                className="w-[68px]"
              />
              <span className="px-2">Items per page</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TicketModulePagination;
