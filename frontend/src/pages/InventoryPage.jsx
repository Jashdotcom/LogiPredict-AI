import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Filter,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Calendar,
  Clock,
  Layers,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardHeader } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { DataTable } from '../components/tables/DataTable';
import { FilterBar } from '../components/filters/FilterBar';
import { KPICard } from '../components/dashboard/KpiCard';
import { INVENTORY_ITEMS } from '../data/dashboard/inventoryData';
import { calculateInventoryMetrics } from '../utils/dashboardCalculations';
import { formatNumber, formatDate } from '../utils/formatters';

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Parameters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialDepot = searchParams.get('depot') || 'all';
  const initialStatus = searchParams.get('filter') || searchParams.get('status') || 'all';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDepot, setSelectedDepot] = useState(initialDepot);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected item for Detail Drawer / Modal
  const [selectedItem, setSelectedItem] = useState(null);

  // Synchronize state changes to URL query parameters
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedDepot !== 'all') params.depot = selectedDepot;
    if (selectedStatus !== 'all') params.filter = selectedStatus;
    setSearchParams(params, { replace: true });
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [searchTerm, selectedCategory, selectedDepot, selectedStatus]);

  // Calculate metrics
  const invMetrics = calculateInventoryMetrics(INVENTORY_ITEMS);

  // Derive unique categories and depots from dataset
  const categories = ['all', ...new Set(INVENTORY_ITEMS.map((item) => item.category))];
  const depots = ['all', ...new Set(INVENTORY_ITEMS.map((item) => item.storage_location))];

  // Filtered inventory records
  const filteredItems = INVENTORY_ITEMS.filter((item) => {
    const itemName = item.item_name || '';
    const itemId = item.item_id || '';
    const cat = item.category || '';
    const depot = item.storage_location || '';

    const matchesSearch =
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      depot.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
    const matchesDepot = selectedDepot === 'all' || depot === selectedDepot;

    // Calculated status
    const current = item.current_stock;
    const min = item.minimum_stock;
    const reorder = item.reorder_level;

    let calcStatus = 'Healthy';
    if (current === 0) calcStatus = 'Out of Stock';
    else if (current < min) calcStatus = 'Critical';
    else if (current < reorder) calcStatus = 'Low Stock';

    let matchesStatus = true;
    if (selectedStatus === 'critical') {
      matchesStatus = calcStatus === 'Critical' || calcStatus === 'Out of Stock';
    } else if (selectedStatus === 'replenishment' || selectedStatus === 'low') {
      matchesStatus = calcStatus === 'Low Stock' || calcStatus === 'Critical';
    } else if (selectedStatus !== 'all') {
      matchesStatus = calcStatus.toLowerCase() === selectedStatus.toLowerCase();
    }

    return matchesSearch && matchesCategory && matchesDepot && matchesStatus;
  });

  // Pagination slicing
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Table columns definition
  const columns = [
    {
      key: 'item_id',
      title: 'SKU / Item ID',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {row.item_id}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1 hover:text-indigo-600 transition-colors">
            {row.item_name}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      render: (row) => (
        <span className="text-slate-600 font-medium text-xs bg-slate-100/70 px-2 py-0.5 rounded border border-slate-200">
          {row.category}
        </span>
      ),
    },
    {
      key: 'storage_location',
      title: 'Depot / Location',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{row.storage_location}</span>
        </div>
      ),
    },
    {
      key: 'current_stock',
      title: 'Current Stock',
      sortable: true,
      render: (row) => {
        const pct = Math.round((row.current_stock / row.maximum_capacity) * 100);
        return (
          <div>
            <span className="font-bold text-slate-900 text-xs font-numeric">
              {formatNumber(row.current_stock)} {row.unit}
            </span>
            <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct < 35 ? 'bg-rose-500' : pct < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'minimum_stock',
      title: 'Min Safety',
      sortable: true,
      render: (row) => (
        <span className="text-slate-500 font-mono text-xs">
          {formatNumber(row.minimum_stock)} {row.unit}
        </span>
      ),
    },
    {
      key: 'maximum_capacity',
      title: 'Max Capacity',
      sortable: true,
      render: (row) => (
        <span className="text-slate-500 font-mono text-xs">
          {formatNumber(row.maximum_capacity)} {row.unit}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Health Status',
      sortable: true,
      render: (row) => {
        let st = 'Healthy';
        if (row.current_stock === 0) st = 'Out of Stock';
        else if (row.current_stock < row.minimum_stock) st = 'Critical';
        else if (row.current_stock < row.reorder_level) st = 'Low Stock';
        return <StatusBadge status={st} size="xs" />;
      },
    },
    {
      key: 'last_updated',
      title: 'Last Updated',
      sortable: true,
      render: (row) => (
        <span className="text-slate-400 text-[11px]">
          {formatDate(row.last_updated, true)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Inventory Management"
        subtitle="Multi-echelon stock levels, dynamic safety stock calculations, and automated replenishment triggers across forward logistics nodes."
        breadcrumbs={[{ label: 'Inventory Management' }]}
        badge={
          <Badge variant="brand" size="sm">
            {INVENTORY_ITEMS.length} Active SKUs Monitored
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={() => alert('Exporting full inventory manifest (SIH 2026 defense format)...')}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => alert('Opening SKU batch requisition wizard...')}
            >
              Add SKU / Batch
            </Button>
          </>
        }
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Monitored SKUs"
          value={invMetrics.totalItems.toLocaleString()}
          change="+340 active catalog"
          isPositive={true}
          timeframe="across 6 regional hubs"
          iconName="Boxes"
          colorScheme="indigo"
        />
        <KPICard
          title="Safety Buffer Deficits"
          value={`${invMetrics.criticalStockCount} SKUs`}
          change="Requires inter-depot transfer"
          isPositive={false}
          timeframe="urgent replenishment"
          iconName="AlertOctagon"
          colorScheme="rose"
          status={invMetrics.criticalStockCount > 0 ? 'Attention' : 'Secure'}
          statusVariant={invMetrics.criticalStockCount > 0 ? 'danger' : 'success'}
        />
        <KPICard
          title="Overall Inventory Health"
          value={`${invMetrics.inventoryHealthPercentage}%`}
          change="+2.4% vs last cycle"
          isPositive={true}
          timeframe="weighted multi-echelon score"
          iconName="TrendingUp"
          colorScheme="emerald"
          status="Optimal"
          statusVariant="success"
        />
        <KPICard
          title="Pending Replenishments"
          value={`${invMetrics.replenishmentNeededCount} POs`}
          change="Queued for dispatch"
          isPositive={true}
          timeframe="auto-reorder engine"
          iconName="FileSpreadsheet"
          colorScheme="blue"
        />
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">Status Filter:</span>
        {[
          { id: 'all', label: `All Statuses (${INVENTORY_ITEMS.length})` },
          { id: 'critical', label: `Critical / Stockout (${invMetrics.criticalStockCount})` },
          { id: 'replenishment', label: `Replenishment Due (${invMetrics.replenishmentNeededCount})` },
          { id: 'low', label: `Low Stock (${invMetrics.lowStockCount})` },
          { id: 'healthy', label: `Healthy (${invMetrics.healthyCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedStatus === tab.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar (Search, Category, Depot) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU, item name, category, or storage location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Depot Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 shrink-0">Depot:</span>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Storage Depots</option>
              {depots.filter(d => d !== 'all').map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {(searchTerm || selectedCategory !== 'all' || selectedDepot !== 'all' || selectedStatus !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <strong>{filteredItems.length}</strong> matching inventory records (out of {INVENTORY_ITEMS.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDepot('all');
                setSelectedStatus('all');
                setSearchParams({});
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              Clear All Filters &times;
            </button>
          </div>
        )}
      </div>

      {/* Inventory Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedItems}
          onRowClick={(row) => setSelectedItem(row)}
          emptyTitle="No inventory records found"
          emptyDescription="Try adjusting your search criteria or resetting active filters."
        />

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredItems.length} total records)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* 9. Item Detail Modal / Drawer */}
      {selectedItem && (
        <Dialog
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`SKU Details: ${selectedItem.item_name}`}
          subtitle={`Unique Identifier: ${selectedItem.item_id} • Category: ${selectedItem.category}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 py-2 text-xs">
            {/* Status Badge & Location Header */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">{selectedItem.storage_location}</span>
              </div>
              <div>
                {(() => {
                  let st = 'Healthy';
                  if (selectedItem.current_stock === 0) st = 'Out of Stock';
                  else if (selectedItem.current_stock < selectedItem.minimum_stock) st = 'Critical';
                  else if (selectedItem.current_stock < selectedItem.reorder_level) st = 'Low Stock';
                  return <StatusBadge status={st} size="sm" />;
                })()}
              </div>
            </div>

            {/* Stock Levels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">Current Stock</span>
                <strong className="text-slate-900 text-base font-extrabold mt-0.5 block">
                  {formatNumber(selectedItem.current_stock)} <span className="text-xs font-normal">{selectedItem.unit}</span>
                </strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">Minimum Safety</span>
                <strong className="text-amber-700 text-base font-extrabold mt-0.5 block">
                  {formatNumber(selectedItem.minimum_stock)} <span className="text-xs font-normal">{selectedItem.unit}</span>
                </strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">Reorder Point</span>
                <strong className="text-indigo-700 text-base font-extrabold mt-0.5 block">
                  {formatNumber(selectedItem.reorder_level)} <span className="text-xs font-normal">{selectedItem.unit}</span>
                </strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 block text-[11px]">Max Capacity</span>
                <strong className="text-slate-900 text-base font-extrabold mt-0.5 block">
                  {formatNumber(selectedItem.maximum_capacity)} <span className="text-xs font-normal">{selectedItem.unit}</span>
                </strong>
              </div>
            </div>

            {/* Consumption & Replenishment Analytics */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-2.5">
              <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wide">
                Consumption & Replenishment Telemetry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block text-[10px]">Daily Consumption Rate</span>
                  <strong className="text-slate-900 text-sm font-bold">{selectedItem.daily_consumption} {selectedItem.unit}/day</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block text-[10px]">Estimated Stock Runway</span>
                  <strong className="text-emerald-700 text-sm font-bold">
                    {(selectedItem.current_stock / selectedItem.daily_consumption).toFixed(1)} Days Remaining
                  </strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block text-[10px]">Transit Lead Time</span>
                  <strong className="text-slate-900 text-sm font-bold">{selectedItem.lead_time_days} Days</strong>
                </div>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Last Telemetry Update: {formatDate(selectedItem.last_updated, true)} IST
              </span>
              <span className="italic text-slate-400">SIH 2026 Synthetic Demonstration Data</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert(`Triggering replenishment purchase order requisition for ${selectedItem.item_id}...`);
                  setSelectedItem(null);
                }}
              >
                Trigger Reorder Requisition
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default InventoryPage;
