import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import './analysis.css';

const Analysis = () => {
  const [expenses, setExpenses] = useState([]);
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const barRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        // fetch both expenses list and monthly report
        const r1 = await fetch(`${API_BASE_URL}/api/expenses`, { headers: { Authorization: `Bearer ${token}` } });
        const j1 = await r1.json().catch(() => ({}));
        if (r1.ok) setExpenses(j1.expenses || []);
        const r2 = await fetch(`${API_BASE_URL}/api/expenses/report`, { headers: { Authorization: `Bearer ${token}` } });
        const j2 = await r2.json().catch(() => ({}));
        if (r2.ok && j2) setReport(j2);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    // debug: show expenses we received
    console.debug('Analysis: expenses', expenses);
  }, [expenses]);

  // Filter expenses based on selected period
  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date || exp.createdAt || exp.updatedAt || Date.now());
    const now = new Date();
    if (period === 'month') {
      const monthStart = new Date(now);
      monthStart.setDate(now.getDate() - 30);
      return expDate >= monthStart && expDate <= now;
    } else if (period === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      return expDate >= weekStart && expDate <= now;
    } else if (period === 'year') {
      const yearStart = new Date(now);
      yearStart.setDate(now.getDate() - 365);
      return expDate >= yearStart && expDate <= now;
    } else if (period === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      return expDate >= start && expDate <= end;
    }
    return true; // default to all if no match
  });

  useEffect(() => {
    if (!window.Chart) return; // ensure CDN loaded
    if (!filteredExpenses.length) return;

    // Prepare data for "Expenses by Category" (bar)
    const byCategory = filteredExpenses.reduce((acc, it) => {
      const cat = it.category || it.purpose || 'Other';
      acc[cat] = (acc[cat] || 0) + Number(it.amount || 0);
      return acc;
    }, {});

    // build bar chart for categories (ensure refs exist)
    const barCtx = barRef.current && barRef.current.getContext && barRef.current.getContext('2d');
    if (barCtx) {
      if (window._barChart) window._barChart.destroy();
      const labels = Object.keys(byCategory);
      const values = Object.values(byCategory);
      window._barChart = new window.Chart(barCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Amount',
            data: values,
            backgroundColor: ['#60a5fa','#f472b6','#f59e0b','#34d399','#a78bfa']
          }]
        },
        options: { responsive: true }
      });
    }

    // Prepare data for "Expenses over Time" (line)
    const byDate = filteredExpenses.reduce((acc, it) => {
      const d = new Date(it.createdAt || it.updatedAt || Date.now()).toLocaleDateString();
      acc[d] = (acc[d] || 0) + Number(it.amount || 0);
      return acc;
    }, {});

    const lineCtx = lineRef.current && lineRef.current.getContext && lineRef.current.getContext('2d');
    if (lineCtx) {
      if (window._lineChart) window._lineChart.destroy();
      window._lineChart = new window.Chart(lineCtx, {
        type: 'line',
        data: {
          labels: Object.keys(byDate),
          datasets: [{ label: 'Daily total', data: Object.values(byDate), borderColor: '#6b46ff', backgroundColor: 'rgba(107,70,255,0.08)' }]
        },
        options: { responsive: true }
      });
    }
  }, [filteredExpenses]);

  // AI-like overspending analysis
  const suggestions = (() => {
    if (!expenses.length) return [];
    // group by category and month
    const byCategoryMonth = {};
    expenses.forEach(it => {
      const date = new Date(it.date || it.createdAt || it.updatedAt || Date.now());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
      const cat = it.category || 'Other';
      byCategoryMonth[cat] = byCategoryMonth[cat] || {};
      byCategoryMonth[cat][monthKey] = (byCategoryMonth[cat][monthKey] || 0) + Number(it.amount || 0);
    });

    const out = [];
    // Use the latest month in the data as "this month" for suggestions
    const allMonthKeys = Object.values(byCategoryMonth).flatMap(cat => Object.keys(cat));
    const uniqueMonths = [...new Set(allMonthKeys)].sort();
    const thisMonthKey = uniqueMonths[uniqueMonths.length - 1]; // latest month

    Object.keys(byCategoryMonth).forEach(cat => {
      const months = Object.keys(byCategoryMonth[cat]).sort();
      if (!months.length) return;
      const recent = byCategoryMonth[cat][thisMonthKey] || 0;
      // compute average of previous months (exclude this month)
      const prevMonths = months.filter(m => m !== thisMonthKey);
      if (prevMonths.length === 0) {
        // no history to compare against
        return;
      }
      const prevTotals = prevMonths.map(m => byCategoryMonth[cat][m]);
      const prevAvg = prevTotals.reduce((s,v) => s+v,0) / prevTotals.length;
      if (prevAvg > 0 && recent > prevAvg) {
        const pct = Math.round((recent - prevAvg) / prevAvg * 100);
        out.push({ category: cat, avg: Math.round(prevAvg), recent: Math.round(recent), pct, severity: pct > 100 ? 'high' : pct > 40 ? 'medium' : 'low', message: `You've spent ${pct}% more on ${cat} this month compared to your average. Consider reducing small frequent purchases and setting a weekly budget.` });
      }
    });
    console.debug('Analysis: byCategoryMonth', byCategoryMonth, 'thisMonthKey', thisMonthKey, 'suggestions', out);
    return out.sort((a,b) => b.pct - a.pct);
  })();

  return (
    <div className="analysis-panel">
      <h2><BarChart3 size={32} /> Expense Analysis</h2>
      <p className="small">Visual overview of expenses by category and over time.</p>
      <div className="period-filters" style={{margin:'12px 0', display:'flex', gap:'8px', alignItems:'center'}}>
        <label><Filter size={16} /> Period:</label>
        <button onClick={() => setPeriod('month')} className={period === 'month' ? 'active' : ''}><Calendar size={14} /> Month</button>
        <button onClick={() => setPeriod('week')} className={period === 'week' ? 'active' : ''}><Calendar size={14} /> Week</button>
        <button onClick={() => setPeriod('year')} className={period === 'year' ? 'active' : ''}><Calendar size={14} /> Year</button>
        <button onClick={() => setPeriod('custom')} className={period === 'custom' ? 'active' : ''}><Calendar size={14} /> Custom</button>
        {period === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </>
        )}
      </div>
      {report && (
        <div className="report-summary" style={{display:'flex',gap:12,margin:'12px 0'}}>
          <div className="card small">Period: <strong>{period.charAt(0).toUpperCase() + period.slice(1)}</strong></div>
          {(() => {
            const local = JSON.parse(localStorage.getItem('profile') || 'null') || {};
            const fallbackIncome = (local.monthlyIncome && Number(local.monthlyIncome)) || 0;
            const monthlyIncome = (report.income && Number(report.income)) || (report.incomeRecorded && Number(report.incomeRecorded)) || fallbackIncome || 0;
            let periodIncome = monthlyIncome;
            if (period === 'week') {
              periodIncome = monthlyIncome / 4.3; // approximate weeks in a month
            } else if (period === 'year') {
              periodIncome = monthlyIncome * 12;
            } else if (period === 'custom' && customStart && customEnd) {
              const start = new Date(customStart);
              const end = new Date(customEnd);
              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
              const dailyIncome = monthlyIncome / 30;
              periodIncome = dailyIncome * days;
            }
            const spentDisplay = filteredExpenses.filter(exp => (exp.type || 'Expense') === 'Expense').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
            const remainingDisplay = periodIncome - spentDisplay;
            const isOverspending = remainingDisplay < 0;
            return (
              <>
                <div className="card small">Income: <strong>₹{Math.round(periodIncome)}</strong></div>
                <div className="card small">Spent: <strong>₹{spentDisplay}</strong></div>
                <div className="card small">Remaining: <strong>₹{Math.round(remainingDisplay)}</strong></div>
                {isOverspending && <div className="card small" style={{ color: '#b91c1c', fontWeight: 700 }}>Overspending alert: you are ₹{Math.abs(Math.round(remainingDisplay))} over budget.</div>}
              </>
            );
          })()}
        </div>
      )}

      <div className="charts">
        <div className="chart card">
          <h3><BarChart3 size={20} /> Expenses by Category</h3>
          <canvas ref={barRef} width="400" height="200"></canvas>
        </div>

        <div className="chart card">
          <h3><TrendingUp size={20} /> Expenses over Time</h3>
          <canvas ref={lineRef} width="400" height="200"></canvas>
        </div>
      </div>

      <div className="suggestions">
        <h3>Smart Insights & Suggestions</h3>
        {suggestions.length === 0 && <div className="small">No unusual spending detected. Good job!</div>}
        {suggestions.map(s => (
          <div className="suggestion" key={s.category}>
            <div>
              <div style={{fontWeight:700}}>{s.category}</div>
              <div className="meta">This month: ₹{s.recent} — Avg: ₹{s.avg}</div>
              <div style={{marginTop:6}}>{s.message}</div>
            </div>
            <div>
              <div className={`badge ${s.severity}`}>{s.pct}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Analysis;
