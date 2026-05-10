import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { forgotPasswordApi, resetPasswordApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const emailSchema = z.object({
  email: z.string().email('Invalid email'),
});

const resetSchema = z.object({
  password: z.string().min(8, 'Minimum 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'done'
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(() => Array(CODE_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const resetForm = useForm({ resolver: zodResolver(resetSchema) });

  useEffect(() => {
    if (step === 'code') inputsRef.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSendCode = async ({ email: e }) => {
    try {
      await forgotPasswordApi(e);
      setEmail(e);
      setDigits(Array(CODE_LENGTH).fill(''));
      setCooldown(RESEND_COOLDOWN);
      setStep('code');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await forgotPasswordApi(email);
      setDigits(Array(CODE_LENGTH).fill(''));
      setCooldown(RESEND_COOLDOWN);
      toast.success('Code resent. Check your inbox.');
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
    }
  };

  const focusInput = (idx) => {
    if (idx < 0 || idx >= CODE_LENGTH) return;
    inputsRef.current[idx]?.focus();
    inputsRef.current[idx]?.select?.();
  };

  const handleDigitChange = (idx, value) => {
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
        setDigits((prev) => { const n = [...prev]; n[idx] = ''; return n; });
      } else if (idx > 0) {
        setDigits((prev) => { const n = [...prev]; n[idx - 1] = ''; return n; });
        focusInput(idx - 1);
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); focusInput(idx - 1); }
    if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) { e.preventDefault(); focusInput(idx + 1); }
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < CODE_LENGTH && i < text.length; i++) next[i] = text[i];
    setDigits(next);
    focusInput(Math.min(text.length, CODE_LENGTH) - 1);
  };

  const code = digits.join('');
  const isCodeComplete = code.length === CODE_LENGTH && /^\d{6}$/.test(code);

  const onResetPassword = async ({ password }) => {
    if (!isCodeComplete) {
      toast.error('Enter all 6 digits');
      return;
    }
    try {
      await resetPasswordApi({ email, code, password });
      toast.success('Password updated successfully');
      setStep('done');
    } catch (err) {
      toast.error(err.message || 'Incorrect or expired code');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
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
            {step === 'done' ? 'Password updated' : 'Reset password'}
          </h1>
          <p className="text-sm text-(--text-3) mt-2">
            {step === 'email' && "We'll send you a 6-digit code"}
            {step === 'code' && <>Code sent to <strong style={{ color: 'var(--text-2)' }}>{email}</strong></>}
            {step === 'done' && 'You can now sign in with your new password'}
          </p>
        </div>

        <Card>
          {/* Step 1 — Email */}
          {step === 'email' && (
            <>
              <form onSubmit={emailForm.handleSubmit(onSendCode)} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  error={emailForm.formState.errors.email?.message}
                  {...emailForm.register('email')}
                />
                <Button
                  type="submit"
                  size="lg"
                  loading={emailForm.formState.isSubmitting}
                  className="mt-2 w-full"
                >
                  Send code
                </Button>
              </form>
              <p className="text-center text-sm text-(--text-3) mt-5">
                Remembered your password?{' '}
                <Link to="/login" className="text-(--accent) link-underline">Log in</Link>
              </p>
            </>
          )}

          {/* Step 2 — Code + new password */}
          {step === 'code' && (
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="flex flex-col gap-5">
              {/* 6-digit code input */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>
                  Verification code
                </p>
                <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
                  {digits.map((d, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onFocus={(e) => e.target.select()}
                      className="w-11 h-13 text-center text-xl font-bold rounded-xl border outline-none transition-colors bg-(--bg-tertiary) text-(--text-1) focus:border-(--accent) border-(--border)"
                      style={{ caretColor: 'var(--accent)' }}
                    />
                  ))}
                </div>
              </div>

              <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                error={resetForm.formState.errors.password?.message}
                {...resetForm.register('password')}
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                error={resetForm.formState.errors.confirm?.message}
                {...resetForm.register('confirm')}
              />

              <Button
                type="submit"
                size="lg"
                loading={resetForm.formState.isSubmitting}
                disabled={!isCodeComplete}
                className="w-full"
              >
                Update password
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                  className="text-sm cursor-pointer bg-transparent border-0 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: 'var(--accent)' }}
                >
                  {cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : resending ? 'Resending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3 — Done */}
          {step === 'done' && (
            <Link
              to="/login"
              className="block text-center text-sm text-(--accent) link-underline"
            >
              Back to login
            </Link>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
