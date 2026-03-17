import { z } from "zod";
import { defineModel, createSchema } from "@openuidev/lang/structured-outputs";
import { chk, type FunctionalTestCase, type FunctionalTestSuite, type VerificationResult } from "./domain.js";

// ---- Medium Schema ----

const ContainerSpecMedium = z.object({
  name: z.string(),
  image: z.string(),
  replicas: z.number(),
  resources: z.object({
    memoryMb: z.number(),
    cpuCores: z.number(),
  }),
  ports: z.array(
    z.object({
      containerPort: z.number(),
      protocol: z.enum(["TCP", "UDP"]),
    })
  ),
  envVars: z.array(
    z.object({
      name: z.string(),
      value: z.string().optional().describe("Static value"),
      valueFrom: z.object({
        secretName: z.string(),
        key: z.string(),
      }).optional().describe("Reference to a secret"),
      serviceRef: z.string().optional().describe("Reference to another service's internal URL"),
    })
  ),
  healthCheck: z.object({
    type: z.enum(["http", "tcp", "exec"]),
    path: z.string().optional(),
    port: z.number().optional(),
    intervalSeconds: z.number(),
    timeoutSeconds: z.number(),
    failureThreshold: z.number(),
  }).optional(),
  expose: z.enum(["public", "internal", "none"]),
});

const IngressRule = z.object({
  domain: z.string(),
  serviceName: z.string(),
  servicePort: z.number(),
  tlsEnabled: z.boolean(),
});

const PersistentVolume = z.object({
  name: z.string(),
  serviceName: z.string(),
  sizeGb: z.number(),
  storageClass: z.string(),
  mountPath: z.string(),
});

const NetworkPolicy = z.object({
  name: z.string(),
  target: z.string().describe("Service this policy applies to"),
  allowIngressFrom: z.array(z.string()).describe("Services allowed to send traffic to target"),
  allowEgressTo: z.array(z.string()).describe("Services the target is allowed to reach"),
});

const Secret = z.object({
  name: z.string(),
  keys: z.array(z.string()),
});

const DeploymentConfigMedium = z.object({
  appName: z.string(),
  services: z.array(ContainerSpecMedium),
  ingress: z.array(IngressRule),
  volumes: z.array(PersistentVolume),
  networkPolicies: z.array(NetworkPolicy),
  secrets: z.array(Secret),
});

// ---- Hard Schema ----

const AutoscalingSpec = z.object({
  minReplicas: z.number(),
  maxReplicas: z.number(),
  targetCpuPercent: z.number(),
});

const ContainerSpecHard = z.object({
  name: z.string(),
  image: z.string(),
  replicas: z.number(),
  resources: z.object({
    memoryMb: z.number(),
    cpuCores: z.number(),
  }),
  ports: z.array(
    z.object({
      containerPort: z.number(),
      protocol: z.enum(["TCP", "UDP"]),
      name: z.string().optional(),
    })
  ),
  envVars: z.array(
    z.object({
      name: z.string(),
      value: z.string().optional(),
      valueFrom: z.object({
        secretName: z.string(),
        key: z.string(),
      }).optional(),
      serviceRef: z.string().optional(),
    })
  ),
  healthCheck: z.object({
    type: z.enum(["http", "tcp", "exec"]),
    path: z.string().optional(),
    port: z.number().optional(),
    intervalSeconds: z.number(),
    timeoutSeconds: z.number(),
    failureThreshold: z.number(),
  }).optional(),
  expose: z.enum(["public", "internal", "none"]),
  autoscaling: AutoscalingSpec.optional(),
});

const DeploymentConfigHard = z.object({
  appName: z.string(),
  services: z.array(ContainerSpecHard),
  ingress: z.array(IngressRule),
  volumes: z.array(PersistentVolume),
  networkPolicies: z.array(NetworkPolicy),
  secrets: z.array(Secret),
});

type DeploymentConfigMediumData = z.infer<typeof DeploymentConfigMedium>;
type DeploymentConfigHardData = z.infer<typeof DeploymentConfigHard>;
type ContainerSpecMediumData = z.infer<typeof ContainerSpecMedium>;
type ContainerSpecHardData = z.infer<typeof ContainerSpecHard>;
type NetworkPolicyData = z.infer<typeof NetworkPolicy>;
type SecretData = z.infer<typeof Secret>;
type PersistentVolumeData = z.infer<typeof PersistentVolume>;

// ---- Prompts ----

