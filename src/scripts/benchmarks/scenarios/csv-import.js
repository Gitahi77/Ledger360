/* eslint-disable */
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    csv_import: {
      executor: 'per-vu-iterations',
      vus: 5,
      iterations: 1, // Each VU simulates one CSV import
      maxDuration: '60s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<5000']
  }
};

const USER_ID = 'bench-csv-user';
const ACCOUNT_ID = 'bench-csv-account';
const CATEGORY_ID = 'bench-csv-cat';

export default function () {
  const url = __ENV.TARGET_URL || 'http://localhost:3000';
  
  // Simulate an import of 100 rows by batching HTTP requests
  // In a real app this would be a single POST /api/bulk with an array,
  // but to test our DB layer throughput we can just spam the single endpoint.
  const requests = Array.from({ length: 100 }).map((_, i) => ({
    method: 'POST',
    url: `${url}/api/v1/transactions`,
    body: JSON.stringify({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      categoryId: CATEGORY_ID,
      type: 'expense',
      amount: 1,
      currency: 'KES',
      name: `CSV Import Row ${i}`,
      date: new Date().toISOString()
    }),
    params: {
      headers: { 'Content-Type': 'application/json' }
    }
  }));

  const responses = http.batch(requests);
  
  const allSuccessful = responses.every(r => r.status === 200);
  check(responses, { 'all rows imported successfully': () => allSuccessful });
}
