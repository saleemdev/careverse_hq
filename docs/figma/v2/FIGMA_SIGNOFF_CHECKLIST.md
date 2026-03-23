# Figma Sign-Off Checklist: Public + Private Hiring Modules

Date: March 22, 2026
Design File: https://www.figma.com/design/8C0T9wJ7bU2B53jaV0W3lG
Scope: `PUB-01..04`, `PRV-01..05`, `DS-01`

## 1) Frame Inventory
- [ ] `PUB-01 Jobs Board List` exists
- [ ] `PUB-02 Job Post Detail` exists
- [ ] `PUB-03 Job Application Submission + Validation` exists
- [ ] `PUB-04 Application Flow + Privacy` exists
- [ ] `PRV-01 Candidate Pipeline` exists
- [ ] `PRV-02 Job Posts List` exists
- [ ] `PRV-03 Job Post Detail` exists
- [ ] `PRV-04 Candidate Profile` exists
- [ ] `PRV-05 Hiring Flow & Ownership` exists
- [ ] `DS-01 Typography + Glassmorphism + Components` exists

## 2) Jobs Board Acceptance
- [ ] `/jobs` list includes search, filters, count, card list, and paging/infinite-load
- [ ] `/jobs/<job_slug>` includes full role details + facility context + related jobs + `Apply`
- [ ] Consent capture is explicit before application submit
- [ ] Public surface excludes recruiter notes and restricted compliance/PII fields
- [ ] Public loading/empty/error states are designed

## 3) Recruitment Desk Acceptance
- [ ] Recruiter pipeline shows all required stages
- [ ] Job opening detail includes `Share Public Link` action
- [ ] Canonical links are visible for list URL and detail URL
- [ ] Candidate workspace includes KYC/license, offer, affiliation trace, employee reconciliation timeline
- [ ] Workflow swimlane shows authority boundaries (Admin vs Candidate app vs System)

## 4) Design System Consistency
- [ ] Typography scale matches Admin Central
- [ ] Glassmorphism tiers match Admin Central
- [ ] Component hierarchy matches Admin Central (shell, cards, table/list, badges, actions)
- [ ] Shared spacing/radius/elevation tokens used
- [ ] No parallel visual language introduced

## 5) Responsive and State Coverage
- [ ] Desktop variants exist for all frames
- [ ] Mobile variants exist for all frames
- [ ] Loading state exists for all list/detail views
- [ ] Empty state exists for all list/detail views
- [ ] Error state exists for all list/detail views

## 6) Final Go/No-Go
- [ ] All checks above complete
- [ ] UX + Product + Engineering sign-off complete
- [ ] Approved for implementation sprint kickoff
