import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    cache_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '5s' // Keep it short, we just want to see first request vs rest
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<50'] // Very fast since it should be cached
  }
};

export default function () {
  const url = __ENV.TARGET_URL || 'http://localhost:3000';
  
  // We hit an endpoint that should use caching (e.g. user preferences or a specific account balance)
  // For now, we simulate by hitting the health endpoint or a static route until we have a real cached endpoint.
  const res = http.get(`${url}/api/health`);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(0.1);
}
