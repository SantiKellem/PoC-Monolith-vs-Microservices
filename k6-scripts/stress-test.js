import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        // warm up fase -> warm up phase to ensure the system is ready for the stress test
        { duration: '15s', target: 20 }, 
        
        // stress fase -> maintein load to observe system behavior under stress
        { duration: '45s', target: 50 }, 
        
        // cooldown fase -> reduce load to zero to observe recovery
        { duration: '10s', target: 0 },   
    ],
    // thresholds for error rate: if more than 5% of requests fail, the test will be marked as failed
    thresholds: {
        http_req_failed: ['rate<0.05'],
    },
};

export default function () {
    const url = __ENV.TARGET_URL || 'http://localhost:3000/api/transfer';

    // aleatorization of origin and destination accounts to simulate real-world usage
    const originId = Math.floor(Math.random() * 10000) + 1;
    let destinationId = Math.floor(Math.random() * 10000) + 1;
    
    while (originId === destinationId) {
        destinationId = Math.floor(Math.random() * 10) + 1;
    }
    
    // random amount for simulation
    const amount = Math.floor(Math.random() * 500) + 1;

    const payload = JSON.stringify({
        originId: originId,
        destinationId: destinationId,
        amount: amount,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // request to the transfer endpoint
    const res = http.post(url, payload, params);

    // check the response status and ensure no gateway timeout occurred
    check(res, {
        'Status 201 (Created)': (r) => r.status === 201,
        'Without timeout': (r) => r.status !== 504,
    });

    // minimum pause to simulate human/system behavior
    sleep(0.05); 
}