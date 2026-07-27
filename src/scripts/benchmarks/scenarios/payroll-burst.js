/* eslint-disable */
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    payroll: {
      executor: 'per-vu-iterations',
      vus: 50, // 50 concurrent payroll disbursements
      iterations: 20, // Each VU does 20 transfers
      maxDuration: '30s'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.05'] // Allowing some failures due to high contention
  }
};

const FROM_USER = 'bench-corp';
const FROM_ACCOUNT = 'bench-payroll-account';
const CATEGORY_ID = 'bench-payroll-cat';

export default function () {
  const url = __ENV.TARGET_URL || 'http://localhost:3000';
  
  // They all transfer from the exact same corporate account to different users
  // This forces massive row lock contention on the FROM_ACCOUNT
  const TO_ACCOUNT = `bench-emp-account-${__VU}`;
  const TO_USER = `bench-emp-${__VU}`;

  const payload = JSON.stringify({
    fromUserId: FROM_USER,
    fromAccountId: FROM_ACCOUNT,
    toUserId: TO_USER,
    toAccountId: TO_ACCOUNT,
    categoryId: CATEGORY_ID,
    amount: 500,
    currency: 'KES',
    name: 'Salary Payment'
  });

  const res = http.post(`${url}/api/v1/transfers`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  check(res, { 'status is 200': (r) => r.status === 200 });
}
