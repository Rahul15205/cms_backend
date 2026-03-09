# Master Plan: Frontend & Backend Integration (Complete Step-by-Step Guide)

> **Backend Status: ✅ VERIFIED COMPLETE** — All 37 controllers with 100+ API endpoints match the `frontend_architecture_flow.md` specification exactly. Every module the frontend expects is implemented and ready.

> **Frontend Status:** Currently 100% mock-data based (localStorage + hardcoded arrays). No API client (axios), no service layer, no environment config exists yet.

---

## Strategy: Parallel Integration with Feature Flags (Zero Breakage)

The frontend will continue to work perfectly using existing mock data while we wire up real APIs in the background. Each module is switched to the real API only when tested and ready. If anything fails, toggle the flag off and the frontend instantly reverts to mock data.

---

## Phase 0: Pre-Flight Checklist (Before Touching Any Code)

### Step 0.1: Verify Backend is Running
```bash
cd d:\Proteccio-Data\Consent_Management_System\backend
npm run start:dev
```
- Confirm the backend starts on `http://localhost:3000`
- Open `http://localhost:3000/api` in browser — you should see the Swagger UI with all endpoints listed

### Step 0.2: Verify Database is Seeded
```bash
cd d:\Proteccio-Data\Consent_Management_System\backend
npx prisma db seed
```
- This runs `prisma/seed.ts` which should create:
  - Default Tenant ("Acme Corp" or similar)
  - Admin role with full permissions
  - Admin user (`admin@acme.com` / `Consent@2024`)
  - Standard roles (DPO, Operator, Viewer, Auditor)
  - Lookup data (Notice Types, Languages, Cookie Categories, etc.)

### Step 0.3: Test a Manual API Call
```bash
# Login and get a token
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@acme.com\",\"password\":\"Consent@2024\"}"
```
You should receive a JSON response with `accessToken` and `refreshToken`. If this works, the backend is ready.

---

## Phase 1: Install Dependencies & Create API Foundation

### Step 1.1: Install Axios in Frontend
```bash
cd d:\Proteccio-Data\Consent_Management_System\frontend
npm install axios
```

### Step 1.2: Create API Client (`src/lib/api.ts`)
Create a centralized Axios instance with interceptors:

```typescript
// src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('cms_auth_data');
    if (authData) {
      const { accessToken } = JSON.parse(authData);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 (token expired) globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authData = localStorage.getItem('cms_auth_data');
        if (authData) {
          const { refreshToken } = JSON.parse(authData);
          const res = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });

          // Store new tokens
          const stored = JSON.parse(authData);
          stored.accessToken = res.data.accessToken;
          stored.refreshToken = res.data.refreshToken;
          localStorage.setItem('cms_auth_data', JSON.stringify(stored));

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — force logout
        localStorage.removeItem('cms_auth_data');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Step 1.3: Create Environment File (`frontend/.env`)
```env
# Toggle real API on/off (set to 'false' to use mock data)
VITE_USE_REAL_API=false

# Backend API base URL
VITE_API_BASE_URL=http://localhost:3000
```

### Step 1.4: Create Feature Flag Helper (`src/lib/featureFlags.ts`)
```typescript
// src/lib/featureFlags.ts

// Master switch: when false, ALL modules use mock data
export const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true';

// Per-module overrides (allows gradual rollout)
export const FEATURE_FLAGS = {
  auth: USE_REAL_API,
  dashboard: USE_REAL_API,
  consent: USE_REAL_API,
  rights: USE_REAL_API,
  grievances: USE_REAL_API,
  cookies: USE_REAL_API,
  notices: USE_REAL_API,
  configurations: USE_REAL_API,
  integrations: USE_REAL_API,
  reports: USE_REAL_API,
  logs: USE_REAL_API,
  security: USE_REAL_API,
  users: USE_REAL_API,
  settings: USE_REAL_API,
} as const;
```

### Step 1.5: Create Service Layer Directory Structure
```
src/
 └── services/
     ├── authService.ts
     ├── dashboardService.ts
     ├── consentService.ts
     ├── rightsService.ts
     ├── grievancesService.ts
     ├── cookiesService.ts
     ├── noticesService.ts
     ├── configurationsService.ts
     ├── integrationsService.ts
     ├── reportsService.ts
     ├── logsService.ts
     ├── securityService.ts
     ├── usersService.ts
     └── settingsService.ts
