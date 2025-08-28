# AGENTS.md — Deno Fresh on Kubernetes (Monorepo Playbook)

> Operating guide for code‑assistants and automation agents working in this repository. Deno‑first, Fresh 2.x (alpha) app, Stripe integration, Docker/CI, and Kubernetes deploys.

---

## 0) Mission & Guardrails

**Mission**: Ship and operate a Deno Fresh storefront with robust Stripe checkout, tiny client bundles (islands-only JS), and reliable Kubernetes deploys.

**Non‑negotiables**

* **Deno runtime** only. Pure ESM. Manage deps via `deno.json` / JSR and *selective* `npm:` specifiers.
* **Fresh islands** discipline: server by default, hydrate only islands. Islands must be client‑safe (no server‑only imports).
* **Security**: no hardcoded secrets. Local via `.env`; cluster via ExternalSecret → Secret → Deployment env.
* **Style contract**: obey `/frontend/DESIGN.md` primitives & tokens (`.btn`, `.card`, semantic colors). No ad‑hoc hex/radii/shadows.
* **Quality gate**: `deno task check` and `deno task test` pass. Keep units close to code with `*_test.ts(x)`.

---

## 1) Monorepo Map

```
/                    # root tasks & CI/K8s orchestrators
  frontend/          # Fresh 2 app (TS/TSX, Preact signals, Tailwind v4)
  k8s/               # Kubernetes manifests (ns, deploy, svc, ingress, NP, ext-secrets)
  docs/              # Docusaurus site (bun) — operational docs
  skaffold.yaml      # Dev loop for K8s
  .github/workflows/ # CI to build & push frontend image to GHCR
```

**Primary runtime surface**

* **Server entry**: `/frontend/main.ts` (Fresh `App<State>()`, fs routes, middleware)
* **Routes**: `/frontend/routes/` (pages + `api/*`)
* **Islands**: `/frontend/islands/`
* **Server libs**: `/frontend/lib/stripe.ts` (Stripe SDK + NodeCache), Zod schemas, money utils
* **Design system**: `/frontend/static/styles.css` + `/frontend/components/Button.tsx`

---

## 2) Commands & Tasks

From **repo root** (delegates to component tasks where relevant):

```bash
# Frontend
deno task dev           # Start Fresh dev (hot reload)
deno task test          # Run tests
deno task check         # fmt + lint + type-check

# Kubernetes
deno task k8s:apply     # kubectl apply -f k8s/
deno task k8s:delete    # kubectl delete -f k8s/

deno task skaffold:dev  # Continuous build/deploy + port-forward 8080
```

From **/docs** (documentation site):

```bash
bun start               # Dev docs
bun run build           # Build docs
```

> Hooks: `.claude/hooks/test-on-edit` runs `deno task test` after edits; keep tests green to avoid blocked edits.

### Two‑commit Build & Deploy Protocol (immutable image tags)

**Goal**: every production deployment is a pair of commits. **Commit A** builds an immutable image tag in GHCR. **Commit B** pins Kubernetes to that exact tag. No `latest`, no mutable tags.

#### Image Tagging (current CI behavior)

* Workflow: `.github/workflows/build-frontend.yml` (auto on push to `main`).
* Tags include branch‑prefixed SHA via docker/metadata‑action: `type=sha,prefix={{branch}}-` → e.g. `main-<COMMIT_SHA>`.
* Registry path: `ghcr.io/<org-or-user>/<repo>/frontend:<TAG>`.

---

#### Commit A — Build (push code → CI builds image)

1. **Make code changes** in `frontend/` (or elsewhere).
2. Run locally:

   ```bash
   deno task check && deno task test
   ```
3. Commit and push to `main` (or merge PR into `main`).
4. CI builds & pushes multi‑arch images to GHCR with tags including `main-<SHA>`.
5. **Verify image exists** (choose one):

   ```bash
   # 1) Pull by tag (will fail if tag isn't published yet)
   docker pull ghcr.io/<org>/<repo>/frontend:main-$(git rev-parse HEAD)

   # 2) Inspect manifest
   docker manifest inspect ghcr.io/<org>/<repo>/frontend:main-$(git rev-parse HEAD) > /dev/null && echo OK

   # 3) List tags (unauthenticated may be rate-limited)
   curl -s https://ghcr.io/v2/<org>/<repo>/frontend/tags/list | jq -r '.tags[]' | grep "main-$(git rev-parse --short=7 HEAD)" || true
   ```

> Proceed to Commit B **only after** the `main-<SHA>` image is visible in GHCR.

---

#### Commit B — Deploy (pin Kubernetes to image SHA)

