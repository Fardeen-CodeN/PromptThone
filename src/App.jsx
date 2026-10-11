import { useEffect, useState } from "react";
import "./App.css";

const INITIAL_BUDGET = 10000;

const initialTransactions = [
  {
    id: 1,
    title: "Weekly groceries",
    category: "Food",
    amount: 650,
    day: 2,
    unexpected: false,
  },
  {
    id: 2,
    title: "Bus and metro",
    category: "Transport",
    amount: 240,
    day: 3,
    unexpected: false,
  },
  {
    id: 3,
    title: "Coffee with friends",
    category: "Lifestyle",
    amount: 180,
    day: 4,
    unexpected: false,
  },
];

const initialCommitments = [
  {
    id: 101,
    name: "Internet bill",
    amount: 499,
    type: "Bill",
    paid: false,
  },
  {
    id: 102,
    name: "Music subscription",
    amount: 149,
    type: "Subscription",
    paid: false,
  },
  {
    id: 103,
    name: "Gym membership",
    amount: 699,
    type: "Membership",
    paid: false,
  },
];

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function App() {
  const [transactions, setTransactions] = useState(() =>
    loadData("survivewise_transactions", initialTransactions)
  );

  const [commitments, setCommitments] = useState(() =>
    loadData("survivewise_commitments", initialCommitments)
  );

  const [extraIncome, setExtraIncome] = useState(() =>
    loadData("survivewise_income", 0)
  );

  const [day, setDay] = useState(() =>
    loadData("survivewise_day", 5)
  );

  const [savingsGoal, setSavingsGoal] = useState(() =>
    loadData("survivewise_goal", 2000)
  );

  const [activeTab, setActiveTab] = useState("Overview");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [isUnexpected, setIsUnexpected] = useState(false);

  const [incomeTitle, setIncomeTitle] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");

  const [simulationTitle, setSimulationTitle] = useState("New purchase");
  const [simulationAmount, setSimulationAmount] = useState(500);
  const [simulationUnexpected, setSimulationUnexpected] = useState(false);

  // Save application data in the browser.
  useEffect(() => {
    localStorage.setItem(
      "survivewise_transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(
      "survivewise_commitments",
      JSON.stringify(commitments)
    );
  }, [commitments]);

  useEffect(() => {
    localStorage.setItem("survivewise_income", JSON.stringify(extraIncome));
  }, [extraIncome]);

  useEffect(() => {
    localStorage.setItem("survivewise_day", JSON.stringify(day));
  }, [day]);

  useEffect(() => {
    localStorage.setItem("survivewise_goal", JSON.stringify(savingsGoal));
  }, [savingsGoal]);

  // Calculate the current financial situation.
  const totalSpent = transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const totalIncome = INITIAL_BUDGET + extraIncome;

  const unpaidCommitments = commitments
    .filter((item) => !item.paid)
    .reduce((total, item) => total + item.amount, 0);

  const balance = totalIncome - totalSpent - unpaidCommitments;

  const daysRemaining = Math.max(1, 31 - day);

  // The savings target is protected before calculating daily spending money.
  const dailyAllowance = Math.max(
    0,
    balance - savingsGoal
  ) / daysRemaining;

  // Estimate the month-end balance using the spending pace so far.
  const elapsedDays = Math.max(1, day - 1);
  const averageDailySpending = totalSpent / elapsedDays;

  const projectedBalance =
    totalIncome -
    averageDailySpending * 30 -
    unpaidCommitments;

  const unexpectedTotal = transactions
    .filter((transaction) => transaction.unexpected)
    .reduce((total, transaction) => total + transaction.amount, 0);

  const savingsProgress = Math.min(
    100,
    Math.max(0, (Math.max(0, balance) / Math.max(1, savingsGoal)) * 100)
  );

  // A simple, explainable financial health indicator.
  const budgetRemainingRatio = Math.max(
    0,
    Math.min(1, balance / Math.max(1, totalIncome))
  );

  const forecastRatio = Math.max(
    0,
    Math.min(1, projectedBalance / Math.max(1, totalIncome))
  );

  const goalCoverage = Math.max(
    0,
    Math.min(1, balance / Math.max(1, savingsGoal))
  );

  const spendingPace = totalSpent / Math.max(1, day);
  const healthyPace = totalIncome / 30;

  const paceScore = Math.max(
    0,
    Math.min(1, 1 - spendingPace / Math.max(1, healthyPace * 1.5))
  );

  const healthScore = Math.round(
    100 *
      (0.35 * budgetRemainingRatio +
        0.30 * forecastRatio +
        0.20 * goalCoverage +
        0.15 * paceScore)
  );

  const healthLabel =
    balance < 0 || projectedBalance < 0
      ? "Needs attention"
      : healthScore >= 75
      ? "Looking healthy"
      : healthScore >= 45
      ? "Stay mindful"
      : "Needs attention";

  const riskLevel =
    balance < 0 || projectedBalance < 0
      ? "High"
      : dailyAllowance < 150
      ? "Medium"
      : "Low";

  // Group expenses by category for the spending breakdown.
  const categoryTotals = transactions.reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + item.amount;
    return result;
  }, {});

  const categoryColors = {
    Food: "#8b7cf6",
    Transport: "#4ea8de",
    Lifestyle: "#f4a261",
    Bills: "#e76f51",
    Shopping: "#e76f51",
    Health: "#55a987",
    Other: "#87909e",
  };

  const categories = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  );

  function addExpense(event) {
    event.preventDefault();

    const amount = Number(expenseAmount);

    if (!expenseTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid expense name and amount.");
      return;
    }

    const newExpense = {
      id: Date.now(),
      title: expenseTitle.trim(),
      category: expenseCategory,
      amount,
      day,
      unexpected: isUnexpected,
    };

    setTransactions((previous) => [newExpense, ...previous]);

    setExpenseTitle("");
    setExpenseAmount("");
    setIsUnexpected(false);
    setShowExpenseForm(false);
  }

  function addIncome(event) {
    event.preventDefault();

    const amount = Number(incomeAmount);

    if (!incomeTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid income source and amount.");
      return;
    }

    setExtraIncome((previous) => previous + amount);
    setIncomeTitle("");
    setIncomeAmount("");
    setShowIncomeForm(false);
  }

  function toggleCommitment(commitment) {
    if (!commitment.paid) {
      // Paying a commitment converts reserved money into an expense.
      const payment = {
        id: commitment.id,
        title: commitment.name,
        category: "Bills",
        amount: commitment.amount,
        day,
        unexpected: false,
      };

      setTransactions((previous) => [payment, ...previous]);
    } else {
      // Undoing the payment removes its transaction and reserves the money again.
      setTransactions((previous) =>
        previous.filter((item) => item.id !== commitment.id)
      );
    }

    setCommitments((previous) =>
      previous.map((item) =>
        item.id === commitment.id
          ? { ...item, paid: !item.paid }
          : item
      )
    );
  }

  function applySimulation() {
    const amount = Number(simulationAmount);

    if (!simulationTitle.trim() || !Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid purchase name and amount.");
      return;
    }

    setTransactions((previous) => [
      {
        id: Date.now(),
        title: simulationTitle.trim(),
        category: "Lifestyle",
        amount,
        day,
        unexpected: simulationUnexpected,
      },
      ...previous,
    ]);

    setSimulationAmount(500);
    setSimulationTitle("New purchase");
    setSimulationUnexpected(false);
    setActiveTab("Overview");
  }

  function deleteTransaction(id) {
    setTransactions((previous) =>
      previous.filter((item) => item.id !== id)
    );
  }

  function resetDemo() {
    const confirmed = window.confirm(
      "Reset your dashboard to the original demo data?"
    );

    if (!confirmed) return;

    setTransactions(initialTransactions);
    setCommitments(initialCommitments);
    setExtraIncome(0);
    setDay(5);
    setSavingsGoal(2000);
    setActiveTab("Overview");
  }

  const simulatedBalance = balance - Number(simulationAmount || 0);

  const simulatedDailyAllowance =
    Math.max(0, simulatedBalance - savingsGoal) / daysRemaining;

  const simulatedForecast = projectedBalance - Number(simulationAmount || 0);

  const simulatedRisk =
    simulatedBalance < 0 || simulatedForecast < 0
      ? "High"
      : simulatedDailyAllowance < 150
      ? "Medium"
      : "Low";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-icon">₹</span>
          <span>
            <strong>survivewise</strong>
            <small>Money, made mindful.</small>
          </span>
        </a>

        <div className="workspace-label">YOUR MONEY</div>

        <nav className="navigation">
          {[
            ["Overview", "◫"],
            ["Transactions", "↕"],
            ["Commitments", "▤"],
            ["Simulator", "⌁"],
          ].map(([name, icon]) => (
            <button
              key={name}
              className={`nav-item ${activeTab === name ? "active" : ""}`}
              onClick={() => setActiveTab(name)}
            >
              <span className="nav-icon">{icon}</span>
              {name}
              {name === "Transactions" && (
                <span className="nav-count">{transactions.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-budget">
          <span className="budget-symbol">✳</span>
          <p>Small budget. Smart moves.</p>
          <span>Your 30-day challenge</span>
          <div className="mini-progress">
            <span
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (Math.max(0, balance) / totalIncome) * 100)
                )}%`,
              }}
            />
          </div>
          <small>{formatMoney(Math.max(0, balance))} left to work with</small>
        </div>

        <button className="reset-button" onClick={resetDemo}>
          ↺ Reset demo data
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Personal finance <span>/</span>{" "}
            <strong>{activeTab}</strong>
          </div>

          <div className="topbar-right">
            <span className="live-dot" />
            <span>30-day challenge</span>
            <div className="avatar">S</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">YOUR FINANCIAL SPACE</p>
              <h1>
                Make your money <span>make sense.</span>
              </h1>
              <p className="subtitle">
                Every rupee has a purpose. Let's make yours count.
              </p>
            </div>

            <div className="day-control">
              <label htmlFor="day-slider">DAY {day} OF 30</label>
              <input
                id="day-slider"
                type="range"
                min="1"
                max="30"
                value={day}
                onChange={(event) => setDay(Number(event.target.value))}
              />
              <div className="day-range">
                <span>Day 1</span>
                <span>Day 30</span>
              </div>
            </div>
          </section>

          <section className="budget-banner">
            <div className="banner-copy">
              <span className="banner-label">YOUR STARTING BUDGET</span>
              <h2>₹10,000</h2>
              <p>
                A whole month. A limited budget. You've got this.
              </p>
              <button
                className="banner-button"
                onClick={() => setShowIncomeForm(true)}
              >
                + Add income
              </button>
            </div>

            <div className="banner-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-coin coin-one">₹</div>
              <div className="art-coin coin-two">₹</div>
              <div className="art-coin coin-three">✳</div>
              <div className="art-center">₹</div>
            </div>

            <div className="banner-stats">
              <div>
                <span>Total available</span>
                <strong>{formatMoney(balance)}</strong>
              </div>
              <div>
                <span>Already spent</span>
                <strong>{formatMoney(totalSpent)}</strong>
              </div>
              <div>
                <span>Days remaining</span>
                <strong>{daysRemaining} days</strong>
              </div>
            </div>
          </section>

          <div className="section-heading">
            <div>
              <h2>Your money at a glance</h2>
              <p>Know where you stand before you make your next move.</p>
            </div>

            <button
              className="primary-button"
              onClick={() => setShowExpenseForm(true)}
            >
              <span>＋</span> Add expense
            </button>
          </div>

          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon purple">↗</span>
                <span className="metric-tag">LIVE BALANCE</span>
              </div>
              <h3>{formatMoney(balance)}</h3>
              <p>After spending & unpaid commitments</p>
              <div className="metric-bottom">
                <span className={balance < 0 ? "negative" : "positive"}>
                  {balance < 0 ? "Over budget" : "Money remaining"}
                </span>
                <span>01</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon blue">◷</span>
                <span className="metric-tag">DAILY ALLOWANCE</span>
              </div>
              <h3>{formatMoney(dailyAllowance)}</h3>
              <p>Per day, while protecting your savings goal</p>
              <div className="metric-bottom">
                <span className="neutral-text">For {daysRemaining} days</span>
                <span>02</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon green">◎</span>
                <span className="metric-tag">SAVINGS GOAL</span>
              </div>
              <h3>{formatMoney(savingsGoal)}</h3>
              <p>Target for your month</p>
              <div className="metric-progress">
                <span style={{ width: `${savingsProgress}%` }} />
              </div>
              <div className="metric-bottom">
                <span className="positive">
                  {Math.round(savingsProgress)}% covered by current balance
                </span>
                <span>03</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-top">
                <span className="metric-icon orange">⌁</span>
                <span className="metric-tag">MONTH-END FORECAST</span>
              </div>
              <h3 className={projectedBalance < 0 ? "negative" : ""}>
                {formatMoney(projectedBalance)}
              </h3>
              <p>Estimated balance if this pace continues</p>
              <div className="metric-bottom">
                <span className={projectedBalance < 0 ? "negative" : "positive"}>
                  {projectedBalance < 0 ? "Potential shortfall" : "Projected remaining"}
                </span>
                <span>04</span>
              </div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel spending-panel">
              <div className="panel-heading">
                <div>
                  <h2>Where your money goes</h2>
                  <p>Your spending, broken down by category.</p>
                </div>
                <span className="panel-icon">◔</span>
              </div>

              {categories.length === 0 ? (
                <div className="empty-state">
                  <span>◌</span>
                  <p>No spending yet. Add your first expense!</p>
                </div>
              ) : (
                <>
                  <div className="spending-total">
                    <strong>{formatMoney(totalSpent)}</strong>
                    <span>total spending</span>
                  </div>

                  <div className="category-bars">
                    {categories.map(([category, amount]) => (
                      <div className="category-row" key={category}>
                        <div className="category-info">
                          <span
                            className="category-dot"
                            style={{
                              background:
                                categoryColors[category] || "#87909e",
                            }}
                          />
                          <span>{category}</span>
                          <strong>{formatMoney(amount)}</strong>
                        </div>
                        <div className="category-track">
                          <span
                            style={{
                              width: `${(amount / Math.max(1, totalSpent)) * 100}%`,
                              background:
                                categoryColors[category] || "#87909e",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="panel-footer">
                <span>{categories.length} spending categories</span>
                <button onClick={() => setActiveTab("Transactions")}>
                  View transactions →
                </button>
              </div>
            </article>

            <article className="panel health-panel">
              <div className="panel-heading">
                <div>
                  <h2>Financial health</h2>
                  <p>A snapshot of your money habits.</p>
                </div>
                <span className="health-sparkle">✳</span>
              </div>

              <div className="health-score">
                <div
                  className="score-ring"
                  style={{
                    "--score": `${healthScore * 3.6}deg`,
                  }}
                >
                  <div className="score-inner">
                    <strong>{healthScore}</strong>
                    <span>out of 100</span>
                  </div>
                </div>

                <div className="score-copy">
                  <span className={`health-pill ${healthScore < 45 ? "warning" : ""}`}>
                    {healthLabel}
                  </span>
                  <p>
                    {healthScore >= 75
                      ? "You're building a good financial cushion. Keep it up!"
                      : healthScore >= 45
                      ? "A few mindful choices can strengthen your month."
                      : "Review your spending and upcoming commitments."}
                  </p>
                </div>
              </div>

              <div className="risk-row">
                <div>
                  <span className="risk-dot" />
                  <span>Financial risk</span>
                </div>
                <strong className={`risk-${riskLevel.toLowerCase()}`}>
                  {riskLevel}
                </strong>
              </div>

              <div className="risk-row">
                <div>
                  <span className="risk-dot blue-dot" />
                  <span>Unexpected expenses</span>
                </div>
                <strong>{formatMoney(unexpectedTotal)}</strong>
              </div>

              <div className="health-tip">
                <span>✦</span>
                <p>
                  {balance <= savingsGoal
                    ? "Your current balance is at or below your savings target. Avoid non-essential spending until you review your plan."
                    : dailyAllowance < 200
                    ? "Your daily allowance is tight. Prioritize essentials and review upcoming commitments."
                    : "Before a big purchase, try the decision simulator to see its impact on your month."}
                </p>
              </div>
            </article>
          </section>

          <section className="dashboard-grid lower-grid">
            <article className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p>Your latest money moves.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setActiveTab("Transactions")}
                >
                  See all →
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions yet.</p>
                </div>
              ) : (
                <div className="transaction-list">
                  {transactions.slice(0, 4).map((item) => (
                    <div className="transaction-item" key={item.id}>
                      <div className="transaction-avatar">
                        {item.category === "Food"
                          ? "🍜"
                          : item.category === "Transport"
                          ? "🚌"
                          : item.category === "Health"
                          ? "💚"
                          : item.category === "Bills"
                          ? "🧾"
                          : item.category === "Shopping"
                          ? "🛍️"
                          : "✳"}
                      </div>
                      <div className="transaction-description">
                        <strong>{item.title}</strong>
                        <span>
                          {item.category} · Day {item.day}
                          {item.unexpected ? " · Unexpected" : ""}
                        </span>
                      </div>
                      <strong className="expense-amount">
                        −{formatMoney(item.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="panel goal-panel">
              <div className="panel-heading">
                <div>
                  <h2>Your savings plan</h2>
                  <p>Choose what you want to protect.</p>
                </div>
                <span className="panel-icon green-icon">◎</span>
              </div>

              <div className="goal-amount">
                <span>Monthly savings target</span>
                <strong>{formatMoney(savingsGoal)}</strong>
              </div>

              <input
                className="goal-slider"
                type="range"
                min="0"
                max="5000"
                step="100"
                value={savingsGoal}
                onChange={(event) => setSavingsGoal(Number(event.target.value))}
                aria-label="Savings target"
              />

              <div className="goal-range">
                <span>₹0</span>
                <span>₹5,000</span>
              </div>

              <div className="goal-summary">
                <div>
                  <span>Target protected</span>
                  <strong>{formatMoney(Math.min(Math.max(0, balance), savingsGoal))}</strong>
                </div>
                <div>
                  <span>Target gap</span>
                  <strong>
                    {formatMoney(Math.max(0, savingsGoal - Math.max(0, balance)))}
                  </strong>
                </div>
              </div>

              <div className="goal-note">
                <span>✦</span>
                This target is reserved when calculating your daily allowance.
              </div>
            </article>
          </section>

          {activeTab === "Transactions" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h2>All transactions</h2>
                  <p>Every recorded expense in your challenge.</p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setShowExpenseForm(true)}
                >
                  + Add expense
                </button>
              </div>

              <div className="transaction-list">
                {transactions.map((item) => (
                  <div className="transaction-item" key={item.id}>
                    <div className="transaction-avatar">₹</div>
                    <div className="transaction-description">
                      <strong>{item.title}</strong>
                      <span>
                        {item.category} · Day {item.day}
                        {item.unexpected ? " · Unexpected" : ""}
                      </span>
                    </div>
                    <strong className="expense-amount">
                      −{formatMoney(item.amount)}
                    </strong>
                    <button
                      className="delete-button"
                      onClick={() => deleteTransaction(item.id)}
                      aria-label={`Delete ${item.title}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === "Commitments" && (
            <section className="panel full-panel">
              <div className="panel-heading">
                <div>
                  <h2>Commitments & subscriptions</h2>
                  <p>Unpaid items reduce your available balance.</p>
                </div>
              </div>

              <div className="commitment-total">
                <span>Still reserved</span>
                <strong>{formatMoney(unpaidCommitments)}</strong>
              </div>

              {commitments.map((item) => (
                <div className="commitment-item" key={item.id}>
                  <div className="commitment-icon">▤</div>
                  <div className="transaction-description">
                    <strong>{item.name}</strong>
                    <span>{item.type}</span>
                  </div>
                  <strong>{formatMoney(item.amount)}</strong>
                  <button
                    className={`status-button ${item.paid ? "paid" : ""}`}
                    onClick={() => toggleCommitment(item)}
                  >
                    {item.paid ? "✓ Paid · Undo" : "Mark as paid"}
                  </button>
                </div>
              ))}
            </section>
          )}

          {activeTab === "Simulator" && (
            <section className="panel simulator-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">THINK BEFORE YOU SPEND</p>
                  <h2>What if you bought it?</h2>
                  <p>
                    Test a purchase first. Nothing changes until you apply it.
                  </p>
                </div>
                <span className="simulator-icon">⌁</span>
              </div>

              <div className="simulator-layout">
                <div className="simulator-form">
                  <label htmlFor="sim-title">What are you planning to buy?</label>
                  <input
                    id="sim-title"
                    value={simulationTitle}
                    onChange={(event) => setSimulationTitle(event.target.value)}
                    placeholder="e.g. New headphones"
                  />

                  <label htmlFor="sim-amount">Purchase amount</label>
                  <div className="amount-input">
                    <span>₹</span>
                    <input
                      id="sim-amount"
                      type="number"
                      min="1"
                      value={simulationAmount}
                      onChange={(event) =>
                        setSimulationAmount(Number(event.target.value))
                      }
                    />
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={Math.min(5000, Math.max(0, simulationAmount))}
                    onChange={(event) =>
                      setSimulationAmount(Number(event.target.value))
                    }
                    aria-label="Simulated purchase amount"
                  />

                  <div className="goal-range">
                    <span>₹0</span>
                    <span>₹5,000</span>
                  </div>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={simulationUnexpected}
                      onChange={(event) =>
                        setSimulationUnexpected(event.target.checked)
                      }
                    />
                    This is an unexpected expense
                  </label>

                  <button className="primary-button apply-button" onClick={applySimulation}>
                    Apply purchase to my budget →
                  </button>
                </div>

                <div className="simulation-results">
                  <span className="eyebrow">IF YOU MAKE THIS PURCHASE</span>

                  <div className="simulation-result-row">
                    <span>Current balance</span>
                    <strong>{formatMoney(balance)}</strong>
                  </div>

                  <div className="simulation-result-row">
                    <span>Balance after purchase</span>
                    <strong className={simulatedBalance < 0 ? "negative" : ""}>
                      {formatMoney(simulatedBalance)}
                    </strong>
                  </div>

                  <div className="simulation-result-row">
                    <span>New daily allowance</span>
                    <strong>{formatMoney(simulatedDailyAllowance)}</strong>
                  </div>

                  <div className="simulation-result-row">
                    <span>New month-end forecast</span>
                    <strong className={simulatedForecast < 0 ? "negative" : ""}>
                      {formatMoney(simulatedForecast)}
                    </strong>
                  </div>

                  <div className="simulation-result-row">
                    <span>Financial risk</span>
                    <strong className={`risk-${simulatedRisk.toLowerCase()}`}>
                      {simulatedRisk}
                    </strong>
                  </div>

                  <div className={`simulation-warning ${simulatedRisk === "High" ? "warning" : ""}`}>
                    {simulatedRisk === "High"
                      ? "⚠ This purchase may put your budget under pressure."
                      : simulatedRisk === "Medium"
                      ? "◷ Consider whether this purchase is worth the trade-off."
                      : "✦ This purchase appears manageable under your current plan."}
                  </div>
                </div>
              </div>
            </section>
          )}

          <footer className="app-footer">
            <span>survivewise © 2026</span>
            <span>Built for smarter money decisions <strong>✳</strong></span>
            <button onClick={resetDemo}>Reset demo</button>
          </footer>
        </div>
      </main>

      {showExpenseForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowExpenseForm(false)}
        >
          <form
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            onSubmit={addExpense}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">TRACK YOUR MONEY</p>
                <h2>Add an expense</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowExpenseForm(false)}
              >
                ×
              </button>
            </div>

            <label htmlFor="expense-title">Expense name</label>
            <input
              id="expense-title"
              value={expenseTitle}
              onChange={(event) => setExpenseTitle(event.target.value)}
              placeholder="e.g. Lunch"
              required
            />

            <label htmlFor="expense-amount">Amount (₹)</label>
            <input
              id="expense-amount"
              type="number"
              min="1"
              value={expenseAmount}
              onChange={(event) => setExpenseAmount(event.target.value)}
              placeholder="e.g. 250"
              required
            />

            <label htmlFor="expense-category">Category</label>
            <select
              id="expense-category"
              value={expenseCategory}
              onChange={(event) => setExpenseCategory(event.target.value)}
            >
              <option>Food</option>
              <option>Transport</option>
              <option>Lifestyle</option>
              <option>Bills</option>
              <option>Shopping</option>
              <option>Health</option>
              <option>Other</option>
            </select>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isUnexpected}
                onChange={(event) => setIsUnexpected(event.target.checked)}
              />
              Unexpected expense
            </label>

            <button type="submit" className="primary-button modal-submit">
              Save expense
            </button>
          </form>
        </div>
      )}

      {showIncomeForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowIncomeForm(false)}
        >
          <form
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            onSubmit={addIncome}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">MORE MONEY, MORE OPTIONS</p>
                <h2>Add income</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowIncomeForm(false)}
              >
                ×
              </button>
            </div>

            <label htmlFor="income-title">Income source</label>
            <input
              id="income-title"
              value={incomeTitle}
              onChange={(event) => setIncomeTitle(event.target.value)}
              placeholder="e.g. Freelance project"
              required
            />

            <label htmlFor="income-amount">Amount (₹)</label>
            <input
              id="income-amount"
              type="number"
              min="1"
              value={incomeAmount}
              onChange={(event) => setIncomeAmount(event.target.value)}
              placeholder="e.g. 1500"
              required
            />

            <button type="submit" className="primary-button modal-submit">
              Add income
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;