```

Each service file follows this pattern:
```typescript
// src/services/exampleService.ts
import api from '../lib/api';
import { FEATURE_FLAGS } from '../lib/featureFlags';
import { mockData } from '../data/mockExample';  // existing mock

export const exampleService = {
  getAll: async () => {
    if (!FEATURE_FLAGS.example) return mockData;
    const res = await api.get('/api/example');
    return res.data;
  },
  // ... more methods
};
```

---

## Phase 2: Authentication Integration (THE FIRST MODULE — Gateway to Everything)

### Why Auth First?
Every other API call requires a JWT token. Without real auth, no other module can hit real endpoints.

### Step 2.1: Create Auth Service (`src/services/authService.ts`)
```typescript
import api from '../lib/api';
import { FEATURE_FLAGS } from '../lib/featureFlags';

export const authService = {
  login: async (email: string, password: string) => {
    if (!FEATURE_FLAGS.auth) {
      // Existing mock login logic
      if (email === 'admin' && password === 'Consent@2024') {
        return { user: { /* mock user */ }, accessToken: 'mock-token', refreshToken: 'mock-refresh' };
      }
      throw new Error('Invalid credentials');
    }
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },

  logout: async () => {
    if (!FEATURE_FLAGS.auth) return;
    await api.post('/api/auth/logout');
  },

  getProfile: async () => {
    if (!FEATURE_FLAGS.auth) {
      return JSON.parse(localStorage.getItem('cms_auth_data') || '{}');
    }
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  refresh: async (refreshToken: string) => {
    const res = await api.post('/api/auth/refresh', { refreshToken });
    return res.data;
  },
};
```

### Step 2.2: Update `AuthContext.tsx`
Modify `src/contexts/AuthContext.tsx` to use `authService` instead of direct localStorage mock:
1. Import `authService`
2. Replace `login()` function to call `authService.login()`
3. Replace the initial auth check to call `authService.getProfile()` on mount
4. Store returned tokens in localStorage (`cms_auth_data`)
5. Keep the same state shape so NO downstream components break

### Step 2.3: Test Auth Integration
1. Set `VITE_USE_REAL_API=true` in `.env`
2. Run frontend: `npm run dev`
3. Open login page → enter credentials → verify you get redirected to dashboard
4. Open DevTools Network tab → confirm `POST /api/auth/login` was called
5. Confirm `GET /api/auth/me` returns user data with permissions
6. Set `VITE_USE_REAL_API=false` → verify mock login still works

---

## Phase 3: Dashboard Integration

### Step 3.1: Create Dashboard Service (`src/services/dashboardService.ts`)
Map to these backend endpoints:
| Frontend Need | Backend Endpoint |
|---|---|
| KPI cards | `GET /api/dashboard/kpis` |
| Charts | `GET /api/dashboard/charts/:type` |
| Recent Activity feed | `GET /api/dashboard/recent-activity` |
| Alerts banner | `GET /api/dashboard/alerts` |
| Widget config | `GET/PUT /api/dashboard/widget-config` |
| Security KPIs | `GET /api/dashboard/security` |

### Step 3.2: Update `DashboardContext.tsx`
Replace mock KPI data with `dashboardService` calls. The DashboardContext currently manages widget config and theme — update it to fetch real widget config from API.

### Step 3.3: Test Dashboard
- Verify all KPI cards show real counts
- Verify charts render with real data
- Verify widget drag/reorder persists via API

---

## Phase 4: Consent Management Integration (Largest Module)

### Step 4.1: Create Consent Service (`src/services/consentService.ts`)

**Templates:**
| Action | Endpoint |
|---|---|
| List templates | `GET /api/consent-templates` |
| Get template detail | `GET /api/consent-templates/:id` |
| Create template (wizard) | `POST /api/consent-templates` |
| Update template | `PUT /api/consent-templates/:id` |
| Delete/Archive template | `DELETE /api/consent-templates/:id` |

**Versions:**
| Action | Endpoint |
|---|---|
| List versions | `GET /api/consent-versions?templateId=X` |
| Create version | `POST /api/consent-versions` |
| Get version | `GET /api/consent-versions/:id` |

**Deployments:**
| Action | Endpoint |
|---|---|
| List deployments | `GET /api/consent-deployments` |
| Create deployment | `POST /api/consent-deployments` |
| Get deployment detail | `GET /api/consent-deployments/:id` |
| Get deployment logs | `GET /api/consent-deployments/:id/logs` |
| Rollback | `PUT /api/consent-deployments/:id/rollback` |

**Analytics & Usage:**
| Action | Endpoint |
|---|---|
| Usage records | `GET /api/consent/usage-records` |
| Cross-app usage | `GET /api/consent/cross-app-usage` |
| Analytics | `GET /api/consent/analytics` |
| System configs | `GET/POST /api/consent/system-configs` |

> **Note:** The consent module has the most sub-entities (Purposes, Data Categories, Third Parties, Sub-Processors). These have their own controllers at `/api/purposes`, `/api/data-categories`, `/api/third-parties`, `/api/sub-processors`.

### Step 4.2: Update Components
- Replace inline mock arrays in consent page components
- Update the 12-step template wizard to `POST` the complete template object
- Connect the deployment tab to real deployment CRUD

### Step 4.3: Test Consent Module
- Create a template through the wizard → verify it appears in the list
- Deploy a template → verify deployment record appears
- Check analytics tab shows real counts

---

## Phase 5: Rights Management Integration

### Step 5.1: Create Rights Service (`src/services/rightsService.ts`)
| Action | Endpoint |
|---|---|
| List requests | `GET /api/rights/requests` |
| Create request | `POST /api/rights/requests` |
| Get request detail | `GET /api/rights/requests/:id` |
| Update status | `PUT /api/rights/requests/:id/status` |
| Assign | `PUT /api/rights/requests/:id/assign` |
| Workflow steps | `GET /api/rights/requests/:id/workflow` |
| Notes | `GET/POST /api/rights/requests/:id/notes` |
| Attachments | `GET/POST /api/rights/requests/:id/attachments` |
| Evidence | `GET/POST /api/rights/requests/:id/evidence` |
| Audit trail | `GET /api/rights/requests/:id/audit` |
| Metrics | `GET /api/rights/metrics` |
| Analytics | `GET /api/rights/analytics` |

### Step 5.2: Replace `mockRights.ts`
The file `src/data/mockRights.ts` contains the mock data. The service layer will either return this or real API data based on the feature flag.

### Step 5.3: Test Rights Module
- Create a right request → verify it gets a case number
- Update status through workflow steps → verify state machine transitions
- Add notes and evidence → verify they persist

---

## Phase 6: Grievances Integration

### Step 6.1: Create Grievances Service (`src/services/grievancesService.ts`)
| Action | Endpoint |
|---|---|
| List | `GET /api/grievances` |
| Create | `POST /api/grievances` |
| Get detail | `GET /api/grievances/:id` |
| Update | `PUT /api/grievances/:id` |
| Comment | `POST /api/grievances/:id/comment` |
| Escalate | `POST /api/grievances/:id/escalate` |
| Metrics | `GET /api/grievances/metrics` |

### Step 6.2: Replace `mockGrievances.ts`

---

## Phase 7: Cookies Management Integration

### Step 7.1: Create Cookies Service (`src/services/cookiesService.ts`)

**Categories:** `GET/POST/PUT/DELETE /api/cookies/categories`
**Inventory:** `GET/POST/PUT/DELETE /api/cookies/inventory`
**Websites (Scanner):** `GET/POST/PUT/DELETE /api/cookies/websites` + `POST /api/cookies/scan/:id`
**Banners:** `GET/POST/PUT/DELETE /api/cookies/banners`
**Consent Logs:** `GET/POST /api/cookies/consent-logs`
**Compliance:** `GET /api/cookies/compliance`

---

## Phase 8: Notices Integration

### Step 8.1: Create Notices Service (`src/services/noticesService.ts`)
| Action | Endpoint |
|---|---|
| List notices | `GET /api/notices` |
| Create notice | `POST /api/notices` |
| Get notice detail | `GET /api/notices/:id` |
| Update notice | `PUT /api/notices/:id` |
| Version history | `GET /api/notices/:id/history` |
| Languages | `GET/POST /api/notices/languages` |
| Types | `GET/POST /api/notices/types` |

### Step 8.2: Replace `mockNotices.ts`

---

## Phase 9: Configurations Integration

### Step 9.1: Create Configurations Service (`src/services/configurationsService.ts`)
All 10 config modules follow the same CRUD pattern:

| Config Section | Endpoint |
|---|---|
| SLA Rules | `CRUD /api/sla-rules` |
| Notification Rules | `CRUD /api/notification-rules` |
| Escalation Rules | `CRUD /api/escalation-rules` |
| API Keys | `CRUD /api/api-keys` |
| Encryption | `GET/PUT /api/encryption` |
| Log Retention | `CRUD /api/log-retention` |
| Export Config | `CRUD /api/export-configs` |
| Aadhaar KYC | `GET/PUT /api/aadhaar-config` |
| Purposes | `CRUD /api/purposes` |
| Workflows | `CRUD /api/workflow-configs` |

---

## Phase 10: Remaining Modules

### Step 10.1: Integrations Module
| Action | Endpoint |
|---|---|
| List | `GET /api/integrations` |
| Create | `POST /api/integrations` |
| Connect/Disconnect/Sync | `POST /api/integrations/:id/{connect\|disconnect\|sync}` |
| Sync Logs | `GET /api/integrations/:id/logs` |

### Step 10.2: User Setup Module
| Action | Endpoint |
|---|---|
| Users | `GET/POST/PUT /api/users`, `PUT /api/users/:id/status` |
| Roles | `GET/POST/PUT /api/roles` |
| Invitations | `GET/POST /api/invitations` |
| Sessions | `GET/DELETE /api/sessions` |
| Audit Logs | `GET /api/audit-logs` |
| Access Rules | `CRUD /api/access-rules` |

### Step 10.3: Reports, Security, System Logs
| Module | Endpoints |
|---|---|
| Reports | `GET/POST /api/reports`, `GET /api/reports/:id/download` |
| Security | `GET /api/security/{events\|login-activity\|sessions}` |
| System Logs | `GET /api/logs`, `GET /api/logs/export` |

---

## Phase 11: Error Handling, Loading States & Polish

### Step 11.1: Global Error Handling
Create a toast notification system using shadcn/ui toast:
```typescript
// src/lib/errorHandler.ts
import { toast } from 'sonner';  // or shadcn toast

export function handleApiError(error: any) {
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  const status = error.response?.status;

  if (status === 400) toast.error(`Validation Error: ${message}`);
  else if (status === 403) toast.error('Access Denied: You lack permissions for this action');
  else if (status === 404) toast.error('Not Found: The requested resource does not exist');
  else if (status === 409) toast.error(`Conflict: ${message}`);
  else if (status >= 500) toast.error('Server Error: Please try again later');
  else toast.error(message);
}
```

### Step 11.2: Loading States
Add loading/skeleton states to every list and detail page:
```typescript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  consentService.getTemplates()
    .then(setTemplates)
    .catch((err) => { handleApiError(err); setError(err.message); })
    .finally(() => setIsLoading(false));
}, []);

