import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  BellRing,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Check,
  RotateCcw,
  SlidersHorizontal,
  X,
  Truck,
  Activity,
  Layers,
  ThermometerSnowflake,
  Fuel,
  RefreshCw,
  FileCheck,
  Send,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { Dialog } from '../components/ui/Dialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/filters/SearchInput';
import { DateRangeFilter } from '../components/filters/DateRangeFilter';
import { KPICard } from '../components/dashboard/KpiCard';
import { EmptyState } from '../components/feedback/EmptyState';
import { SkeletonTable } from '../components/feedback/Skeleton';
import { useToast } from '../hooks/useToast';
import { getSeverityConfig, getAlertStatusConfig } from '../utils/statusHelpers';
import { formatDate, formatDateTime, formatRelativeTime, formatPercent } from '../utils/formatters';
import {
  queryAlerts,
  getAlertCategories,
  getAlertLocations,
  acknowledgeAlert,
  resolveAlert,
  resetAlertsState,
} from '../data/alerts/alertsDataService';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'warning', label: 'Warning / High' },
  { value: 'info', label: 'Info / Low' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Lifecycle States' },
  { value: 'new', label: 'New Anomalies' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
];

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: '5 per page' },
  { value: 10, label: '10 per page' },
  { value: 20, label: '20 per page' },
  { value: 50, label: '50 per page' },
];

const OPERATOR_CALLSIGNS = [
  'Col. Rajesh Verma (Logistics HQ)',
  'Maj. S. Raman (Northern Command)',
  'Capt. Priya Nair (Medical Logistics)',
  'Capt. A. Deshmukh (Fuel & POL Directorate)',
  'Sub. Major G. Singh (Forward Support Depot)',
  'Duty Logistics Officer (Automated System)',
];

