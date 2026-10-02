import React, { useState } from 'react';
import {
  Truck,
  Package,
  Fuel,
  Shield,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/tables/DataTable';
import { FilterBar } from '../components/filters/FilterBar';
import { KPICard } from '../components/dashboard/KpiCard';

const MOCK_SUPPLIES = [
  {
    id: 'REQ-ARMY-8801',
    requisitionId: 'REQ-ARMY-8801',
    category: 'POL (Fuel & Lubricants)',
    item: 'High Altitude High-Flash Diesel (HSD-Winter Grade)',
    destination: 'Forward Post Tango-4 (Leh Sector)',
    quantity: '24,000 Litres',
    urgency: 'critical',
    status: 'Convoy Dispatched',
    eta: '6 hrs 20 mins',
  },
  {
    id: 'REQ-ARMY-8802',
    requisitionId: 'REQ-ARMY-8802',
    category: 'Rations & Nutrition',
    item: 'Combat Pack Rations & High-Altitude Composite Meals',
    destination: 'Base Depot Udhampur -> Sector Alpha',
    quantity: '3,500 Packs',
    urgency: 'normal',
    status: 'In Transit',
    eta: '12 hrs',
  },
  {
    id: 'REQ-ARMY-8803',
    requisitionId: 'REQ-ARMY-8803',
    category: 'Ammunition & Ordnance',
    item: '155mm Artillery Propellant Charges & Fuzes',
    destination: 'Forward Ammunition Depot (FAD-04)',
    quantity: '850 Crates',
    urgency: 'high',
    status: 'In Transit',
    eta: '4 hrs 45 mins',
  },
  {
    id: 'REQ-ARMY-8804',
    requisitionId: 'REQ-ARMY-8804',
    category: 'Medical & Life Support',
    item: 'Portable Oxygen Concentrators & Frostbite Kits',
    destination: 'High Altitude Medical Unit (Siachen Base)',
    quantity: '120 Units',
    urgency: 'high',
    status: 'Convoy Dispatched',
    eta: '2 hrs 15 mins',
  },
  {
    id: 'REQ-ARMY-8805',
    requisitionId: 'REQ-ARMY-8805',
    category: 'Special Winter Clothing',
    item: 'Extreme Cold Weather Clothing System (ECWCS Layer III)',
    destination: 'Eastern Command Buffer Depot (Tawang)',
    quantity: '1,200 Sets',
    urgency: 'normal',
    status: 'Healthy',
    eta: 'Delivered',
  },
];

export function SuppliesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredSupplies = MOCK_SUPPLIES.filter((item) => {
    const matchesSearch =
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requisitionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      key: 'requisitionId',
      title: 'Requisition ID / Item',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            {row.requisitionId}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-slate-100 mt-1">
            {row.item}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      render: (row) => <span className="text-slate-400 font-medium">{row.category}</span>,
    },
    {
      key: 'destination',
      title: 'Forward Destination',
      sortable: true,
      render: (row) => <span className="text-slate-400">{row.destination}</span>,
    },
    {
      key: 'quantity',
      title: 'Quantity',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-100">{row.quantity}</span>,
    },
    {
      key: 'status',
      title: 'Dispatch Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'eta',
      title: 'ETA',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-400">{row.eta}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Supply Management & Forward Consignments"
        subtitle="Operational unit requisitions, convoy manifests, POL fuel reserves, and forward military depot distribution."
        breadcrumbs={[{ label: 'Supply Management' }]}
        badge={
          <Badge variant="brand" size="sm" icon={Shield}>
            Indian Army Forward Logistics
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={Download}>
              Export Manifest
            </Button>
            <Button variant="primary" size="sm" leftIcon={Plus}>
              New Requisition Order
            </Button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Forward Convoys"
          value="28 Convoys"
          change="+4 en-route"
          isPositive={true}
          timeframe="secure corridors"
          iconName="Truck"
          colorScheme="indigo"
        />
        <KPICard
          title="Critical Requisitions"
          value="3 High Priority"
          change="POL & Medical"
          isPositive={false}
          timeframe="immediate dispatch"
          iconName="AlertOctagon"
          colorScheme="rose"
          status="Priority"
          statusVariant="danger"
        />
        <KPICard
          title="POL Fuel Reserve Level"
          value="91.4%"
          change="+3.2%"
          isPositive={true}
          timeframe="across high-altitude depots"
          iconName="Zap"
          colorScheme="emerald"
          status="Optimal"
          statusVariant="success"
        />
        <KPICard
          title="Forward Depot Readiness"
          value="98.2%"
          change="+0.8%"
          isPositive={true}
          timeframe="operational readiness score"
          iconName="PackageCheck"
          colorScheme="purple"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by requisition ID, supply item, sector..."
        selects={[
          {
            key: 'category',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
              { value: 'all', label: 'All Categories' },
              { value: 'pol', label: 'POL (Fuel & Lubricants)' },
              { value: 'rations', label: 'Rations & Nutrition' },
              { value: 'ammunition', label: 'Ammunition & Ordnance' },
              { value: 'medical', label: 'Medical & Life Support' },
            ],
          },
        ]}
        onReset={() => {
          setSearchTerm('');
          setSelectedCategory('all');
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSupplies}
        emptyTitle="No supply requisitions found"
        emptyDescription="Try adjusting search keywords or resetting active category filters."
      />
    </div>
  );
}

export default SuppliesPage;
