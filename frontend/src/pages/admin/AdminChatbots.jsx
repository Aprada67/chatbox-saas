import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Search, MessageSquare, Edit, X, Save } from 'lucide-react';
import AdminLayout from './AdminLayout';
import Button from '../../components/ui/Button';
import api from '../../api/axios';

const AdminChatbots = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});

  // Obtiene todos los chatbots del sistema
  const { data, isLoading } = useQuery({
    queryKey: ['admin-chatbots'],
    queryFn: () => api.get('/admin/chatbots').then((r) => r.data),
  });

  const chatbots = data?.chatbots || [];

  // Filtra chatbots por nombre o slug
  const filtered = chatbots.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()),
  );

  // Abre el editor con los datos del chatbot seleccionado
  const handleEdit = (chatbot) => {
    setEditing(chatbot.id);
    setEditData({
      name: chatbot.name,
      welcomeMessage: chatbot.welcomeMessage || '',
      isActive: chatbot.isActive,
    });
  };

  // Guarda los cambios del chatbot editado
  const editMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/admin/chatbots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-chatbots']);
      toast.success('Chatbot updated');
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading)
    return (
      <AdminLayout title="Chatbots">
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
    <AdminLayout title="Chatbots">
      {/* Barra de búsqueda */}
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
        {filtered.length} chatbot(s) found
      </p>

      {/* Lista de chatbots */}
      <div className="flex flex-col gap-3">
        {filtered.map((bot, i) => (
          <motion.div
            key={bot.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border p-4"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
            }}
          >
            {/* Fila principal */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Ícono del chatbot con su color */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
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

              {/* Badge de estado y botón editar */}
              <div className="flex items-center gap-2 flex-shrink-0">
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

            {/* Panel de edición inline */}
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
                    {/* Campo nombre */}
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

                    {/* Campo mensaje de bienvenida */}
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

                    {/* Toggle de estado activo */}
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
                        className="w-10 h-6 rounded-full transition-all relative"
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

                    {/* Botones de acción */}
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
              No chatbots found
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminChatbots;