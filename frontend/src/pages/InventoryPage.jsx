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
  Sliders,
  Edit3,
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
import { inventoryService } from '../services/inventoryService';
import { calculateInventoryMetrics } from '../utils/dashboardCalculations';
import {
  calculateDailyConsumption,
  calculateStockCoverDays,
  calculateReorderThreshold,
  calculateReorderRecommendation,
  classifyItemStatus,
  detectStockoutRisk,
} from '../utils/inventoryCalculations';
import { formatNumber, formatDate } from '../utils/formatters';
import { useToast } from '../hooks/useToast';

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // URL Query Parameters
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialDepot = searchParams.get('depot') || 'all';
  const initialStatus = searchParams.get('filter') || searchParams.get('status') || 'all';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDepot, setSelectedDepot] = useState(initialDepot);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  // Inventory items state for live updates
  const [inventoryItems, setInventoryItems] = useState(INVENTORY_ITEMS);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected item for Detail Modal
  const [selectedItem, setSelectedItem] = useState(null);

  // Stock Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('set'); // 'set', 'add', 'subtract'
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('Scheduled Depot Restock');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Fetch inventory from service on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await inventoryService.getInventory();
        if (isMounted && Array.isArray(data)) {
          setInventoryItems(data);
        }
      } catch (err) {
        console.warn('Failed to load inventory from service. Using local baseline.', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize state changes to URL query parameters
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedDepot !== 'all') params.depot = selectedDepot;
    if (selectedStatus !== 'all') params.filter = selectedStatus;
    setSearchParams(params, { replace: true });
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedDepot, selectedStatus]);

  // Calculate live metrics from inventoryItems state
  const invMetrics = calculateInventoryMetrics(inventoryItems);

  // Derive unique categories and depots from current inventoryItems
  const categories = ['all', ...new Set(inventoryItems.map((item) => item.category))];
  const depots = ['all', ...new Set(inventoryItems.map((item) => item.storage_location))];

  // Filtered inventory records
  const filteredItems = inventoryItems.filter((item) => {
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

    const calcStatus = classifyItemStatus(item);

    let matchesStatus = true;
    if (selectedStatus === 'critical') {
      matchesStatus = calcStatus === 'Critical' || calcStatus === 'Out of Stock';
    } else if (selectedStatus === 'replenishment' || selectedStatus === 'low') {
      matchesStatus = calcStatus === 'Low Stock' || calcStatus === 'Critical' || calcStatus === 'Out of Stock';
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

  // Handle Quantity Adjustment Submission
  const handleQuantityAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const val = Number(adjustmentValue);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid non-numeric or negative quantity.', { title: 'Validation Error' });
      return;
    }

    let newStock = selectedItem.current_stock;
    if (adjustmentType === 'set') {
      newStock = val;
    } else if (adjustmentType === 'add') {
      newStock = selectedItem.current_stock + val;
    } else if (adjustmentType === 'subtract') {
      newStock = Math.max(0, selectedItem.current_stock - val);
    }

    if (newStock > selectedItem.maximum_capacity) {
      toast.error(`Quantity (${newStock}) exceeds maximum capacity (${selectedItem.maximum_capacity}).`, {
        title: 'Capacity Limit Exceeded',
      });
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      await inventoryService.updateStockQuantity(selectedItem.item_id, newStock, adjustmentReason);

      // Update local inventoryItems state
      setInventoryItems((prev) =>
        prev.map((i) =>
          i.item_id === selectedItem.item_id
            ? { ...i, current_stock: newStock, last_updated: new Date().toISOString() }
            : i
        )
      );

      // Update selectedItem state
      setSelectedItem((prev) => (prev ? { ...prev, current_stock: newStock, last_updated: new Date().toISOString() } : null));

      toast.success(
        `Stock updated successfully for ${selectedItem.item_id}. New stock: ${newStock.toLocaleString()} ${selectedItem.unit}.`,
        { title: 'Inventory Adjusted' }
      );

      setIsAdjustModalOpen(false);
      setAdjustmentValue('');
    } catch (err) {
      toast.error(err.message || 'Failed to update inventory quantity.', { title: 'Update Error' });
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Table columns definition
  const columns = [
    {
      key: 'item_id',
      title: 'SKU / Item ID',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            {row.item_id}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-100 mt-1 hover:text-indigo-400 transition-colors">
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
        <span className="text-slate-400 font-medium text-xs bg-slate-800/70 px-2 py-0.5 rounded border border-slate-700">
          {row.category}
        </span>
      ),
    },
    {
      key: 'storage_location',
      title: 'Depot / Location',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
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
            <span className="font-bold text-slate-100 text-xs font-numeric">
              {formatNumber(row.current_stock)} {row.unit}
            </span>
            <div className="w-20 bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
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
        <span className="text-slate-400 font-mono text-xs">
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
        const st = classifyItemStatus(row);
        return <StatusBadge status={st} size="xs" />;
      },
    },
    {
      key: 'last_updated',
      title: 'Last Updated',
      sortable: true,
      render: (row) => (
        <span className="text-slate-500 text-[11px]">
          {formatDate(row.last_updated, true)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Inventory Management & Logic Engine"
        subtitle="Multi-echelon stock levels, dynamic consumption rates, days-of-cover runway, and validated quantity updates."
        breadcrumbs={[{ label: 'Inventory Management' }]}
        badge={
          <Badge variant="brand" size="sm">
            {inventoryItems.length} Active SKUs Monitored
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={() => toast.success('Inventory manifest CSV exported successfully.', { title: 'Export Ready' })}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => toast.info('Opening batch SKU requisition wizard...', { title: 'Requisition Wizard' })}
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
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-3.5 rounded-xl border border-slate-800 shadow-2xs">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Status Filter:</span>
        {[
          { id: 'all', label: `All Statuses (${inventoryItems.length})` },
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
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar (Search, Category, Depot) */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU, item name, category, or storage location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.filter(c => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Depot:</span>
            <select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
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

        {(searchTerm || selectedCategory !== 'all' || selectedDepot !== 'all' || selectedStatus !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-500">
            <span>
              Showing <strong>{filteredItems.length}</strong> matching inventory records (out of {inventoryItems.length})
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
              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              Clear All Filters &times;
            </button>
          </div>
        )}
      </div>

      {/* Inventory Data Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedItems}
          onRowClick={(row) => setSelectedItem(row)}
          emptyTitle="No inventory records found"
          emptyDescription="Try adjusting your search criteria or resetting active filters."
        />

        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
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

      {/* Item Detail Modal with Quantity Adjustment Support */}
      {selectedItem && (
        <Dialog
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={`SKU Details: ${selectedItem.item_name}`}
          subtitle={`Unique Identifier: ${selectedItem.item_id} • Category: ${selectedItem.category}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-slate-100">{selectedItem.storage_location}</span>
              </div>
              <div>
                <StatusBadge status={classifyItemStatus(selectedItem)} size="sm" />
              </div>
            </div>

            {/* Stock Levels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-slate-400 block text-[11px]">Current Stock</span>
                <strong className="text-slate-100 text-base font-extrabold mt-0.5 block font-numeric">
                  {formatNumber(selectedItem.current_stock)} <span className="text-xs font-normal text-slate-400">{selectedItem.unit}</span>
                </strong>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-slate-400 block text-[11px]">Minimum Safety</span>
                <strong className="text-amber-500 text-base font-extrabold mt-0.5 block">
                  {formatNumber(selectedItem.minimum_stock)} <span className="text-xs font-normal text-amber-500/70">{selectedItem.unit}</span>
                </strong>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-slate-400 block text-[11px]">Reorder Point</span>
                <strong className="text-indigo-400 text-base font-extrabold mt-0.5 block">
                  {formatNumber(calculateReorderThreshold(calculateDailyConsumption(selectedItem), selectedItem.lead_time_days, selectedItem.minimum_stock))} <span className="text-xs font-normal text-indigo-400/70">{selectedItem.unit}</span>
                </strong>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-slate-400 block text-[11px]">Max Capacity</span>
                <strong className="text-slate-100 text-base font-extrabold mt-0.5 block">
                  {formatNumber(selectedItem.maximum_capacity)} <span className="text-xs font-normal text-slate-400">{selectedItem.unit}</span>
                </strong>
              </div>
            </div>

            {/* Consumption & Replenishment Telemetry */}
            <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-900/60 space-y-2.5">
              <h4 className="font-bold text-indigo-300 text-xs uppercase tracking-wide">
                Advanced Inventory Logic & Runway Telemetry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-indigo-900/40">
                  <span className="text-slate-500 block text-[10px]">Daily Consumption</span>
                  <strong className="text-slate-200 text-sm font-bold">{calculateDailyConsumption(selectedItem)} {selectedItem.unit}/day</strong>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-indigo-900/40">
                  <span className="text-slate-500 block text-[10px]">Stock Runway (Cover)</span>
                  <strong className="text-emerald-400 text-sm font-bold">
                    {calculateStockCoverDays(selectedItem.current_stock, calculateDailyConsumption(selectedItem)) ?? 'N/A'} Days
                  </strong>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-indigo-900/40">
                  <span className="text-slate-500 block text-[10px]">Reorder Recommendation</span>
                  <strong className="text-indigo-400 text-sm font-bold">
                    {calculateReorderRecommendation(selectedItem).required
                      ? `+${formatNumber(calculateReorderRecommendation(selectedItem).recommendedQuantity)} ${selectedItem.unit}`
                      : 'Secure (No Reorder)'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                Last Update: {formatDate(selectedItem.last_updated, true)} IST
              </span>
              <span className="italic text-slate-600">SIH 2026 Deterministic Logic Engine</span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                leftIcon={Edit3}
                onClick={() => {
                  setAdjustmentValue(selectedItem.current_stock.toString());
                  setIsAdjustModalOpen(true);
                }}
              >
                Adjust Quantity
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    toast.success(`Replenishment purchase order dispatched for ${selectedItem.item_id}.`, { title: 'PO Dispatched' });
                    setSelectedItem(null);
                  }}
                >
                  Trigger Reorder PO
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Stock Quantity Adjustment Sub-Modal */}
      {isAdjustModalOpen && selectedItem && (
        <Dialog
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Adjust Stock: ${selectedItem.item_id}`}
          subtitle={`Current Level: ${selectedItem.current_stock.toLocaleString()} ${selectedItem.unit}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleQuantityAdjustment} className="space-y-4 py-2 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Adjustment Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'set', label: 'Set Exact' },
                  { id: 'add', label: 'Add Stock' },
                  { id: 'subtract', label: 'Deduct' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAdjustmentType(m.id)}
                    className={`py-2 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
                      adjustmentType === m.id
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Quantity ({selectedItem.unit})
              </label>
              <input
                type="number"
                min="0"
                max={selectedItem.maximum_capacity}
                required
                value={adjustmentValue}
                onChange={(e) => setAdjustmentValue(e.target.value)}
                placeholder="Enter quantity amount..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Maximum capacity: {selectedItem.maximum_capacity.toLocaleString()} {selectedItem.unit}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Adjustment Reason / Authority
              </label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="Scheduled Depot Restock">Scheduled Depot Restock</option>
                <option value="Emergency Convoy Offload">Emergency Convoy Offload</option>
                <option value="Physical Audit Reconciliation">Physical Audit Reconciliation</option>
                <option value="Damage / Spoilage Write-off">Damage / Spoilage Write-off</option>
                <option value="Inter-Depot Stock Transfer">Inter-Depot Stock Transfer</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmittingAdjustment}
              >
                Confirm & Update Stock
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export default InventoryPage;
