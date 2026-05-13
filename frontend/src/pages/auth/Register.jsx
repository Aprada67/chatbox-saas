import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Check, Zap } from 'lucide-react';
import { SignUp } from '@clerk/clerk-react';
import { preCheckoutApi } from '../../api/stripe';
import { useSettings } from '../../context/SettingsContext';
import Button from '../../components/ui/Button';

const getPlans = (t) => [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Free',
    period: '7 days',
    color: 'var(--text-3)',
    cta: t('registerTrialCta'),
    note: t('registerCardRequired'),
    features: ['1 ServeBot', 'Online bookings 24/7', 'Email confirmation', 'Basic calendar'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€34.99',
    oldPrice: '€39.99',
    period: '/month',
    color: 'var(--accent)',
    popular: true,
    cta: t('registerProCta'),
    note: t('registerBilledMonthly'),
    features: ['1 ServeBot', 'Everything in Trial', 'Custom colors & branding', 'Priority support'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '€54.99',
    oldPrice: '€79.99',
    period: '/month',
    color: 'var(--success)',
    cta: t('registerPremiumCta'),
    note: t('registerBilledMonthly'),
    features: ['Up to 2 ServeBots', 'Everything in Pro', 'Advanced analytics', 'Dedicated support'],
  },
];

const Register = () => {
  const [searchParams] = useSearchParams();
  const { t } = useSettings();

  const sessionId = searchParams.get('session_id');
  const planFromUrl = searchParams.get('plan');

  const initialStep = sessionId ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const PLANS = getPlans(t);
  const selectedPlan = planFromUrl || 'trial';
  const planMeta = PLANS.find((p) => p.id === selectedPlan) || PLANS[0];

  // Store session_id in localStorage so Dashboard can apply it after sign-up
  if (sessionId && step === 2) {
    localStorage.setItem('pendingStripeSession', JSON.stringify({ sessionId, plan: selectedPlan }));
  }

  const handlePickPlan = async (planId) => {
    try {
      setLoadingPlan(planId);
      const { data } = await preCheckoutApi(planId);
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      toast.error(t('unexpectedResponse'));
      setLoadingPlan(null);
    } catch (err) {
      toast.error(err?.message || t('errorStartingPayment'));
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`w-full ${step === 1 ? 'max-w-5xl' : 'max-w-md'}`}
      >
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-(--text-1) tracking-tight">{t('registerChoosePlan')}</h1>
              <p className="text-sm text-(--text-3) mt-2">{t('registerChoosePlanSub')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="rounded border p-5 relative flex flex-col"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: plan.popular ? 'var(--accent)' : 'var(--border)',
                    boxShadow: plan.popular ? '0 0 0 1px var(--accent)' : 'none',
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
                      MOST POPULAR
                    </div>
                  )}
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: plan.color }}>{plan.name}</p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-black" style={{ color: 'var(--text-1)' }}>{plan.price}</span>
                    {plan.oldPrice && <span className="text-sm line-through mb-1" style={{ color: 'var(--text-3)' }}>{plan.oldPrice}</span>}
                    <span className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>{plan.period}</span>
                  </div>
                  <p className="text-xs mb-5" style={{ color: 'var(--text-3)' }}>{plan.note}</p>
                  <div className="flex flex-col gap-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--bg-tertiary)' }}>
                          <Check size={10} style={{ color: plan.color }} />
                        </div>
                        <span className="text-xs leading-snug" style={{ color: 'var(--text-2)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Button size="md" variant={plan.popular ? 'primary' : 'secondary'} loading={loadingPlan === plan.id} onClick={() => handlePickPlan(plan.id)} className="w-full">
                    {plan.id !== 'trial' && <Zap size={13} />}
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-sm text-(--text-3) mt-8">
              {t('registerAlreadyAccount')}{' '}
              <Link to="/login" className="text-(--accent) link-underline">{t('logIn')}</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-(--text-1) tracking-tight">{t('registerCreateAccount')}</h1>
              <p className="text-sm text-(--text-3) mt-2">
                {t('registerSelectedPlan')}: <strong style={{ color: 'var(--accent)' }}>{planMeta.name}</strong>
              </p>
            </div>
            <SignUp routing="hash" afterSignUpUrl="/dashboard" signInUrl="/login" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Register;
