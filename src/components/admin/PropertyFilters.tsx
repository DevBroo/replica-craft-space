import React from 'react';
import { Search, Calendar, ChevronDown, Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';

interface PropertyFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  ownerFilter: string;
  onOwnerChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  ownerFilter,
  onOwnerChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters
}) => {
  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all',
    ownerFilter !== '',
    startDate !== '',
    endDate !== ''
  ].filter(Boolean).length;

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, owner, type, or ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => onTypeChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Day Picnic">Day Picnic</option>
              <option value="Villa">Villa</option>
              <option value="Resort">Resort</option>
              <option value="Farmhouse">Farmhouse</option>
              <option value="Hotel">Hotel</option>
              <option value="Cottage">Cottage</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Advanced Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
                {activeFiltersCount > 0 && (
                  <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Advanced Filters</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Owner Filter */}
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner Name/Email</Label>
                  <Input
                    id="owner"
                    type="text"
                    placeholder="Filter by owner..."
                    value={ownerFilter}
                    onChange={(e) => onOwnerChange(e.target.value)}
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => onSortChange(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="created_at">Date Created</option>
                      <option value="title">Name</option>
                      <option value="status">Status</option>
                      <option value="property_type">Type</option>
                      <option value="pricing">Price</option>
                    </select>
                    <select
                      value={sortOrder}
                      onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => onStatusChange('all')}
              />
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {typeFilter}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => onTypeChange('all')}
              />
            </Badge>
          )}
          {ownerFilter && (
            <Badge variant="secondary" className="gap-1">
              Owner: {ownerFilter}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => onOwnerChange('')}
              />
            </Badge>
          )}
          {(startDate || endDate) && (
            <Badge variant="secondary" className="gap-1">
              Date: {startDate || '...'} to {endDate || '...'}
              <X 
                className="w-3 h-3 cursor-pointer hover:text-red-600" 
                onClick={() => {
                  onStartDateChange('');
                  onEndDateChange('');
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyFilters;