# PragOptics™ Subscriber & Partner Agreement
### Effective: February 26, 2026

This Agreement summarizes the pricing, capabilities, and key terms for using the **PragOptics™ Platform**.  
It applies to:

- **Users** subscribing to PragOptics™ capabilities  
- **Partners** building on or reselling PragOptics™ subscriptions  

By subscribing or clicking **“I Agree”**, you accept this Agreement.

---

# 1. Pricing Overview (Primary Section)

## 1.1 Base User Subscription
**$7.50 per user per month**

Includes per user:
- 10,000 API calls per month  
- 1 GB storage  
- Website builder + deployment  
- Domain availability check  
- Authentication (MAUs counted toward Entra free tier)  
- Access to platform automation functions  

*(Partners may set their own retail pricing.)*

---

## 1.2 Partner Premium API Subscription
**$49 per month**

Includes:
- Partner Resource Group  
- Partner storage account  
- Custom API namespace: `/v1/{brand}/*`  
- Access to all public APIs  
- Ability to onboard Users  
- Freedom to set User pricing  
- No per‑endpoint costs  

---

## 1.3 Add‑Ons (Optional)
| Add‑On | Price | Notes |
|--------|--------|-------|
| Domains + Business Email | **$7.50/user/month** | Per user, per domain/email license |
| Extra Storage | **$2.00 per 5GB/month** | Scales in increments |
| Workflow Bundle | **$3.00 per 10,000 executions** | Automations & workflow tasks |
| API Bundle | **$5.00 per 50,000 calls** | High‑volume API workloads |

Partners may resell or mark up add‑ons.

---

## 1.4 Provider‑Level Free Thresholds (Azure‑Backed)
These platform capabilities inherit global free quotas:

- **Microsoft Entra External ID:** 50,000 MAUs free  
- **Azure Function Apps:** 1,000,000 executions free  
- **DNS Queries:** First 1,000,000 queries free (region‑dependent)  

When usage exceeds included or free amounts:
- Overages are billed to **Partners**  
- Partners may pass through surcharges to Users  

---

# 2. Subscriber Types

## 2.1 Users
Users subscribe to access PragOptics™ capabilities directly or via a Partner.

Users receive:
- Public API functions  
- A dedicated storage account with standard tables (Products, Orders, Inventory, etc.)  
- Website builder tools  
- GitHub‑based auto‑deployment  
- Optional add‑ons  

---

## 2.2 Partners
Partners build on or resell PragOptics™.

Partners receive:
- A dedicated Partner Resource Group  
- A Partner storage account  
- A custom API namespace (`/v1/{brand}/*`)  
- Ability to onboard and manage Users  
- Full control over their own retail pricing  
- Access to developer sandbox resources  

---

# 3. Platform Capabilities (Simplified Technical Overview)

## 3.1 Authentication
- OAuth2 Authorization Code + PKCE  
- Microsoft Entra External ID  
- Login flow: `/auth → /auth/login → /auth/callback`

---

## 3.2 API Surface
Key public endpoints:

- **Authentication:**  
  `/v1/auth`, `/v1/auth/login`, `/v1/auth/callback`  
- **Health:**  
  `/v1/ping`  
- **Billing:**  
  `/v1/billing/profile`  
  `/v1/billing/checkout-session`  
- **Partner Custom Namespaces:**  
  `/v1/app/*`, `/v1/custom/*`, `/v1/{brand}/*`  

Partners may build entire SaaS experiences on these endpoints.

---

## 3.3 Data & Storage
Each User or Partner receives:
- Isolated storage  
- Standardized tables  
- Encryption at rest and in transit  
- Capacity scaling via add‑ons  

---

## 3.4 Deployment Model
PragOptics uses a four‑lane deployment system:

- **PROD** — live traffic  
- **BLUE** — staging  
- **GREEN** — staging  
- **DEV** — development  

Global updates propagate through Azure Front Door in **~20–40 minutes**, with **no downtime** due to stateless architecture.

---

# 4. Identity, Security & Privacy
- Encrypted data in transit and at rest  
- Secrets stored in Azure Key Vault  
- Global routing & WAF protections via Azure Front Door  
- Multi‑tenant isolation  
- OAuth2 best‑practice security  
- No payment card details stored on‑platform  

---

# 5. Support Model

## Partner Tier‑1 Support
Partners support their Users in:
- Setup and onboarding  
- UI/UX and workflow guidance  
- First‑line troubleshooting  

## FH Tier‑2 Support
FH supports:
- Platform API issues  
- Authentication problems  
- Provisioning and billing engine issues  
- Infrastructure availability incidents  

---

# 6. Attribution Requirement
Products or sites built using the platform must include:

**“Powered by PragOptics™”**

A small badge, footer, or attribution link satisfies this requirement.

---

# 7. Electronic Acceptance
By clicking **“I Agree”**, you acknowledge that:
- This Agreement is electronically binding  
- Acceptance has the same effect as a handwritten signature  
- Your subscription is governed by this Agreement and the current pricing at the time of purchase  

Electronic acceptance complies with:
- The U.S. **ESIGN Act**  
- The **Uniform Electronic Transactions Act (UETA)**  
- Comparable international digital signature standards  

---

# 8. Acceptance
By subscribing or using the PragOptics™ Platform, you accept:
1. This Agreement  
2. The current subscription and pricing schedule  
3. Any partner‑specific terms presented at checkout  

---
