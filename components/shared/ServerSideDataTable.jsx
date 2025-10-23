/**
 * Server-Side DataTable Component
 * Features: Server-side Pagination, Search, Actions
 */

import React from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

const ServerSideDataTable = ({ 
  data = [], 
  columns = [], 
  pagination = {},
  searchable = true,
  onPageChange,
  onItemsPerPageChange,
  onSearch,
  onRowClick,
  actions,
  emptyMessage = "No data available",
  itemsPerPageOptions = [5, 10, 25, 50, 100],
  loading = false
}) => {
  const { page = 1, limit = 10, total = 0, pages = 0 } = pagination;

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (pages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= pages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show pages around current page
      const startPage = Math.max(1, page - 2);
      const endPage = Math.min(pages, page + 2);
      
      if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) pageNumbers.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      if (endPage < pages) {
        if (endPage < pages - 1) pageNumbers.push('...');
        pageNumbers.push(pages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search brands by name, description, or category..."
              onChange={(e) => onSearch && onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                >
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="px-6 py-4 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            {/* Items per page selector and results info */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {itemsPerPageOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange && onPageChange(1)}
                disabled={page === 1 || loading}
                className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="First page"
              >
                First
              </button>
              <button
                onClick={() => onPageChange && onPageChange(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Page numbers */}
              <div className="flex space-x-1">
                {generatePageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange && onPageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1 border rounded-md text-sm ${
                        page === pageNum 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}
              </div>
              
              <button
                onClick={() => onPageChange && onPageChange(page + 1)}
                disabled={page === pages || loading}
                className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onPageChange && onPageChange(pages)}
                disabled={page === pages || loading}
                className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Last page"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerSideDataTable;
