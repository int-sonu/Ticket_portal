import { Button, Select } from 'antd';
import type { PaginationProps } from 'antd';
import './pagination.css';

export interface CustomPaginationProps extends PaginationProps {
  className?: string;
}

const CustomPagination = ({ className = '', ...props }: CustomPaginationProps) => {
  const total = props.total ?? 0;
  const current = props.current ?? 1;
  const pageSize = props.pageSize ?? 10;
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const isFirstPage = current <= 1;
  const isLastPage = current >= maxPage;

  const changePage = (page: number) => {
    props.onChange?.(page, pageSize);
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
          ‹ ‹ Prev
        </Button>
        <Button disabled={isFirstPage} onClick={() => changePage(current - 1)}>
          ‹ Prev
        </Button>
        <Button disabled={isLastPage} onClick={() => changePage(current + 1)}>
          Next ›
        </Button>
        <Button disabled={isLastPage} onClick={() => changePage(maxPage)}>
          Next › ›
        </Button>
      </div>

      <div className="custom-pagination__size">
        <Select
          value={pageSize}
          onChange={changePageSize}
          options={[10, 20, 50, 100].map((size) => ({ label: size, value: size }))}
          className="custom-pagination__select"
        />
        <span>Items per page</span>
      </div>
    </div>
  );
};

export default CustomPagination;
