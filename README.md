# PoC: Monolith vs Microservices under Stress

This repository contains a practical proof of concept designed to compare the behavior of a monolithic architecture and a microservice-based architecture under load. The study focuses on latency, response time, and reliability when processing financial transfers in a simplified banking-like domain.

The main objective is not to declare one architecture better than the other, but to observe how each approach behaves under realistic stress conditions and to understand how architectural decisions impact performance and system complexity.

## Why this project exists

Modern software systems often need to decide between a monolith and microservices based on scalability, team organization, deployment needs, and expected traffic. This PoC was built to provide a concrete, measurable comparison between both approaches using the same business flow:

- create a transfer between two accounts
- validate the operation
- update balances
- record the transaction

The study was executed primarily with both implementations deployed on Railway, and the CSV results in the repository come from those deployed instances rather than local development servers.

## What the project is about

The project implements two versions of the same business scenario:

- a monolith with a single service handling the transfer flow directly
- a microservice version split into two services:
  - Accounts Service: handles debit and credit operations
  - Transactions Service: coordinates the transfer and records the transaction

Both versions expose an HTTP endpoint for transfers and use PostgreSQL through Prisma as the persistence layer.

## Business logic implemented

The core business rule is simple:

1. the origin account must exist
2. it must have sufficient balance
3. the origin and destination accounts cannot be the same
4. the debit and credit operations must be completed
5. the transfer must be recorded as a transaction

In the monolith version, this flow happens in one application and one database transaction. In the microservices version, the flow is distributed across services and uses HTTP calls between them.

## Architecture comparison

### Monolithic implementation

The monolith keeps the transfer flow in one process and one database transaction:

```ts
// monolith/src/TransferController.ts
const transaction = await TransferModel.processTransfer(originId, destinationId, amount);
return res.status(201).json(transaction);
```

```ts
// monolith/src/TransferModel.ts
return await prisma.$transaction(async (tx) => {
  const originAccount = await tx.account.findUnique({ where: { id: originId } });
  // validate balance, update both accounts, create transaction
});
```

### Microservices implementation

The microservices version splits responsibilities across services, introducing network communication between them:

```ts
// microservices/transactions-service/src/TransactionController.ts
const debitReq = await fetch(`${ACCOUNTS_SERVICE_URL}/api/accounts/debit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accountId: originId, amount })
});

