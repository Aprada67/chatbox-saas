import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Search, Shield, ShieldOff, ChevronDown } from 'lucide-react';
import AdminLayout from './AdminLayout';
import Button from '../../components/ui/Button';
import api from '../../api/axios';

// Colores por plan
const PLAN_COLORS = {
  trial: { bg: 'var(--bg-tertiary)', color: 'var(--text-3)' },
  pro: { bg: 'var(--accent-bg)', color: 'var(--accent)' },
  premium: { bg: 'var(--success-bg)', color: 'var(--success)' },
};

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  // Obtiene todos los usuarios del sistema
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
  });

  const users = data?.users || [];

  // Filtra usuarios por búsqueda y plan
  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    return matchSearch && matchPlan;
  });

  // Cambia el plan de un usuario
  const planMutation = useMutation({
    mutationFn: ({ id, plan }) =>
      api.patch(`/admin/users/${id}/plan`, { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Plan updated');
    },
    onError: (err) => toast.error(err.message),
  });

  // Activa o desactiva la cuenta de un usuario
  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success(data.data.message);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading)
    return (
      <AdminLayout title="Users">
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
    <AdminLayout title="Users">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Input de búsqueda */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-3)' }}
          />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px' }}
          />
        </div>

        {/* Filtro por plan */}
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          style={{ fontSize: '13px', padding: '9px 12px', width: 'auto' }}
        >
          <option value="all">All plans</option>
          <option value="trial">Trial</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* Contador de resultados */}
      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
        {filtered.length} user(s) found
      </p>

      {/* Lista de usuarios */}
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border overflow-hidden"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border)',
              }}
            >
              {/* Fila principal del usuario */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar con inicial */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold text-white"
                    style={{
                      background: user.isActive
                        ? 'var(--accent)'
                        : 'var(--text-3)',
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info del usuario */}
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{
                        color: user.isActive
                          ? 'var(--text-1)'
                          : 'var(--text-3)',
                      }}
                    >
                      {user.name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Badge de plan y botón expandir */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full capitalize hidden sm:inline"
                    style={{
                      background: PLAN_COLORS[user.plan]?.bg,
                      color: PLAN_COLORS[user.plan]?.color,
                    }}
                  >
                    {user.plan}
                  </span>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === user.id ? null : user.id)
                    }
                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{
                      color: 'var(--text-3)',
                      background: 'var(--bg-tertiary)',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: expandedId === user.id ? 180 : 0 }}
                    >
                      <ChevronDown size={14} />
                    </motion.div>
                  </button>
                </div>
              </div>

              {/* Panel expandible con acciones */}
              <AnimatePresence>
                {expandedId === user.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-4 pt-0 border-t flex flex-col sm:flex-row gap-3"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {/* Info adicional */}
                      <div className="flex-1 pt-3 flex flex-col gap-1">
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-3)' }}
                        >
                          Joined:{' '}
                          {new Date(user.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            },
                          )}
                        </p>
                        {user.trialEndsAt && (
                          <p
                            className="text-xs"
                            style={{ color: 'var(--text-3)' }}
                          >
                            Trial ends:{' '}
                            {new Date(user.trialEndsAt).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </p>
                        )}
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-3)' }}
                        >
                          Status:{' '}
                          <span
                            style={{
                              color: user.isActive
                                ? 'var(--success)'
                                : 'var(--error)',
                            }}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                      </div>

                      {/* Acciones del usuario */}
                      <div className="flex flex-col gap-2 sm:items-end pt-3">
                        {/* Selector de plan */}
                        <select
                          value={user.plan}
                          onChange={(e) =>
                            planMutation.mutate({
                              id: user.id,
                              plan: e.target.value,
                            })
                          }
                          style={{
                            fontSize: '12px',
                            padding: '6px 10px',
                            width: 'auto',
                          }}
                        >
                          <option value="trial">Trial</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>

                        {/* Toggle de cuenta activa/inactiva */}
                        <Button
                          variant={user.isActive ? 'danger' : 'secondary'}
                          size="sm"
                          loading={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate(user.id)}
                        >
                          {user.isActive ? (
                            <>
                              <ShieldOff size={13} /> Deactivate
                            </>
                          ) : (
                            <>
                              <Shield size={13} /> Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Estado vacío */}
        {filtered.length === 0 && (
          <div
            className="py-16 text-center rounded-2xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              No users found
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
