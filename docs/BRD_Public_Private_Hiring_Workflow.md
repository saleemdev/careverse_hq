# BRD: Public Job Advertising + Private Hiring Workflow (ERPNext/HRMS + LinkedIn)

Date: March 22, 2026
Owner: Admin Central / Careverse HQ

## 1. Objective
Design a hiring product that supports:

1. A **public jobs module** for external discovery and application.
2. A **private hiring workflow** for recruiters/HR that enforces KYC, practitioner-license validation, and privacy-by-design.
3. Optional LinkedIn integrations for job distribution and application intake where partner access is available.
4. A shared design language with Admin Central (typography, glassmorphism surfaces, and component hierarchy) across list and detail views.

## 2. Problem Statement
Healthcare facilities (e.g., L2/L3) need faster, compliant hiring for locum staff (example: Primary Nurse). Current flows are fragmented between job advertising, candidate screening, license checks, and employee onboarding. This creates hiring delays and compliance risk.

## 3. In Scope
1. Public job listings and candidate application UX.
2. Private recruiter workflow: screening, interview, offer, onboarding trigger, employee creation gate.
3. Practitioner licensing verification gate before Employee record creation.
4. Data-privacy controls for applicant PII.
5. LinkedIn capability mapping and integration path.
6. Shareable public job links generated from Admin Central.
7. Public and private module UX requirements for list and detail pages.

### 3.1 User-Facing Module Naming (Admin Central)
1. Use user language in navigation and page titles; avoid implementation labels such as `Hiring Workflows`.
2. Recommended labels:
   - Public module label: `Jobs Board`
   - Private module label: `Recruitment Desk`
   - Private pipeline label: `Candidate Pipeline`
   - Job management label: `Job Posts`
   - Candidate detail label: `Candidate Profile`
3. Technical terms (workflow orchestration, reconciliation, hooks) should remain in documentation and developer views, not primary user navigation.

## 4. Out of Scope
1. Building a national practitioner registry.
2. Payroll/on-shift scheduling optimization.
3. Full legal policy text drafting (only process controls are defined here).

## 5. Actors
1. Facility Admin (L2/L3): raises requisition and approves shortlist.
2. Recruiter: runs pipeline and communication.
3. HR Compliance Officer: verifies KYC/license and audits data handling.
4. Applicant (Nurse/Clinician): discovers jobs and applies.
5. Interview Panelist: evaluates candidates.
6. System Integrations: practitioner registry service, LinkedIn APIs, geolocation service.
7. System Administrator: configures workflows, permissions, hooks, and retention rules.

## 6. High-Level Business Flow
1. Facility Admin creates Job Requisition -> Job Opening.
2. Job Opening is published publicly (and optionally to LinkedIn where permitted).
3. Applicant submits application (portal/LinkedIn Apply).
4. System creates Job Applicant in private pipeline.
5. Recruiter screens and schedules interviews.
6. KYC + license validation gate runs before offer finalization.
7. Offer/Appointment is issued after compliance pass.
8. On offer acceptance, Admin Central executes the same backend flow as **Add Single Affiliation** (simulation mode) to create `Facility Affiliation`.
9. Candidate confirms affiliation in candidate app using existing affiliation confirmation workflow (`Pending -> Active` authority is candidate-side).
10. Existing confirmation workflow creates `Employee` as part of activation.
11. Admin Central reconciles hiring status from affiliation/employee events and then triggers onboarding tasks.

## 7. Core Use Cases

### UC-01: Post Public Locum Job
- Primary actor: Recruiter / Facility Admin
- Trigger: Need Primary Nurse for locum shift/contract
- Preconditions: Facility and hiring authorization exist
- Main flow:
  1. Create Job Opening with role, facility level, shift, location, compensation band.
  2. Mark opening as Public = Yes.
  3. Publish to public jobs page.
  4. If LinkedIn partner access exists, sync posting to LinkedIn job APIs.
- Success outcome: Job is visible externally with controlled fields.

### UC-02: Apply to Job (Public)
- Primary actor: Applicant
- Main flow:
  1. Applicant filters jobs (role, radius, facility type, locum requirement).
  2. Opens job details and submits application.
  3. Gives explicit consent for profile/KYC processing.
