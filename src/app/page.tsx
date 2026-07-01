import { SalesAnalyticsWidget } from '@/components/SalesAnalyticsWidget';

export default function Home() {
  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
      <h1 style={{ marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>
        Sales Dashboard
      </h1>
      <SalesAnalyticsWidget />
    </main>
  );
}
