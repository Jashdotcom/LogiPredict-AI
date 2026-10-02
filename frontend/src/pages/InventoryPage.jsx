import React, { useState } from 'react';
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
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardHeader } from '../components/ui/Card';
import { DataTable } from '../components/tables/DataTable';
import { FilterBar } from '../components/filters/FilterBar';
import { KPICard } from '../components/dashboard/KpiCard';
import { INVENTORY_ITEMS } from '../data/dashboard/inventoryData';
import { calculateInventoryMetrics } from '../utils/dashboardCalculations';

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHub, setSelectedHub] = useState('all');
  const [activeTabFilter, setActiveTabFilter] = useState(filterParam);

  const invMetrics = calculateInventoryMetrics(INVENTORY_ITEMS);

  const filteredItems = INVENTORY_ITEMS.filter((item) => {
    const itemName = item.item_name || item.name || '';
    const itemId = item.item_id || item.sku || '';
    const location = item.storage_location || item.hub || '';

    const matchesSearch =
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHub =
      selectedHub === 'all' || location.toLowerCase().includes(selectedHub.toLowerCase());

    // Tab filter matching
    let matchesTab = true;
    const current = item.current_stock;
    const min = item.minimum_stock;
    const reorder = item.reorder_level;

    if (activeTabFilter === 'critical') {
      matchesTab = current === 0 || current < min;
    } else if (activeTabFilter === 'replenishment') {
      matchesTab = current <= reorder;
    } else if (activeTabFilter === 'low') {
      matchesTab = current < reorder && current >= min;
    }

    return matchesSearch && matchesHub && matchesTab;
  });

  const columns = [
    {
      key: 'item_id',
      title: 'SKU / Item',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {row.item_id || row.sku}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
            {row.item_name || row.name}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      render: (row) => <span className="text-slate-600 font-medium text-xs">{row.category}</span>,
    },
    {
      key: 'storage_location',
      title: 'Warehouse Hub',
      sortable: true,
      render: (row) => <span className="text-slate-600 text-xs">{row.storage_location || row.hub}</span>,
    },
    {
      key: 'current_stock',
      title: 'Current Stock',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs">
          {(row.current_stock ?? row.stock).toLocaleString()} {row.unit || 'units'}
        </span>
      ),
    },
    {
      key: 'reorder_level',
      title: 'Reorder Point',
      sortable: true,
      render: (row) => (
        <span className="text-slate-500 font-mono text-xs">
          {(row.reorder_level ?? row.reorderLevel).toLocaleString()} {row.unit || 'units'}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Health Status',
      sortable: true,
      render: (row) => {
        let st = row.status || 'Healthy';
        if (row.current_stock < row.minimum_stock) st = 'Stockout Risk';
        else if (row.current_stock <= row.reorder_level) st = 'Low Stock';
        return <StatusBadge status={st} size="xs" />;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Inventory Management"
        subtitle="Multi-echelon stock levels, dynamic safety stock calculations, and automated replenishment triggers across forward logistics nodes."
        breadcrumbs={[{ label: 'Inventory' }]}
        badge={
          <Badge variant="brand" size="sm">
            {INVENTORY_ITEMS.length} Monitored SKUs (6 Hubs)
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={Download}
              onClick={() => alert('Exporting inventory stock CSV (SIH 2026 format)...')}
            >
              Export Stock CSV
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

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Monitored SKUs"
          value={invMetrics.totalItems.toLocaleString()}
          change="+340 active catalog"
          isPositive={true}
          timeframe="across all regional hubs"
          iconName="Boxes"
          colorScheme="indigo"
        />
        <KPICard
          title="Critical Safety Deficits"
          value={`${invMetrics.criticalStockCount} SKUs`}
          change="Requires buffer dispatch"
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
          change="Queued for approval"
          isPositive={true}
          timeframe="auto-reorder engine"
          iconName="FileSpreadsheet"
          colorScheme="blue"
        />
      </div>

      {/* Tab Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">Filter View:</span>
        {[
          { id: 'all', label: `All SKUs (${INVENTORY_ITEMS.length})` },
          { id: 'critical', label: `Critical / Stockout (${invMetrics.criticalStockCount})` },
          { id: 'replenishment', label: `Replenishment Due (${invMetrics.replenishmentNeededCount})` },
          { id: 'low', label: `Low Stock (${invMetrics.lowStockCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTabFilter(tab.id);
              setSearchParams(tab.id === 'all' ? {} : { filter: tab.id });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTabFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by SKU, item name, or hub location..."
        selects={[
          {
            key: 'hub',
            value: selectedHub,
            onChange: setSelectedHub,
            options: [
              { value: 'all', label: 'All Warehouse Hubs' },
              { value: 'leh', label: 'Leh Corps / Forward Depot' },
              { value: 'drass', label: 'Drass Forward Base' },
              { value: 'kargil', label: 'Kargil Logistics Hub' },
              { value: 'siachen', label: 'Siachen Support Camp' },
              { value: 'ahmedabad', label: 'Ahmedabad Cold Hub' },
              { value: 'delhi', label: 'Delhi Central Hub' },
            ],
          },
        ]}
        onReset={() => {
          setSearchTerm('');
          setSelectedHub('all');
          setActiveTabFilter('all');
          setSearchParams({});
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        emptyTitle="No inventory records found"
        emptyDescription="Try adjusting your search criteria or resetting active filters."
      />
    </div>
  );
}

export default InventoryPage;
