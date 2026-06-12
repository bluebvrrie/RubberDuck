/* ══════════════════════════════════
   DATA & CONSTANTS
══════════════════════════════════ */
const CAT_COLORS = [
  '#8b2635','#2A7A4B','#185FA5','#8E3A9D','#B06A00','#0F6E56','#993556','#3B6D11'
];
const CAT_BGS = [
  'rgba(139,38,53,0.08)','#EAF4EF','#E6F1FB','#F5EAF8','#FFF3E0','#E1F5EE','#FBEAF0','#EAF3DE'
];
const EMOJIS = ['🍔','🛒','🚗','💊','📚','🎮','✈️','🏠','💡','📱','🎬','🍕','☕','💇','🐾','🧴','🎵','🏋️','🍷','💐'];

const TYPE_ICONS = {
  emi:'🏦', subscription:'🔄', debt:'🤝', rent:'🏠', other:'🔔'
};

let state = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  budgets: {},
  expenses: [],
  categories: [
    { id:'food',          name:'Food',          icon:'🍔', color:0 },
    { id:'shopping',      name:'Shopping',      icon:'🛒', color:1 },
    { id:'transport',     name:'Transport',     icon:'🚗', color:2 },
    { id:'health',        name:'Health',        icon:'💊', color:3 },
    { id:'entertainment', name:'Entertainment', icon:'🎮', color:4 },
    { id:'bills',         name:'Bills',         icon:'💡', color:5 },
  ],
  incomes: [],
  debts: [],
  selectedCat: null,
  selectedEmoji: EMOJIS[0],
  editingDebtId: null
};

/* ══ STORAGE ══ */
function save() {
  try {
    localStorage.setItem('spendbook-v1', JSON.stringify({
      budgets: state.budgets,
      expenses: state.expenses,
      incomes: state.incomes,
      categories: state.categories,
      debts: state.debts
    }));
  } catch(e) {}
}

function load() {
  try {
    const raw = localStorage.getItem('spendbook-v1');
    if (!raw) return;
    const d = JSON.parse(raw);
    state.budgets    = d.budgets    || {};
    state.expenses   = d.expenses   || [];
    state.incomes    = d.incomes    || [];
    state.categories = d.categories || state.categories;
    state.debts      = d.debts      || [];
  } catch(e) {}
}

/* ══ HELPERS ══ */
function monthKey(y, m) { return `${y}-${String(m+1).padStart(2,'0')}`; }
function monthName(y, m) {
  return new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function ordinal(n) {
  const s = ['th','st','nd','rd'];
  return n + (s[(n % 100 - 20) % 10] || s[n % 100] || s[0]);
}
function currentMonthExpenses() {
  const prefix = monthKey(state.currentYear, state.currentMonth);
  return state.expenses.filter(e => e.date && e.date.startsWith(prefix));
}
function totalSpent() { return currentMonthExpenses().reduce((s,e) => s + e.amount, 0); }

/* ══ NAVIGATION ══ */
function goTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  if (pageId === 'page-home')    render();
  if (pageId === 'page-add')     renderAddPage();
  if (pageId === 'page-history') renderHistory();
  window.scrollTo(0, 0);
}

function changeMonth(dir) {
  state.currentMonth += dir;
  if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
  if (state.currentMonth < 0)  { state.currentMonth = 11; state.currentYear--; }
  render();
}

/* ══ HOME RENDER ══ */
function render() {
  document.getElementById('month-display').textContent = monthName(state.currentYear, state.currentMonth);
  renderBudgetCard();
  renderRecentTx();
  renderDebtList();
}

function renderBudgetCard() {
  const key    = monthKey(state.currentYear, state.currentMonth);
  const budget = state.budgets[key];
  const spent  = totalSpent();
  const el     = document.getElementById('budget-content');

  if (!budget) {
    el.innerHTML = `
      <div class="budget-prompt">
        <span>No budget set for this month.</span>
        <button class="btn-primary" style="width:auto;padding:9px 20px;font-size:13px;border-radius:50px;" onclick="openBudgetModal()">Set Budget</button>
      </div>`;
    return;
  }

  const pct  = Math.min(100, (spent / budget) * 100);
  const rem  = budget - spent;
  const barColor = pct > 90 ? '#8b2635' : pct > 70 ? '#B06A00' : '#2A7A4B';

  el.innerHTML = `
    <div class="row" style="align-items:flex-end">
      <div class="big-number">${fmt(spent)}</div>
      <div style="text-align:right;padding-bottom:4px">
        <div style="font-size:12px;color:var(--text3);font-style:italic">of ${fmt(budget)}</div>
        <div style="font-size:15px;font-weight:700;font-family:'Playfair Display',serif;color:${rem>=0?'var(--green)':'var(--accent)'}">
          ${rem >= 0 ? fmt(rem) + ' left' : fmt(-rem) + ' over budget'}
        </div>
      </div>
    </div>
    <div class="prog-wrap">
      <div class="prog-fill" style="width:${pct}%;background:${barColor}"></div>
    </div>
    <div style="font-size:12px;color:var(--text3);font-style:italic">${Math.round(pct)}% of budget used</div>
    <div class="col2">
      <div class="metric-tile">
        <div class="ml">Spent</div>
        <div class="mv">${fmt(spent)}</div>
      </div>
      <div class="metric-tile">
        <div class="ml">${rem>=0?'Remaining':'Over by'}</div>
        <div class="mv" style="color:${rem>=0?'var(--green)':'var(--accent)'}">${fmt(Math.abs(rem))}</div>
      </div>
    </div>`;
}

