/* eslint-disable */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    reads: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10s'
    },
    writes: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1000']
  }
};

const USER_ID = 'bench-mixed-user';
const ACCOUNT_ID = 'bench-mixed-account';
const CATEGORY_ID = 'bench-mixed-cat';

export default function () {
  const url = __ENV.TARGET_URL || 'http://localhost:3000';
  
  // Decide what to do based on scenario
  if (__ENV.K6_SCENARIO === 'reads') {
    const res = http.get(`${url}/api/v1/accounts/${ACCOUNT_ID}/balance?userId=${USER_ID}`);
    check(res, { 'read status 200': (r) => r.status === 200 });
    sleep(0.5);
  } else {
    const payload = JSON.stringify({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      categoryId: CATEGORY_ID,
      type: 'expense',
      amount: 1,
      currency: 'KES',
      name: 'Mixed Workload Tx'
    });

    const res = http.post(`${url}/api/v1/transactions`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    check(res, { 'write status 200': (r) => r.status === 200 });
  }
}
