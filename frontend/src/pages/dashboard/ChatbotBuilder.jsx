import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { createChatbotApi, updateChatbotApi } from '../../api/chatbot';
import { useSettings } from '../../context/SettingsContext';

// Colores disponibles para personalizar el chatbot
const COLORS = [
  '#3b82f6',
  '#1D9E75',
  '#8b5cf6',
  '#e24b4b',
  '#f59e0b',
  '#ec4899',
  '#0ea5e9',
  '#A0522D',
  '#64748b',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
];

// Schema de validación del formulario
const schema = z.object({
  name: z.string().min(3, 'Minimum 3 characters'),
  welcomeMessage: z.string().min(5, 'Minimum 5 characters'),
  language: z.string().default('en'),
});

// Genera un servicio vacío con ID único
const emptyService = () => ({
  id: Date.now(),
  name: '',
  price: '',
  durationMins: 30,
});

// Genera un paso vacío con orden asignado
const emptyStep = (order) => ({
  id: Date.now(),
  order,
  question: '',
  type: 'service',
});

const ChatbotBuilder = ({ chatbot, onBack }) => {
  const queryClient = useQueryClient();
  const { t } = useSettings();
  const isEditing = !!chatbot;

  // Estado de servicios, pasos y color
  const [services, setServices] = useState(
    chatbot?.services || [emptyService()],
  );
  const [steps, setSteps] = useState(chatbot?.steps || [emptyStep(1)]);
  const [color, setColor] = useState(chatbot?.color || '#3b82f6');
  // Tab activo en móvil
  const [activeTab, setActiveTab] = useState('info');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: chatbot?.name || '',
      welcomeMessage: chatbot?.welcomeMessage || '',
      language: chatbot?.language || 'en',
    },
  });

  // Mutación para crear o editar el chatbot
  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing ? updateChatbotApi(chatbot.id, data) : createChatbotApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatbots']);
      toast.success(t(isEditing ? 'chatbotUpdated' : 'chatbotCreated'));
      onBack();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data) => {
    const validServices = services.filter((s) => s.name.trim());
    const validSteps = steps.filter((s) => s.question.trim());
    if (validServices.length === 0) return toast.error(t('atLeastOneService'));
    if (validSteps.length === 0) return toast.error(t('atLeastOneStep'));
    mutation.mutate({
      ...data,
      color,
      services: validServices,
      steps: validSteps,
    });
  };

  // Funciones de servicios
  const addService = () => setServices((p) => [...p, emptyService()]);
  const removeService = (id) =>
    setServices((p) => p.filter((s) => s.id !== id));
  const updateService = (id, field, value) =>
    setServices((p) =>
      p.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );

  // Funciones de pasos
  const addStep = () => setSteps((p) => [...p, emptyStep(p.length + 1)]);
  const removeStep = (id) => setSteps((p) => p.filter((s) => s.id !== id));
  const updateStep = (id, field, value) =>
    setSteps((p) => p.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const moveStep = (id, dir) => {
    const idx = steps.findIndex((s) => s.id === id);
    const next = idx + dir;
    if (next < 0 || next >= steps.length) return;
    const arr = [...steps];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setSteps(arr.map((s, i) => ({ ...s, order: i + 1 })));
  };

  // Tab labels for mobile nav
  const TABS = [
    { id: 'info', label: t('basicInfo') },
    {
      id: 'services',
      label: t('services').charAt(0).toUpperCase() + t('services').slice(1),
    },
    { id: 'flow', label: t('flow') },
  ];

  // Panel de info básica
  const infoPanel = (
    <div className="flex flex-col gap-4">
      <Card>
        <h3
          className="text-sm font-semibold mb-4"
          style={{ color: 'var(--text-1)' }}
        >
          {t('basicInfo')}
        </h3>
        <div className="flex flex-col gap-4">
          <Input
            label={t('chatbotName')}
            placeholder={t('chatbotNamePH')}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label={t('welcomeMsg')}
            placeholder={t('welcomeMsgPH')}
            error={errors.welcomeMessage?.message}
            {...register('welcomeMessage')}
          />
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: 'var(--text-3)' }}
            >
              {t('chatbotLang')}
            </label>
            <select
              className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{
                background: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-1)',
              }}
              {...register('language')}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Selector de color */}
      <Card>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--text-1)' }}
        >
          {t('chatColor')}
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-8 h-8 rounded-full transition-all"
              style={{
                background: c,
                border:
                  color === c
                    ? '3px solid var(--text-1)'
                    : '3px solid transparent',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
        </div>
        {/* Preview del color */}
        <div
          className="mt-4 rounded-xl p-3 flex items-center gap-2"
          style={{ background: color + '18', border: `1px solid ${color}44` }}
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span className="text-xs" style={{ color }}>
            {color}
          </span>
        </div>
      </Card>
    </div>
  );

  // Panel de servicios
  const servicesPanel = (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--text-1)' }}
        >
          {t('services').charAt(0).toUpperCase() + t('services').slice(1)}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={addService}>
          <Plus size={13} /> {t('addService')}
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {services.map((svc) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border p-3 flex flex-col gap-2"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-tertiary)',
              }}
            >
              <input
                placeholder={t('serviceName')}
                value={svc.name}
                onChange={(e) => updateService(svc.id, 'name', e.target.value)}
                style={{ fontSize: '13px', padding: '7px 10px' }}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={t('priceLabel')}
                  value={svc.price}
                  onChange={(e) =>
                    updateService(svc.id, 'price', e.target.value)
                  }
                  style={{ fontSize: '13px', padding: '7px 10px' }}
                />
                <input
                  type="number"
                  placeholder={t('minsLabel')}
                  value={svc.durationMins}
                  onChange={(e) =>
                    updateService(svc.id, 'durationMins', e.target.value)
                  }
                  style={{ fontSize: '13px', padding: '7px 10px' }}
                />
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(svc.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0"
                    style={{
                      color: 'var(--error)',
                      background: 'var(--error-bg)',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );

  // Panel del flujo
  const flowPanel = (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--text-1)' }}
        >
          {t('convFlow')}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={addStep}>
          <Plus size={13} /> {t('addStep')}
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border p-3 flex flex-col gap-2"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-tertiary)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-3)' }}
                >
                  {t('stepLabel', i + 1)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveStep(step.id, -1)}
                    disabled={i === 0}
                    className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(step.id, 1)}
                    disabled={i === steps.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                    style={{ color: 'var(--text-3)' }}
                  >
                    <ChevronDown size={13} />
                  </button>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      className="w-6 h-6 flex items-center justify-center rounded"
                      style={{ color: 'var(--error)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
              <input
                placeholder={t('questionPH')}
                value={step.question}
                onChange={(e) =>
                  updateStep(step.id, 'question', e.target.value)
                }
                style={{ fontSize: '13px', padding: '7px 10px' }}
              />
              <select
                value={step.type}
                onChange={(e) => updateStep(step.id, 'type', e.target.value)}
                style={{ fontSize: '13px', padding: '7px 10px' }}
              >
                <option value="service">{t('serviceSelection')}</option>
                <option value="day">{t('daySelection')}</option>
                <option value="time">{t('timeSelection')}</option>
                <option value="info">{t('customInfo')}</option>
              </select>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );

  return (
    <DashboardLayout
      title={t(isEditing ? 'editChatbotTitle' : 'newChatbotTitle')}
    >
      {/* Botón volver */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm mb-5 transition-all"
        style={{ color: 'var(--text-3)' }}
      >
        <ArrowLeft size={15} />
        {t('backToChatbots')}
      </button>

      {/* Tabs de navegación — solo en móvil */}
      <div
        className="flex lg:hidden gap-1 mb-5 p-1 rounded-xl"
        style={{
          background: 'var(--bg-secondary)',
          border: '0.5px solid var(--border)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background:
                activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-3)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Layout unificado — grid en desktop, panel único en móvil */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className={activeTab !== 'info' ? 'hidden lg:block' : ''}>
            {infoPanel}
          </div>
          <div className={activeTab !== 'services' ? 'hidden lg:block' : ''}>
            {servicesPanel}
          </div>
          <div className={activeTab !== 'flow' ? 'hidden lg:block' : ''}>
            {flowPanel}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onBack}>
            {t('cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t(isEditing ? 'saveChanges' : 'createChatbot')}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default ChatbotBuilder;
