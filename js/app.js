/**
 * Main Application Logic for FinanzasPlan Pro
 * Enhanced with 100% Dynamic Simulation Engine for the Master Roadmap
 */

let roadmapViewMode = 'milestones'; // 'milestones' or 'all'

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initialize application
 */
function initApp() {
  loadState();
  renderKPIs();
  renderBudgetCategories();
  renderDashboardDebts();
  renderDashboardGoals();
  renderDebtsContainer();
  renderGoalsContainer();
  renderRoadmap();
  renderWeeklyRecordsTable();
  renderDashboardCategoriesLegend();
  populateQuickPayDestinations();
  populateGoalDestinationSelect();

  // Set initial weekly income in budget tab input
  const incomeInput = document.getElementById('weeklyIncomeInput');
  if (incomeInput) {
    incomeInput.value = appState.config.weeklyIncome || 3599;
  }

  // Update simulator with current free flow
  const currentFlow = getWeeklyAvailableFlow();
  updateSimulator(currentFlow > 0 ? currentFlow : 1700);

  // Initialize charts with a short delay to ensure canvas context is ready
  setTimeout(() => {
    initCharts();
  }, 100);
}

/**
 * Smooth Number Counter Animation with ease-out cubic
 */
function animateNumberValue(elementId, targetValue, isCurrency = true) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const currentVal = parseFloat(el.getAttribute('data-numeric-val')) || 0;
  if (Math.round(currentVal) === Math.round(targetValue)) {
    el.textContent = isCurrency ? formatMoney(targetValue) : targetValue;
    return;
  }

  el.setAttribute('data-numeric-val', targetValue);
  const startTime = performance.now();
  const duration = 380; // ms

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const interpolated = Math.round(currentVal + (targetValue - currentVal) * ease);

    el.textContent = isCurrency ? formatMoney(interpolated) : interpolated;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = isCurrency ? formatMoney(targetValue) : targetValue;
      el.classList.remove('value-flash');
      void el.offsetWidth;
      el.classList.add('value-flash');
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Tab switching logic with Accessible ARIA states, Haptic Feedback & clean enter animations
 */
