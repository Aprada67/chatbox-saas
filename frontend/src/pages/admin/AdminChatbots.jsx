import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Search, MessageSquare, Edit, X, Save } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useSettings } from '../../context/SettingsContext';
import Button from '../../components/ui/Button';
import { SkeletonAdminChatbotRow } from '../../components/ui/Skeleton';
import api from '../../api/axios';

const AdminChatbots = () => {
  const queryClient = useQueryClient();
  const { t } = useSettings();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});

  // Fetches all chatbots in the system
  const { data, isLoading } = useQuery({
    queryKey: ['admin-chatbots'],
    queryFn: () => api.get('/admin/chatbots').then((r) => r.data),
  });

  const chatbots = data?.chatbots || [];

  // Filters chatbots by name or slug
  const filtered = chatbots.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  // Opens the editor with the selected chatbot's data
  const handleEdit = (chatbot) => {
    setEditing(chatbot.id);
    setEditData({
      name: chatbot.name,
      welcomeMessage: chatbot.welcomeMessage || '',
      isActive: chatbot.isActive,
    });
  };

  // Saves changes to the edited chatbot
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/admin/chatbots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chatbots']);
      toast.success(t('chatbotUpdated'));
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading)
    return (
      <AdminLayout title="ServeBots">
        {/* Search bar skeleton */}
        <div className="relative mb-5">
          <div className="w-full h-10 animate-pulse rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }} />
        </div>
        <div className="w-32 h-3 animate-pulse rounded mb-4" style={{ background: 'var(--bg-tertiary)' }} />

        {/* Chatbot row skeletons */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonAdminChatbotRow key={i} />
          ))}
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout title="ServeBots">
      {/* Search bar */}
      <div className="relative mb-5">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-3)' }}
        />
        <input
          placeholder="Search by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '34px', fontSize: '13px' }}
        />
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>
        {filtered.length} ServeBot(s) found
      </p>

      {/* Chatbot list */}
      <div className="flex flex-col gap-3">
        {filtered.map((bot, i) => (
          <motion.div
            key={bot.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded border p-4"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Main row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Chatbot icon with its color */}
                <div
                  className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                  style={{
                    background: (bot.color || '#3b82f6') + '22',
                    border: `1.5px solid ${bot.color || '#3b82f6'}`,
                  }}
                >
                  <MessageSquare
                    size={15}
                    style={{ color: bot.color || '#3b82f6' }}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-1)' }}
                  >
                    {bot.name}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: 'var(--text-3)' }}
                  >
                    /{bot.slug}
                  </p>
                </div>
              </div>

              {/* Status badge and edit button */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full hidden sm:inline"
                  style={{
                    background: bot.isActive
                      ? 'var(--success-bg)'
                      : 'var(--bg-tertiary)',
                    color: bot.isActive ? 'var(--success)' : 'var(--text-3)',
                  }}
                >
                  {bot.isActive ? 'Active' : 'Inactive'}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(bot)}
                >
                  <Edit size={13} />
                  Edit
                </Button>
              </div>
            </div>

            {/* Inline edit panel */}
            <AnimatePresence>
              {editing === bot.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-4 pt-4 border-t flex flex-col gap-3"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {/* Name field */}
                    <div>
                      <label
                        className="text-xs font-medium uppercase tracking-wide mb-1.5 block"
                        style={{ color: 'var(--text-3)' }}
                      >
                        Name
                      </label>
                      <input
                        value={editData.name}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, name: e.target.value }))
                        }
                        style={{ fontSize: '13px' }}
                      />
                    </div>

                    {/* Welcome message field */}
                    <div>
                      <label
                        className="text-xs font-medium uppercase tracking-wide mb-1.5 block"
                        style={{ color: 'var(--text-3)' }}
                      >
                        Welcome message
                      </label>
                      <input
                        value={editData.welcomeMessage}
                        onChange={(e) =>
                          setEditData((p) => ({
                            ...p,
                            welcomeMessage: e.target.value,
                          }))
                        }
                        style={{ fontSize: '13px' }}
                      />
                    </div>

                    {/* Active status toggle */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm"
                        style={{ color: 'var(--text-2)' }}
                      >
                        Active
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditData((p) => ({ ...p, isActive: !p.isActive }))
                        }
                        className="w-10 h-6 rounded-full transition-all relative cursor-pointer"
                        style={{
                          background: editData.isActive
                            ? 'var(--accent)'
                            : 'var(--border)',
                        }}
                      >
                        <motion.div
                          animate={{ x: editData.isActive ? 18 : 2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 justify-end mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(null)}
                      >
                        <X size={13} />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        loading={editMutation.isPending}
                        onClick={() =>
                          editMutation.mutate({ id: bot.id, data: editData })
                        }
                      >
                        <Save size={13} />
                        Save
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div
            className="py-16 text-center rounded border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-secondary)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              No ServeBots found
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminChatbots;
