/**
 * Export Button Component
 */

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

const ExportButton = ({ data, filename = 'export', onExport }) => {
  const [showMenu, setShowMenu] = useState(false);

  const exportToCSV = () => {
    if (onExport) {
      onExport('csv');
    } else {
      const csv = convertToCSV(data);
      downloadFile(csv, `${filename}.csv`, 'text/csv');
    }
    setShowMenu(false);
  };

  const exportToJSON = () => {
    if (onExport) {
      onExport('json');
    } else {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, `${filename}.json`, 'application/json');
    }
    setShowMenu(false);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <button
            onClick={exportToCSV}
            className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-left"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export as CSV</span>
          </button>
          <button
            onClick={exportToJSON}
            className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 text-left"
          >
            <FileText className="w-4 h-4" />
            <span>Export as JSON</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;

