import { PageHeader } from '@/components/shared/page-header';

export default function AlertsPage() {
  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Monitor low stock and expiring items"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Alerts' },
        ]}
      />

      <div className="text-muted-foreground">
        Alert monitoring coming soon...
      </div>
    </div>
  );
}