if (isLoading) return <Skeleton />;
if (error) return <ErrorState message={error} onRetry={refetch} />;
```

### Step 11.3: Date/Time Handling
- Backend returns ISO 8601 strings (`2024-01-15T10:30:00Z`)
- Use `date-fns` or `dayjs` to format to local timezone in UI
- Relative times ("2 hours ago") computed on frontend, not stored

### Step 11.4: Pagination
All list endpoints support `limit` + `offset` query params. Add pagination controls to:
- Consent Templates list
- Rights Requests inbox
- Grievances list
- Cookie inventory
- Notices list
- System Logs
- Audit Logs

---

## Phase 12: CORS & Proxy Configuration

### Step 12.1: Frontend Dev Proxy (Vite)
Add to `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
},
```
This avoids CORS issues during development. When using the proxy, set `VITE_API_BASE_URL=` (empty) so axios calls go to the same origin.

### Step 12.2: Backend CORS (for production)
Ensure `main.ts` has CORS enabled:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'https://your-production-domain.com'],
  credentials: true,
});
```

---

## Recommended Integration Order (Priority)

| Order | Module | Complexity | Why This Order |
|---|---|---|---|
| 1 | **Auth** | Low | Gateway — all other modules need tokens |
| 2 | **User Setup (Roles)** | Low | Roles/permissions drive the entire UI visibility |
| 3 | **Dashboard** | Low | Read-only aggregation, quick win for visual proof |
| 4 | **Consent Templates** | High | Largest module, most sub-entities, test wizard flow |
| 5 | **Rights Requests** | High | Complex workflow state machine |
| 6 | **Grievances** | Medium | Reuses Rights patterns |
| 7 | **Notices** | Low | Simple CRUD + versioning |
| 8 | **Cookies** | Medium | Multiple sub-modules (inventory, scanner, banners) |
| 9 | **Configurations** | Low | 10 independent CRUD sections |
| 10 | **Integrations** | Low | Simple list + connect/disconnect |
| 11 | **Reports** | Low | Generate + download |
| 12 | **System Logs** | Low | Read-only list + export |
| 13 | **Security** | Low | Read-only dashboard |
| 14 | **Settings** | Low | Tenant settings CRUD |

