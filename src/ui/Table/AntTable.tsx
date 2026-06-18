import { Table } from 'antd';
import type { TableProps } from 'antd';
import CustomPagination from './CustomPagination';
import type { CustomPaginationProps } from './CustomPagination';
import './table.css';

export interface AntTableProps<T> extends Omit<TableProps<T>, 'pagination'> {
  paginationProps?: CustomPaginationProps;
  showPagination?: boolean;
  disableHorizontalScroll?: boolean;
  elevated?: boolean;
}

function AntTable<T extends object>({ 
  showPagination = true, 
  disableHorizontalScroll = false,
  elevated = true,
  paginationProps,
  className = '',
  scroll,
  ...props 
}: AntTableProps<T>) {
  const tableScroll = disableHorizontalScroll
    ? scroll
    : { x: 'max-content', ...scroll };

  return (
    <div
      className={`w-full flex flex-col h-full min-h-0 ${
        elevated ? "bg-white rounded-lg shadow-sm" : "bg-transparent rounded-none shadow-none"
      } ${className}`.trim()}
    >
      <div className="flex-1 min-h-0 overflow-visible">
        <Table<T>
          pagination={false}
          size="middle"
          scroll={tableScroll}
          className="custom-ant-table"
          rowKey={(record: any) => record.id || record.key || Math.random().toString()}
          {...props}
        />
      </div>
      {showPagination && paginationProps && (
        <div className="mt-auto shrink-0 overflow-x-auto border-t border-gray-100 bg-white rounded-b-lg">
          <CustomPagination {...paginationProps} />
        </div>
      )}
    </div>
  );
}

export default AntTable;
