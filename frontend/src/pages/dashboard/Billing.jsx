import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Check, ExternalLink, Zap, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import {
  createCheckoutApi,
  createPortalApi,
  syncPlanApi,
} from '../../api/stripe';

const PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Gratis',
    oldPrice: null,
    period: '7 días',
    color: 'var(--text-3)',
    features: [
      '1 chatbot',
      'Reservas online 24/7',
      'Email de confirmación',
      'Calendario básico',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '34,99 €',
    oldPrice: '39,99 €',
    period: '/mes',
    color: 'var(--accent)',
    popular: true,
    savings: 'Ahorras 5 €/mes',
    features: [
      '1 chatbot',
      'Todo lo del Trial',
      'Colores y marca propia',
      'Recordatorios WhatsApp',
      'Soporte prioritario',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '79,99 €',
    oldPrice: '110 €',
    period: '/mes',
    color: 'var(--success)',
    savings: 'Ahorras 30 €/mes',
    features: [
      'Hasta 3 chatbots',
      'Todo lo del Pro',
      'Analíticas avanzadas',
      'Integración CRM',
      'Acceso API',
      'Soporte dedicado',
    ],
  },
];

const Billing = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);

  // Maneja redirección de Stripe tras el pago
  const payment = searchParams.get('payment');
  useEffect(() => {
    if (payment === 'success') {
      navigate('/dashboard/billing', { replace: true });
      const sync = async () => {
        setSyncing(true);
        try {
          await syncPlanApi();
          await refreshUser();
          toast.success('¡Plan actualizado correctamente!');
        } catch {
          toast.success('¡Pago completado! Recarga si el plan no se actualiza.');
        } finally {
          setSyncing(false);
        }
      };
      sync();
    }
    if (payment === 'cancelled') {
      toast('Pago cancelado.', { icon: 'ℹ️' });
      navigate('/dashboard/billing', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const handleUpgrade = async (planId) => {
    try {
      setLoadingPlan(planId);
      const { data } = await createCheckoutApi(planId);

      // Caso downgrade programado — el cambio se aplica al final del período
      if (data?.upgraded && data?.scheduled) {
        await refreshUser();
        setPendingChange({ plan: planId, periodEnd: data.periodEnd });
        toast.success(data.message || 'Cambio de plan programado');
        setLoadingPlan(null);
        return;
      }

      // Caso upgrade — la suscripción se actualizó en Stripe sin checkout
      if (data?.upgraded) {
        await refreshUser();
        toast.success('Plan actualizado');
        setLoadingPlan(null);
        return;
      }

      // Caso primera suscripción — redirigimos al checkout de Stripe
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      toast.error('Respuesta inesperada del servidor');
      setLoadingPlan(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Error al iniciar el pago',
      );
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    try {
      setLoadingPortal(true);
      const { data } = await createPortalApi();
      window.location.href = data.url;
    } catch (err) {
      toast.error(
        err?.response?.data?.error || 'Error al abrir el portal de facturación',
      );
      setLoadingPortal(false);
    }
  };

  const trialDaysLeft = user?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const hasPaidPlan = ['pro', 'premium'].includes(user?.plan);

  return (
    <DashboardLayout title="Facturación">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Banner — plan actual */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-5"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'var(--text-3)' }}
              >
                {syncing ? 'Sincronizando plan...' : 'Plan actual'}
              </p>
              <p
                className="text-xl font-black capitalize"
                style={{ color: 'var(--text-1)' }}
              >
                {user?.plan}
              </p>
              {user?.plan === 'trial' && trialDaysLeft !== null && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock
                    size={11}
                    style={{
                      color:
                        trialDaysLeft <= 2 ? 'var(--error)' : 'var(--text-3)',
                    }}
                  />
                  <p
                    className="text-xs"
                    style={{
                      color:
                        trialDaysLeft <= 2 ? 'var(--error)' : 'var(--text-3)',
                    }}
                  >
                    {trialDaysLeft > 0
                      ? `${trialDaysLeft} día(s) restantes en tu prueba gratuita`
                      : 'Tu prueba gratuita ha expirado'}
                  </p>
                </div>
              )}
            </div>
            {hasPaidPlan && (
              <Button
                variant="secondary"
                size="sm"
                loading={loadingPortal}
                onClick={handlePortal}
              >
                <ExternalLink size={13} />
                Gestionar suscripción
              </Button>
            )}
          </div>

          {pendingChange && (
            <div
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
              }}
            >
              <Clock size={12} />
              <span>
                Tu plan cambiará a{' '}
                <strong className="capitalize">{pendingChange.plan}</strong>{' '}
                {pendingChange.periodEnd
                  ? `el ${new Date(pendingChange.periodEnd).toLocaleDateString(
                      'es-ES',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      },
                    )}`
                  : 'al final del período actual'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Tarjetas de plan */}
        {PLANS.map((plan, i) => {
          const isCurrent = user?.plan === plan.id;
          const isDowngrade = plan.id === 'trial';
          const canUpgrade = !isCurrent && !isDowngrade;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl border p-5 relative"
              style={{
                background: isCurrent
                  ? 'var(--accent-bg)'
                  : 'var(--bg-secondary)',
                borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                boxShadow: isCurrent ? '0 0 0 1px var(--accent)' : 'none',
              }}
            >
              {/* Savings badge */}
              {plan.savings && !isCurrent && (
                <div
                  className="absolute top-4 right-4 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                  style={{
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                  }}
                >
                  {plan.savings}
                </div>
              )}

              {/* Nombre y badge */}
              <div className="flex items-center gap-2 mb-2">
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: plan.color }}
                >
                  {plan.name}
                </p>
                {isCurrent && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Actual
                  </span>
                )}
                {plan.popular && !isCurrent && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      color: 'var(--accent)',
                      borderColor: 'var(--accent)',
                    }}
                  >
                    Popular
                  </span>
                )}
              </div>

              {/* Precio */}
              <div className="flex items-end gap-2 mb-4">
                <span
                  className="text-2xl font-black"
                  style={{ color: 'var(--text-1)' }}
                >
                  {plan.price}
                </span>
                {plan.oldPrice && (
                  <span
                    className="text-sm line-through mb-0.5"
                    style={{ color: 'var(--text-3)' }}
                  >
                    {plan.oldPrice}
                  </span>
                )}
                <span
                  className="text-xs mb-1"
                  style={{ color: 'var(--text-3)' }}
                >
                  {plan.period}
                </span>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2 mb-5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: isCurrent
                          ? 'var(--accent)'
                          : 'var(--bg-tertiary)',
                      }}
                    >
                      <Check
                        size={10}
                        style={{ color: isCurrent ? '#fff' : plan.color }}
                      />
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-2)' }}
                    >
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              {/* Botón de upgrade — inferior izquierdo */}
              {canUpgrade && (
                <Button
                  size="sm"
                  loading={loadingPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  <Zap size={12} />
                  Actualizar
                </Button>
              )}
            </motion.div>
          );
        })}

        {/* Nota informativa */}
        <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
          Los pagos son procesados de forma segura por Stripe. Puedes cancelar
          en cualquier momento.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
