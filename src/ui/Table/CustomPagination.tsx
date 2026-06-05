import { Button, Select } from "antd";
import type { PaginationProps } from "antd";
import "./pagination.css";

export interface CustomPaginationProps extends PaginationProps {
  className?: string;
}

const buildPageWindow = (current: number, maxPage: number) => {
  if (maxPage <= 7) {
    return Array.from({ length: maxPage }, (_, index) => index + 1);
  }

  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(maxPage - 1, current + 1);

  if (start > 2) {
    pages.push("...");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < maxPage - 1) {
    pages.push("...");
  }

  pages.push(maxPage);

  return pages;
};

const CustomPagination = ({
  className = "",
  ...props
}: CustomPaginationProps) => {
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
    <div className={`custom-pagination ${className}`}>
      <div className="custom-pagination__summary">
        Showing {start}-{end} of {total} entries
      </div>

      <div className="custom-pagination__controls">
        <Button disabled={isFirstPage} onClick={() => changePage(1)}>
          Prev
        </Button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="custom-pagination__ellipsis">
              ...
            </span>
          ) : (
            <Button
              key={page}
              type={page === current ? "primary" : "default"}
              onClick={() => changePage(page)}
              className="custom-pagination__page"
            >
              {page}
            </Button>
          )
        )}

        <Button disabled={isLastPage} onClick={() => changePage(current + 1)}>
          Next
        </Button>
      </div>

      <div className="custom-pagination__size">
        <Select
          value={pageSize}
          onChange={changePageSize}
          options={[10, 20, 50, 100].map((size) => ({
            label: size,
            value: size,
          }))}
          className="custom-pagination__select"
        />
        <span>Items per page</span>
      </div>
    </div>
  );
};

export default CustomPagination;