- Success outcome: Application stored as Job Applicant with consent artifact.

### UC-03: Private Screening and Interview
- Primary actor: Recruiter
- Main flow:
  1. Recruiter reviews applicants and shortlists.
  2. Creates interview rounds and captures ratings.
  3. Moves successful candidates to compliance gate.
- Success outcome: Candidate is either rejected, held, or advanced.

### UC-04: Practitioner License Verification (KYC Gate)
- Primary actor: HR Compliance Officer
- Main flow:
  1. System checks license number, authority, status, and expiry via registry API.
  2. Writes verification result + timestamp + verifier trail.
  3. Blocks progression if status is invalid/expired/unverifiable.
- Success outcome: Candidate status becomes License Verified or License Failed.

### UC-05: Offer, Affiliation Request, and Hire
- Primary actor: Recruiter + HR Compliance
- Main flow:
  1. Recruiter prepares Job Offer/Appointment.
  2. System validates KYC gate before submit.
  3. After acceptance, system calls the same API used by Admin Central Add Single Affiliation (`careverse_hq.api.single_affiliation.create_single_affiliation`).
  4. Hiring orchestration uses `hp_name` path for terminal step and sends `employment_details`.
  5. Candidate app confirms affiliation (`Pending -> Active`) via existing confirmation flow.
  6. Existing confirmation flow creates Employee; Admin Central updates hire status asynchronously.
- Success outcome: Affiliation request is created, candidate confirms in-app, and employee creation is completed through existing authority workflow.

### UC-06: L2/L3 Facility "Nearby Primary Nurse for Locum" Search
- Primary actor: Facility Admin
- Main flow:
  1. Facility enters requirement: Primary Nurse, locum dates, radius.
  2. System applies eligibility gate: consent, valid active license, role fit, availability.
  3. System ranks candidates by weighted score:
     - 35% proximity/travel
     - 25% license compliance confidence
     - 15% affiliation fit (facility affiliation/privileging)
     - 15% availability readiness
     - 10% experience/specialty fit
  4. Facility sees explainable shortlist and can invite/apply outreach.
- Success outcome: Compliant shortlist with explainability and audit logs.

## 8. Functional Requirements
1. Public job board with open/closed state and application route.
2. Private pipeline with states: New -> Screened -> Interview -> Compliance -> Offer -> Affiliation Requested -> Hired/Rejected/Timed Out.
3. Mandatory consent capture before application processing.
4. KYC data model fields on applicant and immutable audit trail.
5. Practitioner validation adapter with retries, timeout, and manual override path.
6. Hard server-side gate on Employee creation (`before_insert`/equivalent).
7. Role-based and field-level permissions for applicant PII.
8. Data retention and deletion/anonymization workflow for unsuccessful applicants.
9. Optional LinkedIn posting/sync integration where access is approved.
10. Decision explainability for candidate ranking and filtering.
11. Hiring completion must call Affiliation creation API in Admin Central before Employee creation.
12. End-of-hiring affiliation creation must simulate Add Single Affiliation using the same API path and validation rules.
13. Hiring orchestration must not bypass Add Single Affiliation by directly inserting `Facility Affiliation`.
14. `Pending -> Active` transition authority belongs to Candidate App confirmation workflow, not Admin Central.
15. Employee creation authority belongs to existing affiliation confirmation workflow, not hiring orchestration.
16. Terminal hiring affiliation request must use `hp_name` path; `hwr_cache_key` is not allowed at offer stage.
17. Hiring record must subscribe to/reconcile candidate confirmation outcomes: `Active`, `Rejected`, `Expired`, timeout.
18. Jobs Board module must provide a list page (`/jobs`) with searchable/filterable job cards and pagination/infinite-load controls.
19. Jobs Board module must provide a detail page (`/jobs/<job_slug>`) with full role details, facility context, CTA (`Apply`), and related jobs.
20. Recruitment Desk module must provide recruiter list views:
    - Job openings list
    - Applicant pipeline list
    - Affiliation-request tracking list
