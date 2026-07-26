// Where each app's login page lives — see .env.example. Defaults match the
// other three apps' local dev ports so this works out of the box without
// any setup; override with real deployed URLs for production.
export const APPS = {
  customer: {
    label: "Customer",
    blurb: "Post an errand",
    url: import.meta.env.VITE_CUSTOMER_APP_URL || "http://localhost:5174",
  },
  runner: {
    label: "Runner",
    blurb: "Run errands, get paid",
    url: import.meta.env.VITE_RUNNER_APP_URL || "http://localhost:5175",
  },
  admin: {
    label: "Admin",
    blurb: "Operations console",
    url: import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:5173",
  },
}