const creditReq = await fetch(`${ACCOUNTS_SERVICE_URL}/api/accounts/credit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accountId: destinationId, amount })
});
```

This architectural difference is the main reason the study focuses on latency: the microservice approach adds inter-service network overhead and coordination complexity.

## Tech stack

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- k6 for load and stress testing
- Railway for deployment of the tested environments

## Stress testing with k6

The repository includes a k6 script that sends repeated POST requests to the transfer endpoint with randomized payloads.

The script performs three phases:

- warm-up phase
- stress phase
- cooldown phase

It also includes basic thresholds to ensure that the system remains healthy under load.

```js
// k6-scripts/stress-test.js
export const options = {
  stages: [
    { duration: '15s', target: 20 },
    { duration: '45s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
  },
};
```

The test injects random origin and destination account IDs and amounts to resemble realistic traffic patterns.

## How to run the project locally

### 1. Install dependencies

For the monolith:

```bash
cd monolith
npm install
```

For the microservices:

```bash
cd microservices/accounts-service
npm install

cd ../transactions-service
npm install
```

### 2. Configure the databases

Each service expects PostgreSQL connection strings through environment variables such as:

- DATABASE_URL for the monolith
- DATABASE_URL_ACCOUNTS for the accounts service
- DATABASE_URL_TRANSACTIONS for the transactions service

You can use Prisma with a local PostgreSQL instance and then apply the schema:

```bash
npx prisma generate
npx prisma db push
```

### 3. Run the applications

Monolith:

```bash
cd monolith
npm run dev
```

Accounts service:

```bash
cd microservices/accounts-service
npm run dev
```

Transactions service:

```bash
cd microservices/transactions-service
npm run dev
```

## How to run the k6 test

The stress test script is in the k6-scripts folder. To run it against a deployed instance, set the target URL and execute:

```bash
k6 run -e TARGET_URL=https://your-deployed-url/api/transfer k6-scripts/stress-test.js
```

To test a local environment, you can point it to localhost:

```bash
k6 run -e TARGET_URL=http://localhost:3000/api/transfer k6-scripts/stress-test.js
```

The repository also includes CSV exports of the test results:

- k6-scripts/results_monolith.csv
- k6-scripts/results_microservices.csv

If you want to generate your own results, add the flag `--out` and execute:

```bash
k6 run -e TARGET_URL=http://localhost:3000/api/transfer --out csv=your_csv_name.csv k6-scripts/stress-test.js
```

## Observed results

Based on the stress-test data collected from the deployed environments, the results were the following:

| Metric | Monolith | Microservices | Difference |
| --- | ---: | ---: | ---: |
| Total request number | 7.030 | 6.622 | -5.8% |
| Throughput (avg) | 100.34 req/s | 94.27 req/s | -6.0% |
| Average request duration | 226.87 ms | 243.77 ms | +16.90 ms |
| Median request duration | 222.68 ms | 239.22 ms | +16.54 ms |
| Average waiting time | 226.81 ms | 243.53 ms | +16.54 ms |
| Standard deviation | 31,77 ms | 28,30 ms | -3.47 ms |
| Maximum request duration | 1196.03 ms | 1201.89 ms | +5.86 ms |
| Average blocked time | 1.94 ms | 2.06 ms | +0.12 ms |
| Percentile 95 | 238,21 ms | 263,48 ms | +24.27 ms |
| Percentile 99 | 306,46 ms | 337,13 ms | +30.67 ms |
| Failed requests | 0.00% | 0.00% | - |

## Conclusions

From this PoC, the monolith showed slightly better average latency for the tested transfer flow. The microservices version remained functional and reliable, but it introduced a small additional overhead because each transfer required inter-service communication.

While the raw difference seems small, both tests included a ~214ms geographical baseline (ping from South America to the US cloud servers). Subtracting this baseline reveals that the internal processing time almost tripled in the microservices architecture (from ~8.6ms to ~25.2ms at the median). This overhead is due to JSON serialization, deserialization, and the internal HTTP hops between the Transactions and Accounts containers.

Under high concurrent stress, the performance gap is bigger. The 95th percentile (p95) showed a 25.27 ms overhead, and the p99 showed a 30.67 ms delay. This proves that network I/O blocking compounds under pressure, as threads in the transactions service are kept waiting for network responses.

In addition, the microservices version processed 6% fewer requests per second (94.27 req/s vs 100.34 req/s) using the exact same virtual hardware limits, thanks to more CPU cycles being consumed for HTTP connections instead of business logic.

This does not mean that microservices are always slower. In larger systems, they can provide better modularity, independent scalability, and clearer service boundaries. However, for a small workload and a simple business operation, the monolithic approach can be more efficient and simpler to operate.

Interestingly, the standard deviation for microservices (28.30 ms) was slightly lower than that of the monolithic system (31.77 ms). This suggests that, although the baseline latency of microservices is higher, their variability relative to that baseline can be slightly more consistent. This is a significant finding for systems in which latency predictability is more valuable than its absolute value.

## What I learned

- Architecture choice has a measurable impact on latency and response time.
- Network communication between services adds overhead that is visible under load.
- Splitting a simple ACID transaction across multiple services means trading CPU cycles and RAM for JSON serialization and HTTP handshakes, directly impacting maximum throughput.
- A monolith can be effective for small-to-medium workloads and simpler business domains.
- Microservices are valuable when the system needs independent growth, clear service boundaries, and team autonomy.
- During early iterations of this test, 200 concurrent users transferring funds between only 10 accounts caused massive row-level locks and timeouts in PostgreSQL. Stress testing requires carefully randomized datasets (like 10,000 seeded accounts) to test the network/architecture rather than the database's locking limits.
- Performance studies should be based on real deployment conditions, not only local development environments.