const mediumPrompt = `Generate a deployment configuration for a web application based on the following requirements.

Application: "TaskBoard" — a task management web app

Services:
1. Web Frontend
   - Docker image: taskboard/web:3.2.1
   - Needs 2 replicas
   - Requires 512MB memory and 0.5 CPU per replica
   - Exposes port 3000
   - Must be publicly accessible via HTTPS on domain taskboard.example.com
   - Environment variables: API_URL (pointing to the API service's internal URL), NODE_ENV=production
   - Health check: HTTP GET /health every 30 seconds, 5 second timeout, 3 failure threshold

2. API Server
   - Docker image: taskboard/api:3.2.1
   - Needs 3 replicas
   - Requires 1GB memory and 1 CPU per replica
   - Exposes port 8080
   - Internal only (not publicly accessible)
   - Environment variables: DATABASE_URL (pointing to the database), REDIS_URL (pointing to the cache), JWT_SECRET loaded from secret "taskboard-secrets" key "jwt-secret"
   - Health check: HTTP GET /api/health every 15 seconds, 3 second timeout, 2 failure threshold

3. Background Worker
   - Docker image: taskboard/worker:3.2.1
   - Needs 2 replicas
   - Requires 768MB memory and 0.5 CPU per replica
   - No exposed port
   - Environment variables: DATABASE_URL (same as API), REDIS_URL (same as API), WORKER_CONCURRENCY=5
   - No health check needed

Backing Services:
4. Database
   - PostgreSQL 16
   - Single instance (not replicated)
   - 2GB memory, 1 CPU
   - Persistent volume: 20GB, storage class "standard"
   - Exposes port 5432, internal only
   - Environment variables: POSTGRES_DB=taskboard, POSTGRES_USER=taskboard, POSTGRES_PASSWORD loaded from secret "taskboard-secrets" key "db-password"

5. Cache
   - Redis 7.2
   - Single instance
   - 512MB memory, 0.25 CPU
   - No persistent storage needed
   - Exposes port 6379, internal only

Networking:
- Web Frontend can reach API Server
- API Server can reach Database and Cache
- Background Worker can reach Database and Cache
- Web Frontend cannot reach Database or Cache directly
- Background Worker cannot be reached by any other service

Secrets:
- Secret "taskboard-secrets" with keys: "jwt-secret", "db-password"
  (values are opaque — just reference them, don't generate actual values)`;

const hardPrompt = `Generate a deployment configuration for a microservices e-commerce platform with the following requirements.

Application: "ShopFlow" — a microservices e-commerce platform

Services:

1. API Gateway
   - Image: shopflow/gateway:2.0.4
   - 3 replicas, 1GB memory, 1 CPU each
   - Exposes port 8443
   - Public, HTTPS on shop.example.com and api.shop.example.com
   - Environment: RATE_LIMIT_RPS=100, AUTH_SERVICE_URL (ref to auth-service), CATALOG_SERVICE_URL (ref to catalog-service), ORDER_SERVICE_URL (ref to order-service), LOG_LEVEL=info
   - Health check: HTTP GET /gateway/health every 10s, 3s timeout, 2 failure threshold
   - Autoscaling: min 3, max 10, target CPU 65%

2. Auth Service
   - Image: shopflow/auth:2.0.4
   - 2 replicas, 512MB memory, 0.5 CPU each
   - Exposes port 8081
   - Internal only
   - Environment: DATABASE_URL (ref to auth-db), JWT_PRIVATE_KEY from secret "auth-keys" key "private-key", JWT_PUBLIC_KEY from secret "auth-keys" key "public-key", TOKEN_EXPIRY_SECONDS=3600, REDIS_URL (ref to session-cache)
   - Health check: HTTP GET /auth/health every 15s, 3s timeout, 3 failure threshold

3. Catalog Service
   - Image: shopflow/catalog:2.0.4
   - 2 replicas, 768MB memory, 0.5 CPU each
   - Exposes port 8082
   - Internal only
   - Environment: DATABASE_URL (ref to catalog-db), SEARCH_URL (ref to search-engine), CDN_BASE_URL=https://cdn.shop.example.com, CACHE_TTL_SECONDS=300
   - Health check: HTTP GET /catalog/health every 15s, 3s timeout, 3 failure threshold

4. Order Service
   - Image: shopflow/orders:2.0.4
   - 3 replicas, 1GB memory, 1 CPU each
   - Exposes port 8083
   - Internal only
   - Environment: DATABASE_URL (ref to order-db), PAYMENT_GATEWAY_URL from secret "payment-config" key "gateway-url", PAYMENT_API_KEY from secret "payment-config" key "api-key", INVENTORY_SERVICE_URL (ref to inventory-service), NOTIFICATION_SERVICE_URL (ref to notification-service), EVENT_BUS_URL (ref to event-bus)
   - Health check: HTTP GET /orders/health every 10s, 3s timeout, 2 failure threshold

5. Inventory Service
   - Image: shopflow/inventory:2.0.4
   - 2 replicas, 512MB memory, 0.5 CPU each
   - Exposes port 8084
   - Internal only
   - Environment: DATABASE_URL (ref to inventory-db), EVENT_BUS_URL (ref to event-bus), LOW_STOCK_THRESHOLD=10
   - Health check: HTTP GET /inventory/health every 15s, 3s timeout, 3 failure threshold

6. Notification Service
   - Image: shopflow/notifications:2.0.4
   - 2 replicas, 512MB memory, 0.5 CPU each
   - Exposes port 8085
   - Internal only
   - Environment: SMTP_HOST from secret "email-config" key "smtp-host", SMTP_PORT from secret "email-config" key "smtp-port", SMTP_USER from secret "email-config" key "smtp-user", SMTP_PASSWORD from secret "email-config" key "smtp-password", SMS_API_KEY from secret "sms-config" key "api-key", EVENT_BUS_URL (ref to event-bus)
   - Health check: HTTP GET /notifications/health every 20s, 5s timeout, 3 failure threshold

7. Event Bus
   - Image: shopflow/eventbus:1.5.0 (based on NATS)
   - 3 replicas, 512MB memory, 0.5 CPU each
   - Exposes ports 4222 (client) and 6222 (cluster)
   - Internal only
   - Environment: CLUSTER_SIZE=3, MAX_PAYLOAD_MB=8
   - Health check: TCP port 4222 every 10s, 2s timeout, 3 failure threshold
   - Persistent volume: 10GB, storage class "fast", mount at /data/jetstream

Backing Services:

8. Auth Database
   - PostgreSQL 16, image: postgres:16
   - 1 replica, 1GB memory, 0.5 CPU
   - Port 5432, internal
   - Env: POSTGRES_DB=shopflow_auth, POSTGRES_USER=auth_user, POSTGRES_PASSWORD from secret "db-passwords" key "auth-db-password"
   - Persistent volume: 10GB, storage class "standard", mount at /var/lib/postgresql/data

9. Catalog Database
   - PostgreSQL 16, image: postgres:16
   - 1 replica, 2GB memory, 1 CPU
   - Port 5432, internal
   - Env: POSTGRES_DB=shopflow_catalog, POSTGRES_USER=catalog_user, POSTGRES_PASSWORD from secret "db-passwords" key "catalog-db-password"
   - Persistent volume: 30GB, storage class "standard", mount at /var/lib/postgresql/data

10. Order Database
    - PostgreSQL 16, image: postgres:16
    - 1 replica, 2GB memory, 1 CPU
    - Port 5432, internal
    - Env: POSTGRES_DB=shopflow_orders, POSTGRES_USER=orders_user, POSTGRES_PASSWORD from secret "db-passwords" key "orders-db-password"
    - Persistent volume: 50GB, storage class "fast", mount at /var/lib/postgresql/data

11. Inventory Database
    - PostgreSQL 16, image: postgres:16
    - 1 replica, 1GB memory, 0.5 CPU
    - Port 5432, internal
    - Env: POSTGRES_DB=shopflow_inventory, POSTGRES_USER=inventory_user, POSTGRES_PASSWORD from secret "db-passwords" key "inventory-db-password"
    - Persistent volume: 15GB, storage class "standard", mount at /var/lib/postgresql/data

12. Session Cache
    - Redis 7.2, image: redis:7.2
    - 1 replica, 1GB memory, 0.5 CPU
    - Port 6379, internal
    - No env vars
    - No persistent storage

13. Search Engine
    - Elasticsearch 8.12, image: elasticsearch:8.12
    - 2 replicas, 4GB memory, 2 CPU each
    - Port 9200, internal
    - Env: discovery.type=single-node, ES_JAVA_OPTS=-Xms2g -Xmx2g, xpack.security.enabled=false
    - Persistent volume: 50GB, storage class "fast", mount at /usr/share/elasticsearch/data

Networking rules:
- API Gateway can reach: auth-service, catalog-service, order-service
- Auth Service can reach: auth-db, session-cache
- Catalog Service can reach: catalog-db, search-engine
- Order Service can reach: order-db, inventory-service, notification-service, event-bus
- Inventory Service can reach: inventory-db, event-bus
- Notification Service can reach: event-bus
- Event Bus can be reached by: order-service, inventory-service, notification-service
- All databases can ONLY be reached by their respective service
- Session Cache can ONLY be reached by auth-service
- Search Engine can ONLY be reached by catalog-service
- No service can reach API Gateway
- Background services (inventory, notification) cannot be reached by API Gateway directly

Secrets:
- "auth-keys": keys ["private-key", "public-key"]
- "payment-config": keys ["gateway-url", "api-key"]
- "email-config": keys ["smtp-host", "smtp-port", "smtp-user", "smtp-password"]
- "sms-config": keys ["api-key"]
- "db-passwords": keys ["auth-db-password", "catalog-db-password", "orders-db-password", "inventory-db-password"]

Autoscaling (in addition to API Gateway):
- Order Service: min 3, max 8, target CPU 70%
- Catalog Service: min 2, max 6, target CPU 75%`;

