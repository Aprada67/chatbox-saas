import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import AdminLayout from './AdminLayout';
import KpiCard from '../../components/ui/KpiCard';
import api from '../../api/axios';

const AdminDashboard = () => {
  // Obtiene las estadísticas generales del sistema
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const stats = data?.stats;

  if (isLoading)
    return (
      <AdminLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-48">
          <span
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: 'var(--accent)',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout title="Admin Dashboard">
      {/* KPIs generales del sistema */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <KpiCard
          title="Total users"
          value={stats?.totalUsers}
          subtitle="registered clients"
          icon={Users}
        />
        <KpiCard
          title="Chatbots"
          value={stats?.totalChatbots}
          subtitle="created"
          icon={MessageSquare}
        />
        <KpiCard
          title="Appointments"
          value={stats?.totalAppointments}
          subtitle="total"
          icon={Calendar}
        />
        <KpiCard
          title="Active plans"
          value={stats?.byPlan?.find((p) => p.plan === 'pro')?.count || 0}
          subtitle="pro subscribers"
          icon={TrendingUp}
          color="var(--success)"
        />
      </div>

      {/* Distribución de planes */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-1)' }}
          >
            Plan distribution
          </h2>
        </div>

        <div className="p-5 flex flex-col gap-3">
          {['trial', 'pro', 'premium'].map((plan, i) => {
            // Calcula el porcentaje de cada plan
            const count =
              stats?.byPlan?.find((p) => p.plan === plan)?.count || 0;
            const total = stats?.totalUsers || 1;
            const percent = Math.round((count / total) * 100);
            const colors = {
              trial: 'var(--text-3)',
              pro: 'var(--accent)',
              premium: 'var(--success)',
            };
            return (
              <motion.div
                key={plan}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs font-medium capitalize"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {plan}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {count} users · {percent}%
                  </span>
                </div>
                {/* Barra de progreso del plan */}
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: colors[plan] }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
