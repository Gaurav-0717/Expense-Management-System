const http = require('http');

function req(path, method = 'GET', data = null) {
  const opts = { hostname: '127.0.0.1', port: 5000, path, method, headers: { 'Content-Type': 'application/json' } };
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
    console.log('1) Signup');
    const s = await req('/api/signup', 'POST', { name: 'E2EUser2', email: 'e2e2@example.com', password: 'E2EPass123' });
    console.log(s.status, s.body);

    console.log('2) Login');
    const l = await req('/api/login', 'POST', { email: 'e2e2@example.com', password: 'E2EPass123' });
    console.log(l.status, l.body);

    const token = l.body && l.body.token;
    if (!token) {
      console.error('No token from login, stopping');
      process.exit(1);
    }

    console.log('3) Create expense');
    // Create a new expense via POST to /api/expenses with Authorization header - use a direct http.request for headers
    const opts = { hostname: '127.0.0.1', port: 5000, path: '/api/expenses', method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } };
    const created = await new Promise((resolve, reject) => {
      const r = http.request(opts, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try { body = JSON.parse(body); } catch (e) {}
          resolve({ status: res.statusCode, body });
        });
      });
      r.on('error', reject);
      r.write(JSON.stringify({ category: 'Test', description: 'E2E test', amount: 12.5, date: new Date().toISOString() }));
      r.end();
    });
    console.log(created.status, created.body);
  } catch (err) {
    console.error('E2E error', err);
  }
})();