---

## Backend API Route Summary (Quick Reference)

| Module | Controller Route Prefix | Endpoint Count |
|---|---|---|
| Auth | `/api/auth` | 4 |
| Dashboard | `/api/dashboard` | 7 |
| Consent Templates | `/api/consent-templates` | 5 |
| Consent Versions | `/api/consent-versions` | 3 |
| Consent Deployments | `/api/consent-deployments` | 7 |
| Consent Records | `/api/consent-records` | 4 |
| Consent Analytics | `/api/consent` | 5 |
| Purposes | `/api/purposes` | CRUD |
| Data Categories | `/api/data-categories` | CRUD |
| Third Parties | `/api/third-parties` | CRUD |
| Sub-Processors | `/api/sub-processors` | CRUD |
| Rights Requests | `/api/rights` | 16 |
| Grievances | `/api/grievances` | 7 |
| Cookies | `/api/cookies` | 19 |
| Notices | `/api/notices` | 9 |
| Integrations | `/api/integrations` | 10 |
| Users | `/api/users` | CRUD |
| Roles | `/api/roles` | CRUD |
| Invitations | `/api/invitations` | CRUD |
| Sessions | `/api/sessions` | CRUD |
| Audit Logs | `/api/audit-logs` | List |
| Access Rules | `/api/access-rules` | CRUD |
| Reports | `/api/reports` | 4 |
| Security | `/api/security` | 3 |
| System Logs | `/api/logs` | 2 |
| SLA Rules | `/api/sla-rules` | CRUD |
| Notification Rules | `/api/notification-rules` | CRUD |
| Escalation Rules | `/api/escalation-rules` | CRUD |
| API Keys | `/api/api-keys` | CRUD |
| Encryption | `/api/encryption` | 2 |
| Log Retention | `/api/log-retention` | CRUD |
| Export Configs | `/api/export-configs` | CRUD |
| Aadhaar Config | `/api/aadhaar-config` | 2 |
| Workflow Configs | `/api/workflow-configs` | CRUD |
| Applications | `/api/applications` | CRUD |
| Settings | `/api/settings` | CRUD |

