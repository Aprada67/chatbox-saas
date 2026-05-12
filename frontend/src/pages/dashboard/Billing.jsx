import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Check, ExternalLink, Zap, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import { SkeletonPlanCard } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  createCheckoutApi,
  createPortalApi,
  syncPlanApi,
  upgradePreviewApi,
} from '../../api/stripe';

const PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Free',
    oldPrice: null,
    period: '7 days',
    color: 'var(--text-3)',
    features: [
      '1 ServeBot',
      'Online bookings 24/7',
      'Email confirmation',
      'Basic calendar',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€34.99',
    oldPrice: '€39.99',
    period: '/month',
    color: 'var(--accent)',
    popular: true,
    savings: 'Save €5/month',
    features: [
      '1 ServeBot',
      'Everything in Trial',
      'Custom colors & branding',
      'WhatsApp reminders',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '€54.99',
    oldPrice: '€79.99',
    period: '/month',
    color: 'var(--success)',
    savings: 'Save €55/month',
    features: [
      'Up to 2 ServeBots',
      'Everything in Pro',
      'Advanced analytics',
      'Dedicated support',
    ],
  },
];

const Billing = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useSettings();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [confirm, setConfirm] = useState(null); // { plan, amount, currency, isProration, periodEnd }

  // Handles Stripe redirect after payment
  const payment = searchParams.get('payment');
  useEffect(() => {
    if (payment === 'success') {
      navigate('/dashboard/billing', { replace: true });
      const sync = async () => {
        setSyncing(true);
        try {
          await syncPlanApi();
          await refreshUser();
          toast.success(t('planUpdatedSuccess'));
        } catch {
          toast(t('paymentCompletedReload'), { icon: 'ℹ️' });
        } finally {
          setSyncing(false);
        }
      };
      sync();
    }
    if (payment === 'cancelled') {
      toast(t('paymentCancelled'), { icon: 'ℹ️' });
      navigate('/dashboard/billing', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  // Step 1 — fetch charge preview and show confirmation modal
  const handleUpgrade = async (planId) => {
    try {
      setLoadingPlan(planId);
      const { data } = await upgradePreviewApi(planId);
      setConfirm({ plan: planId, ...data });
      setLoadingPlan(null);
    } catch (err) {
      console.error('Preview error:', err);
      toast.error(err?.message || t('errorFetchingPlanDetails'));
      setLoadingPlan(null);
    }
  };

  // Step 2 — user confirmed, apply the upgrade
  const handleConfirm = async () => {
    const planId = confirm.plan;
    setConfirm(null);
    try {
      setLoadingPlan(planId);
      const { data } = await createCheckoutApi(planId);

      if (data?.upgraded && data?.scheduled) {
        await refreshUser();
        setPendingChange({ plan: planId, periodEnd: data.periodEnd });
        toast.success(data.message || t('planChangeScheduled'));
        setLoadingPlan(null);
        return;
      }

      if (data?.upgraded) {
        await refreshUser();
        toast.success(t('planUpdated'));
        setLoadingPlan(null);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      toast.error(t('unexpectedResponse'));
      setLoadingPlan(null);
    } catch (err) {
      console.error('Upgrade error:', err);
      toast.error(err?.message || t('errorProcessingPayment'));
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
        err?.response?.data?.error || t('errorOpeningPortal'),
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

  // Show skeleton when auth user data is still being loaded or plan is syncing
  if (!user || syncing)
    return (
      <DashboardLayout title="Billing">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">
          {/* Current plan banner skeleton */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-20 h-2.5 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
                <div className="w-16 h-6 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
                <div className="w-32 h-2.5 animate-pulse rounded-lg" style={{ background: 'var(--bg-tertiary)' }} />
              </div>
              <div className="w-32 h-9 animate-pulse rounded-xl" style={{ background: 'var(--bg-tertiary)' }} />
            </div>
          </div>

          {/* Plan card skeletons — one per plan */}
          {PLANS.map((plan) => (
            <SkeletonPlanCard key={plan.id} features={plan.features.length} />
          ))}
        </div>
      </DashboardLayout>
    );

  const formatAmount = (amount, currency) =>
    new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency?.toUpperCase() || 'EUR',
    }).format(amount / 100);

  return (
    <DashboardLayout title="Billing">
      {/* Confirmation modal */}
      {confirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => !loadingPlan && setConfirm(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="rounded-2xl border p-6 w-full max-w-sm"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-1)' }}>
              {(() => {
                const RANK = { trial: 0, pro: 1, premium: 2 };
                const action = (RANK[confirm.plan] ?? 0) > (RANK[user?.plan] ?? 0) ? 'Upgrade' : 'Downgrade';
                return `Confirm ${action.toLowerCase()} to ${confirm.plan.charAt(0).toUpperCase() + confirm.plan.slice(1)}`;
              })()}
            </h3>

            <div
              className="rounded-xl p-4 my-4 text-center"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>
                  {confirm.isProration ? 'Charged now (prorated)' : 'Charged now'}
                </p>
                <p className="text-3xl font-black" style={{ color: 'var(--text-1)' }}>
                  {formatAmount(confirm.amount, confirm.currency)}
                </p>
                {confirm.isTrialEnd && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                    Your current trial will end immediately and you'll be charged now.
                  </p>
                )}
                {confirm.isProration && confirm.periodEnd && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                    Credit applied for unused days of your current plan.
                    Full price from {new Date(confirm.periodEnd).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}.
                  </p>
                )}
              </>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" loading={!!loadingPlan} onClick={handleConfirm}>
                <Zap size={13} />
                Confirm
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {/* Banner — current plan */}
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
                {syncing ? 'Syncing plan...' : 'Current plan'}
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
                      ? `${trialDaysLeft} day(s) remaining in your free trial`
                      : 'Your free trial has expired'}
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
                Manage subscription
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
                Your plan will change to{' '}
                <strong className="capitalize">{pendingChange.plan}</strong>{' '}
                {pendingChange.periodEnd
                  ? `on ${new Date(pendingChange.periodEnd).toLocaleDateString(
                      'en-US',
                      {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      },
                    )}`
                  : 'at the end of the current period'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Plan cards */}
        {PLANS.map((plan, i) => {
          const RANK = { trial: 0, pro: 1, premium: 2 };
          const isCurrent = user?.plan === plan.id;
          const currentRank = RANK[user?.plan] ?? 0;
          const planRank = RANK[plan.id] ?? 0;
          const isUpgrade = !isCurrent && planRank > currentRank;
          const isDowngrade = !isCurrent && planRank < currentRank && plan.id !== 'trial';

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

              {/* Name and badge */}
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
                    Current
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

              {isUpgrade && (
                <Button
                  size="sm"
                  loading={loadingPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  <Zap size={12} />
                  Upgrade
                </Button>
              )}
              {isDowngrade && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={loadingPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  Downgrade
                </Button>
              )}
            </motion.div>
          );
        })}

        {/* Nota informativa */}
        <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
          Payments are securely processed by Stripe. You can cancel at any time.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