1. Edit **`k8s/deployment.yaml`** container image for the `frontend` container to the exact SHA tag from Commit A. Example patch:

   ```yaml
   spec:
     template:
       metadata:
         annotations:
           app.kubernetes.io/version: "<COMMIT_SHA>"   # helps auditing
       spec:
         imagePullSecrets:
           - name: ghcr-secret
         containers:
           - name: frontend
             image: ghcr.io/<org>/<repo>/frontend:main-<COMMIT_SHA>
             imagePullPolicy: IfNotPresent  # OK because the tag is immutable
   ```

   *Use the full commit SHA to avoid ambiguity. Ensure `imagePullSecrets: ghcr-secret` is present (populated by `k8s/external-secret.yaml`).*
2. Commit the manifest change:

   ```bash
   git add k8s/deployment.yaml
   git commit -m "deploy(frontend): pin image to main-<COMMIT_SHA>"
   git push
   ```
3. Apply (if not using a GitOps controller):

   ```bash
   deno task k8s:apply
   ```
4. **Verify rollout**:

   ```bash
   kubectl -n deno-fresh-example rollout status deploy/frontend
   kubectl -n deno-fresh-example get pods -l app=frontend -o wide
   # Confirm the running image tag
   kubectl -n deno-fresh-example get deploy/frontend -o jsonpath='{.spec.template.spec.containers[0].image}' && echo
   ```

**Rollback**: revert Commit B (the manifest pin) to the previous `main-<SHA>`; apply. No rebuild required.

**Why two commits**

* Build provenance is immutable and auditable.
* Cluster state is declarative in git; rollbacks are trivial `git revert`.
* Eliminates "latest drift" and cache surprises.

---