// ---- Verification helpers ----

function normName(name: string): string {
  return name.toLowerCase().replace(/[\s_]+/g, "-");
}

function findService<T extends { name: string }>(services: T[], name: string): T | undefined {
  return services.find((s) => normName(s.name) === normName(name));
}

function getNetworkPolicy(policies: NetworkPolicyData[], target: string): NetworkPolicyData | undefined {
  return policies.find((p) => normName(p.target) === normName(target));
}

function includesNorm(arr: string[], name: string): boolean {
  return arr.some((s) => normName(s) === normName(name));
}

// ---- Medium Verification ----

function verifyMediumConfig(parsed: unknown): VerificationResult {
  const checks: ReturnType<typeof chk>[] = [];
  const cfg = parsed as Partial<DeploymentConfigMediumData>;

  // 1. appName
  checks.push(chk("appName", cfg.appName === "TaskBoard", cfg.appName, "TaskBoard"));

  // 2. services.length === 5
  const services: ContainerSpecMediumData[] = (cfg.services as ContainerSpecMediumData[]) ?? [];
  checks.push(chk("services_count", services.length === 5, services.length, 5));

  // Helper: check service basic fields
  function svc(name: string) { return findService(services, name); }

  // 3+4. Each service: image, replicas, memory, CPU, ports
  const webFrontend = svc("web-frontend");
  checks.push(chk("web-frontend:exists", !!webFrontend));
  if (webFrontend) {
    checks.push(chk("web-frontend:image", webFrontend.image === "taskboard/web:3.2.1", webFrontend.image, "taskboard/web:3.2.1"));
    checks.push(chk("web-frontend:replicas", webFrontend.replicas === 2, webFrontend.replicas, 2));
    checks.push(chk("web-frontend:memory", webFrontend.resources.memoryMb === 512, webFrontend.resources.memoryMb, 512));
    checks.push(chk("web-frontend:cpu", webFrontend.resources.cpuCores === 0.5, webFrontend.resources.cpuCores, 0.5));
    checks.push(chk("web-frontend:port", webFrontend.ports.some((p) => p.containerPort === 3000), webFrontend.ports));
    // 5. env vars
    const apiUrlVar = webFrontend.envVars.find((e) => e.name === "API_URL");
    checks.push(chk("web-frontend:API_URL:exists", !!apiUrlVar));
    if (apiUrlVar) {
      checks.push(chk("web-frontend:API_URL:serviceRef", !!apiUrlVar.serviceRef, apiUrlVar.serviceRef));
    }
    const nodeEnvVar = webFrontend.envVars.find((e) => e.name === "NODE_ENV");
    checks.push(chk("web-frontend:NODE_ENV", nodeEnvVar?.value === "production", nodeEnvVar?.value, "production"));
    // 6. health check
    const hc = webFrontend.healthCheck;
    checks.push(chk("web-frontend:hc:exists", !!hc));
    if (hc) {
      checks.push(chk("web-frontend:hc:type", hc.type === "http", hc.type, "http"));
      checks.push(chk("web-frontend:hc:path", hc.path === "/health", hc.path, "/health"));
      checks.push(chk("web-frontend:hc:interval", hc.intervalSeconds === 30, hc.intervalSeconds, 30));
      checks.push(chk("web-frontend:hc:timeout", hc.timeoutSeconds === 5, hc.timeoutSeconds, 5));
      checks.push(chk("web-frontend:hc:failure", hc.failureThreshold === 3, hc.failureThreshold, 3));
    }
    // 7. expose
    checks.push(chk("web-frontend:expose", webFrontend.expose === "public", webFrontend.expose, "public"));
  }

  const apiServer = svc("api-server");
  checks.push(chk("api-server:exists", !!apiServer));
  if (apiServer) {
    checks.push(chk("api-server:image", apiServer.image === "taskboard/api:3.2.1", apiServer.image, "taskboard/api:3.2.1"));
    checks.push(chk("api-server:replicas", apiServer.replicas === 3, apiServer.replicas, 3));
    checks.push(chk("api-server:memory", apiServer.resources.memoryMb === 1024, apiServer.resources.memoryMb, 1024));
    checks.push(chk("api-server:cpu", apiServer.resources.cpuCores === 1, apiServer.resources.cpuCores, 1));
    checks.push(chk("api-server:port", apiServer.ports.some((p) => p.containerPort === 8080)));
    const jwtVar = apiServer.envVars.find((e) => e.name === "JWT_SECRET");
    checks.push(chk("api-server:JWT_SECRET", !!jwtVar));
    if (jwtVar) {
      checks.push(chk("api-server:JWT_SECRET:secretName", jwtVar.valueFrom?.secretName === "taskboard-secrets", jwtVar.valueFrom?.secretName, "taskboard-secrets"));
      checks.push(chk("api-server:JWT_SECRET:key", jwtVar.valueFrom?.key === "jwt-secret", jwtVar.valueFrom?.key, "jwt-secret"));
    }
    const hc = apiServer.healthCheck;
    checks.push(chk("api-server:hc:exists", !!hc));
    if (hc) {
      checks.push(chk("api-server:hc:type", hc.type === "http", hc.type, "http"));
      checks.push(chk("api-server:hc:interval", hc.intervalSeconds === 15, hc.intervalSeconds, 15));
      checks.push(chk("api-server:hc:timeout", hc.timeoutSeconds === 3, hc.timeoutSeconds, 3));
      checks.push(chk("api-server:hc:failure", hc.failureThreshold === 2, hc.failureThreshold, 2));
    }
    checks.push(chk("api-server:expose", apiServer.expose === "internal", apiServer.expose, "internal"));
  }

  const bgWorker = svc("background-worker");
  checks.push(chk("background-worker:exists", !!bgWorker));
  if (bgWorker) {
    checks.push(chk("background-worker:image", bgWorker.image === "taskboard/worker:3.2.1", bgWorker.image, "taskboard/worker:3.2.1"));
    checks.push(chk("background-worker:replicas", bgWorker.replicas === 2, bgWorker.replicas, 2));
    checks.push(chk("background-worker:memory", bgWorker.resources.memoryMb === 768, bgWorker.resources.memoryMb, 768));
    checks.push(chk("background-worker:hc:absent", !bgWorker.healthCheck));
    checks.push(chk("background-worker:expose", bgWorker.expose === "none", bgWorker.expose, "none"));
  }

  const database = svc("database");
  checks.push(chk("database:exists", !!database));
  if (database) {
    checks.push(chk("database:image", database.image === "postgres:16", database.image, "postgres:16"));
    checks.push(chk("database:replicas", database.replicas === 1, database.replicas, 1));
    checks.push(chk("database:memory", database.resources.memoryMb === 2048, database.resources.memoryMb, 2048));
    checks.push(chk("database:port", database.ports.some((p) => p.containerPort === 5432)));
    const pwVar = database.envVars.find((e) => e.name === "POSTGRES_PASSWORD");
    checks.push(chk("database:POSTGRES_PASSWORD", !!pwVar));
    if (pwVar) {
      checks.push(chk("database:POSTGRES_PASSWORD:secretName", pwVar.valueFrom?.secretName === "taskboard-secrets", pwVar.valueFrom?.secretName, "taskboard-secrets"));
      checks.push(chk("database:POSTGRES_PASSWORD:key", pwVar.valueFrom?.key === "db-password", pwVar.valueFrom?.key, "db-password"));
    }
    checks.push(chk("database:expose", database.expose === "internal", database.expose, "internal"));
  }

  const cache = svc("cache");
  checks.push(chk("cache:exists", !!cache));
  if (cache) {
    checks.push(chk("cache:image", cache.image === "redis:7.2", cache.image, "redis:7.2"));
    checks.push(chk("cache:replicas", cache.replicas === 1, cache.replicas, 1));
    checks.push(chk("cache:memory", cache.resources.memoryMb === 512, cache.resources.memoryMb, 512));
    checks.push(chk("cache:cpu", cache.resources.cpuCores === 0.25, cache.resources.cpuCores, 0.25));
    checks.push(chk("cache:port", cache.ports.some((p) => p.containerPort === 6379)));
    checks.push(chk("cache:expose", cache.expose === "internal", cache.expose, "internal"));
  }

  // 8. Ingress
  const ingress = cfg.ingress ?? [];
  const mainIngress = ingress.find((i) => i.domain === "taskboard.example.com");
  checks.push(chk("ingress:domain", !!mainIngress));
  if (mainIngress) {
    checks.push(chk("ingress:serviceName", normName(mainIngress.serviceName) === "web-frontend", mainIngress.serviceName, "web-frontend"));
    checks.push(chk("ingress:servicePort", mainIngress.servicePort === 3000, mainIngress.servicePort, 3000));
    checks.push(chk("ingress:tls", mainIngress.tlsEnabled === true));
  }

  // 9. Volumes
  const volumes = (cfg.volumes as PersistentVolumeData[]) ?? [];
  const dbVol = volumes.find((v) => normName(v.serviceName) === "database");
  checks.push(chk("volume:database:exists", !!dbVol));
  if (dbVol) {
    checks.push(chk("volume:database:sizeGb", dbVol.sizeGb === 20, dbVol.sizeGb, 20));
    checks.push(chk("volume:database:storageClass", dbVol.storageClass === "standard", dbVol.storageClass, "standard"));
  }

  // 10. Network policies
  const networkPolicies = (cfg.networkPolicies as NetworkPolicyData[]) ?? [];

  const webPolicy = getNetworkPolicy(networkPolicies, "web-frontend");
  checks.push(chk("netpol:web-frontend:exists", !!webPolicy));
  if (webPolicy) {
    checks.push(chk("netpol:web-frontend:egress:api-server", includesNorm(webPolicy.allowEgressTo, "api-server")));
    checks.push(chk("netpol:web-frontend:egress:no-db", !includesNorm(webPolicy.allowEgressTo, "database")));
    checks.push(chk("netpol:web-frontend:egress:no-cache", !includesNorm(webPolicy.allowEgressTo, "cache")));
  }

  const apiPolicy = getNetworkPolicy(networkPolicies, "api-server");
  checks.push(chk("netpol:api-server:exists", !!apiPolicy));
  if (apiPolicy) {
    checks.push(chk("netpol:api-server:egress:database", includesNorm(apiPolicy.allowEgressTo, "database")));
    checks.push(chk("netpol:api-server:egress:cache", includesNorm(apiPolicy.allowEgressTo, "cache")));
    checks.push(chk("netpol:api-server:ingress:web-frontend", includesNorm(apiPolicy.allowIngressFrom, "web-frontend")));
  }

  const bgPolicy = getNetworkPolicy(networkPolicies, "background-worker");
  checks.push(chk("netpol:background-worker:exists", !!bgPolicy));
  if (bgPolicy) {
    checks.push(chk("netpol:background-worker:egress:database", includesNorm(bgPolicy.allowEgressTo, "database")));
    checks.push(chk("netpol:background-worker:egress:cache", includesNorm(bgPolicy.allowEgressTo, "cache")));
    checks.push(chk("netpol:background-worker:ingress:empty", bgPolicy.allowIngressFrom.length === 0, bgPolicy.allowIngressFrom.length, 0));
  }

  const dbPolicy = getNetworkPolicy(networkPolicies, "database");
  checks.push(chk("netpol:database:exists", !!dbPolicy));
  if (dbPolicy) {
    checks.push(chk("netpol:database:ingress:api-server", includesNorm(dbPolicy.allowIngressFrom, "api-server")));
    checks.push(chk("netpol:database:ingress:bg-worker", includesNorm(dbPolicy.allowIngressFrom, "background-worker")));
  }

  const cachePolicy = getNetworkPolicy(networkPolicies, "cache");
  checks.push(chk("netpol:cache:exists", !!cachePolicy));
  if (cachePolicy) {
    checks.push(chk("netpol:cache:ingress:api-server", includesNorm(cachePolicy.allowIngressFrom, "api-server")));
    checks.push(chk("netpol:cache:ingress:bg-worker", includesNorm(cachePolicy.allowIngressFrom, "background-worker")));
  }

  // 11. Secrets
  const secrets = (cfg.secrets as SecretData[]) ?? [];
  const tbSecret = secrets.find((s) => s.name === "taskboard-secrets");
  checks.push(chk("secret:taskboard-secrets:exists", !!tbSecret));
  if (tbSecret) {
    const keys = [...tbSecret.keys].sort();
    const expKeys = ["db-password", "jwt-secret"].sort();
    checks.push(chk("secret:taskboard-secrets:keys", JSON.stringify(keys) === JSON.stringify(expKeys), keys, expKeys));
  }

  return { pass: checks.every((c) => c.pass), checks };
}