function switchTab(tabId) {
  // Mobile haptic feedback
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate(10); } catch (e) {}
  }

  // Update tab buttons & ARIA attributes (desktop header + mobile bottom dock)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
  });

  // Update tab contents with enter-materialize
  document.querySelectorAll('.tab-content').forEach(section => {
    if (section.id === `tab-${tabId}`) {
      section.classList.remove('hidden');
      section.classList.add('active');
      section.classList.remove('enter-materialize');
      // Trigger reflow to restart enter-materialize animation cleanly
      void section.offsetWidth;
      section.classList.add('enter-materialize');
    } else {
      section.classList.add('hidden');
      section.classList.remove('active');
    }
  });

  // Re-render charts or roadmap if entering those tabs
  if (tabId === 'dashboard' || tabId === 'budget' || tabId === 'metrics') {
    setTimeout(() => {
      initCharts();
    }, 60);
  }
  if (tabId === 'roadmap') {
    renderRoadmap();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Calculate & Render Key Performance Indicators and Hero Stats
 */
function renderKPIs() {
  const weeklyIncome = parseFloat(appState.config.weeklyIncome) || 0;
  const totalExpenses = getTotalWeeklyExpenses();
  const weeklyAvailable = getWeeklyAvailableFlow();
  const monthlyProjected = Math.round(weeklyIncome * 4.333);

  // Hero section updates with counter animation
  animateNumberValue('heroIncomeDisplay', weeklyIncome);
  animateNumberValue('heroExpensesDisplay', totalExpenses);
  animateNumberValue('heroAvailableWeekly', weeklyAvailable);

  // KPIs
  animateNumberValue('kpiIncome', weeklyIncome);
  animateNumberValue('kpiIncomeMonthly', monthlyProjected);
  animateNumberValue('kpiTotalExpenses', totalExpenses);
  animateNumberValue('kpiFreeFlow', weeklyAvailable);

  // Rent & Savings Rate KPIs for mobile 2x2 grid
  const rentCat = (appState.config.categories || []).find(c => c.id === 'cat_rent' || c.id === 'rent');
  const rentAmt = rentCat ? (parseFloat(rentCat.amount) || 0) : 500;
  animateNumberValue('kpiRentWeekly', rentAmt);

  const savingsRate = weeklyIncome > 0 ? Math.max(0, Math.min(100, Math.round((weeklyAvailable / weeklyIncome) * 100))) : 0;
  const kpiSavingsRate = document.getElementById('kpiSavingsRate');
  if (kpiSavingsRate) kpiSavingsRate.textContent = `${savingsRate}%`;

  // Budget Tab displays
  const monthlyEquiv = document.getElementById('monthlyEquivDisplay');
  if (monthlyEquiv) monthlyEquiv.textContent = `${formatMoney(monthlyProjected)} MXN`;

  animateNumberValue('budgetTabAvailable', weeklyAvailable);
  animateNumberValue('budgetTotalExpensesDisplay', totalExpenses);
  animateNumberValue('budgetSurplusDisplay', weeklyAvailable);

  // Status diagnostics
  const statusTitle = document.getElementById('budgetStatusTitle');
  const statusDesc = document.getElementById('budgetStatusDesc');
  if (statusTitle && statusDesc) {
    if (weeklyAvailable > 1000) {
      statusTitle.textContent = 'Diagnóstico Presupuestal Excepcional';
      statusTitle.className = 'text-xs font-bold text-emerald-400 uppercase tracking-wider block';
      statusDesc.textContent = `Tienes ${formatMoney(weeklyAvailable)} libres por semana. Puedes liquidar tus deudas rápidamente y comprar tus gadgets sin retrasos.`;
    } else if (weeklyAvailable > 0) {
      statusTitle.textContent = 'Diagnóstico Presupuestal Equilibrado';
      statusTitle.className = 'text-xs font-bold text-amber-400 uppercase tracking-wider block';
      statusDesc.textContent = `Tienes ${formatMoney(weeklyAvailable)} libres por semana. Cubres todo, pero el ahorro para gadgets tomará un poco más de tiempo.`;
    } else {
      statusTitle.textContent = 'Alerta: Presupuesto en Déficit';
      statusTitle.className = 'text-xs font-bold text-rose-400 uppercase tracking-wider block';
      statusDesc.textContent = `Tus gastos (${formatMoney(totalExpenses)}) superan o igualan tus ingresos (${formatMoney(weeklyIncome)}). Reduce categorías de gastos para liberar flujo.`;
    }
  }

  // Total Debt Calculation
  let totalDebtInitial = 0;
  let totalDebtPaid = 0;
  let totalDebtRemaining = 0;

  appState.debts.forEach(d => {
    totalDebtInitial += d.total;
    totalDebtPaid += d.paid;
    totalDebtRemaining += Math.max(0, d.total - d.paid);
  });

  animateNumberValue('kpiDebt', totalDebtRemaining);

  const kpiDebtCount = document.getElementById('kpiDebtCount');
  const activeDebtsCount = appState.debts.filter(d => d.total > d.paid).length;
  if (kpiDebtCount) kpiDebtCount.textContent = `${activeDebtsCount} pendientes`;

  const debtPercent = totalDebtInitial > 0 ? Math.round((totalDebtPaid / totalDebtInitial) * 100) : 100;
  const kpiDebtProgress = document.getElementById('kpiDebtProgress');
  if (kpiDebtProgress) kpiDebtProgress.textContent = `${debtPercent}% liquidado`;

  animateNumberValue('dashDebtTotal', totalDebtRemaining);

  // Goals Calculation
  let totalGoalsTarget = 0;
  let totalGoalsSaved = 0;
  appState.goals.forEach(g => {
    totalGoalsTarget += g.target;
    totalGoalsSaved += g.saved;
  });

  const remainingGoals = Math.max(0, totalGoalsTarget - totalGoalsSaved);

  animateNumberValue('kpiSavings', totalGoalsSaved);
  animateNumberValue('dashGoalsRemaining', remainingGoals);

  // Overall combined progress
  const grandTotal = totalDebtInitial + totalGoalsTarget; // $4,600 + $30,000 = $34,600
  const grandAccomplished = totalDebtPaid + totalGoalsSaved;
  const overallPercent = grandTotal > 0 ? Math.round((grandAccomplished / grandTotal) * 100) : 100;

  const overallPercentEl = document.getElementById('overallPercentage');
  if (overallPercentEl) overallPercentEl.textContent = `${overallPercent}%`;

  const overallTotalEl = document.getElementById('overallTotalProgress');
  if (overallTotalEl) overallTotalEl.textContent = `${formatMoney(grandAccomplished)} / ${formatMoney(grandTotal)}`;

  // Bar segments
  const debtBarPercent = grandTotal > 0 ? (totalDebtPaid / grandTotal) * 100 : 0;
  const goalsBarPercent = grandTotal > 0 ? (totalGoalsSaved / grandTotal) * 100 : 0;

  const barDebtPaid = document.getElementById('barDebtPaid');
  if (barDebtPaid) barDebtPaid.style.width = `${debtBarPercent}%`;

  const barGadgetSaved = document.getElementById('barGadgetSaved');
  if (barGadgetSaved) barGadgetSaved.style.width = `${goalsBarPercent}%`;

  // Dynamic simulation for hero titles
  const sim = calculateDynamicSimulation();
  const estDate = document.getElementById('estimatedFinishDate');
  if (estDate) {
    estDate.textContent = sim.totalWeeks > 0 
      ? `Meta estimada: Semana ${sim.totalWeeks} (${(sim.totalWeeks / 4.33).toFixed(1)} meses)` 
      : 'Meta estimada: Requiere flujo positivo';
  }

  const heroWeeks = document.getElementById('heroTotalWeeks');
  if (heroWeeks) {
    heroWeeks.textContent = sim.totalWeeks > 0 ? `${sim.totalWeeks} sem` : '--';
  }

  const heroTitle = document.getElementById('heroRoadmapDebtTitle');
  const heroDesc = document.getElementById('heroRoadmapDesc');
  if (heroTitle && heroDesc) {
    if (sim.debtFreeWeek > 0) {
      heroTitle.innerHTML = `Ruta Dinámica: <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Libre de Deudas en ${sim.debtFreeWeek} Semanas</span>`;
      heroDesc.innerHTML = `Con tu flujo configurado de <strong>${formatMoney(weeklyAvailable)}/sem</strong>, exterminas tus deudas en <strong>${sim.debtFreeWeek} semanas</strong> y completas tus <strong>3 dispositivos ($30k)</strong> en la <strong>Semana ${sim.totalWeeks}</strong> (~${(sim.totalWeeks / 4.33).toFixed(1)} meses).`;
    } else {
      heroTitle.innerHTML = `Ruta Dinámica: <span class="text-emerald-400">100% Libre de Deudas</span>`;
      heroDesc.innerHTML = `Ya no tienes deudas pendientes. Todo tu flujo semanal de <strong>${formatMoney(weeklyAvailable)}/sem</strong> va directo a tus dispositivos ($30k en ~${sim.totalWeeks} semanas).`;
    }
  }
}

/**
 * Live updates all category percentage labels and progress bars without destroying focus
 */
function updateAllCategoryBarsAndPercentages() {
  const weeklyIncome = parseFloat(appState.config.weeklyIncome) || 1;
  const categories = appState.config.categories || [];

  categories.forEach(cat => {
    const amt = parseFloat(cat.amount) || 0;
    const pct = Math.min(100, Math.round((amt / weeklyIncome) * 100));

    // Live update percentage label
    const pctLabel = document.getElementById(`cat_pct_${cat.id}`);
    if (pctLabel) {
      pctLabel.textContent = `${pct}% del sueldo`;
    }

    // Live update progress bar width
    const bar = document.getElementById(`cat_bar_${cat.id}`);
    if (bar) {
      bar.style.width = `${pct}%`;
    }
  });

  // Also update live budget status diagnostics
  const totalExp = getTotalWeeklyExpenses();
  const available = getWeeklyAvailableFlow();

  const expDisplay = document.getElementById('budgetTotalExpensesDisplay');
  if (expDisplay) expDisplay.textContent = formatMoney(totalExp);

  const surplusDisplay = document.getElementById('budgetSurplusDisplay');
  if (surplusDisplay) surplusDisplay.textContent = formatMoney(available);

  const statusTitle = document.getElementById('budgetStatusTitle');
  const statusDesc = document.getElementById('budgetStatusDesc');
  if (statusTitle && statusDesc) {
    if (available > 1000) {
      statusTitle.textContent = 'Diagnóstico Presupuestal Excepcional';
      statusTitle.className = 'text-xs font-bold text-emerald-400 uppercase tracking-wider block';
      statusDesc.textContent = `Tienes ${formatMoney(available)} libres por semana. Puedes liquidar tus deudas rápidamente y comprar tus gadgets sin retrasos.`;
    } else if (available > 0) {
      statusTitle.textContent = 'Diagnóstico Presupuestal Equilibrado';
      statusTitle.className = 'text-xs font-bold text-amber-400 uppercase tracking-wider block';
      statusDesc.textContent = `Tienes ${formatMoney(available)} libres por semana. Cubres todo, pero el ahorro para gadgets tomará un poco más de tiempo.`;
    } else {
      statusTitle.textContent = 'Alerta: Presupuesto en Déficit';
      statusTitle.className = 'text-xs font-bold text-rose-400 uppercase tracking-wider block';
      statusDesc.textContent = `Tus gastos (${formatMoney(totalExp)}) superan o igualan tus ingresos (${formatMoney(weeklyIncome)}). Reduce categorías de gastos para liberar flujo.`;
    }
  }
}

/**
 * Render Granular Budget Categories in the "Mi Sueldo & Gastos" tab
 */
function renderBudgetCategories() {
  const container = document.getElementById('budgetCategoryCardsContainer');
  if (!container) return;

  const weeklyIncome = parseFloat(appState.config.weeklyIncome) || 1;
  const categories = appState.config.categories || [];

  container.innerHTML = categories.map(cat => {
    const amt = parseFloat(cat.amount) || 0;
    const pct = Math.min(100, Math.round((amt / weeklyIncome) * 100));

    return `
      <div class="apex-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 sm:space-y-4 border-slate-800/80 relative">
        <div class="space-y-2.5 sm:space-y-3">
          <div class="flex items-center justify-between">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg" style="background-color: ${cat.color}20; color: ${cat.color};">
              <i class="fa-solid ${cat.icon}"></i>
            </div>
            ${!cat.isFixed ? `
              <button onclick="deleteCategory('${cat.id}')" class="btn-tactile touch-target w-8 h-8 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition" title="Eliminar categoría" aria-label="Eliminar ${cat.name}">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            ` : `
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Fijo Base</span>
            `}
          </div>

          <div>
            <h4 class="font-heading font-bold text-white text-sm sm:text-base">${cat.name}</h4>
            <p class="text-[11px] sm:text-xs text-slate-400 mt-0.5">${cat.description || 'Gasto semanal recurrente'}</p>
          </div>
        </div>

        <div class="space-y-2 pt-2 border-t border-slate-800/80">
          <div class="flex items-center justify-between text-xs">
            <label for="cat_input_${cat.id}" class="text-slate-400 font-medium">Asignación Semanal:</label>
            <span class="font-numeral font-bold text-slate-300" id="cat_pct_${cat.id}">${pct}% del sueldo</span>
          </div>

          <div class="relative">
            <span class="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">$</span>
            <input type="number" id="cat_input_${cat.id}" min="0" step="any" value="${amt}"
                   class="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3.5 py-2 text-base font-bold font-numeral text-white focus:border-cyan-500 focus:outline-none transition"
                   oninput="updateCategoryAmount('${cat.id}', this.value)"
                   aria-label="Monto para ${cat.name}">
          </div>

          <div class="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div id="cat_bar_${cat.id}" class="progress-bar-animated h-full rounded-full transition-all duration-300" style="width: ${pct}%; background-color: ${cat.color};"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Handle Income modifications in real-time
 */
function handleIncomeChange(newVal) {
  const income = isNaN(parseFloat(newVal)) ? 0 : Math.max(0, parseFloat(newVal));
  appState.config.weeklyIncome = income;
  saveState();

  // 1. Live update all category percentages & progress bars
  updateAllCategoryBarsAndPercentages();

  // 2. Live update KPIs & hero metrics
  renderKPIs();

  // 3. Live update chips & roadmap
  renderDashboardCategoriesLegend();
  renderRoadmap();

  // 4. Live update charts
  if (budgetChartInstance) renderBudgetDoughnut();
  if (growthChartInstance) renderGrowthLineChart();
  if (monthlyChartInstance) renderMonthlyComparisonChart();
  if (debtBurnDownInstance) renderDebtBurnDownChart();
}

/**
 * Quick income presets
 */
function setQuickIncome(amount) {
  const input = document.getElementById('weeklyIncomeInput');
  if (input) input.value = amount;
  handleIncomeChange(amount);
  showToast(`Sueldo semanal actualizado a ${formatMoney(amount)}`, 'info');
}

/**
 * Update single category amount in real-time
 */
function updateCategoryAmount(catId, newVal) {
  const amt = isNaN(parseFloat(newVal)) ? 0 : Math.max(0, parseFloat(newVal));
  const category = (appState.config.categories || []).find(c => c.id === catId);
  if (category) {
    category.amount = amt;
    saveState();

    // 1. Live update this category and all other category bars & percentages
    updateAllCategoryBarsAndPercentages();

    // 2. Live update KPIs & hero metrics
    renderKPIs();

    // 3. Live update chips & roadmap
    renderDashboardCategoriesLegend();
    renderRoadmap();

    // 4. Live update charts
    if (budgetChartInstance) renderBudgetDoughnut();
    if (growthChartInstance) renderGrowthLineChart();
    if (monthlyChartInstance) renderMonthlyComparisonChart();
    if (debtBurnDownInstance) renderDebtBurnDownChart();
  }
}

/**
 * Add a new user-defined category
 */
function handleAddCategory(e) {
  e.preventDefault();
  const name = document.getElementById('newCategoryName').value.trim();
  const amount = parseFloat(document.getElementById('newCategoryAmount').value) || 0;
  const icon = document.getElementById('newCategoryIcon').value;
  const color = document.getElementById('newCategoryColor').value;

  if (!name) return;

  appState.config.categories.push({
    id: 'cat_' + Date.now(),
    name,
    description: 'Categoría personalizada creada por ti',
    amount,
    icon,
    color,
    isFixed: false
  });

  saveState();
  closeModal('addCategoryModal');
  initApp();
  showToast(`Categoría "${name}" agregada con éxito`, 'success');
  document.getElementById('addCategoryForm').reset();
}

/**
 * Delete a custom category
 */
function deleteCategory(catId) {
  const cat = (appState.config.categories || []).find(c => c.id === catId);
  if (!cat) return;

  if (confirm(`¿Deseas eliminar la categoría "${cat.name}"?`)) {
    appState.config.categories = appState.config.categories.filter(c => c.id !== catId);
    saveState();
    initApp();
    showToast(`Categoría "${cat.name}" eliminada`, 'info');
  }
}

/**
 * Render mini category chips on dashboard
 */
function renderDashboardCategoriesLegend() {
  const container = document.getElementById('dashboardCategoriesLegend');
  if (!container) return;

  const categories = appState.config.categories || [];
  const available = getWeeklyAvailableFlow();

  let html = `<div class="flex flex-wrap items-center justify-center gap-2 pt-1">`;
  categories.forEach(c => {
    if (c.amount > 0) {
      html += `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${c.color}"></span>
          ${c.name}: <strong class="font-numeral text-white">${formatMoney(c.amount)}</strong>
        </span>
      `;
    }
  });

  if (available > 0) {
    html += `
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
        Flujo Libre: ${formatMoney(available)}
      </span>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

/**
 * ==========================================================================
 * DYNAMIC SIMULATION ENGINE & ROADMAP GENERATOR
 * ==========================================================================
 */

/**
 * Simulates week-by-week exact financial execution based on user configuration
 */
function calculateDynamicSimulation() {
  const income = parseFloat(appState.config.weeklyIncome) || 0;
  const rentCat = (appState.config.categories || []).find(c => c.id === 'cat_rent');
  const rentAmt = rentCat ? (parseFloat(rentCat.amount) || 0) : 0;
  const totalExpenses = getTotalWeeklyExpenses();
  const otherExpenses = Math.max(0, totalExpenses - rentAmt);
  const flow = getWeeklyAvailableFlow();

  // Clone debts with unpaid amounts
  const debtsToPay = (appState.debts || []).map(d => ({
    id: d.id,
    name: d.name,
    remaining: Math.max(0, d.total - d.paid),
    priority: d.priority || 99
  })).sort((a, b) => a.priority - b.priority);

  // Clone goals with needed amounts
  const goalsToReach = (appState.goals || []).map(g => ({
    id: g.id,
    name: g.name,
    target: g.target,
    saved: g.saved,
    needed: Math.max(0, g.target - g.saved)
  })).sort((a, b) => a.priority - b.priority);

  let totalDebtRemaining = debtsToPay.reduce((acc, d) => acc + d.remaining, 0);
  let totalGoalNeeded = goalsToReach.reduce((acc, g) => acc + g.needed, 0);

  if (flow <= 0) {
    return {
      flow: 0,
      income,
      rentAmt,
      otherExpenses,
      debtFreeWeek: 0,
      gadget1Week: 0,
      gadget2Week: 0,
      gadget3Week: 0,
      totalWeeks: 0,
      allWeeks: []
    };
  }

  const allWeeks = [];
  let currentWeek = 0;
  let debtFreeWeek = (totalDebtRemaining === 0) ? 0 : null;
  let gadget1Week = null;
  let gadget2Week = null;
  let gadget3Week = null;

  let goalIndex = 0;

  while ((totalDebtRemaining > 0 || totalGoalNeeded > 0) && currentWeek < 60) {
    currentWeek++;
    let weekAvailable = flow;
    let weekActions = [];
    let weekStatus = '';
    let badgeClass = 'bg-slate-800 text-slate-300 border border-slate-700';

    // 1. Pay Debts
    if (totalDebtRemaining > 0) {
      for (let d of debtsToPay) {
        if (d.remaining <= 0) continue;

        if (weekAvailable >= d.remaining) {
          weekActions.push(`Liquidar ${d.name} (${formatMoney(d.remaining)})`);
          weekAvailable -= d.remaining;
          d.remaining = 0;
        } else {
          weekActions.push(`Abonar ${formatMoney(weekAvailable)} a ${d.name}`);
          d.remaining -= weekAvailable;
          weekAvailable = 0;
          break;
        }
      }

      totalDebtRemaining = debtsToPay.reduce((acc, d) => acc + d.remaining, 0);
      if (totalDebtRemaining === 0 && !debtFreeWeek) {
        debtFreeWeek = currentWeek;
        weekStatus = '100% LIBRE DE DEUDAS';
        badgeClass = 'bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/50';
      } else {
        weekStatus = `Deuda baja a ${formatMoney(totalDebtRemaining)}`;
        badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      }
    }

    // 2. Fund Gadgets with remaining flow
    if (weekAvailable > 0 && totalGoalNeeded > 0) {
      while (weekAvailable > 0 && goalIndex < goalsToReach.length) {
        let currentGoal = goalsToReach[goalIndex];
        if (currentGoal.needed <= 0) {
          goalIndex++;
          continue;
        }

        if (weekAvailable >= currentGoal.needed) {
          weekActions.push(`Completar ${currentGoal.name} (${formatMoney(currentGoal.needed)})`);
          weekAvailable -= currentGoal.needed;
          currentGoal.needed = 0;
          currentGoal.saved = currentGoal.target;

          if (goalIndex === 0 && !gadget1Week) {
            gadget1Week = currentWeek;
            weekStatus = `COMPRA: ${currentGoal.name}`;
            badgeClass = 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40';
          } else if (goalIndex === 1 && !gadget2Week) {
            gadget2Week = currentWeek;
            weekStatus = `COMPRA: ${currentGoal.name}`;
            badgeClass = 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40';
          } else if (goalIndex === 2 && !gadget3Week) {
            gadget3Week = currentWeek;
            weekStatus = `COMPRA: ${currentGoal.name} ¡META FINAL!`;
            badgeClass = 'bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/50';
          }
          goalIndex++;
        } else {
          weekActions.push(`Ahorro de ${formatMoney(weekAvailable)} para ${currentGoal.name}`);
          currentGoal.needed -= weekAvailable;
          currentGoal.saved += weekAvailable;
          weekAvailable = 0;
          if (!weekStatus) {
            weekStatus = `Fondo en ${formatMoney(currentGoal.saved)} / ${formatMoney(currentGoal.target)}`;
            badgeClass = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
          }
        }
      }
      totalGoalNeeded = goalsToReach.reduce((acc, g) => acc + g.needed, 0);
    }

    allWeeks.push({
      week: currentWeek,
      weekLabel: `Semana ${currentWeek}`,
      income,
      rent: rentAmt,
      living: otherExpenses,
      available: flow,
      destination: weekActions.join(' + ') || `Ahorro semanal de ${formatMoney(flow)}`,
      status: weekStatus || `Ahorro acumulado activo`,
      badgeClass,
      isMilestone: (
        currentWeek === 1 || 
        currentWeek === debtFreeWeek || 
        currentWeek === gadget1Week || 
        currentWeek === gadget2Week || 
        currentWeek === gadget3Week
      )
    });
  }

  return {
    flow,
    income,
    rentAmt,
    otherExpenses,
    totalExpenses,
    debtFreeWeek: debtFreeWeek !== null ? debtFreeWeek : 0,
    gadget1Week: gadget1Week || (debtFreeWeek ? debtFreeWeek + Math.ceil(10000 / flow) : Math.ceil(10000 / flow)),
    gadget2Week: gadget2Week || (debtFreeWeek ? debtFreeWeek + Math.ceil(20000 / flow) : Math.ceil(20000 / flow)),
    gadget3Week: gadget3Week || currentWeek,
    totalWeeks: currentWeek,
    allWeeks
  };
}

/**
 * Render both Phase Cards and Table in the Roadmap tab
 */
function renderRoadmap() {
  const sim = calculateDynamicSimulation();
  renderRoadmapPhases(sim);
  renderRoadmapTable(sim);
}

/**
 * Render the 3 Dynamic Phase Cards based on exact simulation
 */
function renderRoadmapPhases(sim) {
  const container = document.getElementById('roadmapPhaseCardsContainer');
  if (!container) return;

  if (sim.flow <= 0) {
    container.innerHTML = `
      <div class="col-span-3 p-6 rounded-2xl bg-rose-950/20 border border-rose-800/40 text-center">
        <h4 class="font-bold text-rose-400 text-base">Atención: No hay flujo libre para avanzar el plan</h4>
        <p class="text-xs text-slate-300 mt-1">Tus gastos actuales superan o igualan tu sueldo semanal. Ajusta tus categorías en "Mi Sueldo & Gastos" para ver tu hoja de ruta recalculada.</p>
      </div>
    `;
    return;
  }

  const dWeek = sim.debtFreeWeek;
  const g1Week = sim.gadget1Week;
  const g3Week = sim.gadget3Week;

  const phase1Range = dWeek > 0 ? `SEMANAS 1 - ${dWeek}` : 'LIQUIDADA';
  const phase1Result = dWeek > 0 ? `Cero deudas en ${dWeek} semanas` : '¡Ya eres libre de deudas!';

  const phase2Start = dWeek > 0 ? dWeek + 1 : 1;
  const phase2Range = `SEMANAS ${phase2Start} - ${g1Week}`;

  const phase3Start = g1Week + 1;
  const phase3Range = `SEMANAS ${phase3Start} - ${g3Week}`;

  container.innerHTML = `
    <!-- Phase 1 -->
    <div class="bg-rose-950/20 border border-rose-800/40 p-5 rounded-2xl space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase text-rose-400">FASE 1 &bull; ${phase1Range}</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">PRIORIDAD 1</span>
      </div>
      <h4 class="font-heading text-base font-bold text-white">Liquidación de Deudas ($4,600)</h4>
      <p class="text-xs text-slate-300">Abonando tu flujo libre de ${formatMoney(sim.flow)}/sem, eliminas tus acreedores con la estrategia Bola de Nieve.</p>
      <div class="text-xs text-emerald-400 font-semibold pt-2 flex items-center gap-1.5">
        <i class="fa-solid fa-circle-check"></i> ${phase1Result}
      </div>
    </div>

    <!-- Phase 2 -->
    <div class="bg-indigo-950/20 border border-indigo-800/40 p-5 rounded-2xl space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase text-indigo-400">FASE 2 &bull; ${phase2Range}</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">META 1</span>
      </div>
      <h4 class="font-heading text-base font-bold text-white">1er Dispositivo ($10,000)</h4>
      <p class="text-xs text-slate-300">Todo el flujo de ${formatMoney(sim.flow)}/sem va a la alcancía. En la Semana ${g1Week} compras tu 1er equipo.</p>
      <div class="text-xs text-indigo-300 font-semibold pt-2 flex items-center gap-1.5">
        <i class="fa-solid fa-mobile-screen-button"></i> Teléfono comprado de contado
      </div>
    </div>

    <!-- Phase 3 -->
    <div class="bg-amber-950/20 border border-amber-800/40 p-5 rounded-2xl space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase text-amber-400">FASE 3 &bull; ${phase3Range}</span>
        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">METAS 2 Y 3</span>
      </div>
      <h4 class="font-heading text-base font-bold text-white">2da Tablet y 3er Equipo ($20,000)</h4>
      <p class="text-xs text-slate-300">Semana ${sim.gadget2Week}: Compras la 2da tablet. Semana ${g3Week}: Compras el tercer equipo ($30,000 completados).</p>
      <div class="text-xs text-amber-300 font-semibold pt-2 flex items-center gap-1.5">
        <i class="fa-solid fa-crown"></i> $30,000 en tecnología tuya
      </div>
    </div>
  `;
}

/**
 * Render the dynamic Roadmap Table with toggle support
 */
function renderRoadmapTable(simData) {
  const tbody = document.getElementById('roadmapTableBody');
  if (!tbody) return;

  const sim = simData || calculateDynamicSimulation();

  if (sim.flow <= 0 || sim.allWeeks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400 text-xs">Flujo semanal insuficiente para proyectar semanas. Aumenta tu sueldo o reduce gastos para ver la simulación.</td></tr>`;
    return;
  }

  let displayRows = [];

  if (roadmapViewMode === 'milestones') {
    // Group intermediate weeks smoothly into clean milestone intervals
    let lastWeekAdded = 0;

    sim.allWeeks.forEach((w) => {
      if (w.isMilestone) {
        // If there is an intermediate interval between last week and this milestone
        if (w.week > lastWeekAdded + 1) {
          const start = lastWeekAdded + 1;
          const end = w.week - 1;
          const intervalLabel = start === end ? `Semana ${start}` : `Semanas ${start} - ${end}`;
          displayRows.push({
            weekLabel: intervalLabel,
            income: sim.income,
            rent: sim.rentAmt,
            living: sim.otherExpenses,
            available: sim.flow,
            destination: `Ahorro constante de ${formatMoney(sim.flow)}/semana`,
            status: `Acumulando fondo acelerado (${formatMoney(sim.flow * (end - start + 1))})`,
            badgeClass: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
          });
        }

        displayRows.push(w);
        lastWeekAdded = w.week;
      }
    });

    // In case there are weeks after the last milestone
    if (sim.totalWeeks > lastWeekAdded) {
      const start = lastWeekAdded + 1;
      const end = sim.totalWeeks;
      displayRows.push({
        weekLabel: `Semanas ${start} - ${end}`,
        income: sim.income,
        rent: sim.rentAmt,
        living: sim.otherExpenses,
        available: sim.flow,
        destination: `Ahorro libre de ${formatMoney(sim.flow)}/semana`,
        status: `Fondo completado al 100%`,
        badgeClass: 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
      });
    }
  } else {
    // Show every single week 1 to N
    displayRows = sim.allWeeks;
  }

  tbody.innerHTML = displayRows.map(r => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="p-3.5 font-bold text-white whitespace-nowrap">${r.weekLabel}</td>
      <td class="p-3.5 font-numeral text-emerald-400 font-semibold">${formatMoney(r.income)}</td>
      <td class="p-3.5 font-numeral text-indigo-300">${formatMoney(r.rent)}</td>
      <td class="p-3.5 font-numeral text-slate-400">${formatMoney(r.living)}</td>
      <td class="p-3.5 font-numeral text-teal-300 font-bold">${formatMoney(r.available)}</td>
      <td class="p-3.5 text-slate-200">${r.destination}</td>
      <td class="p-3.5 whitespace-nowrap">
        <span class="px-2.5 py-1 rounded-lg text-xs font-bold ${r.badgeClass}">${r.status}</span>
      </td>
    </tr>
  `).join('');
}

/**
 * Toggle between "Hitos Clave" and "Todas las Semanas"
 */
function setRoadmapViewMode(mode) {
  roadmapViewMode = mode;
  const btnMilestones = document.getElementById('btnRoadmapMilestones');
  const btnAll = document.getElementById('btnRoadmapAll');

  if (mode === 'milestones') {
    if (btnMilestones) btnMilestones.className = 'btn-tactile touch-target px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-cyan-300 border border-slate-700';
    if (btnAll) btnAll.className = 'btn-tactile touch-target px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-white';
  } else {
    if (btnMilestones) btnMilestones.className = 'btn-tactile touch-target px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-white';
    if (btnAll) btnAll.className = 'btn-tactile touch-target px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-cyan-300 border border-slate-700';
  }

  renderRoadmap();
}

/**
 * Render small debt snapshot in dashboard
 */
function renderDashboardDebts() {
  const container = document.getElementById('dashboardDebtsList');
  if (!container) return;

  if (appState.debts.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">No hay ninguna deuda registrada actualmente.</p>`;
    return;
  }

  container.innerHTML = appState.debts.map(d => {
    const remaining = Math.max(0, d.total - d.paid);
    const pct = Math.round((d.paid / d.total) * 100);
    const isPaid = remaining === 0;

    return `
      <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${isPaid ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800'} flex items-center justify-between gap-3">
        <div class="space-y-1.5 flex-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-white ${isPaid ? 'line-through text-slate-400' : ''}">${d.name}</span>
            <span class="font-numeral text-xs font-extrabold ${isPaid ? 'text-emerald-400' : 'text-rose-400'}">${isPaid ? 'Liquidada' : formatMoney(remaining)}</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="progress-bar-animated ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'} h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
        ${!isPaid ? `
          <button onclick="quickPaySpecificDebt('${d.id}')" class="btn-tactile touch-target px-3 py-1.5 text-xs rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 font-bold transition flex-shrink-0" aria-label="Abonar a ${d.name}">
            Abonar
          </button>
        ` : `
          <span class="text-emerald-400 text-sm flex-shrink-0" aria-label="Pagada completamente"><i class="fa-solid fa-circle-check"></i></span>
        `}
      </div>
    `;
  }).join('');
}

/**
 * Render small goals snapshot in dashboard
 */
function renderDashboardGoals() {
  const container = document.getElementById('dashboardGoalsList');
  if (!container) return;

  container.innerHTML = appState.goals.map(g => {
    const remaining = Math.max(0, g.target - g.saved);
    const pct = Math.round((g.saved / g.target) * 100);
    const isCompleted = remaining === 0;

    return `
      <div class="p-3.5 rounded-2xl bg-slate-900/80 border ${isCompleted ? 'border-amber-500/40 bg-amber-950/15' : 'border-slate-800'} flex items-center justify-between gap-3">
        <div class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 text-sm">
          <i class="fa-solid ${g.icon}"></i>
        </div>
        <div class="space-y-1.5 flex-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-white">${g.name}</span>
            <span class="font-numeral text-xs font-bold text-amber-300">${formatMoney(g.saved)} / ${formatMoney(g.target)}</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div class="progress-bar-animated bg-gradient-to-r from-amber-500 to-cyan-400 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
        <span class="font-numeral text-xs font-black ${isCompleted ? 'text-amber-400' : 'text-slate-400'} min-w-[38px] text-right">${pct}%</span>
      </div>
    `;
  }).join('');
}

/**
 * Render all debt cards in Debts Tab
 */
function renderDebtsContainer() {
  const container = document.getElementById('debtsContainer');
  if (!container) return;

  container.innerHTML = appState.debts.map(d => {
    const remaining = Math.max(0, d.total - d.paid);
    const pct = Math.round((d.paid / d.total) * 100);
    const isPaid = remaining === 0;

    return `
      <div class="apex-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
        ${isPaid ? `
          <div class="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Totalmente Liquidada
          </div>
        ` : `
          <div class="absolute top-4 right-4 bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Prioridad #${d.priority}
          </div>
        `}

        <div class="space-y-4">
          <div class="w-12 h-12 rounded-2xl ${isPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} flex items-center justify-center text-xl">
            <i class="fa-solid ${isPaid ? 'fa-check-double' : 'fa-receipt'}"></i>
          </div>

          <div>
            <h4 class="font-heading font-extrabold text-white text-lg ${isPaid ? 'line-through text-slate-400' : ''}">${d.name}</h4>
            <p class="text-xs text-slate-400 mt-0.5">${d.description || 'Deuda por liquidar'}</p>
          </div>

          <div class="pt-2">
            <div class="flex items-baseline justify-between text-xs mb-1.5">
              <span class="text-slate-400 font-medium">Saldo Restante:</span>
              <span class="font-numeral text-2xl font-black ${isPaid ? 'text-emerald-400' : 'text-rose-400'}">${formatMoney(remaining)}</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div class="progress-bar-animated bg-gradient-to-r from-rose-500 to-emerald-400 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>Pagado: ${formatMoney(d.paid)}</span>
              <span>Total: ${formatMoney(d.total)} (${pct}%)</span>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2.5">
          ${!isPaid ? `
            <button onclick="quickPaySpecificDebt('${d.id}')" class="btn-tactile touch-target flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-rose-600/25" aria-label="Abonar a ${d.name}">
              Abonar a esta Deuda
            </button>
            <button onclick="payDebtInFull('${d.id}')" class="btn-tactile touch-target px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition" title="Liquidar por completo" aria-label="Liquidar todo de ${d.name}">
              Liquidar Todo
            </button>
          ` : `
            <div class="w-full text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <i class="fa-solid fa-trophy mr-1.5"></i> Cero compromisos en esta cuenta
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render all goal cards in Goals Tab
 */
function renderGoalsContainer() {
  const container = document.getElementById('goalsContainer');
  if (!container) return;

  container.innerHTML = appState.goals.map(g => {
    const remaining = Math.max(0, g.target - g.saved);
    const pct = Math.round((g.saved / g.target) * 100);
    const isCompleted = remaining === 0;

    return `
      <div class="apex-card rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden group">
        
        ${isCompleted ? `
          <div class="absolute top-4 right-4 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Fondos Completos
          </div>
        ` : `
          <div class="absolute top-4 right-4 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            Meta #${g.priority} &bull; Sem ${g.targetWeek}
          </div>
        `}

        <div class="space-y-4">
          <div class="w-13 h-13 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl p-3">
            <i class="fa-solid ${g.icon}"></i>
          </div>

          <div>
            <h4 class="font-heading font-extrabold text-white text-xl">${g.name}</h4>
            <p class="text-xs text-slate-400 mt-1">${g.notes || 'Dispositivo de alta gama'}</p>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-baseline justify-between text-xs">
              <span class="text-slate-400 font-medium">Fondo Ahorrado:</span>
              <span class="font-numeral text-2xl font-black text-amber-300">${formatMoney(g.saved)}</span>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
              <div class="progress-bar-animated bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
            <div class="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>Objetivo: ${formatMoney(g.target)}</span>
              <span class="font-bold text-amber-400">${pct}%</span>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2.5">
          ${!isCompleted ? `
            <button onclick="quickSavingsSpecificGoal('${g.id}')" class="btn-tactile touch-target flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/25" aria-label="Asignar ahorro a ${g.name}">
              Asignar Ahorro a este Equipo
            </button>
          ` : `
            <button onclick="triggerConfetti()" class="btn-tactile touch-target w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">
              <span>Comprar de Contado</span>
              <i class="fa-solid fa-bag-shopping"></i>
            </button>
          `}
        </div>

      </div>
    `;
  }).join('');
}

/**
 * Render Weekly Log records
 */
function renderWeeklyRecordsTable() {
  const tbody = document.getElementById('weeklyRecordsTableBody');
  if (!tbody) return;

  if (appState.weeklyLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-5 text-center text-slate-400 text-xs">No hay cobros registrados en la bitácora aún. ¡Registra tu primer cobro semanal!</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.weeklyLogs.map(log => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="p-3.5">
        <span class="font-bold text-white block">${log.label}</span>
        <span class="text-[11px] text-slate-500 font-mono">${log.date || ''}</span>
      </td>
      <td class="p-3.5 font-numeral text-emerald-400 font-bold">${formatMoney(log.income)}</td>
      <td class="p-3.5 font-numeral text-indigo-300">${formatMoney(log.rent)}</td>
      <td class="p-3.5 font-numeral text-slate-300">${formatMoney(log.livingExpenses)}</td>
      <td class="p-3.5 font-numeral text-rose-400 font-semibold">${formatMoney(log.debtPayment)}</td>
      <td class="p-3.5 font-numeral text-amber-300 font-semibold">${formatMoney(log.goalSavings)}</td>
      <td class="p-3.5">
        <button onclick="deleteWeeklyRecord('${log.id}')" class="btn-tactile touch-target text-rose-400 hover:text-rose-300 p-2 rounded-lg transition" title="Eliminar registro" aria-label="Eliminar registro de la semana">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Populate destinations for Quick Pay modal
 */
function populateQuickPayDestinations() {
  const type = document.getElementById('quickPayType')?.value;
  const select = document.getElementById('quickPayDestination');
  if (!select) return;

  select.innerHTML = '';
  if (type === 'debt') {
    appState.debts.forEach(d => {
      const remaining = Math.max(0, d.total - d.paid);
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.name} (Resta: ${formatMoney(remaining)})`;
      select.appendChild(opt);
    });
  } else {
    appState.goals.forEach(g => {
      const remaining = Math.max(0, g.target - g.saved);
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${g.name} (Resta: ${formatMoney(remaining)})`;
      select.appendChild(opt);
    });
  }
}

function toggleQuickPayDestinations() {
  populateQuickPayDestinations();
}

/**
 * Populate Goal selector
 */
function populateGoalDestinationSelect() {
  const select = document.getElementById('goalDestinationSelect');
  if (!select) return;

  select.innerHTML = appState.goals.map(g => {
    const remaining = Math.max(0, g.target - g.saved);
    return `<option value="${g.id}">${g.name} (Faltan: ${formatMoney(remaining)})</option>`;
  }).join('');
}

/**
 * Handle quick pay submit
 */
function handleQuickPay(e) {
  e.preventDefault();
  const type = document.getElementById('quickPayType').value;
  const destinationId = document.getElementById('quickPayDestination').value;
  const amount = parseFloat(document.getElementById('quickPayAmount').value) || 0;

  if (amount <= 0) return;

  if (type === 'debt') {
    const debt = appState.debts.find(d => d.id === destinationId);
    if (debt) {
      debt.paid = Math.min(debt.total, debt.paid + amount);
      if (debt.paid >= debt.total) {
        triggerConfetti();
        showToast(`¡Felicidades! Liquidaste al 100% ${debt.name}`, 'success');
      } else {
        showToast(`Abono de ${formatMoney(amount)} aplicado a ${debt.name}`, 'info');
      }
    }
  } else {
    const goal = appState.goals.find(g => g.id === destinationId);
    if (goal) {
      goal.saved = Math.min(goal.target, goal.saved + amount);
      if (goal.saved >= goal.target) {
        triggerConfetti();
        showToast(`¡Excelente! Fondos listos para comprar ${goal.name}`, 'success');
      } else {
        showToast(`Asignaste ${formatMoney(amount)} a ${goal.name}`, 'info');
      }
    }
  }

  saveState();
  closeModal('quickPayModal');
  initApp();
  document.getElementById('quickPayForm').reset();
}

/**
 * Quick pay helpers for cards
 */
function quickPaySpecificDebt(debtId) {
  const debt = appState.debts.find(d => d.id === debtId);
  if (!debt) return;

  const remaining = Math.max(0, debt.total - debt.paid);
  const amountStr = prompt(`¿Cuánto deseas abonar a "${debt.name}"? (Saldo pendiente: ${formatMoney(remaining)})`, remaining);
  if (!amountStr) return;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return;

  debt.paid = Math.min(debt.total, debt.paid + amount);
  if (debt.paid >= debt.total) {
    triggerConfetti();
    showToast(`¡Deuda liquidada: ${debt.name}!`, 'success');
  } else {
    showToast(`Abono de ${formatMoney(amount)} registrado`, 'info');
  }

  saveState();
  initApp();
}

function payDebtInFull(debtId) {
  const debt = appState.debts.find(d => d.id === debtId);
  if (!debt) return;

  if (confirm(`¿Confirmas que liquidaste por completo la deuda "${debt.name}" por ${formatMoney(debt.total - debt.paid)}?`)) {
    debt.paid = debt.total;
    triggerConfetti();
    showToast(`¡Deuda liquidada al 100%: ${debt.name}!`, 'success');
    saveState();
    initApp();
  }
}

function quickSavingsSpecificGoal(goalId) {
  const goal = appState.goals.find(g => g.id === goalId);
  if (!goal) return;

  const remaining = Math.max(0, goal.target - goal.saved);
  const flow = getWeeklyAvailableFlow();
  const defaultVal = flow > 0 ? flow : 1700;
  const amountStr = prompt(`¿Cuánto deseas transferir al ahorro para "${goal.name}"? (Faltan: ${formatMoney(remaining)})`, defaultVal);
  if (!amountStr) return;

  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return;

  goal.saved = Math.min(goal.target, goal.saved + amount);
  if (goal.saved >= goal.target) {
    triggerConfetti();
    showToast(`¡Completaste la meta de ${goal.name}!`, 'success');
  } else {
    showToast(`Ahorro de ${formatMoney(amount)} añadido a ${goal.name}`, 'info');
  }

  saveState();
  initApp();
}

/**
 * Add new custom debt
 */
function handleAddDebt(e) {
  e.preventDefault();
  const name = document.getElementById('newDebtName').value.trim();
  const amount = parseFloat(document.getElementById('newDebtAmount').value) || 0;

  if (!name || amount <= 0) return;

  appState.debts.push({
    id: 'debt_' + Date.now(),
    name,
    description: 'Deuda agregada por el usuario',
    total: amount,
    paid: 0,
    priority: appState.debts.length + 1,
    createdAt: new Date().toISOString()
  });

  saveState();
  closeModal('addDebtModal');
  initApp();
  showToast(`Deuda "${name}" agregada con éxito`, 'info');
  document.getElementById('addDebtForm').reset();
}

/**
 * Add savings to goal via modal
 */
function handleAddGoalSavings(e) {
  e.preventDefault();
  const goalId = document.getElementById('goalDestinationSelect').value;
  const amount = parseFloat(document.getElementById('goalSavingsAmount').value) || 0;

  if (amount <= 0) return;

  const goal = appState.goals.find(g => g.id === goalId);
  if (goal) {
    goal.saved = Math.min(goal.target, goal.saved + amount);
    if (goal.saved >= goal.target) {
      triggerConfetti();
      showToast(`¡Alcanzaste la meta de ${goal.name}!`, 'success');
    } else {
      showToast(`Asignaste ${formatMoney(amount)} a ${goal.name}`, 'info');
    }
  }

  saveState();
  closeModal('addSavingsModal');
  initApp();
  document.getElementById('addSavingsForm').reset();
}

/**
 * Live validation in weekly log modal
 */
function calculateWeekModalTotals() {
  const salary = parseFloat(document.getElementById('weekSalary')?.value) || 0;
  const rent = parseFloat(document.getElementById('weekRent')?.value) || 0;
  const living = parseFloat(document.getElementById('weekLiving')?.value) || 0;
  const debt = parseFloat(document.getElementById('weekDebtPay')?.value) || 0;
  const goals = parseFloat(document.getElementById('weekGoalSavings')?.value) || 0;

  const totalUsed = rent + living + debt + goals;
  const diff = salary - totalUsed;

  const label = document.getElementById('weekModalBalanceText');
  if (!label) return;

  if (Math.abs(diff) < 0.01) {
    label.textContent = 'Exacto ($0 diferencia)';
    label.className = 'font-numeral font-bold text-emerald-400';
  } else if (diff > 0) {
    label.textContent = `Te sobran ${formatMoney(diff)} sin asignar`;
    label.className = 'font-numeral font-bold text-cyan-400';
  } else {
    label.textContent = `Te faltan ${formatMoney(Math.abs(diff))} (Gastas más de lo cobrado)`;
    label.className = 'font-numeral font-bold text-rose-400';
  }
}

/**
 * Add weekly record
 */
function handleAddWeeklyRecord(e) {
  e.preventDefault();
  const label = document.getElementById('weekLabel').value.trim();
  const income = parseFloat(document.getElementById('weekSalary').value) || 0;
  const rent = parseFloat(document.getElementById('weekRent').value) || 0;
  const livingExpenses = parseFloat(document.getElementById('weekLiving').value) || 0;
  const debtPayment = parseFloat(document.getElementById('weekDebtPay').value) || 0;
  const goalSavings = parseFloat(document.getElementById('weekGoalSavings').value) || 0;

  appState.weeklyLogs.unshift({
    id: 'log_' + Date.now(),
    weekNumber: appState.weeklyLogs.length + 1,
    label,
    income,
    rent,
    livingExpenses,
    debtPayment,
    goalSavings,
    date: new Date().toLocaleDateString('es-MX')
  });

  saveState();
  closeModal('addWeekRecordModal');
  initApp();
  showToast('Semana registrada correctamente en la bitácora', 'success');
  document.getElementById('addWeekRecordForm').reset();
}

/**
 * Delete a weekly record
 */
function deleteWeeklyRecord(logId) {
  if (confirm('¿Deseas eliminar este registro de la bitácora?')) {
    appState.weeklyLogs = appState.weeklyLogs.filter(l => l.id !== logId);
    saveState();
    initApp();
    showToast('Registro eliminado', 'info');
  }
}

/**
 * Dynamic simulator update based on slider
 */
function updateSimulator(savingsValue) {
  const val = parseInt(savingsValue, 10);
  const display = document.getElementById('simSavingsDisplay');
  if (display) display.textContent = `${formatMoney(val)} / sem`;

  const target1 = 10000;
  const target2 = 20000;
  const target3 = 30000;

  const weeks1 = Math.ceil(target1 / val);
  const weeks2 = Math.ceil(target2 / val);
  const weeks3 = Math.ceil(target3 / val);

  const sim = calculateDynamicSimulation();
  const debtWeeks = sim.debtFreeWeek || 3;

  const elDev1 = document.getElementById('simDevice1Weeks');
  if (elDev1) elDev1.textContent = `${weeks1} semanas`;
  const elDate1 = document.getElementById('simDevice1Date');
  if (elDate1) elDate1.textContent = `~${(weeks1 / 4.33).toFixed(1)} meses`;

  const elDev2 = document.getElementById('simDevice2Weeks');
  if (elDev2) elDev2.textContent = `${weeks2} semanas`;
  const elDate2 = document.getElementById('simDevice2Date');
  if (elDate2) elDate2.textContent = `~${(weeks2 / 4.33).toFixed(1)} meses`;

  const elTotal = document.getElementById('simTotalWeeks');
  if (elTotal) elTotal.textContent = `${weeks3} semanas`;
  const elTotalDate = document.getElementById('simTotalDate');
  if (elTotalDate) elTotalDate.textContent = `~${(weeks3 / 4.33).toFixed(1)} meses (+${debtWeeks} sem deudas = ${weeks3 + debtWeeks} sem)`;
}

/**
 * Modal helpers with accessible focus & backdrop control
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    if (modalId === 'addWeekRecordModal') {
      calculateWeekModalTotals();
    }
    const firstInput = modal.querySelector('input, select, button');
    if (firstInput) firstInput.focus();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

/**
 * Close modal when clicking on the blurred backdrop
 */
function handleBackdropClick(event, modalId) {
  if (event.target && event.target.id === modalId) {
    closeModal(modalId);
  }
}

// Global Escape key listener to close open modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => {
      modal.classList.add('hidden');
    });
  }
});

function openSettingsModal() {
  openModal('settingsModal');
}

/**
 * Canvas Confetti trigger for milestone victories
 */
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.6 }
    });
  }
}

/**
 * Toast notification with strict accessibility (WCAG aria-live)
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' 
    ? 'bg-emerald-600 text-white' 
    : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-100');
  
  toast.className = `${bg} text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 toast-animate pointer-events-auto`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-emerald-200' : 'fa-bell text-slate-300'}"></i>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    toast.style.transition = 'opacity 200ms ease, transform 200ms ease';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}
