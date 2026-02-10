// app/admin/page.tsx (or wherever you want the dashboard)
import { FirebaseCacheDashboard } from '@/components/FirebaseCacheDashboard';

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Cache Management Dashboard</h1>
      <FirebaseCacheDashboard />
    </div>
  );
}