// ---- Hard Verification ----

function verifyHardConfig(parsed: unknown): VerificationResult {
  const checks: ReturnType<typeof chk>[] = [];
  const cfg = parsed as Partial<DeploymentConfigHardData>;

  // 1. services.length === 13
  const services: ContainerSpecHardData[] = (cfg.services as ContainerSpecHardData[]) ?? [];
  checks.push(chk("services_count", services.length === 13, services.length, 13));

  function svc(name: string) { return findService(services, name); }

  // Autoscaling checks
  const gateway = svc("api-gateway");
  checks.push(chk("api-gateway:exists", !!gateway));
  if (gateway) {
    checks.push(chk("api-gateway:autoscaling:exists", !!gateway.autoscaling));
    if (gateway.autoscaling) {
      checks.push(chk("api-gateway:autoscaling:min", gateway.autoscaling.minReplicas === 3, gateway.autoscaling.minReplicas, 3));
      checks.push(chk("api-gateway:autoscaling:max", gateway.autoscaling.maxReplicas === 10, gateway.autoscaling.maxReplicas, 10));
      checks.push(chk("api-gateway:autoscaling:target", gateway.autoscaling.targetCpuPercent === 65, gateway.autoscaling.targetCpuPercent, 65));
    }
    checks.push(chk("api-gateway:expose", gateway.expose === "public", gateway.expose, "public"));
    checks.push(chk("api-gateway:image", gateway.image === "shopflow/gateway:2.0.4", gateway.image, "shopflow/gateway:2.0.4"));
  }

  const orderSvc = svc("order-service");
  checks.push(chk("order-service:exists", !!orderSvc));
  if (orderSvc) {
    checks.push(chk("order-service:autoscaling:exists", !!orderSvc.autoscaling));
    if (orderSvc.autoscaling) {
      checks.push(chk("order-service:autoscaling:min", orderSvc.autoscaling.minReplicas === 3, orderSvc.autoscaling.minReplicas, 3));
      checks.push(chk("order-service:autoscaling:max", orderSvc.autoscaling.maxReplicas === 8, orderSvc.autoscaling.maxReplicas, 8));
      checks.push(chk("order-service:autoscaling:target", orderSvc.autoscaling.targetCpuPercent === 70, orderSvc.autoscaling.targetCpuPercent, 70));
    }
  }

  const catalogSvc = svc("catalog-service");
  checks.push(chk("catalog-service:exists", !!catalogSvc));
  if (catalogSvc) {
    checks.push(chk("catalog-service:autoscaling:exists", !!catalogSvc.autoscaling));
    if (catalogSvc.autoscaling) {
      checks.push(chk("catalog-service:autoscaling:min", catalogSvc.autoscaling.minReplicas === 2, catalogSvc.autoscaling.minReplicas, 2));
      checks.push(chk("catalog-service:autoscaling:max", catalogSvc.autoscaling.maxReplicas === 6, catalogSvc.autoscaling.maxReplicas, 6));
      checks.push(chk("catalog-service:autoscaling:target", catalogSvc.autoscaling.targetCpuPercent === 75, catalogSvc.autoscaling.targetCpuPercent, 75));
    }
  }

  // Autoscaling absent on non-autoscaled services
  const noAutoScale = ["auth-service", "inventory-service", "notification-service", "event-bus",
    "auth-db", "catalog-db", "order-db", "inventory-db", "session-cache", "search-engine"];
  for (const name of noAutoScale) {
    const s = svc(name);
    if (s) {
      checks.push(chk(`${name}:no_autoscaling`, !s.autoscaling));
    }
  }

  // Event bus: two ports 4222 and 6222
  const eventBus = svc("event-bus");
  checks.push(chk("event-bus:exists", !!eventBus));
  if (eventBus) {
    checks.push(chk("event-bus:port:4222", eventBus.ports.some((p) => p.containerPort === 4222)));
    checks.push(chk("event-bus:port:6222", eventBus.ports.some((p) => p.containerPort === 6222)));
    checks.push(chk("event-bus:hc:tcp", eventBus.healthCheck?.type === "tcp", eventBus.healthCheck?.type, "tcp"));
    checks.push(chk("event-bus:expose", eventBus.expose === "internal", eventBus.expose, "internal"));
  }

  // 5 secrets
  const secrets = (cfg.secrets as SecretData[]) ?? [];
  checks.push(chk("secrets_count", secrets.length === 5, secrets.length, 5));

  const authKeys = secrets.find((s) => s.name === "auth-keys");
  checks.push(chk("secret:auth-keys:exists", !!authKeys));
  if (authKeys) {
    const k = [...authKeys.keys].sort();
    const ek = ["private-key", "public-key"].sort();
    checks.push(chk("secret:auth-keys:keys", JSON.stringify(k) === JSON.stringify(ek), k, ek));
  }

  const paymentConfig = secrets.find((s) => s.name === "payment-config");
  checks.push(chk("secret:payment-config:exists", !!paymentConfig));
  if (paymentConfig) {
    const k = [...paymentConfig.keys].sort();
    const ek = ["api-key", "gateway-url"].sort();
    checks.push(chk("secret:payment-config:keys", JSON.stringify(k) === JSON.stringify(ek), k, ek));
  }

  const emailConfig = secrets.find((s) => s.name === "email-config");
  checks.push(chk("secret:email-config:exists", !!emailConfig));
  if (emailConfig) {
    const k = [...emailConfig.keys].sort();
    const ek = ["smtp-host", "smtp-password", "smtp-port", "smtp-user"].sort();
    checks.push(chk("secret:email-config:keys", JSON.stringify(k) === JSON.stringify(ek), k, ek));
  }

  const smsConfig = secrets.find((s) => s.name === "sms-config");
  checks.push(chk("secret:sms-config:exists", !!smsConfig));
  if (smsConfig) {
    checks.push(chk("secret:sms-config:keys", smsConfig.keys.includes("api-key")));
  }

  const dbPasswords = secrets.find((s) => s.name === "db-passwords");
  checks.push(chk("secret:db-passwords:exists", !!dbPasswords));
  if (dbPasswords) {
    const k = [...dbPasswords.keys].sort();
    const ek = ["auth-db-password", "catalog-db-password", "inventory-db-password", "orders-db-password"].sort();
    checks.push(chk("secret:db-passwords:keys", JSON.stringify(k) === JSON.stringify(ek), k, ek));
  }

  // 7 volumes
  const volumes = (cfg.volumes as PersistentVolumeData[]) ?? [];
  checks.push(chk("volumes_count", volumes.length === 6, volumes.length, 6));

  const expectedVolumes = [
    { serviceName: "event-bus", sizeGb: 10, storageClass: "fast" },
    { serviceName: "auth-db", sizeGb: 10, storageClass: "standard" },
    { serviceName: "catalog-db", sizeGb: 30, storageClass: "standard" },
    { serviceName: "order-db", sizeGb: 50, storageClass: "fast" },
    { serviceName: "inventory-db", sizeGb: 15, storageClass: "standard" },
    { serviceName: "search-engine", sizeGb: 50, storageClass: "fast" },
  ];
  for (const ev of expectedVolumes) {
    const vol = volumes.find((v) => normName(v.serviceName) === normName(ev.serviceName));
    checks.push(chk(`volume:${ev.serviceName}:exists`, !!vol));
    if (vol) {
      checks.push(chk(`volume:${ev.serviceName}:sizeGb`, vol.sizeGb === ev.sizeGb, vol.sizeGb, ev.sizeGb));
      checks.push(chk(`volume:${ev.serviceName}:storageClass`, vol.storageClass === ev.storageClass, vol.storageClass, ev.storageClass));
    }
  }

  // 8. Two ingress rules
  const ingress = cfg.ingress ?? [];
  checks.push(chk("ingress_count", ingress.length === 2, ingress.length, 2));
  const shopIngress = ingress.find((i) => i.domain === "shop.example.com");
  const apiIngress = ingress.find((i) => i.domain === "api.shop.example.com");
  checks.push(chk("ingress:shop.example.com:exists", !!shopIngress));
  if (shopIngress) {
    checks.push(chk("ingress:shop.example.com:service", normName(shopIngress.serviceName) === "api-gateway", shopIngress.serviceName, "api-gateway"));
    checks.push(chk("ingress:shop.example.com:port", shopIngress.servicePort === 8443, shopIngress.servicePort, 8443));
    checks.push(chk("ingress:shop.example.com:tls", shopIngress.tlsEnabled === true));
  }
  checks.push(chk("ingress:api.shop.example.com:exists", !!apiIngress));
  if (apiIngress) {
    checks.push(chk("ingress:api.shop.example.com:service", normName(apiIngress.serviceName) === "api-gateway", apiIngress.serviceName, "api-gateway"));
    checks.push(chk("ingress:api.shop.example.com:port", apiIngress.servicePort === 8443, apiIngress.servicePort, 8443));
    checks.push(chk("ingress:api.shop.example.com:tls", apiIngress.tlsEnabled === true));
  }

  // 9. Cross-reference integrity: every serviceRef points to an existing service
  const serviceNames = new Set(services.map((s) => normName(s.name)));
  let crossRefOk = true;
  for (const s of services) {
    for (const env of s.envVars) {
      if (env.serviceRef && !serviceNames.has(normName(env.serviceRef))) {
        crossRefOk = false;
        break;
      }
    }
    if (!crossRefOk) break;
  }
  checks.push(chk("cross_ref_integrity", crossRefOk));

  // 10. Secret reference integrity
  const secretMap = new Map<string, Set<string>>();
  for (const s of secrets) {
    secretMap.set(s.name, new Set(s.keys));
  }
  let secretRefOk = true;
  for (const s of services) {
    for (const env of s.envVars) {
      if (env.valueFrom) {
        const secKeys = secretMap.get(env.valueFrom.secretName);
        if (!secKeys || !secKeys.has(env.valueFrom.key)) {
          secretRefOk = false;
          break;
        }
      }
    }
    if (!secretRefOk) break;
  }
  checks.push(chk("secret_ref_integrity", secretRefOk));

  return { pass: checks.every((c) => c.pass), checks };
}

