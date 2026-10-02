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
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardHeader } from '../components/common/Card';
import { TableContainer } from '../components/common/TableContainer';
import { SearchInput } from '../components/common/SearchInput';
import { KpiCard } from '../components/common/KpiCard';

const MOCK_INVENTORY = [
  {
    sku: 'SKU-8849',
    name: 'Microcontroller Units (32-bit Cortex)',
    category: 'Electronics',
    hub: 'Pune West Hub',
    stock: 420,
    safety: 600,
    reorderLevel: 800,
    status: 'Stockout Risk',
    variant: 'danger',
  },
  {
    sku: 'SKU-4102',
    name: 'Lithium Iron Phosphate Cells (3.2V)',
    category: 'Energy/Battery',
    hub: 'Bengaluru DC',
    stock: 2400,
    safety: 1200,
    reorderLevel: 1800,
    status: 'Healthy',
    variant: 'success',
  },
  {
    sku: 'SKU-2910',
    name: 'Cold-Chain Insulin & Vaccine Vials',
    category: 'Pharmaceuticals',
    hub: 'Ahmedabad Cold Hub',
    stock: 890,
    safety: 500,
    reorderLevel: 1000,
    status: 'Reorder Needed',
    variant: 'warning',
  },
  {
    sku: 'SKU-7301',
    name: 'Heavy Duty 4-Ply Corrugated Cartons',
    category: 'Packaging',
    hub: 'Delhi Central',
    stock: 15400,
    safety: 5000,
    reorderLevel: 8000,
    status: 'Surplus',
    variant: 'info',
  },
  {
    sku: 'SKU-5520',
    name: 'Automotive Precision Brake Calipers',
    category: 'Automotive',
    hub: 'Chennai Auto Hub',
    stock: 1250,
    safety: 800,
    reorderLevel: 1100,
    status: 'Healthy',
    variant: 'success',
  },
];

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = MOCK_INVENTORY.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Inventory Management"
        subtitle="Multi-echelon stock levels, dynamic safety stock calculations, and automated replenishment triggers."
        breadcrumbs={[{ label: 'Inventory Management' }]}
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
        <KpiCard
          title="Total Monitored SKUs"
          value="12,480"
          change="+340"
          isPositive={true}
          timeframe="active catalog"
          iconName="Boxes"
          colorScheme="indigo"
        />
        <KpiCard
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
        <KpiCard
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
        <KpiCard
          title="Total Stock Value"
          value="₹48.2 Cr"
          change="+₹1.2 Cr"
          isPositive={true}
          timeframe="gross warehouse valuation"
          iconName="PackageCheck"
          colorScheme="purple"
        />
      </div>

      {/* Table Container */}
      <TableContainer
        title="Inventory Stock Ledger"
        subtitle="Live tracking of warehouse batches, safety margins, and automated reorder points"
        action={
          <div className="flex items-center gap-3">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU, item name or hub..."
              size="sm"
            />
            <Button variant="outline" size="sm" leftIcon={Filter}>
              Filter
            </Button>
          </div>
        }
      >
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">SKU / Item</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Warehouse Hub</th>
            <th className="py-3 px-4">Current Stock</th>
            <th className="py-3 px-4">Reorder Point</th>
            <th className="py-3 px-4">Health Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredItems.map((item) => (
            <tr key={item.sku} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3.5 px-4">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {item.sku}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                    {item.name}
                  </p>
                </div>
              </td>
              <td className="py-3.5 px-4 text-slate-600 font-medium">{item.category}</td>
              <td className="py-3.5 px-4 text-slate-600">{item.hub}</td>
              <td className="py-3.5 px-4 font-bold text-slate-900">
                {item.stock.toLocaleString()} units
              </td>
              <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                {item.reorderLevel.toLocaleString()} units
              </td>
              <td className="py-3.5 px-4">
                <Badge variant={item.variant} size="xs" dot>
                  {item.status}
                </Badge>
              </td>
              <td className="py-3.5 px-4 text-right">
                <Button variant="ghost" size="xs">
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

export default InventoryPage;
