import { Table } from 'antd';
import type { TableProps } from 'antd';
import CustomPagination from './CustomPagination';
import type { CustomPaginationProps } from './CustomPagination';
import './table.css';

export interface AntTableProps<T> extends Omit<TableProps<T>, 'pagination'> {
  paginationProps?: CustomPaginationProps;
  showPagination?: boolean;
  disableHorizontalScroll?: boolean;
}

function AntTable<T extends object>({ 
  showPagination = true, 
  disableHorizontalScroll = false,
  paginationProps,
  className = '',
  scroll,
  ...props 
}: AntTableProps<T>) {
  const tableScroll = disableHorizontalScroll
    ? { y: '100%', ...scroll }
    : { y: '100%', x: 'max-content', ...scroll };

  return (
    <div className={`w-full flex flex-col h-full min-h-0 bg-white rounded-lg shadow-sm ${className}`}>
      <div className="flex-1 min-h-0 overflow-hidden">
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