// ---- Lang Schemas ----

const SecretRefModel = defineModel({
  name: "SecretRef",
  description: "A reference to a secret key",
  schema: z.object({
    secretName: z.string(),
    key: z.string(),
  }),
});

const EnvVarModel = defineModel({
  name: "EnvVar",
  description: "An environment variable for a container",
  schema: z.object({
    name: z.string(),
    value: z.string().optional().describe("Static value"),
    serviceRef: z.string().optional().describe("Reference to another service's internal URL"),
    valueFrom: SecretRefModel.ref.optional().describe("Reference to a secret"),
  }),
});

const HealthCheckModel = defineModel({
  name: "HealthCheck",
  description: "A container health check configuration",
  schema: z.object({
    type: z.enum(["http", "tcp", "exec"]),
    path: z.string().optional(),
    port: z.number().optional(),
    intervalSeconds: z.number(),
    timeoutSeconds: z.number(),
    failureThreshold: z.number(),
  }),
});

const ResourcesModel = defineModel({
  name: "Resources",
  description: "Resource limits for a container",
  schema: z.object({
    memoryMb: z.number(),
    cpuCores: z.number(),
  }),
});

const PortModel = defineModel({
  name: "Port",
  description: "A port exposed by a container",
  schema: z.object({
    containerPort: z.number(),
    protocol: z.enum(["TCP", "UDP"]),
  }),
});

