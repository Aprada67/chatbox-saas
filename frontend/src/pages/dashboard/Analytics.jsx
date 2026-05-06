import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import KpiCard from '../../components/ui/KpiCard';
import { getMyChatbotsApi } from '../../api/chatbot';
import { getAppointmentStatsApi } from '../../api/appointments';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const Analytics = () => {
  const { user } = useAuth();
  const { t, formatDate } = useSettings();

  const isPremium = user?.plan === 'premium';

  // 1) Get the user's chatbots — we use the first one
  const { data: chatbotsData } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getMyChatbotsApi().then((r) => r.data),
  });

  const chatbots = chatbotsData?.chatbots || [];
  const chatbotId = chatbots[0]?.id;

  // 2) Fetch advanced stats for that chatbot
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['appointmentStats', chatbotId],
    queryFn: () => getAppointmentStatsApi(chatbotId).then((r) => r.data),
    enabled: !!chatbotId,
  });

  const summary = statsData?.summary || {
    total: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    revenue: 0,
  };
  const byDay = statsData?.byDay || [];
  const topServices = statsData?.topServices || [];
  const cancellationRate = statsData?.cancellationRate ?? 0;

  // Max value used to scale the bar chart
  const maxCount = byDay.reduce((m, d) => (d.count > m ? d.count : m), 0) || 1;

  return (
    <DashboardLayout title={t('analytics')}>
      {/* Upgrade banner for trial / pro users */}
      {!isPremium && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3"
          style={{
            background: 'var(--accent-bg)',
            color: 'var(--accent)',
            border: '0.5px solid var(--accent)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={14} className="shrink-0" />
            <span className="truncate">{t('upgradeForAnalytics')}</span>
          </div>
          <Link
            to="/dashboard/billing"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{
              background: 'var(--accent)',
              color: 'white',
            }}
          >
            {t('billing')}
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      )}

      {/* KPI cards row — Total, Revenue, Confirmed, Cancellation rate */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <KpiCard
          title={t('total')}
          value={summary.total}
          subtitle={t('appointments')}
          icon={Calendar}
        />
        <KpiCard
          title={t('revenue')}
          value={isPremium ? `${summary.revenue} €` : '—'}
          subtitle={isPremium ? t('last30Days') : t('upgradeForAnalytics')}
          icon={DollarSign}
          color="var(--success)"
        />
        <KpiCard
          title={t('confirmed')}
          value={summary.confirmed}
          subtitle={t('appointments')}
          icon={CheckCircle}
          color="var(--success)"
        />
        <KpiCard
          title={t('cancellationRate')}
          value={isPremium ? `${cancellationRate}%` : '—'}
          subtitle={`${summary.cancelled} ${t('cancelled')}`}
          icon={XCircle}
          color="var(--error)"
        />
      </div>

      {/* Premium-only sections */}
      {isPremium && (
        <>
          {/* Bar chart — last 30 days */}
          <div
            className="rounded-2xl border overflow-hidden mb-6"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="px-4 md:px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: 'var(--text-1)' }}
              >
                {t('last30Days')}
              </h2>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                {summary.total} {t('total').toLowerCase()}
              </span>
            </div>

            <div className="px-4 md:px-5 py-5">
              {isLoading ? (
                <div
                  className="h-40 rounded-lg animate-pulse"
                  style={{ background: 'var(--bg-tertiary)' }}
                />
              ) : (
                <>
                  {/* Bars row */}
                  <div className="flex items-end gap-1 h-40">
                    {byDay.map((d, i) => {
                      const heightPct = (d.count / maxCount) * 100;
                      return (
                        <motion.div
                          key={d.date}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(heightPct, 2)}%` }}
                          transition={{ delay: i * 0.01, duration: 0.4 }}
                          className="flex-1 rounded-t-md"
                          style={{
                            background:
                              d.count > 0
                                ? 'var(--accent)'
                                : 'var(--bg-tertiary)',
                            minHeight: 4,
                          }}
                          title={`${d.date}: ${d.count}`}
                        />
                      );
                    })}
                  </div>

                  {/* Day labels — every 5 days */}
                  <div className="flex gap-1 mt-2">
                    {byDay.map((d, i) => (
                      <div
                        key={d.date}
                        className="flex-1 text-center text-[10px]"
                        style={{ color: 'var(--text-3)' }}
                      >
                        {i % 5 === 0
                          ? formatDate(new Date(d.date), {
                              day: 'numeric',
                              month: 'short',
                            })
                          : ''}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Top services table */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="px-4 md:px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2
                className="text-sm font-semibold"
                style={{ color: 'var(--text-1)' }}
              >
                {t('topServices')}
              </h2>
            </div>

            {topServices.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Calendar
                  size={28}
                  className="mx-auto mb-3"
                  style={{ color: 'var(--text-3)' }}
                />
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                  {t('noAppts')}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr
                    className="border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <th
                      className="text-left text-xs font-medium uppercase tracking-wide px-4 md:px-5 py-3"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {t('service')}
                    </th>
                    <th
                      className="text-right text-xs font-medium uppercase tracking-wide px-4 md:px-5 py-3"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {t('total')}
                    </th>
                    <th
                      className="text-right text-xs font-medium uppercase tracking-wide px-4 md:px-5 py-3"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {t('revenue')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topServices.map((s, i) => (
                    <motion.tr
                      key={s.service}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b last:border-b-0"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <td
                        className="px-4 md:px-5 py-3 text-sm font-medium"
                        style={{ color: 'var(--text-1)' }}
                      >
                        {s.service}
                      </td>
                      <td
                        className="px-4 md:px-5 py-3 text-sm text-right"
                        style={{ color: 'var(--text-2)' }}
                      >
                        {s.count}
                      </td>
                      <td
                        className="px-4 md:px-5 py-3 text-sm text-right font-medium"
                        style={{ color: 'var(--success)' }}
                      >
                        {s.revenue} €
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Analytics;