21. Recruitment Desk module must provide recruiter detail views:
    - Job opening detail (publish/share controls and analytics)
    - Applicant detail (timeline, KYC status, interview summary, offer state, affiliation trace)
22. Admin Central must expose a `Share Public Link` action on the job opening detail view and return canonical share URLs for:
    - jobs list landing URL
    - specific job detail URL
23. Shared links must be generated and served from `careverse_hq` website pages (`www`) and follow Frappe route rules; implementation should mirror current login/landing page delivery pattern.
24. Public pages must expose only approved public fields; recruiter/internal notes, compliance artifacts, and PII beyond applicant-provided public profile must never be rendered publicly.
25. Public and private list/detail views must use the Admin Central design system contract:
    - typography scale and font pairing
    - glassmorphism surface treatment
    - component hierarchy (page shell, cards, tables, pills/badges, primary actions)
    - spacing, radius, elevation, and state styles from shared tokens
26. List and detail views must define empty/loading/error/skeleton states consistent with Admin Central UX.
27. Responsive behavior for list and detail views is mandatory (desktop/tablet/mobile) without divergence from Admin Central visual language.

## 9. ERPNext/HRMS Design Mapping
1. `Job Opening`: public/private publication control.
2. `Job Applicant`: main candidate profile, screening status, and KYC fields.
3. `Interview`: structured interview rounds and scoring.
4. `Job Offer` / `Appointment Letter`: formal pre-hire stage.
5. `Facility Affiliation`: created after offer acceptance using configured initial lifecycle state.
6. `Employee`: created by existing candidate confirmation workflow when affiliation becomes `Active`.

Recommended enforcement points:

1. Workflow transitions at Job Applicant/Job Offer level for compliance gating.
2. Frappe hooks / doc events on validation and submit events.
3. Final non-bypass gate on Employee insert.
4. Affiliation transition guard to ensure KYC remains valid before activation.

### 9.1 Affiliation Plugin Contract (Admin Central Module)
1. Trigger: successful offer acceptance in private hiring workflow.
2. Action: call Add Single Affiliation API (`/api/method/careverse_hq.api.single_affiliation.create_single_affiliation`) to create `Facility Affiliation`.
3. Payload contract (same as Add Single Affiliation, constrained for hiring terminal step):
   - Identity selector: `hp_name` (existing HP) only.
   - `employment_details`: `fid`, `employment_type`, `designation`, `start_date`, optional `end_date`.
4. Non-bypass rule:
   - Hiring workflow must not insert `Facility Affiliation` directly.
   - All duplicate checks, full-time conflict checks, and designation handling must come from the shared Add Single Affiliation backend path.
5. Audit outputs:
   - `affiliation_id`, source path (`create_single_affiliation`), actor, timestamp, and request payload hash/reference.
6. Authority boundary:
   - Admin Central does not transition `Pending -> Active`.
   - Admin Central does not directly create Employee in this flow.

### 9.2 Identity Mapping Contract (Job Applicant to HP)
1. Canonical link: `Job Applicant` must store a resolved `health_professional` reference (`hp_name`) before Offer Accepted.
2. Resolution order:
   - direct link if already present,
   - deterministic match by registration number + identification,
   - manual compliance resolution if ambiguous.
3. Offer cannot move to Accepted unless `hp_name` is resolved and validated.
4. `hwr_cache_key` is allowed only for short-lived search/onboarding UX, not terminal hiring step.

### 9.3 Transition Authority Matrix
1. Hiring workflow transitions:
   - `Offer Issued -> Offer Accepted`: Recruiter/HR.
   - `Offer Accepted -> Affiliation Requested`: Admin Central orchestration.
   - `Affiliation Requested -> Hired`: System reconciliation on candidate confirmation + employee creation event.
   - `Affiliation Requested -> Closed (No Confirmation)`: System timeout or Recruiter closure.
2. Affiliation lifecycle transitions:
   - `Pending -> Active`: Candidate app confirmation workflow.
   - `Pending -> Rejected`: Candidate app rejection workflow.
   - `Pending -> Expired`: System scheduler/job.
   - `Active -> Inactive`: Unaffiliation workflow per existing process.
