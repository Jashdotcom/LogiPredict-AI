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
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TableContainer } from '../components/common/TableContainer';
import { SearchInput } from '../components/common/SearchInput';
import { KpiCard } from '../components/common/KpiCard';

const MOCK_SUPPLIES = [
  {
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
    requisitionId: 'REQ-ARMY-8802',
    category: 'Rations & Nutrition',
    item: 'Combat Pack Rations & High-Altitude Composite Meals',
    destination: 'Base Depot Udhampur -> Sector Alpha',
    quantity: '3,500 Packs',
    urgency: 'normal',
    status: 'Ready for Loading',
    eta: '12 hrs',
  },
  {
    requisitionId: 'REQ-ARMY-8803',
    category: 'Ammunition & Ordnance',
    item: '155mm Artillery Propellant Charges & Fuzes',
    destination: 'Forward Ammunition Depot (FAD-04)',
    quantity: '850 Crates',
    urgency: 'high',
    status: 'Escort Cleared',
    eta: '4 hrs 45 mins',
  },
  {
    requisitionId: 'REQ-ARMY-8804',
    category: 'Medical & Life Support',
    item: 'Portable Oxygen Concentrators & Frostbite Kits',
    destination: 'High Altitude Medical Unit (Siachen Base)',
    quantity: '120 Units',
    urgency: 'high',
    status: 'Air-Drop Scheduled',
    eta: '2 hrs 15 mins',
  },
  {
    requisitionId: 'REQ-ARMY-8805',
    category: 'Special Winter Clothing',
    item: 'Extreme Cold Weather Clothing System (ECWCS Layer III)',
    destination: 'Eastern Command Buffer Depot (Tawang)',
    quantity: '1,200 Sets',
    urgency: 'normal',
    status: 'Stocked & Verified',
    eta: 'Delivered',
  },
];

export function SuppliesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSupplies = MOCK_SUPPLIES.filter(
    (item) =>
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requisitionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <KpiCard
          title="Active Forward Convoys"
          value="28 Convoys"
          change="+4 en-route"
          isPositive={true}
          timeframe="secure corridors"
          iconName="Truck"
          colorScheme="indigo"
        />
        <KpiCard
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
        <KpiCard
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
        <KpiCard
          title="Forward Depot Readiness"
          value="98.2%"
          change="+0.8%"
          isPositive={true}
          timeframe="operational readiness score"
          iconName="PackageCheck"
          colorScheme="purple"
        />
      </div>

      {/* Supply Requisitions Table */}
      <TableContainer
        title="Forward Requisition & Convoy Dispatch Ledger"
        subtitle="Live tracking of military supplies, ammunition, and winter combat essentials"
        action={
          <div className="flex items-center gap-3">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by requisition ID, supply item, sector..."
              size="sm"
            />
            <Button variant="outline" size="sm" leftIcon={Filter}>
              Filter Sector
            </Button>
          </div>
        }
      >
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
            <th className="py-3 px-4">Requisition ID / Item</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Forward Destination</th>
            <th className="py-3 px-4">Quantity</th>
            <th className="py-3 px-4">Dispatch Status</th>
            <th className="py-3 px-4">ETA</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredSupplies.map((sup) => (
            <tr key={sup.requisitionId} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-3.5 px-4">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {sup.requisitionId}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                    {sup.item}
                  </p>
                </div>
              </td>
              <td className="py-3.5 px-4 text-slate-600 font-medium">{sup.category}</td>
              <td className="py-3.5 px-4 text-slate-600">{sup.destination}</td>
              <td className="py-3.5 px-4 font-bold text-slate-900">{sup.quantity}</td>
              <td className="py-3.5 px-4">
                <Badge
                  variant={
                    sup.urgency === 'critical'
                      ? 'danger'
                      : sup.urgency === 'high'
                      ? 'warning'
                      : 'info'
                  }
                  size="xs"
                  dot
                >
                  {sup.status}
                </Badge>
              </td>
              <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{sup.eta}</td>
              <td className="py-3.5 px-4 text-right">
                <Button variant="ghost" size="xs">
                  Manifest
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableContainer>
    </div>
  );
}

export default SuppliesPage;
