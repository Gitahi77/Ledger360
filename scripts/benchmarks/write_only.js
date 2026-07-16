import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    transaction_write_heavy: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      exec: 'transactionWrite',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'], 
    http_req_failed: ['rate<0.01'], 
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function getHeaders() {
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': `k6-${Math.floor(Math.random() * 1000000)}`,
      'x-benchmark-user-id': 'cmrjag4x4000004joej6vkb5p'
    },
  };
}

export function transactionWrite() {
  const payload = JSON.stringify({
    accountId: 'cmrjag5b3000r04jo6hveljmt',
    categoryId: 'cmrjag52v000104jotm74e694',
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