3. Guard conditions:
   - KYC/license must remain valid at activation time.
   - Employee creation allowed only through confirmation authority path.

### 9.4 Jobs Board Routing and Page Contract (`careverse_hq`)
1. Implementation location:
   - Frappe website pages under `careverse_hq/www` (HTML + optional controller `.py` files).
2. Required routes (minimum):
   - `/jobs` -> public jobs list view.
   - `/jobs/<job_slug>` -> public job detail view.
3. Optional route controls:
   - `website_route_rules` in `careverse_hq/hooks.py` for canonical mapping.
4. Share-link behavior:
   - Admin Central generates and copies canonical links that resolve to the above routes.
   - Link generation must be deterministic and environment-aware (base URL from site config).
5. Rendering model:
   - Same deployment pattern as login/landing pages (server-rendered entry page + frontend assets).
   - Public pages must not require Admin Central session authentication.

## 10. LinkedIn Integration Strategy

### Capability reality (as of March 22, 2026)
1. Job posting and application sync are possible through LinkedIn Talent partner programs.
2. Access is partner-gated; not fully self-serve for all developers.
3. Member data requires explicit OAuth consent and scoped permissions.

### Implementation phases
1. Phase A (No partner dependency): run public board + ERPNext/HRMS private pipeline + registry KYC.
2. Phase B (With approved partner access): add LinkedIn job sync + Apply Connect ingestion + status sync.
3. Phase C (Optimization): analytics, quality scoring, and hiring SLA dashboards.

## 11. Security, Privacy, and Compliance Requirements
1. Least-privilege access by role and field-level permissions.
2. Encryption at rest/in transit for PII and verification payloads.
3. Full audit trail for who viewed/edited applicant data.
4. Consent ledger: capture time, scope, and policy version.
5. Retention schedule and deletion/anonymization for rejected/withdrawn applications.
6. Bias control: do not use protected attributes in ranking.

## 12. Non-Functional Requirements
1. Availability: 99.9% target for core application flow.
2. Performance: shortlist query under 2 seconds for typical filtered search.
3. Reliability: idempotent external validation calls with retry/backoff.
4. Traceability: every hiring decision linked to state transition + actor + timestamp.
5. UX consistency: public/private list and detail pages must consume shared Admin Central design tokens and reusable components; no parallel visual system.
6. Accessibility baseline: list/detail interactions must support keyboard navigation, clear focus states, and AA-level contrast for critical controls/text.

## 13. Success Metrics
1. Time-to-shortlist reduced by at least 40%.
2. Time-to-hire reduced by at least 30% for locum roles.
3. 100% of hired clinicians have verified active license at hire timestamp.
4. Zero employee creation without KYC pass.
5. Applicant conversion rate from public page to completed application.

## 14. Risks and Mitigations
1. LinkedIn partner access delays.
   - Mitigation: deliver Phase A independently first.
2. External registry instability.
   - Mitigation: cache last valid checks, manual compliance fallback, and retry policy.
3. Workflow bypass by direct record creation.
   - Mitigation: enforce final gate on Employee create/insert event.
4. Privacy violations from broad access.
   - Mitigation: strict permissions, audit reviews, and periodic access recertification.

## 15. Open Questions
1. Which national/regional practitioner registry APIs are legally and technically available?
2. What exact definition of "affiliated to facilities near me" should be used (current affiliation only vs historical)?
3. Is manual compliance override allowed, and if yes, under what approval matrix?
4. Final jurisdiction retention periods (default config can be implemented now, legal values finalized before production).

## 16. Recommended Next Decision
Start with **Phase A** immediately using ERPNext/HRMS-native workflow + custom KYC gates, then layer LinkedIn partner integration once access is approved.

## 17. Coding Kickoff Plan (Start Immediately)

### 17.1 Implementation Principle
1. End-of-hiring affiliation creation must reuse Admin Central Add Single Affiliation backend flow.
2. Use existing whitelisted method:
   - `/api/method/careverse_hq.api.single_affiliation.create_single_affiliation`