const ContainerSpecModel = defineModel({
  name: "ContainerSpec",
  description: "A container service specification",
  schema: z.object({
    name: z.string(),
    image: z.string(),
    replicas: z.number(),
    resources: ResourcesModel.ref,
    ports: z.array(PortModel.ref),
    envVars: z.array(EnvVarModel.ref),
    healthCheck: HealthCheckModel.ref.optional(),
    expose: z.enum(["public", "internal", "none"]),
  }),
});

const IngressRuleModel = defineModel({
  name: "IngressRule",
  description: "An ingress routing rule",
  schema: z.object({
    domain: z.string(),
    serviceName: z.string(),
    servicePort: z.number(),
    tlsEnabled: z.boolean(),
  }),
});

const PersistentVolumeModel = defineModel({
  name: "PersistentVolume",
  description: "A persistent volume attached to a service",
  schema: z.object({
    name: z.string(),
    serviceName: z.string(),
    sizeGb: z.number(),
    storageClass: z.string(),
    mountPath: z.string(),
  }),
});

const NetworkPolicyModel = defineModel({
  name: "NetworkPolicy",
  description: "A network policy controlling service-to-service traffic",
  schema: z.object({
    name: z.string(),
    target: z.string().describe("Service this policy applies to"),
    allowIngressFrom: z.array(z.string()).describe("Services allowed to send traffic to target"),
    allowEgressTo: z.array(z.string()).describe("Services the target is allowed to reach"),
  }),
});

