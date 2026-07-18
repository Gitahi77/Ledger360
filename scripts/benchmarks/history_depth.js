
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  scenarios: {
    write: { executor: 'constant-vus', vus: 10, duration: '10s' }
  },
  thresholds: { http_req_duration: ['p(95)<10000'] }
};
export default function () {
  const url = 'http://localhost:3000/api/v1/transactions';
  const payload = JSON.stringify({
    userId: 'test-history-user-1',
    accountId: 'test-history-account-1',
    categoryId: 'test-history-category-1',
    type: 'expense',
    amount: 10,
    currency: 'KES',
    name: 'K6 Test Tx',
    date: new Date().toISOString()
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  check(res, { 'is status 200': (r) => r.status === 200 });
}
  