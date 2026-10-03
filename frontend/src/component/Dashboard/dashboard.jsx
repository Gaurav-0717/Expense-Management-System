import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import "./dashboard.css"

const calculateMonthlySummary = (expenses = []) => {
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();

  const monthStats = new Map();

  expenses.forEach(exp => {
    const expDate = new Date(exp.date);
    const key = `${expDate.getFullYear()}-${expDate.getMonth()}`;
    const entry = monthStats.get(key) || { income: 0, expense: 0 };

    if ((exp.type || 'Expense') === 'Income') {
      entry.income += Number(exp.amount) || 0;
    } else {
      entry.expense += Number(exp.amount) || 0;
    }

    monthStats.set(key, entry);
  });

  const sortedKeys = [...monthStats.keys()].sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    return yearA - yearB || monthA - monthB;
  });

  const carryForwardByMonth = new Map();
  let runningCarry = 0;

  sortedKeys.forEach(key => {
    const { income, expense } = monthStats.get(key);
    const monthBalance = runningCarry + income - expense;
    runningCarry = Math.max(monthBalance, 0);
    carryForwardByMonth.set(key, {
      income,
      expense,
      monthBalance,
      carryForward: runningCarry,
    });
  });

  const currentMonthKey = `${currentYear}-${currentMonthIndex}`;
  const previousMonthKey = `${currentMonthIndex === 0 ? currentYear - 1 : currentYear}-${currentMonthIndex === 0 ? 11 : currentMonthIndex - 1}`;

  const currentMonthStats = monthStats.get(currentMonthKey) || { income: 0, expense: 0 };
  const carriedOver = carryForwardByMonth.get(previousMonthKey)?.carryForward || 0;
  const incomeTotal = currentMonthStats.income + carriedOver;
  const expenseTotal = currentMonthStats.expense;

  return {
    incomeTotal,
    expenseTotal,
    total: incomeTotal - expenseTotal,
    carryForward: Math.max(incomeTotal - expenseTotal, 0),
  };
};

const COMMON_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Salary', 'Entertainment', 'Health', 'Education', 'Travel', 'Other'];