const SecretModel = defineModel({
  name: "Secret",
  description: "A secret with named keys",
  schema: z.object({
    name: z.string(),
    keys: z.array(z.string()),
  }),
});

const DeploymentConfigModel = defineModel({
  name: "DeploymentConfig",
  description: "A complete deployment configuration for an application",
  schema: z.object({
    appName: z.string(),
    services: z.array(ContainerSpecModel.ref),
    ingress: z.array(IngressRuleModel.ref),
    volumes: z.array(PersistentVolumeModel.ref),
    networkPolicies: z.array(NetworkPolicyModel.ref),
    secrets: z.array(SecretModel.ref),
  }),
});

const mediumLangSchema = createSchema([DeploymentConfigModel]);

// Hard schema — adds autoscaling and named ports

const AutoscalingModel = defineModel({
  name: "Autoscaling",
  description: "Autoscaling configuration for a service",
  schema: z.object({
    minReplicas: z.number(),
    maxReplicas: z.number(),
    targetCpuPercent: z.number(),
  }),
});

const PortHardModel = defineModel({
  name: "PortHard",
  description: "A port exposed by a container, with an optional name",
  schema: z.object({
    containerPort: z.number(),
    protocol: z.enum(["TCP", "UDP"]),
    name: z.string().optional(),
  }),
});

