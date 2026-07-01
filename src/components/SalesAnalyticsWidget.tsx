'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, Select, Typography } from '@/design-system';
import { tokens } from '@/design-system/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesRecord {
  product: string;
  revenue: number;
  units: number;
  region: string;
}

type TimeRange = '7d' | '30d' | '90d';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DATA: Record<TimeRange, SalesRecord[]> = {
  '7d': [
    { product: 'Aurora Plan', revenue: 12400, units: 48, region: 'APAC' },
    { product: 'Borealis Plan', revenue: 8900, units: 31, region: 'EMEA' },
    { product: 'Cirrus Plan', revenue: 6200, units: 22, region: 'Americas' },
    { product: 'Delta Plan', revenue: 4100, units: 15, region: 'APAC' },
    { product: 'Echo Plan', revenue: 2800, units: 9, region: 'EMEA' },
  ],
  '30d': [
    { product: 'Aurora Plan', revenue: 51000, units: 194, region: 'APAC' },
    { product: 'Borealis Plan', revenue: 38400, units: 141, region: 'EMEA' },
    { product: 'Cirrus Plan', revenue: 27600, units: 98, region: 'Americas' },
    { product: 'Delta Plan', revenue: 18200, units: 64, region: 'APAC' },
    { product: 'Echo Plan', revenue: 11900, units: 41, region: 'EMEA' },
  ],
  '90d': [
    { product: 'Aurora Plan', revenue: 148000, units: 562, region: 'APAC' },
    { product: 'Borealis Plan', revenue: 112000, units: 414, region: 'EMEA' },
    { product: 'Cirrus Plan', revenue: 79400, units: 288, region: 'Americas' },
    { product: 'Delta Plan', revenue: 54800, units: 196, region: 'APAC' },
    { product: 'Echo Plan', revenue: 34200, units: 121, region: 'EMEA' },
  ],
};

const PAGE_SIZE = 3;

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

// ---------------------------------------------------------------------------
// Bar chart using native canvas
// ---------------------------------------------------------------------------

interface BarChartProps {
  data: SalesRecord[];
}