3. Do not create `Facility Affiliation` by direct insert in new hiring code paths.
4. Respect authority boundary: candidate app confirms affiliation and existing confirmation flow creates Employee.

### 17.2 Target Sequence (Private Hiring Terminal Step)
1. Candidate reaches `Offer Accepted`.
2. Hiring orchestrator validates `hp_name` is resolved on candidate.
3. Hiring orchestrator prepares Add Single Affiliation payload:
   - `hp_name` + `employment_details`
4. Call `careverse_hq.api.single_affiliation.create_single_affiliation`.
5. Persist returned `facility_affiliation` on hiring record for traceability.
6. Wait for candidate app confirmation outcome within SLA window.
7. On `Active` + Employee-created event, mark hire complete and trigger onboarding.
8. On `Rejected`/`Expired`/timeout, move hiring record to exception queue/state.

### 17.3 Payload Contract for Hiring Orchestrator
1. Required:
   - `employment_details.fid`
   - `employment_details.employment_type`
   - `employment_details.designation`
   - `employment_details.start_date` (`YYYY-MM-DD`)
2. Optional:
   - `employment_details.end_date` (`YYYY-MM-DD`)
3. Identity selector:
   - `hp_name` required
   - `hwr_cache_key` not permitted for terminal hiring step

### 17.3.1 Idempotency Contract
1. Idempotency key format:
   - `hire_aff_req:{job_offer_id}:{hp_name}:{fid}`
2. Storage:
   - dedicated idempotency ledger table/doctype with request hash + response reference.
3. Behavior:
   - first request creates affiliation and stores response reference,
   - replay with same key returns existing `affiliation_id` with `idempotent_replay=true`.
4. Deduplication window:
   - 30 days (configurable).

### 17.4 Backend Work Items
1. Add a dedicated hiring orchestration method in `careverse_hq` that wraps:
   - offer-accepted validation
   - Add Single Affiliation API call
   - linkage persistence (`job_applicant`/`job_offer` to `facility_affiliation`)
2. Add idempotency key/check to prevent duplicate affiliation requests on retries.
3. Add audit log entry for each orchestration call with actor + payload reference + response.
4. Add reconciliation consumer/poller for affiliation confirmation outcomes and employee creation events.
5. Add timeout handler for unconfirmed affiliations (SLA breach path).

### 17.5 Frontend/Admin Central Work Items
1. Add terminal hiring action: `Complete Hire` (Recruitment Desk module only).
2. Action must invoke new hiring orchestration API (not direct affiliation insert).
3. Display Add Single Affiliation simulation result:
   - success: affiliation ID + state
   - failure: validation/conflict reason from shared backend flow
4. Add timeline/event panel on candidate detail to show:
   - offer accepted
   - affiliation request created
   - affiliation activated
   - employee created
5. Add explicit status badges for waiting states:
   - `Awaiting Candidate Confirmation`
   - `Confirmation Timed Out`
   - `Candidate Rejected Affiliation`
6. Build Jobs Board pages in `careverse_hq/www`:
   - jobs list page (`/jobs`)
   - job detail page (`/jobs/<job_slug>`)
7. Add `Share Public Link` control in Admin Central job opening detail view:
   - copy jobs list URL
   - copy specific job URL
8. Build Recruitment Desk list/detail pages for:
   - job openings
   - applicants pipeline
   - candidate profile/timeline/KYC/offer/affiliation detail
9. Apply Admin Central visual contract to all new views:
   - same typography scale
   - same glassmorphism surfaces
   - same component hierarchy and tokenized spacing/radius
10. Add design QA checklist in PR template for list/detail parity:
   - desktop + mobile screenshots
   - token usage validation
   - empty/loading/error state captures

### 17.6 Test Plan (Minimum for Sprint 1)
1. Existing HP success path creates affiliation through shared API and links candidate.
2. Offer acceptance is blocked when `hp_name` is unresolved.
3. Duplicate affiliation conflict is surfaced from shared API without bypass.
4. Full-time conflict is surfaced from shared API without bypass.
5. Candidate confirmation (`Pending -> Active`) completes hire and creates employee through existing confirmation workflow.
6. Employee creation is blocked in hiring orchestration path.
7. Retry on same idempotency key does not create duplicate affiliation.
8. Timeout path moves candidate to exception state after SLA breach.

