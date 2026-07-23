import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    single_user: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1000']
  }
};

const USER_ID = 'bench-single-user';
const ACCOUNT_ID = 'bench-single-account';
const CATEGORY_ID = 'bench-single-cat';

export default function () {
  const url = __ENV.TARGET_URL || 'http://localhost:3000';
  
  const payload = JSON.stringify({
    userId: USER_ID,
    accountId: ACCOUNT_ID,
    categoryId: CATEGORY_ID,
    type: 'expense',
    amount: 5,
    currency: 'KES',
    name: 'Sequential Benchmark Tx'
  });

  const res = http.post(`${url}/api/v1/transactions`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(res, { 'status is 200': (r) => r.status === 200 });
}