function BarChart({ data }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const paddingLeft = 48;
    const paddingBottom = 32;
    const paddingTop = 16;
    const paddingRight = 16;

    ctx.clearRect(0, 0, width, height);

    const maxRevenue = Math.max(...data.map(d => d.revenue));
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const barColors = [
      tokens.color.interactivePrimary,
      tokens.color.success,
      tokens.color.warning,
      '#8b5cf6',
      '#ec4899',
    ];

    const barWidth = Math.floor(chartWidth / data.length) - 8;

    // Draw axis line
    ctx.strokeStyle = tokens.color.borderDefault;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, height - paddingBottom);
    ctx.lineTo(width - paddingRight, height - paddingBottom);
    ctx.stroke();

    // Draw bars
    data.forEach((record, i) => {
      const barHeight = (record.revenue / maxRevenue) * chartHeight;
      const x = paddingLeft + i * (chartWidth / data.length) + 4;
      const y = paddingTop + chartHeight - barHeight;

      ctx.fillStyle = barColors[i % barColors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Product label (abbreviated)
      ctx.fillStyle = tokens.color.textSecondary;
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      const label = record.product.split(' ')[0];
      ctx.fillText(label, x + barWidth / 2, height - paddingBottom + 14);
    });

    // Y-axis labels
    ctx.fillStyle = tokens.color.textSecondary;
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'right';

    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const val = (maxRevenue / steps) * s;
      const y = paddingTop + chartHeight - (val / maxRevenue) * chartHeight;
      const label = val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`;
      ctx.fillText(label, paddingLeft - 4, y + 4);
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={200}
      aria-label="Revenue bar chart"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export function SalesAnalyticsWidget() {
  const [range, setRange] = useState<TimeRange>('30d');
  const [page, setPage] = useState(1);

  const data = MOCK_DATA[range];
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleRows = data.slice(startIndex, startIndex + PAGE_SIZE);

  function handleRangeChange(value: string) {
    setRange(value as TimeRange);
    setPage(1);
  }

  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const rows = data;
  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const avgUnits = Math.round(rows.reduce((sum, r) => sum + r.units, 0) / rows.length);
  const topProduct = rows.reduce((top, r) => r.revenue > top.revenue ? r : top, rows[0]);

  return (
    <Card padding="lg">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: tokens.spacing.lg,
        }}
      >
        <div>
          <Typography variant="title" as="h2">
            Sales Analytics
          </Typography>
          <Typography variant="caption" tone="secondary" as="p">
            Revenue and units sold by product
          </Typography>
        </div>
        <Select
          id="time-range"
          label="Time Range"
          value={range}
          onChange={handleRangeChange}
          options={RANGE_OPTIONS}
        />
      </div>

      {/* Summary stats row */}
      <div style={{ display: 'flex', gap: tokens.spacing.md, marginBottom: tokens.spacing.lg }}>
        {[
          { label: 'Total Revenue', value: currency.format(totalRevenue) },
          { label: 'Avg Units Sold', value: avgUnits.toLocaleString() },
          { label: 'Top Performer', value: topProduct.product },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: 1,
              padding: tokens.spacing.md,
              background: tokens.color.surfaceSubtle,
              borderRadius: tokens.radii.md,
              border: `1px solid ${tokens.color.cardBorder}`,
            }}
          >
            <Typography variant="caption" tone="secondary">{label}</Typography>
            <Typography variant="title">{value}</Typography>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ marginBottom: tokens.spacing.lg }}>
        <BarChart data={data} />
      </div>

      {/* Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
          marginBottom: tokens.spacing.md,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: `2px solid ${tokens.color.borderDefault}`,
            }}
          >
            {['Product', 'Revenue', 'Units', 'Region'].map(col => (
              <th
                key={col}
                style={{
                  padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                  textAlign: col === 'Product' || col === 'Region' ? 'left' : 'right',
                  color: tokens.color.textSecondary,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, i) => (
            <tr
              key={row.product}
              style={{
                borderBottom: `1px solid ${tokens.color.cardBorder}`,
                background: i % 2 === 0 ? tokens.color.surface : tokens.color.surfaceSubtle,
              }}
            >
              <td
                style={{
                  padding: `${tokens.spacing.sm}px`,
                  color: tokens.color.textPrimary,
                  fontWeight: 500,
                }}
              >
                {row.product}
              </td>
              <td
                style={{
                  padding: `${tokens.spacing.sm}px`,
                  textAlign: 'right',
                  color: tokens.color.textPrimary,
                  fontFamily: tokens.font.mono,
                  fontSize: '0.8125rem',
                }}
              >
                {currency.format(row.revenue)}
              </td>
              <td
                style={{
                  padding: `${tokens.spacing.sm}px`,
                  textAlign: 'right',
                  color: tokens.color.textSecondary,
                }}
              >
                {row.units.toLocaleString()}
              </td>
              <td
                style={{
                  padding: `${tokens.spacing.sm}px`,
                  color: tokens.color.textSecondary,
                }}
              >
                {row.region}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" tone="secondary">
          Page {page} of {totalPages}
        </Typography>
        <div style={{ display: 'flex', gap: tokens.spacing.sm }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            style={{
              padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
              border: `1px solid ${tokens.color.borderDefault}`,
              borderRadius: tokens.radii.sm,
              background: page === 1 ? tokens.color.surfaceSubtle : tokens.color.surface,
              color: page === 1 ? tokens.color.textSecondary : tokens.color.textPrimary,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            Prev
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            style={{
              padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
              border: `1px solid ${tokens.color.borderDefault}`,
              borderRadius: tokens.radii.sm,
              background: page === totalPages ? tokens.color.surfaceSubtle : tokens.color.surface,
              color: page === totalPages ? tokens.color.textSecondary : tokens.color.textPrimary,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  );
}