---

## Key Files to Create/Modify (Summary)

### New Files (Frontend)
| File | Purpose |
|---|---|
| `src/lib/api.ts` | Axios instance with interceptors |
| `src/lib/featureFlags.ts` | Module-level API toggle |
| `src/lib/errorHandler.ts` | Global error toast handler |
| `src/services/*.ts` | 14 service files (one per module) |
| `.env` | Environment variables |

### Modified Files (Frontend)
| File | Change |
|---|---|
| `src/contexts/AuthContext.tsx` | Use `authService` instead of mock login |
| `src/contexts/DashboardContext.tsx` | Use `dashboardService` for KPIs and widgets |
| `src/data/mockRoles.ts` | Keep as fallback, accessed via service layer |
| `src/data/mockRights.ts` | Keep as fallback, accessed via service layer |
| `src/data/mockGrievances.ts` | Keep as fallback, accessed via service layer |
| `src/data/mockNotices.ts` | Keep as fallback, accessed via service layer |
| `vite.config.ts` | Add dev proxy for `/api` |
| All page/tab components | Replace direct mock imports with service calls |

### No Changes Needed (Backend)
The backend is complete and requires no modifications for integration.

---

## Troubleshooting Checklist

| Issue | Fix |
|---|---|
| CORS errors | Check `app.enableCors()` in backend `main.ts` or use Vite proxy |
| 401 on every request | Verify token is stored in `cms_auth_data` localStorage |
| Empty responses | Check if seed data was created (`npx prisma db seed`) |
| Data shape mismatch | Compare backend DTO response with frontend interface — map fields in service layer |
| Mock data still showing | Verify `VITE_USE_REAL_API=true` in `.env` and restart dev server (Vite caches env) |
| Swagger not loading | Verify backend is running on the correct port |
