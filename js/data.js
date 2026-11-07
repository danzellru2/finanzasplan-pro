/**
 * Data management and persistence layer for FinanzasPlan Pro
 * Enhanced with Granular Income and Expense Breakdown Capabilities
 */

const STORAGE_KEY = 'FINANZAS_PLAN_PRO_STATE_V2';

// Initial default state based exactly on user's prompt
const DEFAULT_STATE = {
  config: {
    weeklyIncome: 3599,
    monthlyRent: 2000,
    categories: [
      {
        id: 'cat_rent',
        name: 'Renta (Apartado Semanal)',
        description: 'Cubre tus $2,000 mensuales de renta ($500 x 4 semanas)',
        amount: 500,
        icon: 'fa-house-user',
        color: '#6366f1',
        isFixed: true
      },
      {
        id: 'cat_food',
        name: 'Comida y Despensa',
        description: 'Alimentación semanal, mercado y despensa básica',
        amount: 800,
        icon: 'fa-utensils',
        color: '#10b981',
        isFixed: false
      },
      {
        id: 'cat_transport',
        name: 'Transporte y Pasajes',
        description: 'Camiones, metro, gasolina o pasajes para llegar a tiempo',
        amount: 400,
        icon: 'fa-bus',
        color: '#06b6d4',
        isFixed: false
      },
      {
        id: 'cat_services',
        name: 'Servicios Básicos & Celular',
        description: 'Recargas telefónicas, luz, agua o aportaciones',
        amount: 200,
        icon: 'fa-bolt',
        color: '#f59e0b',
        isFixed: false
      },
      {
        id: 'cat_personal',
        name: 'Gustos y Gastos Personales',
        description: 'Café, salidas, gustos personales u ocio',
        amount: 0,
        icon: 'fa-mug-hot',
        color: '#ec4899',
        isFixed: false
      }
    ]
  },
  debts: [
    {
      id: 'debt_600',
      name: 'Deuda Menor ($600)',
      description: 'Deuda pequeña prioritaria (Estrategia bola de nieve)',
      total: 600,
      paid: 0,
      priority: 1,
      category: 'personal',
      createdAt: new Date().toISOString()
    },
    {
      id: 'debt_1000',
      name: 'Deuda Mediana (~$1,000)',
      description: 'Compromiso pendiente de pago',
      total: 1000,
      paid: 0,
      priority: 2,
      category: 'personal',
      createdAt: new Date().toISOString()
    },
    {
      id: 'debt_3000',
      name: 'Préstamo Principal ($3,000)',
      description: 'Dinero prestado por devolver',
      total: 3000,
      paid: 0,
      priority: 3,
      category: 'prestamo',
      createdAt: new Date().toISOString()
    }
  ],
  goals: [
    {
      id: 'goal_phone',
      name: 'Teléfono Móvil (Gama Alta)',
      category: 'phone',
      icon: 'fa-mobile-screen-button',
      target: 10000,
      saved: 0,
      priority: 1,
      targetWeek: 9,
      notes: 'Presupuesto de $10,000 para compra de contado sin intereses'
    },
    {
      id: 'goal_tablet_1',
      name: 'Tablet 1 (Productividad / Estudio)',
      category: 'tablet',
      icon: 'fa-tablet-screen-button',
      target: 10000,
      saved: 0,
      priority: 2,
      targetWeek: 15,
      notes: 'Ej. iPad 10 / Galaxy Tab S9 FE'
    },
    {
      id: 'goal_tablet_2',
      name: 'Tablet 2 (Personal / Familiar)',
      category: 'tablet',
      icon: 'fa-tablet',
      target: 10000,
      saved: 0,
      priority: 3,
      targetWeek: 21,
      notes: 'Segunda tablet de $10,000 de contado'
    }
  ],
  weeklyLogs: [
    {
      id: 'log_week_1_plan',
      weekNumber: 1,
      label: 'Semana 1 (Planificada)',
      income: 3599,
      rent: 500,
      livingExpenses: 1400,
      debtPayment: 1600,
      goalSavings: 99,
      date: new Date().toLocaleDateString('es-MX'),
      notes: 'Sueldo completo por asistencia y puntualidad perfecta'
    }
  ]
};

// Global App State
let appState = null;

/**
 * Load state from localStorage or seed defaults with auto-migration
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('FINANZAS_PLAN_PRO_STATE_V1');
    if (raw) {
      appState = JSON.parse(raw);
      // Auto-migrate if categories array is missing
      if (!appState.config.categories || !Array.isArray(appState.config.categories)) {
        appState.config.categories = JSON.parse(JSON.stringify(DEFAULT_STATE.config.categories));
      }
      saveState();
    } else {
      appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveState();
    }
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
  return appState;
}

/**
 * Save current state to localStorage
 */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

/**
 * Total expenses calculation from categories
 */
function getTotalWeeklyExpenses() {
  if (!appState || !appState.config || !appState.config.categories) return 1900;
  return appState.config.categories.reduce((acc, cat) => acc + (parseFloat(cat.amount) || 0), 0);
}

/**
 * Free available weekly flow calculation
 */
function getWeeklyAvailableFlow() {
  if (!appState || !appState.config) return 1699;
  const income = parseFloat(appState.config.weeklyIncome) || 0;
  const expenses = getTotalWeeklyExpenses();
  return Math.max(0, income - expenses);
}

/**
 * Format number to MXN currency
 */
function formatMoney(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/**
 * Export state as JSON file
 */
function exportDataJSON() {
  const jsonStr = JSON.stringify(appState, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `FinanzasPlan_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Respaldo descargado exitosamente', 'success');
}

/**
 * Import state from JSON file
 */
function importDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.debts && data.goals && data.config) {
        appState = data;
        if (!appState.config.categories) {
          appState.config.categories = JSON.parse(JSON.stringify(DEFAULT_STATE.config.categories));
        }
        saveState();
        closeModal('settingsModal');
        showToast('Respaldo importado con éxito', 'success');
        initApp();
      } else {
        alert('El archivo no tiene el formato válido de FinanzasPlan.');
      }
    } catch (err) {
      alert('Error al leer el archivo JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/**
 * Reset to initial plan state
 */
function resetToInitialState() {
  if (confirm('¿Seguro que deseas restablecer todos los datos a la configuración inicial del plan?')) {
    appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    closeModal('settingsModal');
    showToast('Plan restablecido a los valores iniciales', 'info');
    initApp();
  }
}
