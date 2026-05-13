import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import { SkeletonChatbotCard } from '../../components/ui/Skeleton';
import { getMyChatbotsApi, deleteChatbotApi } from '../../api/chatbot';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const StatusBadge = ({ isActive, t }) => (
  <span
    className="text-xs font-medium px-2.5 py-1 rounded-full"
    style={{
      background: isActive ? 'var(--success-bg)' : 'var(--bg-tertiary)',
      color: isActive ? 'var(--success)' : 'var(--text-3)',
    }}
  >
    {isActive ? t('activeStatus') : t('inactiveStatus')}
  </span>
);

const Chatbots = ({ onCreateClick, onEditClick }) => {
  const { user } = useAuth();
  const { t } = useSettings();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(null);

  // Fetches the authenticated client's chatbots
  const { data, isLoading } = useQuery({
    queryKey: ['chatbots'],
    queryFn: () => getMyChatbotsApi().then((r) => r.data),
  });

  const chatbots = data?.chatbots || [];

  // Limit based on the user's plan
  const limits = { trial: 1, pro: 1, premium: 2 };
  const limit = limits[user?.plan] ?? 1;
  const canCreate = chatbots.length < limit;

  // Mutation to delete a chatbot with confirmation
  const deleteMutation = useMutation({
    mutationFn: deleteChatbotApi,
    onSuccess: () => {
      queryClient.invalidateQueries(['chatbots']);
      toast.success(t('chatbotDeleted'));
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setDeleting(null);
    },
  });

  // Copies the public link to clipboard
  const copySlug = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${slug}`);
    toast.success(t('linkCopied'));
  };

  if (isLoading)
    return (
      <DashboardLayout title={t('chatbots')}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col gap-2">
            <div className="w-32 h-4 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} />
            <div className="w-24 h-3 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} />
          </div>
          <div className="w-28 h-9 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)' }} />
        </div>
        {/* Chatbot card skeletons — show up to 2 placeholder cards */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonChatbotCard key={i} />
          ))}
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout title={t('chatbots')}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-base md:text-lg font-semibold"
            style={{ color: 'var(--text-1)' }}
          >
            {t('yourChatbots')}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            {chatbots.length} / {limit} — {user?.plan} plan
          </p>
        </div>
        {canCreate && (
          <Button onClick={onCreateClick} size="md">
            <Plus size={15} />
            <span className="hidden sm:inline">{t('newChatbot')}</span>
            <span className="sm:hidden">{t('addService')}</span>
          </Button>
        )}
      </div>

      {chatbots.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 rounded border"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-secondary)',
          }}
        >
          <MessageSquare
            size={36}
            className="mb-4"
            style={{ color: 'var(--text-3)' }}
          />
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-1)' }}
          >
            {t('noChatbots')}
          </p>
          <p
            className="text-xs mb-5 text-center px-6"
            style={{ color: 'var(--text-3)' }}
          >
            {t('noChatbotsHint')}
          </p>
          <Button onClick={onCreateClick} size="md">
            <Plus size={15} />
            {t('createChatbot')}
          </Button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {chatbots.map((bot, i) => (
              <motion.div
                key={bot.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.05 }}
                className="rounded border p-4 md:p-5"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border)',
                }}
              >
                {/* Top row — info and badge */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                    style={{
                      background: bot.color + '22',
                      border: `1.5px solid ${bot.color}`,
                    }}
                  >
                    <MessageSquare size={16} style={{ color: bot.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-1)' }}
                    >
                      {bot.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {bot.services?.length || 0} {t('services')} ·{' '}
                      {bot.steps?.length || 0} {t('steps')}
                    </p>
                  </div>
                  <StatusBadge isActive={bot.isActive} t={t} />
                </div>

                {/* Bottom row — actions */}
                <div
                  className="flex items-center gap-2 pt-3 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copySlug(bot.slug)}
                  >
                    <Copy size={14} />
                    <span className="hidden sm:inline">{t('copyLink')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/chat/${bot.slug}`, '_blank')}
                  >
                    <ExternalLink size={14} />
                    <span className="hidden sm:inline">{t('preview')}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditClick(bot)}
                  >
                    <Edit size={14} />
                    {t('edit')}
                  </Button>
                  <div className="ml-auto">
                    {deleting === bot.id ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs hidden sm:inline"
                          style={{ color: 'var(--text-3)' }}
                        >
                          {t('sure')}
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(bot.id)}
                        >
                          {t('delete')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(null)}
                        >
                          {t('cancel')}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(bot.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Limit reached notice */}
      {!canCreate && chatbots.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 px-4 py-3 rounded text-xs"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-3)',
            border: '0.5px solid var(--border)',
          }}
        >
          {t('limitReached', user?.plan)} {t('upgradePremium')}
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default Chatbots;
