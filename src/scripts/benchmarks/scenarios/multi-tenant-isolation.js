import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    noisy_neighbors: {
      executor: 'constant-vus',
      vus: 50,
      duration: '15s',
      exec: 'noisy_neighbor'
    },
    isolated_tenant: {
      executor: 'constant-vus',
      vus: 1,
      duration: '15s',
      exec: 'isolated_tenant'
    }
  },
  thresholds: {
    'http_req_duration{scenario:isolated_tenant}': ['p(95)<1000']
  }
};

export function noisy_neighbor() {
  const url = __ENV.TARGET_URL || 'http://localhost:3000';
  const orgId = __VU % 10; // 10 noisy organizations
  
  const payload = JSON.stringify({
    userId: `bench-noisy-${orgId}`,
    accountId: `bench-noisy-acc-${orgId}`,
    categoryId: `bench-noisy-cat-${orgId}`,
    type: 'expense',
    amount: 1,
    currency: 'KES',
    name: 'Noisy Tx'
  });

  http.post(`${url}/api/v1/transactions`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { scenario: 'noisy_neighbors' }
  });
}

export function isolated_tenant() {
  const url = __ENV.TARGET_URL || 'http://localhost:3000';
  
  // This tenant should not be affected by the row-locks of the noisy neighbors
  const res = http.get(`${url}/api/v1/accounts/isolated-acc/balance?userId=isolated-tenant`, {
    tags: { scenario: 'isolated_tenant' }
  });
  
  check(res, { 'isolated status 200': (r) => r.status === 200 });
  sleep(1);
}
