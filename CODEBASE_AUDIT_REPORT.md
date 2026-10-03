# Expense App Codebase Audit Report

## Scope reviewed
- Backend: [backend](backend)
- Frontend: [frontend/src](frontend/src)
- Models, controllers, routes, middleware, and auth flow

## Verification performed
1. Backend startup check:
   - Command: `cmd /d /c "cd /d c:\Users\Lenovo\OneDrive\Desktop\Coding\Expense_app\backend && npm run start"`
   - Result: failed with `SyntaxError: Unexpected token '='` while loading the route files.
2. Frontend production build check:
   - Command: `cmd /d /c "cd /d c:\Users\Lenovo\OneDrive\Desktop\Coding\Expense_app\frontend && npm run build"`
   - Result: passed (`vite build` completed successfully).

## Findings

### 1) Backend startup crash due to corrupted route imports
- File / line: [backend/Routes/budgetRoutes.js](backend/Routes/budgetRoutes.js#L9), [backend/Routes/accountRoutes.js](backend/Routes/accountRoutes.js#L9), [backend/Routes/goalRoutes.js](backend/Routes/goalRoutes.js#L9), [backend/Routes/reminderRoutes.js](backend/Routes/reminderRoutes.js#L9), [backend/Routes/tagRoutes.js](backend/Routes/tagRoutes.js#L9)
- Issue description: The server cannot start because the route files contain invalid syntax (`= require(...)`) and reference missing controller files under `controllers/`.
- Root cause: The route files were partially corrupted and point to non-existent modules (`../controllers/...`) while the real controllers are under `backend/Controller/` or `backend/controllers/`.
- Severity: Critical
- Exact code fix:
  ```js
  const { authenticateToken } = require('../Middleware/authMiddleware');
  const { createBudget, getBudgets, getBudgetById, updateBudget, deleteBudget } = require('../Controller/budgetController');
  ```
- Best practice solution: Keep one controller folder convention only, add a CI test that runs `node server.js`, and add route-level unit tests.
- Production-ready implementation: Standardize imports, fix the broken files, and add a startup smoke test in CI.

### 2) API integration is broken in production because of hard-coded base URLs
- File / line: [frontend/src/component/login/login.jsx](frontend/src/component/login/login.jsx#L18-L29), [frontend/src/component/signup/signup.jsx](frontend/src/component/signup/signup.jsx#L15), [frontend/src/component/Dashboard/dashboard.jsx](frontend/src/component/Dashboard/dashboard.jsx#L43-L191), [frontend/src/component/Settings/settings.jsx](frontend/src/component/Settings/settings.jsx#L26-L57), [frontend/src/component/Analysis/analysis.jsx](frontend/src/component/Analysis/analysis.jsx#L20-L23)
- Issue description: The app uses absolute URLs such as `http://127.0.0.1:5000/...` instead of the Vite proxy or a single environment-based API helper.
- Root cause: The frontend was built with mixed API strategies. The proxy in [frontend/vite.config.js](frontend/vite.config.js) works only in dev; hard-coded URLs will fail in deployed environments and across hosts/ports.
- Severity: High
- Exact code fix:
  ```js
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const res = await fetch(`${API_BASE}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
  ```
- Best practice solution: Centralize API access in one `apiClient.js` using `baseURL` and `Authorization` interceptors.
- Production-ready implementation: Replace all hard-coded URLs with `apiClient`, add environment variables, and test against staging.

### 3) JWT secret fallback is insecure and allows token forgery in weak environments
- File / line: [backend/controllers/authController.js](backend/controllers/authController.js#L5), [backend/Middleware/authMiddleware.js](backend/Middleware/authMiddleware.js#L2)
- Issue description: The app falls back to `'replace_this_secret'` when `JWT_SECRET` is missing.
- Root cause: The secret is not enforced at startup, so a misconfigured environment silently produces weak tokens.
- Severity: High
- Exact code fix:
  ```js
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in the environment');
  }
  const JWT_SECRET = process.env.JWT_SECRET;
  ```
- Best practice solution: Fail-fast startup, rotate secrets in production, and store them in a secrets manager.
- Production-ready implementation: Add env validation at startup and reject missing secrets before the server listens.

### 4) CORS is open to all origins
- File / line: [backend/server.js](backend/server.js#L18)
- Issue description: `app.use(cors())` allows any origin by default.
- Root cause: The server does not restrict allowed origins, which is risky for production and makes cross-origin misuse easier.
- Severity: High
- Exact code fix:
  ```js
  app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'], credentials: true }));
  ```
- Best practice solution: Restrict CORS to known frontend origins and use cookies only when needed.
- Production-ready implementation: Add an explicit allowlist and fail closed.

### 5) Authentication tokens are stored in localStorage, which is vulnerable to XSS
- File / line: [frontend/src/component/login/login.jsx](frontend/src/component/login/login.jsx#L25-L33), [frontend/src/component/Dashboard/dashboard.jsx](frontend/src/component/Dashboard/dashboard.jsx#L39-L43)
- Issue description: JWTs are persisted in `localStorage`.
- Root cause: Any XSS issue in the frontend gives attackers access to the bearer token immediately.
- Severity: High
- Exact code fix:
  ```js
  // Prefer httpOnly cookies or a memory-only session store.
  // If keeping browser storage, at least use sessionStorage and rotate the token.
  sessionStorage.setItem('token', data.token);
  ```
- Best practice solution: Use secure, httpOnly cookies for auth or an in-memory token store with refresh rotation.
- Production-ready implementation: Move auth to cookie-based sessions and remove `localStorage` token usage from the app.

### 6) Profile/theme persistence logic is inconsistent and broken
- File / line: [backend/server.js](backend/server.js#L44-L53), [backend/server.js](backend/server.js#L71-L73), [frontend/src/component/Settings/settings.jsx](frontend/src/component/Settings/settings.jsx#L18-L33)
- Issue description: The frontend sends `theme`, but the backend profile update path only persists `name`, `email`, and `monthlyIncome`. The `theme` field is never stored and never returned.
- Root cause: The backend schema and update logic do not include `theme`, even though the UI depends on it.
- Severity: Medium
- Exact code fix:
  ```js
  const { name, email, monthlyIncome, theme } = req.body;
  if (theme) update.theme = theme;
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true })
    .select('name email monthlyIncome theme');
  ```
  And in the model:
  ```js
  theme: { type: String, default: 'light' }
  ```
- Best practice solution: Make the profile model and API contract match the UI requirements; add a typed schema and tests for profile update.
- Production-ready implementation: Add `theme` to the user schema and return it from every profile response.

### 7) Settings save flow leaves the loading state stuck on success
- File / line: [frontend/src/component/Settings/settings.jsx](frontend/src/component/Settings/settings.jsx#L19-L45)
- Issue description: `setLoading(false)` is only reached in the fallback branch, so successful API updates can leave the button permanently disabled.
- Root cause: The success path returns early without resetting the loading state.
- Severity: Medium
- Exact code fix:
  ```js
  if (res.ok && json.user) {
    localStorage.setItem('profile', JSON.stringify(json.user));
    if (onProfileUpdate) onProfileUpdate(json.user);
    alert('Profile saved successfully!');
    setLoading(false);
    return;
  }
  setLoading(false);
  ```
- Best practice solution: Use `try/finally` for async UI state transitions.
- Production-ready implementation: Wrap the save operation in `try/finally` so every exit path resets the UI state.

### 8) Chart.js instances are stored globally and can leak memory across renders
- File / line: [frontend/src/component/Analysis/analysis.jsx](frontend/src/component/Analysis/analysis.jsx#L60-L100)
- Issue description: `window._barChart` and `window._lineChart` are created on every filtered update but are not fully cleaned up on unmount.
- Root cause: The chart objects are stored on the global window object and only destroyed if they exist at the time of the next render; they are not disposed when the component unmounts.
- Severity: Medium
- Exact code fix:
  ```js
  useEffect(() => {
    return () => {
      if (window._barChart) window._barChart.destroy();
      if (window._lineChart) window._lineChart.destroy();
    };
  }, []);
  ```
- Best practice solution: Use a chart library with explicit cleanup, or store chart instances in `useRef` and destroy them in the effect cleanup.
- Production-ready implementation: Replace global window state with per-component refs and destroy charts in `useEffect` cleanup.

### 9) MongoDB startup is not treated as a hard dependency
- File / line: [backend/server.js](backend/server.js#L31)
- Issue description: The app starts listening even if MongoDB is unavailable.
- Root cause: `mongoose.connect(...).catch(...)` is non-blocking, so the server can accept requests before the database is ready.
- Severity: Medium
- Exact code fix:
  ```js
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  ```
  with startup error handling around the connection.
- Best practice solution: Block startup on DB readiness and fail fast if the database is unavailable.
- Production-ready implementation: Add a health check and a startup gate that verifies DB connectivity before serving traffic.

### 10) Frontend uses no centralized error handling or retry strategy for API calls
- File / line: [frontend/src/component/Dashboard/dashboard.jsx](frontend/src/component/Dashboard/dashboard.jsx#L69-L85), [frontend/src/component/Analysis/analysis.jsx](frontend/src/component/Analysis/analysis.jsx#L17-L27)
- Issue description: Network and server failures are handled with raw `console.error` and `alert()` only, with no retry/backoff or structured error handling.
- Root cause: The UI does not centralize API errors, so failures are inconsistent and hard to debug in production.
- Severity: Low
- Exact code fix:
  ```js
  try {
    const res = await apiClient.get('/api/expenses');
  } catch (err) {
    setErrorMsg('Unable to load expenses right now. Please retry.');
  }
  ```
- Best practice solution: Use one shared fetch wrapper with retries, timeouts, error normalization, and user-friendly messages.
- Production-ready implementation: Introduce `apiClient.js`, add retries for idempotent reads, and surface consistent error states in the UI.

## Summary
- The backend currently has a real runtime blocker: the server cannot start due to broken route imports.
- The frontend build passes, but the app still has production-readiness problems in auth, API integration, theme persistence, and memory/UX handling.
- The highest-priority fixes are: repair the broken route files, standardize API base URLs, harden auth storage and secret handling, and add a proper profile/theme schema contract.