export function AlertsPage() {
  const { toast } = useToast();

  // Filter States
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Loading & Data State
  const [isLoading, setIsLoading] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  // Modal / Drawer States
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Acknowledge Action Modal
  const [ackAlertTarget, setAckAlertTarget] = useState(null);
  const [ackCallsign, setAckCallsign] = useState(OPERATOR_CALLSIGNS[0]);
  const [isAckLoading, setIsAckLoading] = useState(false);

  // Resolve Action Modal
  const [resolveAlertTarget, setResolveAlertTarget] = useState(null);
  const [resolveCallsign, setResolveCallsign] = useState(OPERATOR_CALLSIGNS[0]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolveLoading, setIsResolveLoading] = useState(false);

  // Dropdown option lists
  const categories = useMemo(() => getAlertCategories(), [dataVersion]);
  const locations = useMemo(() => getAlertLocations(), [dataVersion]);

  const categoryOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Categories' },
      ...categories.map((c) => ({ value: c, label: c })),
    ];
  }, [categories]);

  const locationOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Hubs & Depots' },
      ...locations.map((l) => ({ value: l, label: l })),
    ];
  }, [locations]);

  // Query Alert Data
  const queryResult = useMemo(() => {
    return queryAlerts({
      search,
      severity: severityFilter,
      category: categoryFilter,
      status: statusFilter,
      location: locationFilter,
      dateRange,
      sortBy,
      sortOrder,
      page,
      pageSize,
    });
  }, [
    search,
    severityFilter,
    categoryFilter,
    statusFilter,
    locationFilter,
    dateRange,
    sortBy,
    sortOrder,
    page,
    pageSize,
    dataVersion,
  ]);

  const { items: alerts, total, totalPages, kpis } = queryResult;

  // Check if any filter is actively applied
  const isFiltered = useMemo(() => {
    return (
      Boolean(search.trim()) ||
      severityFilter !== 'all' ||
      categoryFilter !== 'all' ||
      statusFilter !== 'all' ||
      locationFilter !== 'all' ||
      dateRange !== 'all'
    );
  }, [search, severityFilter, categoryFilter, statusFilter, locationFilter, dateRange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (severityFilter !== 'all') count++;
    if (categoryFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (locationFilter !== 'all') count++;
    if (dateRange !== 'all') count++;
    return count;
  }, [search, severityFilter, categoryFilter, statusFilter, locationFilter, dateRange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearch('');
    setSeverityFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
    setDateRange('all');
    setPage(1);
    toast.info('All search and category filters reset.');
  }, [toast]);

  // Toggle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // View Alert Detail
  const handleViewDetail = (alert) => {
    setSelectedAlert(alert);
    setIsDetailOpen(true);
  };

  // Open Acknowledge Dialog
  const handleOpenAcknowledge = (alert, e) => {
    if (e) e.stopPropagation();
    setAckAlertTarget(alert);
    setAckCallsign(OPERATOR_CALLSIGNS[0]);
  };

  // Execute Acknowledge
  const handleConfirmAcknowledge = async () => {
    if (!ackAlertTarget) return;
    const alertId = ackAlertTarget.id || ackAlertTarget.alert_id;
    setIsAckLoading(true);

    try {
      const updated = await acknowledgeAlert(alertId, ackCallsign);
      setDataVersion((v) => v + 1);
      if (selectedAlert && (selectedAlert.id || selectedAlert.alert_id) === alertId) {
        setSelectedAlert(updated);
      }
      toast.success(`Alert ${alertId} acknowledged by ${ackCallsign}.`, {
        title: 'Anomaly Acknowledged',
      });
      setAckAlertTarget(null);
    } catch (err) {
      toast.error(`Failed to acknowledge alert: ${err.message}`);
    } finally {
      setIsAckLoading(false);
    }
  };

  // Open Resolve Dialog
  const handleOpenResolve = (alert, e) => {
    if (e) e.stopPropagation();
    setResolveAlertTarget(alert);
    setResolveCallsign(OPERATOR_CALLSIGNS[0]);
    setResolutionNotes(
      alert.recommendedAction || alert.recommended_action || 'Mitigation protocol executed successfully.'
    );
  };

  // Execute Resolve
  const handleConfirmResolve = async () => {
    if (!resolveAlertTarget) return;
    const alertId = resolveAlertTarget.id || resolveAlertTarget.alert_id;
    setIsResolveLoading(true);

    try {
      const updated = await resolveAlert(alertId, resolveCallsign, resolutionNotes);
      setDataVersion((v) => v + 1);
      if (selectedAlert && (selectedAlert.id || selectedAlert.alert_id) === alertId) {
        setSelectedAlert(updated);
      }
      toast.success(`Mitigation protocol executed. Alert ${alertId} marked resolved.`, {
        title: 'Anomaly Resolved',
      });
      setResolveAlertTarget(null);
      if (isDetailOpen) {
        setIsDetailOpen(false);
      }
    } catch (err) {
      toast.error(`Failed to resolve alert: ${err.message}`);
    } finally {
      setIsResolveLoading(false);
    }
  };

  // Reset all state to pristine synthetic data
  const handleResetAll = () => {
    resetAlertsState();
    setDataVersion((v) => v + 1);
    handleClearFilters();
    toast.success('Alerts state reset to default synthetic telemetry dataset.');
  };

  // Render Sort Header helper
  const renderSortHeader = (label, field) => {
    const isCurrent = sortBy === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider text-[11px] cursor-pointer select-none transition-colors group"
      >
        <span>{label}</span>
        {isCurrent ? (
          sortOrder === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <PageHeader
        title="Predictive Anomaly & Risk Alerts"
        subtitle="Multi-echelon bottleneck detection, cold-chain temperature excursions, and autonomous stockout mitigation."
        breadcrumbs={[{ label: 'Predictive Alerts' }]}
        badge={
          <Badge variant="danger" size="sm" dot dotPulse>
            {kpis.activeCount} Active Anomalies
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RotateCcw}
              onClick={handleResetAll}
            >
              Reset All Telemetry
            </Button>
          </div>
        }
      />

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Critical Alerts"
          value={kpis.criticalActive.toString()}
          change={kpis.criticalActive > 0 ? 'Immediate action required' : 'Zero critical risks'}
          isPositive={kpis.criticalActive === 0}
          timeframe="stockout & cold chain"
          iconName="AlertOctagon"
          colorScheme="rose"
          status={kpis.criticalActive > 0 ? 'Urgent' : 'Secure'}
          statusVariant={kpis.criticalActive > 0 ? 'danger' : 'success'}
          onClick={() => {
            setSeverityFilter('critical');
            setStatusFilter('all');
            setPage(1);
          }}
        />
        <KPICard
          title="High Transit Risks"
          value={kpis.transitRisks.toString()}
          change="Expressway & Pass Convoys"
          isPositive={kpis.transitRisks <= 1}
          timeframe="corridor bottlenecks"
          iconName="Truck"
          colorScheme="amber"
          status="Monitored"
          statusVariant="warning"
          onClick={() => {
            setCategoryFilter('Transit & Route Logistics');
            setPage(1);
          }}
        />
        <KPICard
          title="Active Mitigations"
          value={`${kpis.resolved} resolved`}
          change={`${kpis.acknowledged} in review`}
          isPositive={true}
          timeframe="autonomous protocols"
          iconName="CheckCircle2"
          colorScheme="emerald"
          status="Optimal"
          statusVariant="success"
          onClick={() => {
            setStatusFilter('resolved');
            setPage(1);
          }}
        />
        <KPICard
          title="Total Telemetry Alerts"
          value={kpis.total.toString()}
          change="Monitored 24/7 across nodes"
          isPositive={true}
          timeframe="all forward sectors"
          iconName="BellRing"
          colorScheme="indigo"
          onClick={() => {
            handleClearFilters();
          }}
        />
      </div>

      {/* 3. Multi-Criteria Filter Bar */}
      <div className="bg-[#131b2e] p-4 rounded-xl border border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Free-text Search */}
          <div className="flex-1 max-w-lg">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onClear={() => {
                setSearch('');
                setPage(1);
              }}
              placeholder="Search alert ID, SKU, location, or protocol (Press '/' to focus)..."
              size="md"
            />
          </div>

          {/* Date Range Presets */}
          <div className="flex items-center gap-2">
            <DateRangeFilter
              presets={[
                { id: '24h', label: '24h' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: 'all', label: 'All History' },
              ]}
              selected={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Dropdown Filters & Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <Select
              label="Severity"
              options={SEVERITY_OPTIONS}
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              size="sm"
            />
          </div>

          <div>
            <Select
              label="Category"
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              size="sm"
            />
          </div>

          <div>
            <Select
              label="Lifecycle Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              size="sm"
            />
          </div>

          <div>
            <Select
              label="Hub / Depot"
              options={locationOptions}
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
              size="sm"
            />
          </div>
        </div>

        {/* Active Filter Indicators */}
        {isFiltered && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Active Filters ({activeFilterCount}):
              </span>
              {search && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                  Query: "{search}"
                  <button type="button" onClick={() => setSearch('')} className="hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {severityFilter !== 'all' && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                  Severity: {severityFilter}
                  <button type="button" onClick={() => setSeverityFilter('all')} className="hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                  Category: {categoryFilter}
                  <button type="button" onClick={() => setCategoryFilter('all')} className="hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                  Status: {statusFilter}
                  <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                  Depot: {locationFilter}
                  <button type="button" onClick={() => setLocationFilter('all')} className="hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
                  Timeframe: {dateRange}
                  <button type="button" onClick={() => setDateRange('all')} className="hover:text-rose-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <Button
              variant="ghost"
              size="xs"
              leftIcon={X}
              onClick={handleClearFilters}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* 4. Structured Alert Data Table */}
      <Card className="overflow-hidden border-slate-800 bg-[#131b2e] p-0 shadow-2xs">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Real-Time Anomaly Ledger
            </h2>
            <Badge variant="neutral" size="xs">
              {total} Total Records
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <SkeletonTable rows={pageSize} cols={7} />
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Anomalies Found"
              description={
                isFiltered
                  ? 'No alerts match your current search and filter criteria. Try clearing or relaxing filters.'
                  : 'All operational parameters and multi-echelon stock levels are currently within safe limits.'
              }
              variant={isFiltered ? 'search' : 'default'}
              actionText={isFiltered ? 'Reset Filters' : undefined}
              onAction={isFiltered ? handleClearFilters : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">{renderSortHeader('Alert ID', 'id')}</TableHead>
                  <TableHead className="w-28">{renderSortHeader('Severity', 'severity')}</TableHead>
                  <TableHead className="min-w-[240px]">{renderSortHeader('Anomaly Title & Trigger', 'title')}</TableHead>
                  <TableHead className="min-w-[160px]">{renderSortHeader('Category & SKU', 'category')}</TableHead>
                  <TableHead className="min-w-[160px]">{renderSortHeader('Location / Depot', 'warehouse')}</TableHead>
                  <TableHead className="min-w-[150px]">Predicted Impact</TableHead>
                  <TableHead className="w-32">{renderSortHeader('Status', 'status')}</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => {
                  const alertId = alert.id || alert.alert_id;
                  const sevConfig = getSeverityConfig(alert.severity);
                  const statusConfig = getAlertStatusConfig(alert.status);

                  return (
                    <TableRow
                      key={alertId}
                      onClick={() => handleViewDetail(alert)}
                      className="cursor-pointer hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Alert ID */}
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/80 group-hover:border-indigo-500/50 transition-colors">
                          {alertId}
                        </span>
                      </TableCell>

                      {/* Severity Badge */}
                      <TableCell>
                        <Badge variant={sevConfig.badgeVariant} size="xs" dot>
                          {sevConfig.label}
                        </Badge>
                      </TableCell>

                      {/* Title & Trigger */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-200 text-xs sm:text-sm line-clamp-1 group-hover:text-indigo-300 transition-colors">
                            {alert.title}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {alert.trigger_condition || alert.description}
                          </p>
                        </div>
                      </TableCell>

                      {/* Category & SKU */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-slate-300 block">
                            {alert.category || 'General Logistics'}
                          </span>
                          {alert.item_name && (
                            <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                              {alert.item_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Depot / Route */}
                      <TableCell>
                        <div className="flex items-start gap-1.5 text-xs text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="block font-medium">{alert.warehouse || alert.location_name}</span>
                            {alert.route_id && (
                              <span className="text-[11px] text-indigo-400 font-mono block">
                                Route: {alert.route_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Predicted Impact */}
                      <TableCell>
                        <span className="text-xs font-medium text-rose-400/90 block leading-tight">
                          {alert.predictedImpact || alert.predicted_impact}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <Badge
                            variant={statusConfig.variant}
                            size="xs"
                            dot={statusConfig.dot}
                            dotPulse={statusConfig.dotPulse}
                          >
                            {statusConfig.label}
                          </Badge>
                          {alert.acknowledged_by && alert.status !== 'resolved' && (
                            <span className="text-[10px] text-slate-500 block truncate">
                              by {alert.acknowledged_by}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleViewDetail(alert)}
                            title="View Deep Telemetry"
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          {alert.status === 'new' && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={(e) => handleOpenAcknowledge(alert, e)}
                              className="text-amber-400 hover:text-amber-300 border-amber-800/60 hover:bg-amber-950/40 text-[11px] py-0.5 px-1.5"
                            >
                              Ack
                            </Button>
                          )}

                          {alert.status !== 'resolved' && (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={(e) => handleOpenResolve(alert, e)}
                              className="text-[11px] py-0.5 px-2"
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && alerts.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <strong className="text-slate-200">{(page - 1) * pageSize + 1}</strong> to{' '}
              <strong className="text-slate-200">
                {Math.min(page * pageSize, total)}
              </strong>{' '}
              of <strong className="text-slate-200">{total}</strong> alerts
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          page === p
                            ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === page - 2 || p === page + 2) {
                    return (
                      <span key={p} className="text-slate-600 px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 5. Deep Telemetry Alert Detail Dialog */}
      {selectedAlert && (
        <Dialog
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Anomaly Telemetry: ${selectedAlert.id || selectedAlert.alert_id}`}
          subtitle={selectedAlert.title}
          maxWidth="max-w-2xl"
        >
          <div className="p-5 sm:p-6 space-y-5 text-slate-300">
            {/* Top Status & Severity Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityConfig(selectedAlert.severity).badgeVariant} size="sm" dot>
                  {getSeverityConfig(selectedAlert.severity).label} Severity
                </Badge>
                <Badge variant={getAlertStatusConfig(selectedAlert.status).variant} size="sm">
                  {getAlertStatusConfig(selectedAlert.status).label}
                </Badge>
              </div>

              {selectedAlert.confidence_score && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">AI Confidence:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {formatPercent(selectedAlert.confidence_score, true, 0)}
                  </span>
                </div>
              )}
            </div>

            {/* Core Telemetry Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Target SKU & Item
                </span>
                <span className="text-slate-200 font-medium text-sm mt-0.5 block">
                  {selectedAlert.item_name || 'Multi-Item Fleet Convoy'}
                </span>
                {selectedAlert.sku && (
                  <span className="text-slate-500 font-mono mt-0.5 block">
                    ID: {selectedAlert.sku}
                  </span>
                )}
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Depot Node / Transit Corridor
                </span>
                <span className="text-slate-200 font-medium text-sm mt-0.5 block">
                  {selectedAlert.warehouse || selectedAlert.location_name}
                </span>
                {selectedAlert.route_id && (
                  <span className="text-indigo-400 font-mono mt-0.5 block">
                    Corridor: {selectedAlert.route_id}
                  </span>
                )}
              </div>
            </div>

            {/* Sensor / Trigger Condition */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Telemetry Trigger Condition
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {selectedAlert.trigger_condition || selectedAlert.description}
              </p>
            </div>

            {/* Predicted Impact Timeline */}
            <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Predicted Operational Impact
              </div>
              <p className="text-xs text-rose-200 leading-relaxed font-medium">
                {selectedAlert.predicted_impact || selectedAlert.predictedImpact}
              </p>
            </div>

            {/* Recommended Action / Mitigation Protocol */}
            <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-900/40 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Recommended Mitigation Protocol
              </div>
              <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                {selectedAlert.recommended_action || selectedAlert.recommendedAction}
              </p>
            </div>

            {/* Lifecycle Audit Trail */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                Incident Audit Trail
              </span>
              <div className="space-y-1.5 text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Detected:</span>
                  <span className="text-slate-300 font-medium">
                    {formatDateTime(selectedAlert.created_at)} ({formatRelativeTime(selectedAlert.created_at)})
                  </span>
                </div>
                {selectedAlert.acknowledged_at && (
                  <div className="flex items-center justify-between">
                    <span>Acknowledged by {selectedAlert.acknowledged_by}:</span>
                    <span className="text-slate-300 font-medium">
                      {formatDateTime(selectedAlert.acknowledged_at)}
                    </span>
                  </div>
                )}
                {selectedAlert.resolved_at && (
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span>Resolved by {selectedAlert.resolved_by}:</span>
                      <span className="text-emerald-400 font-medium">
                        {formatDateTime(selectedAlert.resolved_at)}
                      </span>
                    </div>
                    {selectedAlert.resolution_notes && (
                      <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2 rounded border border-slate-800">
                        "{selectedAlert.resolution_notes}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedAlert.status === 'new' && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Check}
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleOpenAcknowledge(selectedAlert);
                    }}
                    className="text-amber-400 hover:text-amber-300 border-amber-800/60"
                  >
                    Acknowledge Anomaly
                  </Button>
                )}

                {selectedAlert.status !== 'resolved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={CheckCircle2}
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleOpenResolve(selectedAlert);
                    }}
                  >
                    Execute Mitigation Protocol
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* 6. Acknowledge Confirmation Dialog */}
      {ackAlertTarget && (
        <ConfirmDialog
          isOpen={Boolean(ackAlertTarget)}
          onClose={() => setAckAlertTarget(null)}
          onConfirm={handleConfirmAcknowledge}
          title={`Acknowledge Anomaly: ${ackAlertTarget.id || ackAlertTarget.alert_id}`}
          description="Acknowledge receipt of this anomaly alert and assign an active review callsign."
          confirmText={isAckLoading ? 'Acknowledging...' : 'Acknowledge Alert'}
          cancelText="Cancel"
          variant="warning"
          isLoading={isAckLoading}
        >
          <div className="mt-3 space-y-3 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Duty Officer Callsign:
              </label>
              <select
                value={ackCallsign}
                onChange={(e) => setAckCallsign(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
              >
                {OPERATOR_CALLSIGNS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-500 italic">
              Status will transition from <strong className="text-rose-400">New</strong> to{' '}
              <strong className="text-amber-400">Acknowledged</strong>.
            </p>
          </div>
        </ConfirmDialog>
      )}

      {/* 7. Resolve / Mitigation Protocol Dialog */}
      {resolveAlertTarget && (
        <Dialog
          isOpen={Boolean(resolveAlertTarget)}
          onClose={() => setResolveAlertTarget(null)}
          title={`Execute Mitigation: ${resolveAlertTarget.id || resolveAlertTarget.alert_id}`}
          subtitle={resolveAlertTarget.title}
          maxWidth="max-w-lg"
        >
          <div className="p-5 sm:p-6 space-y-4 text-left text-slate-300">
            <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-800/40 text-xs">
              <span className="text-indigo-400 font-bold block uppercase tracking-wider text-[10px] mb-1">
                Autonomous Recommendation:
              </span>
              <p className="text-indigo-200">
                {resolveAlertTarget.recommendedAction || resolveAlertTarget.recommended_action}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Authorizing Officer Callsign:
              </label>
              <select
                value={resolveCallsign}
                onChange={(e) => setResolveCallsign(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
              >
                {OPERATOR_CALLSIGNS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Resolution & Mitigation Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                placeholder="Log dispatch convoy numbers, re-route clearance, or temperature reset details..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResolveAlertTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={CheckCircle2}
                isLoading={isResolveLoading}
                onClick={handleConfirmResolve}
              >
                Confirm & Mark Resolved
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default AlertsPage;