const ContainerSpecHardModel = defineModel({
  name: "ContainerSpecHard",
  description: "A container service specification with optional autoscaling",
  schema: z.object({
    name: z.string(),
    image: z.string(),
    replicas: z.number(),
    resources: ResourcesModel.ref,
    ports: z.array(PortHardModel.ref),
    envVars: z.array(EnvVarModel.ref),
    healthCheck: HealthCheckModel.ref.optional(),
    expose: z.enum(["public", "internal", "none"]),
    autoscaling: AutoscalingModel.ref.optional(),
  }),
});

const HardDeploymentConfigModel = defineModel({
  name: "HardDeploymentConfig",
  description: "A complete deployment configuration for a microservices application with autoscaling",
  schema: z.object({
    appName: z.string(),
    services: z.array(ContainerSpecHardModel.ref),
    ingress: z.array(IngressRuleModel.ref),
    volumes: z.array(PersistentVolumeModel.ref),
    networkPolicies: z.array(NetworkPolicyModel.ref),
    secrets: z.array(SecretModel.ref),
  }),
});

const hardLangSchema = createSchema([HardDeploymentConfigModel]);

// ---- Test Cases ----

const case2dMedium: FunctionalTestCase = {
  id: "2d-medium",
  name: "TaskBoard Deployment Config",
  complexity: "medium",
  prompt: mediumPrompt,
  schema: DeploymentConfigMedium,
  langSchema: mediumLangSchema,
  verify: verifyMediumConfig,
};

const case2dHard: FunctionalTestCase = {
  id: "2d-hard",
  name: "ShopFlow Microservices Config",
  complexity: "hard",
  prompt: hardPrompt,
  schema: DeploymentConfigHard,
  langSchema: hardLangSchema,
  verify: verifyHardConfig,
};

export const suite2d: FunctionalTestSuite = {
  id: "2d",
  name: "Config Generation",
  cases: [case2dMedium, case2dHard],
};
