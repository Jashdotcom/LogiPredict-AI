import React, { useState } from 'react';
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

const MOCK_INVENTORY = [
  {
    id: 'SKU-8849',
    sku: 'SKU-8849',
    name: 'Microcontroller Units (32-bit Cortex)',
    category: 'Electronics',
    hub: 'Pune West Hub',
    stock: 420,
    safety: 600,
    reorderLevel: 800,
    status: 'Stockout Risk',
  },
  {
    id: 'SKU-4102',
    sku: 'SKU-4102',
    name: 'Lithium Iron Phosphate Cells (3.2V)',
    category: 'Energy/Battery',
    hub: 'Bengaluru DC',
    stock: 2400,
    safety: 1200,
    reorderLevel: 1800,
    status: 'Healthy',
  },
  {
    id: 'SKU-2910',
    sku: 'SKU-2910',
    name: 'Cold-Chain Insulin & Vaccine Vials',
    category: 'Pharmaceuticals',
    hub: 'Ahmedabad Cold Hub',
    stock: 890,
    safety: 500,
    reorderLevel: 1000,
    status: 'Low Stock',
  },
  {
    id: 'SKU-7301',
    sku: 'SKU-7301',
    name: 'Heavy Duty 4-Ply Corrugated Cartons',
    category: 'Packaging',
    hub: 'Delhi Central',
    stock: 15400,
    safety: 5000,
    reorderLevel: 8000,
    status: 'Surplus',
  },
  {
    id: 'SKU-5520',
    sku: 'SKU-5520',
    name: 'Automotive Precision Brake Calipers',
    category: 'Automotive',
    hub: 'Chennai Auto Hub',
    stock: 1250,
    safety: 800,
    reorderLevel: 1100,
    status: 'Healthy',
  },
];

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHub, setSelectedHub] = useState('all');

  const filteredItems = MOCK_INVENTORY.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hub.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHub =
      selectedHub === 'all' || item.hub.toLowerCase().includes(selectedHub.toLowerCase());

    return matchesSearch && matchesHub;
  });

  const columns = [
    {
      key: 'sku',
      title: 'SKU / Item',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {row.sku}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
            {row.name}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      render: (row) => <span className="text-slate-600 font-medium">{row.category}</span>,
    },
    {
      key: 'hub',
      title: 'Warehouse Hub',
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.hub}</span>,
    },
    {
      key: 'stock',
      title: 'Current Stock',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.stock.toLocaleString()} units
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      title: 'Reorder Point',
      sortable: true,
      render: (row) => (
        <span className="text-slate-500 font-mono text-xs">
          {row.reorderLevel.toLocaleString()} units
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Health Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="xs" />,
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
            8 Regional Hubs
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={Download}>
              Export Stock CSV
            </Button>
            <Button variant="primary" size="sm" leftIcon={Plus}>
              Add SKU / Batch
            </Button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Monitored SKUs"
          value="12,480"
          change="+340"
          isPositive={true}
          timeframe="active catalog"
          iconName="Boxes"
          colorScheme="indigo"
        />
        <KPICard
          title="Safety Buffer Deficits"
          value="14 SKUs"
          change="-3 this week"
          isPositive={true}
          timeframe="requiring replenishment"
          iconName="AlertOctagon"
          colorScheme="amber"
          status="Attention"
          statusVariant="warning"
        />
        <KPICard
          title="Avg Inventory Turnover"
          value="8.4x"
          change="+0.6x"
          isPositive={true}
          timeframe="vs industry benchmark"
          iconName="TrendingUp"
          colorScheme="emerald"
          status="Optimal"
          statusVariant="success"
        />
        <KPICard
          title="Total Stock Value"
          value="₹48.2 Cr"
          change="+₹1.2 Cr"
          isPositive={true}
          timeframe="gross warehouse valuation"
          iconName="PackageCheck"
          colorScheme="purple"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by SKU, item name, or hub..."
        selects={[
          {
            key: 'hub',
            value: selectedHub,
            onChange: setSelectedHub,
            options: [
              { value: 'all', label: 'All Warehouses' },
              { value: 'pune', label: 'Pune West Hub' },
              { value: 'bengaluru', label: 'Bengaluru DC' },
              { value: 'delhi', label: 'Delhi Central' },
              { value: 'ahmedabad', label: 'Ahmedabad Cold Hub' },
              { value: 'chennai', label: 'Chennai Auto Hub' },
            ],
          },
        ]}
        onReset={() => {
          setSearchTerm('');
          setSelectedHub('all');
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
