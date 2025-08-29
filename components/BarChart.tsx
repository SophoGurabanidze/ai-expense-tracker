'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ExpenseRecord {
  date: string;
  amount: number;
  category: string;
}

const CATEGORY_COLORS = [
  'rgba(54, 162, 235, 0.35)',
  'rgba(255, 99, 132, 0.35)',
  'rgba(255, 206, 86, 0.35)',
  'rgba(75, 192, 192, 0.35)',
  'rgba(153, 102, 255, 0.35)',
  'rgba(255, 159, 64, 0.35)',
] as const;

const CATEGORY_BORDERS = [
  'rgba(54, 162, 235, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
] as const;

const BarChart = ({ records }: { records: ExpenseRecord[] }) => 
  {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [windowWidth, setWindowWidth] = useState(1024);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = windowWidth < 640;

  // ---- Aggregate per day & per category ----
  type DayAgg = Record<string, number>;
  const dayMap = new Map<string, DayAgg>();
  const categorySet = new Set<string>();

  records.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getUTCDate()).padStart(2, '0')}`;

    categorySet.add(r.category);
    const agg = dayMap.get(key) ?? {};
    agg[r.category] = (agg[r.category] ?? 0) + r.amount;
    dayMap.set(key, agg);
  });

  const days = Array.from(dayMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const categories = Array.from(categorySet);

  const data: ChartData<'bar'> = {
    labels: days.map((d) => {
      const [, m, dd] = d.split('-');
      return `${m}/${dd}`;
    }),
    datasets: categories.map((cat, i) => ({
      label: cat,
      data: days.map((day) => dayMap.get(day)?.[cat] ?? 0),
      backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      borderColor: CATEGORY_BORDERS[i % CATEGORY_BORDERS.length],
      borderWidth: 1,
      borderRadius: 2,
      stack: 'total',
    })),
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: isDark ? '#e5e7eb' : '#374151' },
      },
      title: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDark ? 'rgba(31,41,55,0.95)' : 'rgba(255,255,255,0.95)',
        titleColor: isDark ? '#f9fafb' : '#1f2937',
        bodyColor: isDark ? '#d1d5db' : '#374151',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          // one line per category segment
          label: (ctx: TooltipItem<'bar'>): string => {
            const value = typeof ctx.parsed.y === 'number' ? ctx.parsed.y : 0;
            return `${ctx.dataset.label ?? 'Amount'}: $${value.toFixed(2)}`;
          },
          // footer shows day total
          footer: (items: TooltipItem<'bar'>[]): string => {
            const sum = items.reduce(
              (s, it) => s + (typeof it.parsed.y === 'number' ? it.parsed.y : 0),
              0
            );
            return `Total: $${sum.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          font: { size: isMobile ? 10 : 12 },
          color: isDark ? '#9ca3af' : '#7f8c8d',
          maxRotation: isMobile ? 45 : 0,
          minRotation: isMobile ? 45 : 0,
        },
        grid: { display: false },
        title: {
          display: true,
          text: 'Date',
          color: isDark ? '#d1d5db' : '#2c3e50',
          font: { size: isMobile ? 12 : 14, weight: 'bold' },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: isDark ? '#374151' : '#e0e0e0' },
        ticks: {
          color: isDark ? '#9ca3af' : '#7f8c8d',
          font: { size: isMobile ? 10 : 12 },
          callback: (value: number | string): string =>
            `$${typeof value === 'number' ? value : Number(value)}`,
        },
        title: {
          display: true,
          text: 'Amount ($)',
          color: isDark ? '#d1d5db' : '#2c3e50',
          font: { size: isMobile ? 12 : 16, weight: 'bold' },
        },
      },
    },
  };

  return (
    <div className="relative w-full h-64 sm:h-72 md:h-80">
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChart;
