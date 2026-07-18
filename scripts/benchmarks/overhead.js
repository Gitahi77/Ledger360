
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  scenarios: {
    write: { executor: 'constant-vus', vus: 50, duration: '10s' }
  },
  thresholds: { http_req_duration: ['p(95)<10000'] }
};
export default function () {
  const url = 'http://localhost:3001/api/v1/benchmarks/prisma-overhead?mode=raw';
  const res = http.post(url, '{}', { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'is status 200': (r) => r.status === 200 });
}
  