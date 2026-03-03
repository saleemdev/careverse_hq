Admin Central  

1.1 Unaffiliation Management Use Case 

1. Purpose: 

This use case facilitates the formal termination of a professional link between a Healthcare facility and a Health Professional (HP). It ensures that the digital relationship remains an accurate reflection of real-world employment or contractual status. 

2. Use Case Description:  

Title: Central Admin initiates the formal termination of a professional link. 

Actors: 

Central Administrator 

Facility admin  

Health Professional  

Preconditions: 

The HP must have an Active affiliation status with the specific facility. 

The initiator has access to Admin Central with appropriate permissions.  

Primary Flow (Initiated from Admin Central): 

Central Admin user logs into Admin Central and navigates to the relevant section “Facility Affiliations”.  

User  searches for and selects the Health Professional(s) and the associated facility, then selects the option to “Initiate Termination of Affiliation”. 

System prompts the Central Admin to: 

Select a reason (e.g., End of Contract, Dismissal, Regulatory Requirement). 

Upload any accompanying documents (e.g., resignation letter, termination notice, regulatory order). 

Submit the termination request. 

Upon submission: 

System updates the HP's affiliation status to “Inactive” in the central registry. 

The request/termination is recorded and becomes visible in the Facility Admin's view on F360. 

Facility Admin receives a notification about the termination request from Admin Central. 

Health Professional receives a notification in P360 informing them of the termination of their affiliation with the facility. 

System revokes the HP's access to facility-specific features (e.g., pre-authorizations, procedure management for that facility) and moves the record to historical/inactive logs. (V2 Feature)  

Alternate Flow 

A1: Missing Termination Reason 

If the Central Admin does not select and/or provide a reason for terminating the affiliation, the system displays: “Please provide a reason for terminating the affiliation”. The user is prompted to enter/select a reason before submission can proceed. 

A2: Health Professional with Pending Actions (V2 Feature)  

If the system detects open pre-authorizations, incomplete procedure records, or other pending actions tied to the facility for the selected HP: 

System blocks the termination submission. 

Displays: “Cannot unaffiliate, Health Professional has pending pre-authorizations or incomplete records. Please resolve these first.” 

Central Admin must address the pending (or escalate) before retrying termination. 

 

Business Objectives: 

Compliance: Maintain an accurate, real-time registry of the active workforce within a facility for regulatory and insurance (SHA) purposes. 

Security: Revoke access to facility-specific workflows (like pre-authorizations and procedure management) once an HP is no longer part of the staff. 

Possible Reasons for Unaffiliation: 

End of employment contract or fixed-term agreement expiration  

Voluntary resignation by the HP 

Retirement of the HP 

Dismissal/termination for cause with specific reason (performance, misconduct, etc.) 

Facility closure or service discontinuation 

Regulatory or compliance requirements (e.g., license suspension, credentialing changes) 

 

 

 