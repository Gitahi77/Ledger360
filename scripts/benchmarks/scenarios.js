import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    dashboard_read_heavy: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      exec: 'dashboardRead',
    },
    transaction_write_heavy: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: 'transactionWrite',
    },
    reporting_complex_queries: {
      executor: 'shared-iterations',
      vus: 5,
      iterations: 20,
      maxDuration: '30s',
      exec: 'reportingQueries',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'], // 95% of requests should be below 300ms
    http_req_failed: ['rate<0.01'], // less than 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function getHeaders() {
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': `k6-${Math.floor(Math.random() * 1000000)}`,
      'x-benchmark-user-id': 'cmrmakiuc01n5m8hqj2c4jd8m'
    },
  };
}

export function dashboardRead() {
  const res = http.get(`${BASE_URL}/api/v1/net-worth`, getHeaders());
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

export function transactionWrite() {
  const payload = JSON.stringify({
    accountId: 'cmrmakpy401okm8hq7n12i6bl',
    categoryId: 'cmrmakizd01n6m8hq23gzhng7',
    baseAmountMinor: 5000,
    type: 'expense',
    date: '2026-07-15',
    name: 'Grocery Shopping',
  });

  const res = http.post(`${BASE_URL}/api/v1/transactions`, payload, getHeaders());
  
  check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
}

export function reportingQueries() {
  const res = http.get(`${BASE_URL}/api/v1/transactions?limit=100`, getHeaders());
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(2);
}
