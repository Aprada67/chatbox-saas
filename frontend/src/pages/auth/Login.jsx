import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { loginApi, resendVerificationApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useSettings();

  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await loginApi(data);
      login(res.data.token, res.data.user);
      toast.success(t('welcomeBack'));
      const role = res.data.user.role;
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.message);
      if (err.status === 403) {
        // Email no verificado — redirige a la página de verificación con código
        const email = getValues('email') || '';
        if (email && /verifica/i.test(err.message || '')) {
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setResendEmail(email);
        setShowResend(true);
      }
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error(t('enterYourEmail'));
      return;
    }
    setResending(true);
    try {
      await resendVerificationApi(resendEmail);
      toast.success(t('codeResent'));
      navigate(`/verify-email?email=${encodeURIComponent(resendEmail)}`);
    } catch (err) {
      toast.error(err.message);
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
            Sign In
          </h1>
          <p className="text-sm text-(--text-3) mt-2">Welcome back</p>
        </div>

        <Card>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="mt-2 w-full"
            >
              Sign In
            </Button>
          </form>

          {showResend && (
            <div
              className="mt-4 p-3 rounded-xl border"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-tertiary)',
              }}
            >
              <form onSubmit={handleResend} className="flex flex-col gap-3">
                <p className="text-xs text-(--text-3)">
                  Resend verification code to:
                </p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  loading={resending}
                  className="w-full"
                >
                  Resend code
                </Button>
              </form>
            </div>
          )}

          <p className="text-center text-sm text-(--text-3) mt-4">
            <Link
              to="/forgot-password"
              className="text-(--accent) link-underline"
            >
              Forgot your password?
            </Link>
          </p>

          <p className="text-center text-sm text-(--text-3) mt-3">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-(--accent) link-underline">
              Register
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
