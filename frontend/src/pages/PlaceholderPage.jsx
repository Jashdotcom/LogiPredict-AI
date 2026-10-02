import React from 'react';
import { Construction, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/feedback/EmptyState';

/**
 * Reusable Placeholder Page for modules under active development
 */
export function PlaceholderPage({
  title = 'Feature Under Development',
  description = 'This forward supply chain module is actively being developed for SIH 2026.',
  breadcrumbs = [],
  badgeText = 'Coming Soon',
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title={title}
        subtitle={description}
        breadcrumbs={breadcrumbs.length > 0 ? breadcrumbs : [{ label: title }]}
        badge={
          <Badge variant="neutral" size="sm">
            {badgeText}
          </Badge>
        }
      />

      <EmptyState
        title={title}
        description={`${description} Neural forecasting models, database integrations, and GIS layers will be available in the next sprint.`}
        icon={Construction}
        actionButton={
          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={Home}>
              Return to Overview
            </Button>
          </Link>
        }
      />
    </div>
  );
}

export default PlaceholderPage;