tsx
// Page — routes/about.tsx
import { define } from "../utils.ts";
export default define.page(() => (

  <main class="px-4 py-8 max-w-3xl mx-auto">
    <h1 class="text-4xl font-bold">About</h1>
  </main>
));
```

**Islands rules** (enforced in code here)

* Do **not** import `frontend/lib/stripe.ts` from islands — it uses `Stripe` SDK & `NodeCache` (server-only). Instead, use client‑safe helpers like `frontend/lib/money.ts` and shared signals in `frontend/lib/cart-state.ts`.
* Pass only serializable props (strings, numbers, arrays). See `islands/ProductListItem.tsx` and `islands/Cart.tsx`.

---

## 4) Payments (Stripe) — exact usage in this repo

* SDK initialized in `frontend/lib/stripe.ts` with API version `2025-02-24.acacia`, using `Stripe.createFetchHttpClient()`.
* **Caching**: `NodeCache` TTL 60s for product list; metrics exposed at `GET /api/cache-stats`.
* **Checkout**: `POST /api/checkout` validates body via Zod (`lib/schemas.ts`), expands/validates price→product, derives idempotency key via SHA‑256, returns `sessionId` + redirect `url`.
* **Success page**: `/checkout/success.tsx` fetches session with expanded line items, shows totals with `formatMoney`.
* **Webhooks**: `POST /api/stripe-webhook` verifies signature against `STRIPE_WEBHOOK_SECRET`, handles key events (checkout.session.completed, payment\_intent.\*). Handlers log TODOs — safe spot to integrate DB/order pipeline. Keep idempotent (use `session.id`).

**Env required at runtime**

* `STRIPE_SECRET_KEY` (server). Webhook additionally requires `STRIPE_WEBHOOK_SECRET`.
* Optional browser exposure uses `NEXT_PUBLIC_*` naming via K8s ExternalSecret for site URL.

**Client formatting**

* Use `frontend/lib/money.ts` for currency display everywhere (SSR + islands).

---

## 5) UI System (Tailwind v4 + primitives)

* Tokens & components live in `frontend/static/styles.css` under `@theme` and `@layer components`.
* Use **only** provided primitives: `.btn[ -primary| -ghost| -danger ][ -sm| -lg ]`, `.card` + `.card-body`, `.input`, `.label`.
* Button component wrapper: `frontend/components/Button.tsx` — prefer it over raw `<button>` to get loading/success affordances.
* Accessibility: focus‑visible rings are mandatory; rely on classes baked into primitives.

---

## 6) Testing Strategy (examples present)

* Keep tests adjacent with `_test.ts`/`_test.tsx` (see `Button_test.tsx`, `Counter_test.tsx`, `schemas_test.ts`, `stripe_test.ts`, route tests under `routes/api/*_test.tsx`).
* Use `jsr:@std/assert`.
* For Stripe tests, set env **before** importing modules that read it at top level (see `lib/stripe_test.ts`).

Common tasks:

```bash
deno task test                      # all tests
deno test frontend/lib/money_test.ts  # one file
```

---

## 7) Docker & CI

* **Dockerfile**: `/frontend/Dockerfile` multi‑stage, caches deps, builds Fresh, copies compiled CSS to `static/styles.css`, exposes port **8000** (service maps 80→8000).
* **GitHub Actions**: `.github/workflows/build-frontend.yml` builds multi‑arch (amd64/arm64) and pushes to GHCR on main. Image: `ghcr.io/<repo>/frontend` with ref/semver/SHA tags.

---

## 8) Kubernetes (cluster layer for this app)

Namespace: `deno-fresh-example`.

**Core manifests**

* `deployment.yaml` (not shown here in full), `service.yaml` (ClusterIP 80→8000), `ingress.yaml` (class `external`, TLS, NGINX annotations for buffering & headers), `network-policy.yaml`, `external-secret.yaml` (1Password Connect → `deno-fresh-example-secrets`).

**Known gotcha (already documented in /docs)**

* If ingress timeouts (HTTP 524) occur, ensure NetworkPolicy namespace selector matches the actual ingress namespace label: `kubernetes.io/metadata.name: network` (not `name=ingress-nginx`).

**Port‑forward/dev**

* `skaffold.yaml` forwards `svc/frontend:80` → `localhost:8080` during `skaffold dev`.

**Secrets wiring (production)**

* ExternalSecret populates `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL` into a Kubernetes Secret consumed by the Deployment.

---

## 9) Local Dev & Permissions

* Start with `deno task dev` (uses `dev.ts` to run Fresh with Tailwind plugin). `-A` is acceptable in dev; in CI/production, use explicit flags or container perms.
* VS Code: `.vscode/settings.json` enables Deno tooling; keep it on.

---

## 10) Agent Playbooks (Do‑this‑exactly)

### A) Add a new page route

1. Create `frontend/routes/<slug>.tsx` with `define.page`.
2. Use design primitives; no inline styles.
3. Add minimal test if logic exists.
4. Run `deno task check && deno task test`.

### B) Add an API route

1. Create `frontend/routes/api/<name>.ts(x)` with `define.handlers`.
2. Return JSON via `Response.json(...)` and set status codes precisely.
3. Add a route unit test hitting the handler.

### C) Add an island

1. Create `frontend/islands/<Name>.tsx`.
2. Import **only** client‑safe modules: `lib/money.ts`, `lib/cart-state.ts`, `components/Button.tsx`.
3. Ensure props are serializable; make DOM self‑contained.

### D) List or display products

1. On server: call `listProducts()` from `frontend/lib/stripe.ts`.
2. Pass **only** serializable fields to the island (name, images\[0], unitAmount, currency, productId, priceId).
3. In island, call `addToCart()` (from `lib/cart-state.ts`) and use `formatMoney()`.

### E) Change product cache TTL

1. Edit TTL in `frontend/lib/stripe.ts` (`NodeCache` `stdTTL`).
2. Consider exposing TTL via env for ops parity.
3. Validate via `/api/cache-stats` endpoint.

### F) Wire webhook action

1. Implement logic inside `handleCheckoutSessionCompleted()` and `handlePaymentIntentSucceeded()`.
2. Make idempotent using `session.id`/`paymentIntent.id` as unique keys.
3. Return 200 on success; 500 to trigger Stripe retry on transient errors.

### G) K8s policy tweak (ingress reachability)

1. If changing ingress namespace, update `k8s/network-policy.yaml` namespaceSelector accordingly.
2. Verify with `kubectl logs -n <ingress-ns> <controller-pod>` and `kubectl describe networkpolicy`.

---

## 11) PR Checklist (strict)

* [ ] `deno task check` & `deno task test` succeed locally.
* [ ] Islands have no server‑only imports; props are serializable.
* [ ] UI follows `/frontend/DESIGN.md` primitives & tokens.
* [ ] No secrets committed; `.env.example` updated if new config added.
* [ ] Stripe API version consistent across files.
* [ ] K8s changes validated (namespace, ports 80→8000, ingress host).

---

## 12) Do / Don’t (quick sanity)

**Do**

* Use `lib/money.ts` in both server and islands.
* Use `lib/cart-state.ts` signals for cross‑island state.
* Keep images lazy‑loaded and components keyboard‑navigable.

**Don’t**

* Don’t import `lib/stripe.ts` (or any server‑only libs) inside islands.
* Don’t inline hex colors or invent new radii/shadows — use tokens.
* Don’t broaden container/K8s permissions casually; keep NP tight.

---

## 13) Troubleshooting Notes (repo‑specific)

* **Hydration issues**: check island imports for server‑only modules; ensure props are primitives; simplify to a button to verify hydration.
* **Stripe 400s**: confirm `priceId` ↔ `productId` alignment (API validates this), and that `STRIPE_SECRET_KEY` is present. Check idempotency key logic if duplicates suspected.
* **Ingress timeouts (524)**: confirm NetworkPolicy namespace label selector; use port‑forward to bypass policy and isolate.
* **Cache confusion**: hit `/api/cache-stats` to see hit/miss ratio; `clearProductsCache()` is available server‑side.

---

## 14) Future Work Hooks

* Externalize Stripe cache TTL via env.
* Add `resources` limits & HPA in `k8s/` for production grade.
* Expand `/docs` with runbooks for common SEVs (ingress, DNS, TLS).

**End of AGENTS.md**