const SOURCE_ICONS = {
  salary:'💼', freelance:'💻', investment:'📈', gift:'🎁', refund:'🔄', other:'💰'
};

function txHtml(tx) {
  if (tx._type === 'income') {
    return `<div class="tx-item">
      <div class="tx-ico tx-ico-income">${SOURCE_ICONS[tx.source] || '💰'}</div>
      <div class="tx-info">
        <div class="tx-name">${tx.note || tx.source}</div>
        <div class="tx-meta tx-meta-income">${tx.source.charAt(0).toUpperCase()+tx.source.slice(1)} · ${tx.date}</div>
      </div>
      <div class="tx-amt tx-amt-income">+${fmt(tx.amount)}</div>
    </div>`;
  }
  const cat = state.categories.find(c => c.id === tx.catId) || { name: tx.catId, icon:'💰', color:0 };
  const ci  = cat.color % CAT_COLORS.length;
  return `<div class="tx-item">
    <div class="tx-ico" style="background:${CAT_BGS[ci]}">${cat.icon}</div>
    <div class="tx-info">
      <div class="tx-name">${tx.note || cat.name}</div>
      <div class="tx-meta">${cat.name} · ${tx.date}</div>
    </div>
    <div class="tx-amt">−${fmt(tx.amount)}</div>
  </div>`;
}

function renderRecentTx() {
  const allExpenses = state.expenses.map(e => ({ ...e, _type: 'expense' }));
  const allIncomes  = state.incomes.map(i  => ({ ...i, _type: 'income'  }));
  const all    = [...allExpenses, ...allIncomes].sort((a,b) => b.date.localeCompare(a.date));
  const recent = all.slice(0, 5);
  const el     = document.getElementById('recent-tx-list');
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🧾</div>No transactions yet</div>`;
    return;
  }
  el.innerHTML = recent.map(txHtml).join('');
}

function renderDebtList() {
  const el    = document.getElementById('debt-list');
  const today = new Date().getDate();
  if (!state.debts.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div>No reminders added</div>`;
    return;
  }
  el.innerHTML = state.debts.map(d => {
    const isDue = d.due && (today >= d.due - 3 && today <= d.due + 1);
    return `<div class="debt-item">
      <div class="debt-ico">${TYPE_ICONS[d.type] || '🔔'}</div>
      <div class="debt-info">
        <div class="debt-name">${d.name}${isDue ? '<span class="badge badge-due">Due soon</span>' : ''}</div>
        <div class="debt-sub">${d.type.charAt(0).toUpperCase()+d.type.slice(1)}${d.due ? ' · Due on ' + ordinal(d.due) : ''}</div>
      </div>
      <div class="debt-right">
        <div class="debt-amt">${fmt(d.amount)}</div>
        <button class="edit-btn" onclick="openDebtModal('${d.id}')" title="Edit">✏️</button>
      </div>
    </div>`;
  }).join('');
}

/* ══ ADD EXPENSE PAGE ══ */
function renderAddPage() {
  document.getElementById('exp-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-note').value   = '';
  document.getElementById('save-feedback').textContent = '';
  state.selectedCat = null;
  renderCatChips();
  renderCatBreakdown();
}

function renderCatChips() {
  document.getElementById('cat-chips').innerHTML = state.categories.map(c => `
    <div class="chip ${state.selectedCat===c.id?'selected':''}" onclick="selectCat('${c.id}')">
      ${c.icon} ${c.name}
    </div>`).join('');
}

function selectCat(id) {
  state.selectedCat = id;
  renderCatChips();
}

