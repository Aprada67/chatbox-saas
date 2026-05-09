import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { forgotPasswordApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await forgotPasswordApi(data.email);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message);
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
            Recover password
          </h1>
          <p className="text-sm text-(--text-3) mt-2">
            We'll send you a link to reset it
          </p>
        </div>

        <Card>
          {submitted ? (
            <div className="flex flex-col gap-4">
              <p
                className="text-sm text-center"
                style={{ color: 'var(--text-2)' }}
              >
                If an account exists for that email, you'll receive a recovery
                link.
              </p>
              <Link
                to="/login"
                className="text-center text-sm text-(--accent) link-underline"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
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
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="mt-2 w-full"
                >
                  Send link
                </Button>
              </form>

              <p className="text-center text-sm text-(--text-3) mt-5">
                Remembered your password?{' '}
                <Link to="/login" className="text-(--accent) link-underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
