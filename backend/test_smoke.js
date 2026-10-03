const assert = require('assert');

const routeModules = [
  './Routes/authRoutes',
  './Routes/expenseRoutes',
  './Routes/budgetRoutes',
  './Routes/goalRoutes',
  './Routes/reminderRoutes',
  './Routes/accountRoutes',
  './Routes/tagRoutes',
];

for (const mod of routeModules) {
  const router = require(mod);
  assert.ok(router && typeof router.stack !== 'undefined', `${mod} should export an Express router`);
}

console.log('Backend smoke test passed: route modules load successfully.');