### 17.7 Definition of Done
1. Hiring terminal step calls only the shared Add Single Affiliation flow.
2. End-to-end path produces:
   - `Job Applicant/Offer` trace
   - `Facility Affiliation` trace
   - `Employee` trace
3. All test cases in 17.6 pass in CI/local verification.
4. Operational logs allow support to correlate a hire attempt to affiliation API response.
5. Authority boundary is enforced in code and documented in workflow transitions.

### 17.8 SLA and Compensation Rules
1. Confirmation SLA:
   - Candidate confirmation expected within 7 calendar days (configurable).
2. Reminder schedule:
   - reminder at 24 hours, 72 hours, and 24 hours before expiry.
3. Expiry outcome:
   - move hiring record to `Confirmation Timed Out`.
4. Manual recovery:
   - Recruiter can reissue affiliation request (new idempotency key) or close candidate.
5. Partial-failure compensation:
   - if affiliation is created but hire linkage fails, system retries linkage and raises support alert without duplicating affiliation.

## 18. Source Basis (Context7 + Sub-agent research)
1. ERPNext/HRMS docs for Job Opening, Job Applicant, Job Offer, Employee Referral, and framework hooks.
2. Frappe permission and privacy/deletion documentation.
3. LinkedIn Talent docs: access model, Apply Connect, job posting sync schema, authentication, and compliance APIs.

Reference links:

1. https://docs.frappe.io/erpnext/v14/user/manual/en/human-resources/job-applicant
2. https://docs.frappe.io/erpnext/v14/user/manual/en/human-resources/job-offer
3. https://docs.frappe.io/erpnext/v14/user/manual/en/human-resources/employee-referral
4. https://github.com/frappe/hrms/blob/develop/hrms/templates/generators/job_opening.html
5. https://github.com/frappe/hrms/blob/develop/hrms/www/jobs/index.html
6. https://github.com/frappe/hrms/blob/develop/hrms/hr/doctype/job_applicant/job_applicant_dashboard.html
7. https://docs.frappe.io/framework/v14/user/en/python-api/hooks
8. https://docs.frappe.io/erpnext/user/manual/en/permissions
9. https://docs.frappe.io/erpnext/user/manual/en/personal-data-deletion
10. https://learn.microsoft.com/en-us/linkedin/talent/apply-connect
11. https://learn.microsoft.com/en-us/linkedin/talent/job-postings/api/sync-job-postings
12. https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
13. https://learn.microsoft.com/en-us/linkedin/compliance/compliance-api/overview
14. https://docs.frappe.io/framework/v14/user/en/api/database
15. Local implementation reference: `careverse_hq/api/single_affiliation.py`
16. Local UI flow reference: `frontend/src/pages/affiliations/SingleAffiliationPage.tsx`
17. Frappe portal pages reference: https://docs.frappe.io/framework/user/en/portal-pages
18. Local design token reference: `frontend/src/styles/tokens.ts`
19. HRMS public jobs list template baseline: https://github.com/frappe/hrms/blob/develop/hrms/www/jobs/index.html
20. HRMS job detail template baseline: https://github.com/frappe/hrms/blob/develop/hrms/templates/generators/job_opening.html

## 19. Figma Screen-to-Requirement Traceability (Execution Checklist)

Design file baseline: https://www.figma.com/design/8C0T9wJ7bU2B53jaV0W3lG

### 19.1 Jobs Board Pages (User-Facing)
1. `PUB-01 Jobs Board List`
   - View type: List view (`/jobs`)
   - Covers FR: 1, 18, 23, 24, 25, 26, 27
   - Must show: search, filters, result count, job cards, pagination/infinite load, loading/empty/error states.
2. `PUB-02 Job Post Detail`
   - View type: Detail view (`/jobs/<job_slug>`)
   - Covers FR: 1, 19, 23, 24, 25, 26, 27
   - Must show: full role details, facility summary, locum indicators, related jobs, `Apply` CTA, open/closed state.