function renderCatBreakdown() {
  const expenses = currentMonthExpenses();
  const total    = expenses.reduce((s,e) => s + e.amount, 0);
  const bycat    = {};
  expenses.forEach(e => { bycat[e.catId] = (bycat[e.catId] || 0) + e.amount; });
  const sorted   = Object.entries(bycat).sort((a,b) => b[1] - a[1]);
  const el       = document.getElementById('cat-breakdown');

  if (!sorted.length) {
    el.innerHTML = `<div class="empty-state">No expenses this month</div>`;
    return;
  }
  el.innerHTML = sorted.map(([catId, amt]) => {
    const cat = state.categories.find(c => c.id === catId) || { name: catId, icon:'💰', color:0 };
    const ci  = cat.color % CAT_COLORS.length;
    const pct = total ? (amt / total) * 100 : 0;
    return `<div class="cat-row">
      <div class="cat-left">
        <span>${cat.icon}</span>
        <span>${cat.name}</span>
      </div>
      <div class="cat-right">
        <span class="cat-pct">${Math.round(pct)}%</span>
        <div class="cat-bar-wrap">
          <div class="cat-bar" style="width:${pct}%;background:${CAT_COLORS[ci]}"></div>
        </div>
        <span class="cat-val">${fmt(amt)}</span>
      </div>
    </div>`;
  }).join('');
}

function addExpense() {
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const note   = document.getElementById('exp-note').value.trim();
  const date   = document.getElementById('exp-date').value.trim();
  const fb     = document.getElementById('save-feedback');

  if (!amount || amount <= 0) { fb.style.color='var(--accent)'; fb.textContent='Please enter a valid amount.'; return; }
  if (!state.selectedCat)     { fb.style.color='var(--accent)'; fb.textContent='Please select a category.'; return; }
  if (!date)                  { fb.style.color='var(--accent)'; fb.textContent='Please enter a date.'; return; }

  state.expenses.push({ id:'tx-'+Date.now(), amount, note, catId: state.selectedCat, date });
  save();

  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-note').value   = '';
  state.selectedCat = null;
  renderCatChips();
  renderCatBreakdown();

  fb.style.color = 'var(--green)';
  fb.textContent  = '✓ Expense saved!';
  setTimeout(() => fb.textContent = '', 2000);
}