const Dashboard = React.memo(({ profile }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState('');

  const [editId, setEditId] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState('Expense');
  const [editDate, setEditDate] = useState('');
  const [editReference, setEditReference] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const updateSummary = useCallback((expenses = []) => {
    const summary = calculateMonthlySummary(expenses);
    setIncomeTotal(summary.incomeTotal);
    setExpenseTotal(summary.expenseTotal);
    setTotal(summary.total);
  }, []);

  const handleTypeChange = useCallback((e) => setType(e.target.value), []);
  const handleCategoryChange = useCallback((e) => setCategory(e.target.value), []);
  const handleCustomCategoryChange = useCallback((e) => setCustomCategory(e.target.value), []);
  const handleDescriptionChange = useCallback((e) => setDescription(e.target.value), []);
  const handleAmountChange = useCallback((e) => setAmount(e.target.value), []);
  const handleDateChange = useCallback((e) => setDate(e.target.value), []);

  useEffect(() => {
    // load from API if token exists
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/expenses', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => ({}));
          if (res.ok) {
          const allExpenses = json.expenses || [];
          setData(allExpenses);
          updateSummary(allExpenses);
        } else {
          console.error('Failed to load expenses', json);
        }
      } catch (err) {
        console.error('Network error loading expenses', err);
      }
    })();
  }, [updateSummary]);

  const handleClick = (e) => {
    e.preventDefault();
    setErrorMsg('');
    // client-side validation
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setErrorMsg('Please enter a valid amount (>0)');
      return;
    }
    const finalCategory = category === 'Custom' ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      setErrorMsg('Please select or enter a category');
      return;
    }
    if (!date) {
      setErrorMsg('Please select a date');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return alert('Not authenticated');

    setAdding(true);
    (async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount: Number(amount), type, category: finalCategory, date, description })
        });
        // log raw response for easier debugging when validation fails server-side
  const raw = await res.text();
        console.log('Create expense response status:', res.status);
        console.log('Create expense raw response:', raw);
        let json;
        try { json = JSON.parse(raw); } catch { json = { message: raw }; }
        if (res.ok) {
          const added = json.expense;
          setData(prev => {
            const next = [added, ...prev];
            updateSummary(next);
            return next;
          });
          setAmount(''); setCategory(''); setCustomCategory(''); setDate(''); setDescription(''); setType('Expense');
        } else {
          setErrorMsg(json.message || 'Save failed');
        }
      } catch (err) {
        console.error('Network error creating expense', err);
        setErrorMsg('Unable to reach the server. Please ensure the backend is running.');
      } finally {
        setAdding(false);
      }
    })();
  };

  const handleDelete = (deleteId) => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Not authenticated');
    (async () => {
      try {
  const res = await fetch(`http://127.0.0.1:5000/api/expenses/${deleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json().catch(() => ({}));
          if (res.ok) {
          // Use functional update to avoid stale closures
          setData(prev => {
            const next = prev.filter(item => item._id !== deleteId);
            updateSummary(next);
            return next;
          });
        } else {
          alert((json && json.message) || 'Delete failed');
        }
      } catch (err) { console.error(err); alert('Server error'); }
    })();
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditAmount(item.amount);
    setEditType(item.type || 'Expense');
    setEditCategory(item.category || '');
    setEditDate(item.date ? new Date(item.date).toISOString().slice(0,10) : '');
    setEditDescription(item.description || '');
  };

  const handleUpdate = async () => {
    if (!editId) return;
    const token = localStorage.getItem('token');
    if (!token) return alert('Not authenticated');
    setEditSaving(true);
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/expenses/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(editAmount), type: editType, category: editCategory, date: editDate, description: editDescription })
      });
      const raw = await res.text();
      let json;
      try { json = JSON.parse(raw); } catch { json = { message: raw }; }
      if (res.ok && json.expense) {
        const updated = json.expense;
        setData(prev => {
          const next = prev.map(item => item._id === updated._id ? updated : item);
          updateSummary(next);
          return next;
        });
        // clear edit state
        setEditId(null);
        setEditCategory(''); setEditDescription(''); setEditAmount(''); setEditType('Expense'); setEditDate('');
      } else {
        const msg = (json && json.message) || 'Update failed';
        setErrorMsg(msg);
        console.error('Update failed', json);
      }
    } catch (err) {
      console.error('Network error updating expense', err);
      setErrorMsg('Unable to reach the server. Please ensure the backend is running.');
    } finally {
      setEditSaving(false);
    }
  };

  const displayProfile = useMemo(() => profile || JSON.parse(localStorage.getItem('profile') || 'null') || {}, [profile]);
  const isOverspending = total < 0;

  return (
    <div className="dashboard-container">
      <div className='header'>
        <div>
          <h1 className="heading">Expense Management</h1>
          {displayProfile.name && displayProfile.email ? (
            <div className="small">{displayProfile.name} • {displayProfile.email}</div>
          ) : displayProfile.email ? (
            <div className="small">{displayProfile.email}</div>
          ) : null}
        </div>
        <div>
          <div className="summary">
              <div className="card">
                <div className="small">Income</div>
                <div style={{fontSize:20,fontWeight:700}}>₹{incomeTotal}</div>
              </div>
              <div className="card">
                <div className="small">Spent</div>
                <div style={{fontSize:20,fontWeight:700}}>₹{expenseTotal}</div>
              </div>
              <div className="card">
                <div className="small">Remaining</div>
                <div style={{fontSize:20,fontWeight:700}}>₹{total}</div>
              </div>
          </div>
        </div>
      </div>

      {isOverspending && (
        <div className="inline-error" style={{ marginBottom: 12 }}>
          You are overspending by ₹{Math.abs(total)}. Review your recent expenses and reduce non-essential spending.
        </div>
      )}

      <div className="dashboard-layout">
        <div className="panel controls">
          {errorMsg && <div className="inline-error">{errorMsg}</div>}
          <label>Amount</label>
          <input type="number" placeholder="Enter Amount" name="Amount" value={amount} onChange={handleAmountChange} />

          <label>Type</label>
          <select value={type} onChange={handleTypeChange}>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>

          <label>Category</label>
          <select value={category} onChange={handleCategoryChange}>
            <option value="">Select a category</option>
            {COMMON_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
            <option value="Custom">Custom…</option>
          </select>
          {category === 'Custom' && (
            <input type="text" placeholder="Enter a custom category" value={customCategory} onChange={handleCustomCategoryChange} style={{ marginTop: 8 }} />
          )}

          <label>Date</label>
          <input type="date" value={date} onChange={handleDateChange} />

          <label>Description</label>
          <textarea placeholder="Enter description" name="Description" value={description} onChange={handleDescriptionChange} />

          <button className="save-btn" onClick={handleClick} disabled={adding}>
            {adding ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : <><Plus size={16} /> Save</>}
          </button>
        </div>

        <div className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <td>ID</td>
                  <td>Amount</td>
                  <td>Type</td>
                  <td>Category</td>
                  <td>Date</td>
                  <td>Description</td>
                  <td>Action</td>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item._id}>
                    <td style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'}}>{item._id}</td>
                    <td>{editId === item._id ? (
                      <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                    ) : (`₹${item.amount}`)}</td>
                    <td>{editId === item._id ? (
                      <select value={editType} onChange={e => setEditType(e.target.value)}>
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                      </select>
                    ) : item.type}</td>
                    <td>{editId === item._id ? (
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                        {COMMON_CATEGORIES.map(option => <option key={option} value={option}>{option}</option>)}
                        <option value="Custom">Custom</option>
                      </select>
                    ) : item.category}</td>
                    <td>{editId === item._id ? (
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                    ) : (item.date ? new Date(item.date).toLocaleDateString() : '')}</td>
                    <td>{editId === item._id ? (
                      <input value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                    ) : (item.description || '')}</td>
                    <td>
                      <div className="actions">
                        {editId === item._id ? (
                          <>
                            <button className='action-btn secondary' onClick={handleUpdate} disabled={editSaving}>
                              {editSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Edit2 size={14} /> Save</>}
                            </button>
                            <button className='action-btn' onClick={() => setEditId(null)} disabled={editSaving}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button className='action-btn' onClick={() => handleDelete(item._id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                            <button className='action-btn secondary' onClick={() => handleEdit(item)}>
                              <Edit2 size={14} /> Update
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
