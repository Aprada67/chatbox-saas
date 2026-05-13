const base = {
  elements: {
    rootBox: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      boxShadow: 'none',
      borderRadius: '8px',
      padding: '28px 32px',
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    headerSubtitle: {
      fontSize: '13px',
    },
    socialButtonsBlockButton: {
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'border-color 0.15s',
    },
    dividerText: {
      fontSize: '12px',
    },
    formFieldLabel: {
      fontSize: '12px',
      fontWeight: '500',
      marginBottom: '4px',
    },
    formFieldInput: {
      borderRadius: '4px',
      fontSize: '14px',
      padding: '10px 14px',
      transition: 'border-color 0.15s',
    },
    formButtonPrimary: {
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      letterSpacing: '0',
      textTransform: 'none',
      boxShadow: 'none',
      padding: '10px 16px',
      transition: 'opacity 0.15s',
    },
    footer: {
      background: 'transparent',
    },
    footerPages: {
      borderRadius: '0 0 8px 8px',
    },
    userButtonPopoverFooter: {
      display: 'none',
    },
    otpCodeFieldInput: {
      borderRadius: '4px',
    },
  },
}

export const clerkAppearanceDark = {
  ...base,
  variables: {
    colorBackground: '#080808',
    colorInputBackground: '#101010',
    colorText: '#e8edf5',
    colorTextSecondary: '#94a3b8',
    colorInputText: '#e8edf5',
    colorPrimary: '#7c3aed',
    colorDanger: '#e24b4b',
    colorSuccess: '#1D9E75',
    colorNeutral: '#e8edf5',
    borderRadius: '4px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    fontSize: '14px',
  },
  elements: {
    ...base.elements,
    card: {
      ...base.elements.card,
      background: '#080808',
      border: '0.5px solid #1c1c1c',
    },
    socialButtonsBlockButton: {
      ...base.elements.socialButtonsBlockButton,
      background: '#101010',
      border: '0.5px solid #1c1c1c',
      color: '#e8edf5',
    },
    socialButtonsBlockButtonText: { color: '#e8edf5', fontWeight: '500' },
    dividerLine: { background: '#1c1c1c' },
    dividerText: { ...base.elements.dividerText, color: '#5a6a82' },
    formFieldAction: { color: '#7c3aed', fontSize: '12px' },
    footerActionLink: { color: '#7c3aed', fontWeight: '500' },
    footerAction: { color: '#5a6a82', fontSize: '13px' },
    footerPages: { ...base.elements.footerPages, background: '#080808' },
    alert: {
      background: '#130808',
      border: '0.5px solid rgba(226,75,75,0.2)',
      borderRadius: '4px',
    },
    otpCodeFieldInput: {
      ...base.elements.otpCodeFieldInput,
      background: '#101010',
      border: '0.5px solid #1c1c1c',
      color: '#e8edf5',
    },
    userButtonPopoverCard: {
      background: '#080808',
      border: '0.5px solid #1c1c1c',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      borderRadius: '8px',
    },
    userButtonPopoverActionButton: { color: '#e8edf5', borderRadius: '4px' },
    userButtonPopoverActionButtonText: { color: '#e8edf5' },
    badge: {
      background: '#120d22',
      color: '#7c3aed',
      border: '0.5px solid rgba(124,58,237,0.3)',
    },
  },
}

export const clerkAppearanceLight = {
  ...base,
  variables: {
    colorBackground: '#ffffff',
    colorInputBackground: '#f1f5f9',
    colorText: '#0f172a',
    colorTextSecondary: '#475569',
    colorInputText: '#0f172a',
    colorPrimary: '#7c3aed',
    colorDanger: '#ef4444',
    colorSuccess: '#16a34a',
    colorNeutral: '#0f172a',
    borderRadius: '4px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    fontSize: '14px',
  },
  elements: {
    ...base.elements,
    card: {
      ...base.elements.card,
      background: '#ffffff',
      border: '0.5px solid #e2e8f0',
    },
    socialButtonsBlockButton: {
      ...base.elements.socialButtonsBlockButton,
      background: '#f1f5f9',
      border: '0.5px solid #e2e8f0',
      color: '#0f172a',
    },
    socialButtonsBlockButtonText: { color: '#0f172a', fontWeight: '500' },
    dividerLine: { background: '#e2e8f0' },
    dividerText: { ...base.elements.dividerText, color: '#94a3b8' },
    formFieldAction: { color: '#7c3aed', fontSize: '12px' },
    footerActionLink: { color: '#7c3aed', fontWeight: '500' },
    footerAction: { color: '#94a3b8', fontSize: '13px' },
    footerPages: { ...base.elements.footerPages, background: '#ffffff' },
    alert: {
      background: '#fef2f2',
      border: '0.5px solid rgba(239,68,68,0.2)',
      borderRadius: '4px',
    },
    otpCodeFieldInput: {
      ...base.elements.otpCodeFieldInput,
      background: '#f1f5f9',
      border: '0.5px solid #e2e8f0',
      color: '#0f172a',
    },
    userButtonPopoverCard: {
      background: '#ffffff',
      border: '0.5px solid #e2e8f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      borderRadius: '8px',
    },
    userButtonPopoverActionButton: { color: '#0f172a', borderRadius: '4px' },
    userButtonPopoverActionButtonText: { color: '#0f172a' },
  },
}