/* ══ HISTORY PAGE ══ */
function renderHistory() {
  const catSel    = document.getElementById('hist-cat').value;
  const sortVal   = document.getElementById('hist-sort').value;
  const catEl     = document.getElementById('hist-cat');
  const savedCat  = catEl.value;

  catEl.innerHTML = `<option value="" ${savedCat===''?'selected':''}>All categories</option>` +
    `<option value="__income__" ${savedCat==='__income__'?'selected':''}>💰 Income</option>` +
    state.categories.map(c =>
      `<option value="${c.id}" ${savedCat===c.id?'selected':''}>${c.icon} ${c.name}</option>`
    ).join('');

  const allExpenses = state.expenses.map(e => ({ ...e, _type: 'expense' }));
  const allIncomes  = state.incomes.map(i  => ({ ...i, _type: 'income'  }));
  let list = [...allExpenses, ...allIncomes];

  if (catSel === '__income__') list = list.filter(e => e._type === 'income');
  else if (catSel) list = list.filter(e => e.catId === catSel);

  if (sortVal === 'newest')  list.sort((a,b) => b.date.localeCompare(a.date));
  if (sortVal === 'oldest')  list.sort((a,b) => a.date.localeCompare(b.date));
  if (sortVal === 'highest') list.sort((a,b) => b.amount - a.amount);

  const el = document.getElementById('history-list');
  if (!list.length) { el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div>No transactions found</div>`; return; }

  let html = '', lastDate = '';
  list.forEach(tx => {
    if (sortVal !== 'highest' && tx.date !== lastDate) {
      html += `<div class="date-group-header">${tx.date}</div>`;
      lastDate = tx.date;
    }
    html += txHtml(tx);
  });
  el.innerHTML = html;
}

/* ══ BUDGET MODAL ══ */
function openBudgetModal() {
  const key = monthKey(state.currentYear, state.currentMonth);
  document.getElementById('budget-modal-sub').textContent = monthName(state.currentYear, state.currentMonth);
  document.getElementById('budget-input').value = state.budgets[key] || '';
  document.getElementById('budget-modal').classList.add('open');
}
function closeBudgetModal(e) {
  if (!e || e.target === document.getElementById('budget-modal'))
    document.getElementById('budget-modal').classList.remove('open');
}
function saveBudget() {
  const val = parseFloat(document.getElementById('budget-input').value);
  if (!val || val <= 0) { alert('Please enter a valid budget amount.'); return; }
  const key = monthKey(state.currentYear, state.currentMonth);
  state.budgets[key] = val;
  save();
  document.getElementById('budget-modal').classList.remove('open');
  render();
}

/* ══ ADD CATEGORY MODAL ══ */
function openAddCatModal() {
  document.getElementById('new-cat-name').value = '';
  document.getElementById('new-cat-icon').value = '';
  state.selectedEmoji = EMOJIS[0];

  document.getElementById('emoji-picker').innerHTML = EMOJIS.map(e =>
    `<span class="emoji-opt ${e===state.selectedEmoji?'picked':''}" onclick="pickEmoji('${e}', event)">${e}</span>`
  ).join('');

  document.getElementById('add-cat-modal').classList.add('open');
}
function pickEmoji(e, event) {
  state.selectedEmoji = e;
  document.querySelectorAll('.emoji-opt').forEach(el => el.classList.remove('picked'));
  event.target.classList.add('picked');
  document.getElementById('new-cat-icon').value = '';
}
function closeAddCatModal(e) {
  if (!e || e.target === document.getElementById('add-cat-modal'))
    document.getElementById('add-cat-modal').classList.remove('open');
}
function saveNewCat() {
  const name = document.getElementById('new-cat-name').value.trim();
  if (!name) { alert('Please enter a category name.'); return; }
  const typed = document.getElementById('new-cat-icon').value.trim();
  const icon  = typed || state.selectedEmoji;
  const color = state.categories.length % CAT_COLORS.length;
  state.categories.push({ id: 'cat-'+Date.now(), name, icon, color });
  save();
  document.getElementById('add-cat-modal').classList.remove('open');
  renderCatChips();
}

/* ══ DEBT MODAL ══ */
function openDebtModal(id) {
  state.editingDebtId = id;
  const d = id ? state.debts.find(x => x.id === id) : null;
  document.getElementById('debt-modal-title').textContent = d ? 'Edit Reminder' : 'Add Reminder';
  document.getElementById('debt-name').value   = d ? d.name   : '';
  document.getElementById('debt-amount').value = d ? d.amount : '';
  document.getElementById('debt-due').value    = d ? d.due    : '';
  document.getElementById('debt-type').value   = d ? d.type   : 'emi';
  document.getElementById('debt-del-btn').style.display = d ? 'block' : 'none';
  document.getElementById('debt-modal').classList.add('open');
}
function closeDebtModal(e) {
  if (!e || e.target === document.getElementById('debt-modal'))
    document.getElementById('debt-modal').classList.remove('open');
}
function saveDebt() {
  const name   = document.getElementById('debt-name').value.trim();
  const amount = parseFloat(document.getElementById('debt-amount').value);
  const due    = parseInt(document.getElementById('debt-due').value) || null;
  const type   = document.getElementById('debt-type').value;
  if (!name || !amount) { alert('Please enter name and amount.'); return; }

  if (state.editingDebtId) {
    const idx = state.debts.findIndex(d => d.id === state.editingDebtId);
    if (idx >= 0) state.debts[idx] = { ...state.debts[idx], name, amount, due, type };
  } else {
    state.debts.push({ id:'debt-'+Date.now(), name, amount, due, type });
  }
  save();
  document.getElementById('debt-modal').classList.remove('open');
  renderDebtList();
}
function deleteDebt() {
  if (!confirm('Delete this reminder?')) return;
  state.debts = state.debts.filter(d => d.id !== state.editingDebtId);
  save();
  document.getElementById('debt-modal').classList.remove('open');
  renderDebtList();
}

/* ══ INCOME MODAL ══ */
function openIncomeModal() {
  document.getElementById('inc-amount').value = '';
  document.getElementById('inc-note').value   = '';
  document.getElementById('inc-source').value = 'salary';
  document.getElementById('inc-date').value   = new Date().toISOString().slice(0, 10);
  document.getElementById('income-feedback').textContent = '';
  document.getElementById('income-modal').classList.add('open');
}
function closeIncomeModal(e) {
  if (!e || e.target === document.getElementById('income-modal'))
    document.getElementById('income-modal').classList.remove('open');
}
function addIncome() {
  const amount = parseFloat(document.getElementById('inc-amount').value);
  const source = document.getElementById('inc-source').value;
  const note   = document.getElementById('inc-note').value.trim();
  const date   = document.getElementById('inc-date').value.trim();
  const fb     = document.getElementById('income-feedback');

  if (!amount || amount <= 0) { fb.style.color='var(--accent)'; fb.textContent='Please enter a valid amount.'; return; }
  if (!date)                  { fb.style.color='var(--accent)'; fb.textContent='Please enter a date.'; return; }

  state.incomes.push({ id:'inc-'+Date.now(), amount, source, note, date });
  save();

  fb.style.color = 'var(--green)';
  fb.textContent  = '✓ Income saved!';
  setTimeout(() => {
    document.getElementById('income-modal').classList.remove('open');
    render();
  }, 900);
}

/* ══ INIT ══ */
load();
render();