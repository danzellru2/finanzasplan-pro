/**
 * Charts and Data Visualizations using Chart.js for FinanzasPlan Pro
 * Enhanced with Dynamic Category Rendering and Reactive Recalculations
 */

let budgetChartInstance = null;
let growthChartInstance = null;
let monthlyChartInstance = null;
let debtBurnDownInstance = null;

/**
 * Initialize all charts
 */
function initCharts() {
  renderBudgetDoughnut();
  renderGrowthLineChart();
  renderMonthlyComparisonChart();
  renderDebtBurnDownChart();
}

/**
 * Doughnut chart: Dynamic weekly budget allocation across all categories
 */
function renderBudgetDoughnut() {
  const ctx = document.getElementById('budgetDoughnutChart')?.getContext('2d');
  if (!ctx) return;

  if (budgetChartInstance) {
    budgetChartInstance.destroy();
  }

  const categories = appState.config.categories || [];
  const available = getWeeklyAvailableFlow();

  const labels = [];
  const data = [];
  const bgColors = [];

  categories.forEach(cat => {
    const amt = parseFloat(cat.amount) || 0;
    if (amt > 0) {
      labels.push(`${cat.name}`);
      data.push(amt);
      bgColors.push(cat.color || '#64748b');
    }
  });

  // Add free flow if positive
  if (available > 0) {
    labels.push('Flujo Libre (Deudas / Ahorro)');
    data.push(available);
    bgColors.push('#10b981'); // Brand Emerald
  }

  budgetChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#0c1017'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0c1017',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#1e293b',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              const total = data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((val / total) * 100) : 0;
              return ` ${context.label}: ${formatMoney(val)} (${pct}%)`;
            }
          }
        }
      },
      cutout: '72%'
    }
  });
}

/**
 * Line chart: 22-week trajectory (Debt Burn-down vs Gadget Accumulation)
 * Reacts directly to current available weekly flow
 */
function renderGrowthLineChart() {
  const ctx = document.getElementById('growthLineChart')?.getContext('2d');
  if (!ctx) return;

  if (growthChartInstance) {
    growthChartInstance.destroy();
  }

  const weeks = [];
  const debtCurve = [];
  const savingsCurve = [];

  const weeklySurplus = getWeeklyAvailableFlow();
  
  // Calculate total initial active debt
  let remainingDebt = 0;
  appState.debts.forEach(d => {
    remainingDebt += Math.max(0, d.total - d.paid);
  });
  // If all are already paid, show standard projection from total
  if (remainingDebt === 0) remainingDebt = 4600;

  let accumulatedSavings = 0;

  for (let w = 0; w <= 22; w++) {
    weeks.push('Sem ' + w);

    if (w === 0) {
      debtCurve.push(remainingDebt);
      savingsCurve.push(0);
      continue;
    }

    if (weeklySurplus <= 0) {
      debtCurve.push(remainingDebt);
      savingsCurve.push(accumulatedSavings);
      continue;
    }

    if (remainingDebt > 0) {
      if (weeklySurplus >= remainingDebt) {
        const leftover = weeklySurplus - remainingDebt;
        remainingDebt = 0;
        accumulatedSavings += leftover;
      } else {
        remainingDebt -= weeklySurplus;
      }
    } else {
      accumulatedSavings += weeklySurplus;
    }

    debtCurve.push(Math.round(remainingDebt));
    savingsCurve.push(Math.round(accumulatedSavings));
  }

  growthChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [
        {
          label: 'Deuda Restante',
          data: debtCurve,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 2.5,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f43f5e'
        },
        {
          label: 'Ahorro Gadgets ($30k)',
          data: savingsCurve,
          borderColor: '#22d3ee',
          backgroundColor: 'rgba(34, 211, 238, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointBackgroundColor: '#22d3ee'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#cbd5e1',
            font: { size: 11, family: 'Plus Jakarta Sans', weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: '#0c1017',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: '#1e293b',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatMoney(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#94a3b8', font: { size: 10, family: 'JetBrains Mono' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10, family: 'JetBrains Mono' },
            callback: function(value) {
              return '$' + (value / 1000) + 'k';
            }
          }
        }
      }
    }
  });
}

/**
 * Bar chart: Monthly breakdown (approx 4.33 weeks)
 */
function renderMonthlyComparisonChart() {
  const ctx = document.getElementById('monthlyComparisonChart')?.getContext('2d');
  if (!ctx) return;

  if (monthlyChartInstance) {
    monthlyChartInstance.destroy();
  }

  const factor = 4.333; // Average weeks per month
  const weeklyIncome = parseFloat(appState.config.weeklyIncome) || 0;
  const incomeMonthly = Math.round(weeklyIncome * factor);

  const rentCategory = (appState.config.categories || []).find(c => c.id === 'cat_rent');
  const rentWeekly = rentCategory ? (parseFloat(rentCategory.amount) || 0) : 500;
  const rentMonthly = Math.round(rentWeekly * 4); // 4 weeks cover full rent

  const otherExpensesWeekly = getTotalWeeklyExpenses() - rentWeekly;
  const otherExpensesMonthly = Math.round(otherExpensesWeekly * factor);

  const surplusWeekly = getWeeklyAvailableFlow();
  const surplusMonthly = Math.max(0, incomeMonthly - rentMonthly - otherExpensesMonthly);

  monthlyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ingreso Total', 'Renta Mensual', 'Gastos de Vida', 'Flujo Libre Mensual'],
      datasets: [{
        data: [incomeMonthly, rentMonthly, otherExpensesMonthly, surplusMonthly],
        backgroundColor: [
          '#10b981',
          '#6366f1',
          '#64748b',
          '#06b6d4'
        ],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1017',
          borderColor: '#1e293b',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              return ' ' + formatMoney(context.raw);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#cbd5e1', font: { size: 10, family: 'Plus Jakarta Sans', weight: '600' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10, family: 'JetBrains Mono' },
            callback: function(v) { return '$' + (v / 1000) + 'k'; }
          }
        }
      }
    }
  });
}

/**
 * Area / Line chart: Step-by-step debt elimination
 */
function renderDebtBurnDownChart() {
  const ctx = document.getElementById('debtBurnDownChart')?.getContext('2d');
  if (!ctx) return;

  if (debtBurnDownInstance) {
    debtBurnDownInstance.destroy();
  }

  const flow = getWeeklyAvailableFlow() || 1699;
  let remaining = 4600;
  const points = [remaining];
  const labels = ['Inicio'];

  for (let s = 1; s <= 4; s++) {
    labels.push('Semana ' + s);
    remaining = Math.max(0, remaining - flow);
    points.push(Math.round(remaining));
  }

  debtBurnDownInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Saldo de Deuda',
        data: points,
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.15)',
        fill: true,
        tension: 0.25,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f43f5e'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1017',
          borderColor: '#1e293b',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(c) {
              return ` Saldo Pendiente: ${formatMoney(c.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#94a3b8', font: { size: 10, family: 'JetBrains Mono' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 10, family: 'JetBrains Mono' },
            callback: function(v) { return '$' + v; }
          }
        }
      }
    }
  });
}
