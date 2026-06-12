// --- SIDEBAR LOGIC ---
function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('visible');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('visible');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
}

// --- MAIN REPORT LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
    const reportDisplay = document.getElementById("reportDisplay");
    const storyDisplay = document.getElementById("storyDisplay");
    
    // 1. DATA RETRIEVAL
    const data = JSON.parse(localStorage.getItem("spendbook-v1")) || {};
    
    // Map expenses and incomes into a unified transactions array
    const mappedExpenses = (data.expenses || []).map(e => {
        const cat = (data.categories || []).find(c => c.id === e.catId);
        return {
            ...e,
            type: "expense",
            amount: parseFloat(e.amount) || 0,
            desc: e.note || (cat ? cat.name : e.catId) || "Expense"
        };
    });
    const mappedIncomes = (data.incomes || []).map(i => ({
        ...i,
        type: "income",
        amount: parseFloat(i.amount) || 0,
        desc: i.note || i.source || "Income"
    }));
    
    const transactions = [...mappedExpenses, ...mappedIncomes].sort((a, b) => a.date.localeCompare(b.date));
    
    // Determine the monthly budget limit (current month, or fall back to the most recently set budget)
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let budget = 0;
    if (data.budgets) {
        budget = parseFloat(data.budgets[currentMonthKey]) || 0;
        if (budget === 0) {
            const keys = Object.keys(data.budgets).sort();
            if (keys.length > 0) {
                budget = parseFloat(data.budgets[keys[keys.length - 1]]) || 0;
            }
        }
    }
    
    // 2. CALCULATIONS
    const expenses = transactions.filter(t => t.type === "expense");
    const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netSavings = totalIncome - totalExpense;
    const budgetStatus = budget - totalExpense;

    // Generate Budget Status HTML
    let statusHTML = budget === 0 
        ? `<p class="expense">No budget set for this month.</p>`
        : budgetStatus >= 0 
            ? `<p class="income">Great! ₹${budgetStatus.toLocaleString()} remaining.</p>`
            : `<p class="expense">Alert: Over budget by ₹${Math.abs(budgetStatus).toLocaleString()}.</p>`;

    // Inject Summary into Top Card
    if (reportDisplay) {
        reportDisplay.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-box" style="border-left: 5px solid #ac3c45;">
                    <h4>Cash Flow</h4>
                    <p>Total Income: <span class="income">₹${totalIncome.toLocaleString()}</span></p>
                    <p>Total Spent: <span class="expense">₹${totalExpense.toLocaleString()}</span></p>
                </div>
                <div class="form-box" style="border-left: 5px solid #3498db;">
                    <h4>Budget Tracking</h4>
                    <p>Monthly Limit: ₹${budget.toLocaleString()}</p>
                    ${statusHTML}
                </div>
            </div>
        `;
    }

    // 3. STORY SCROLL LOGIC (The Milestone System)
    let milestones = [];

    if (transactions.length > 0) {
        // Milestone 1: The First Step
        milestones.push({
            title: "The First Move",
            text: `Your journey began on ${transactions[0].date}. Taking that first step to track your money is the hardest part!`
        });

        // Milestone 3: Biggest Spending
        if (expenses.length > 0) {
            const biggest = expenses.reduce((prev, curr) => (parseFloat(prev.amount) > parseFloat(curr.amount)) ? prev : curr);
            milestones.push({
                title: "The Largest Transaction",
                text: `Your biggest single expense was ₹${biggest.amount.toLocaleString()} for "${biggest.desc}".`
            });
        }

        // Milestone 4: Savings Health
        if (netSavings > 0) {
            milestones.push({
                title: "Wealth Builder",
                text: `You finished the period with ₹${netSavings.toLocaleString()} in net savings. That's money building your future!`
            });
        } else if (netSavings < 0) {
            milestones.push({
                title: "Recovery Mode",
                text: `You spent more than you earned this month. Let's aim to flip that "Discipline Score" higher next month!`
            });
        }
    }

    // Conclusion Milestone
    milestones.push({
        title: "Journey Complete",
        text: "You've successfully reviewed your monthly habits. Ready to do it again?"
    });

    // Inject Milestones into the Timeline
    if (storyDisplay) {
        storyDisplay.innerHTML = ""; // Clear placeholders
        milestones.forEach(m => {
            const div = document.createElement("div");
            div.className = "story-point";
            div.innerHTML = `<h3>${m.title}</h3><p>${m.text}</p>`;
            storyDisplay.appendChild(div);
        });
    }

    // 4. INTERSECTION OBSERVER (Scroll Animations)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.story-point').forEach(point => {
        observer.observe(point);
    });
});

// --- UTILITY: RESET DATA ---
function resetData() {
    if (confirm("Are you sure? This will permanently delete all ExpenseFlow records.")) {
        localStorage.clear();
        window.location.href = 'home.html'; // Redirect to home after reset
    }
}