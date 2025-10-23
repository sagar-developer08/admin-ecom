/**
 * Advanced Filter Component
 */

import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';

const AdvancedFilter = ({ filters = [], onApply, onClear }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filterValues, setFilterValues] = useState({});

  const handleChange = (name, value) => {
    setFilterValues(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply(filterValues);
    setShowFilters(false);
  };

  const handleClear = () => {
    setFilterValues({});
    onClear();
    setShowFilters(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
      </button>

      {showFilters && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      value={filterValues[filter.name] || ''}
                      onChange={(e) => handleChange(filter.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All</option>
                      {filter.options.map((opt, i) => (
                        <option key={i} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : filter.type === 'date' ? (
                    <input
                      type="date"
                      value={filterValues[filter.name] || ''}
                      onChange={(e) => handleChange(filter.name, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type={filter.type || 'text'}
                      value={filterValues[filter.name] || ''}
                      onChange={(e) => handleChange(filter.name, e.target.value)}
                      placeholder={filter.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;