3. `PUB-03 Job Application Submission`
   - View type: Workflow step (detail-to-apply)
   - Covers FR: 3, 24, 26, 27
   - Must show: consent capture, required field validation, error handling, success confirmation.
4. `PUB-04 Application Flow + Privacy Panel`
   - View type: Operational flow and policy communication
   - Covers FR: 24, 25
   - Must show: what public users can see vs what is private, explicit privacy boundaries.

### 19.2 Recruitment Desk Pages (User-Facing)
1. `PRV-01 Candidate Pipeline`
   - View type: List view
   - Covers FR: 2, 20, 25, 26, 27
   - Must show: candidate stages, SLA risk indicators, filters, assignment state.
2. `PRV-02 Job Posts List`
   - View type: List view
   - Covers FR: 20, 22, 25, 26, 27
   - Must show: publish state, share state, posting channels, conversion summary.
3. `PRV-03 Job Post Detail`
   - View type: Detail view
   - Covers FR: 22, 23, 25, 26, 27
   - Must show: canonical public links, `Share Public Link`, publish controls, linked pipeline metrics.
4. `PRV-04 Candidate Profile`
   - View type: Detail view
   - Covers FR: 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 21, 25, 26, 27
   - Must show: KYC/license status, interview outcomes, offer state, affiliation trace, employee event reconciliation timeline.
5. `PRV-05 Hiring Flow & Ownership`
   - View type: Workflow orchestration view
   - Covers FR: 11, 12, 13, 14, 15, 16, 17
   - Must show: Offer Accepted -> Affiliation Requested -> Candidate Confirmation -> Employee Created/Timeout branches.

### 19.3 Shared Design System Page
1. `DS-01 Typography + Glassmorphism + Components`
   - View type: Design system alignment page
   - Covers FR: 25, 26, 27 and NFR: 5, 6
   - Must show: typography scale, glass surface tiers, component hierarchy, token references, mobile/desktop comparisons.

### 19.4 Review Gate Before Dev Start
1. Every frame listed above exists and is named exactly as specified.
2. Every frame has desktop and mobile variants.
3. Every list/detail frame includes loading/empty/error state variant.
4. `PRV-03` explicitly includes `Share Public Link` action and copied URL examples.
5. `PRV-04` explicitly includes affiliation and employee reconciliation timeline events.

## 20. Solution Fitness and Business Edge Assessment

### 20.1 Architecture Fitness Verdict
1. Yes, this is a strong and buildable solution for Admin Central if implemented as specified.
2. The design is technically aligned to Frappe/HRMS patterns (public list/detail pages plus private workflow orchestration).
3. The authority model is correctly separated:
   - Admin Central requests affiliation.
   - Candidate app confirms affiliation.
   - Existing confirmation workflow creates Employee.

### 20.2 Where the Business Edge Comes From
1. Compliance-by-default hiring:
   - License/KYC gate before hire completion reduces regulatory exposure and failed placements.
2. Faster fulfillment for locum demand:
   - Public discoverability + private pipeline + nearby shortlist logic compresses time-to-shortlist and time-to-hire.
3. Closed-loop operational traceability:
   - Requisition -> offer -> affiliation -> employee linkage gives auditable proof for facilities and regulators.
4. Distribution leverage:
   - Shareable public links from Admin Central and optional LinkedIn integration increase candidate inflow without fragmenting operations.
5. Differentiated recruiter cockpit:
   - Unified list/detail workflows and explainable ranking can outperform generic ATS flows in healthcare staffing context.

### 20.3 Conditions Required to Realize the Edge
1. Registry/KYC integrations must be stable and operationally monitored.
2. Share-link UX and public page performance must be production-grade (no friction on candidate entry).
3. Reconciliation events (affiliation and employee) must be reliable and observable.
4. Design consistency must be enforced via shared tokens/components, not manual styling.

### 20.4 Final Recommendation
1. Proceed to implementation with this BRD as the build baseline.
2. Lock frame names from Section 19 in Figma before sprint kickoff.
3. Use Section 19.4 as a mandatory design sign-off checklist before coding each module.
