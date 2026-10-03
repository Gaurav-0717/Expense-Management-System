const http = require('http');

function req(path, method = 'GET', data = null, token = null) {
  const opts = {
    hostname: '127.0.0.1',
    port: 5000,
    path,
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  return new Promise((resolve, reject) => {
    const r = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', reject);
    if (data) r.write(JSON.stringify(data));
    r.end();
  });
}

(async () => {
  try {
    console.log('1) Login');
    const l = await req('/api/login', 'POST', { email: 'e2e2@example.com', password: 'E2EPass123' });
    console.log(l.status, l.body);

    const token = l.body && l.body.token;
    if (!token) {
      console.error('No token from login, stopping');
      process.exit(1);
    }

    console.log('2) Create Budget');
    const budget = await req('/api/budgets', 'POST', {
      name: 'Monthly Food Budget',
      amount: 500,
      category: 'Food',
      period: 'monthly',
      startDate: new Date().toISOString(),
      description: 'Budget for groceries and dining out'
    }, token);
    console.log(budget.status, budget.body);

    console.log('3) Get Budgets');
    const budgets = await req('/api/budgets', 'GET', null, token);
    console.log(budgets.status, budgets.body);

    console.log('4) Create Goal');
    const goal = await req('/api/goals', 'POST', {
      name: 'Emergency Fund',
      targetAmount: 10000,
      category: 'Savings',
      targetDate: new Date(Date.now() + 365*24*60*60*1000).toISOString(),
      description: 'Build emergency savings'
    }, token);
    console.log(goal.status, goal.body);

    console.log('5) Get Goals');
    const goals = await req('/api/goals', 'GET', null, token);
    console.log(goals.status, goals.body);

    console.log('6) Create Reminder');
    const reminder = await req('/api/reminders', 'POST', {
      title: 'Pay Credit Card Bill',
      description: 'Monthly credit card payment',
      amount: 250,
      dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      category: 'Bills',
      isRecurring: true,
      frequency: 'monthly'
    }, token);
    console.log(reminder.status, reminder.body);

    console.log('7) Get Reminders');
    const reminders = await req('/api/reminders', 'GET', null, token);
    console.log(reminders.status, reminders.body);

    console.log('8) Create Account');
    const account = await req('/api/accounts', 'POST', {
      name: 'Main Checking',
      type: 'checking',
      balance: 2500,
      currency: 'USD',
      institution: 'Bank of America',
      description: 'Primary checking account'
    }, token);
    console.log(account.status, account.body);

    console.log('9) Get Accounts');
    const accounts = await req('/api/accounts', 'GET', null, token);
    console.log(accounts.status, accounts.body);

    console.log('10) Create Tag');
    const tag = await req('/api/tags', 'POST', {
      name: 'Essential',
      color: '#28a745',
      description: 'Essential expenses'
    }, token);
    console.log(tag.status, tag.body);

    console.log('11) Get Tags');
    const tags = await req('/api/tags', 'GET', null, token);
    console.log(tags.status, tags.body);

  } catch (err) {
    console.error('Test error', err);
  }
})();
