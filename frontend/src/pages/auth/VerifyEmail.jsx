import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { verifyCodeApi, resendVerificationApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const VerifyEmail = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useSettings();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputsRef = useRef([]);

  // Auto-focus on the first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Cooldown countdown for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // If there is no email in the URL we cannot verify
  useEffect(() => {
    if (!email) {
      toast.error(t('missingEmailRegister'));
    }
  }, [email]);

  const focusInput = (idx) => {
    if (idx < 0 || idx >= CODE_LENGTH) return;
    inputsRef.current[idx]?.focus();
    inputsRef.current[idx]?.select?.();
  };

  const handleChange = (idx, value) => {
    // Digits only, max 1 character
    const v = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && idx < CODE_LENGTH - 1) focusInput(idx + 1);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        // Clear current digit
        setDigits((prev) => {
          const next = [...prev];
          next[idx] = '';
          return next;
        });
      } else if (idx > 0) {
        // If current is empty, go back and clear the previous
        setDigits((prev) => {
          const next = [...prev];
          next[idx - 1] = '';
          return next;
        });
        focusInput(idx - 1);
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      focusInput(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) {
      e.preventDefault();
      focusInput(idx + 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < CODE_LENGTH && i < text.length; i++) {
      next[i] = text[i];
    }
    setDigits(next);
    const lastFilled = Math.min(text.length, CODE_LENGTH) - 1;
    focusInput(Math.min(Math.max(lastFilled, 0), CODE_LENGTH - 1));
  };

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && /^\d{6}$/.test(code);

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!email) {
      toast.error(t('missingEmail'));
      return;
    }
    if (!isComplete) {
      toast.error(t('enter6Digits'));
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await verifyCodeApi({ email, code });
      login(data.token, data.user);
      toast.success(t('accountVerified'));
      navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.message || t('incorrectExpiredCode'));
      setDigits(Array(CODE_LENGTH).fill(''));
      focusInput(0);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await resendVerificationApi(email);
      toast.success(t('codeResent'));
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(err.message || t('errorResendingCode'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-(--text-1) tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-(--text-3) mt-2">
            Enter the 6-digit code we sent to{' '}
            <strong style={{ color: 'var(--text-2)' }}>
              {email || 'your email'}
            </strong>
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div
              className="flex items-center justify-center gap-2"
              onPaste={handlePaste}
            >
              {digits.map((d, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onFocus={(e) => e.target.select()}
                  className="
                    w-12 h-14 text-center text-2xl font-bold rounded-xl border outline-none transition-colors
                    bg-(--bg-tertiary) text-(--text-1)
                    focus:border-(--accent)
                    border-(--border)
                  "
                  style={{ caretColor: 'var(--accent)' }}
                />
              ))}
            </div>

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={!isComplete}
              className="w-full"
            >
              Verify
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-(--text-3) mb-2">Didn't receive it?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
              className="text-sm cursor-pointer bg-transparent border-0 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: 'var(--accent)' }}
            >
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : resending
                  ? 'Resending...'
                  : 'Resend code'}
            </button>
          </div>

          <p className="text-center text-sm text-(--text-3) mt-5">
            <Link to="/login" className="text-(--accent) link-underline">
              Back to login
            </Link>
          </p>
        </Card>

        <p
          className="text-center text-xs mt-5"
          style={{ color: 'var(--text-3)' }}
        >
          The code expires in 15 minutes.
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
