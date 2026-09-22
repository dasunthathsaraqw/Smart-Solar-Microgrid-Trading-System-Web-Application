# Member 4: Grid Operator Web Workflow

## 1. Operator Web Navigation
The Grid Operator portal is located under `/dashboard/operator` and consists of five primary tabs:
- **Overview:** Live workload for the currently assigned station.
- **Transfer Monitor:** Operational view of Approved, Pending, Completed, and Cancelled reservations.
- **Update Slots:** Slot management UI (shared existing component).
- **Transaction History:** Record of completed energy transfers.
- **Station View:** Station metadata and upcoming operational slot status.

## 2. API Used by Member 4 Pages
- `GET /api/auth/me`: Fetched once globally via `OperatorContext.jsx`. Provides `currentUser` and `stationId`.
- `GET /api/stations/{id}`: Fetched once globally via `OperatorContext.jsx`. Provides station details.
- `GET /api/reports/operator-dashboard`: (Overview) Fetch dashboard statistics.
- `GET /api/reservations`: (Transfer Monitor) Fetch paginated reservations by status.
- `GET /api/reservations/operator/history`: (Transaction History) Fetch completed reservations for the operator's station.
- `PUT /api/reservations/{id}/approve`: (Transfer Monitor) Approve a pending reservation.
- `GET /api/slots`: (Station View) Fetch available operational slots.

## 3. Station Assignment Behavior
The backend is strictly authoritative regarding station scope. The frontend uses `OperatorContext` to fetch `/auth/me` on initial load.
- If `stationId` exists, the frontend pulls station metadata.
- If `stationId` is null, the frontend immediately renders `<OperatorUnassignedState />` intercepting all local page API fetches.
- Changes to station assignment mid-session trigger 403s on operations, exposing a **"Refresh assignment"** action to safely re-sync the session without logout.

## 4. Transfer Monitor Lifecycle
- **Approved (Awaiting Transfer):** Default view. These transfers are approved and await the physical QR scan at the microgrid station.
- **Pending:** Requires manual Operator approval via the **"Approve"** button. Button disables on submission, shows loading UI, fires a success Toast, and re-fetches to move the record out of Pending.
- **Completed / Cancelled:** Read-only historical tables. 

## 5. Why Web Has No Direct "Complete" Action
The backend mandates that actual energy transfer completion requires a physical presence verification (`POST /api/reservations/scan-complete`). Providing a raw "Complete" button on the web portal would violate this physical verification requirement.

## 6. Why QR Scanning Belongs to Kotlin Operator App
The Web Portal serves as a "station monitor desk". True point-of-sale operational completion, including scanning the Prosumer's QR token via hardware camera, natively belongs to the Android operator application as scoped in the system architecture.

## 7. Transaction History
A dedicated view targeting `GET /reservations/operator/history`. Designed strictly for completed transfers. Paginates via backend parameters (`page`, `pageSize`, `dateFrom`, `dateTo`). Resetting filters resets backend pagination cleanly. 

## 8. Station View
A read-only technical view for operators to monitor underlying station active/inactive status, schedule, physical capacity, and coordinate locations, along with an overview of generated slot windows.

## 9. Reassignment Behavior
If Backoffice reassigns an Operator, their JWT token is internally unaffected (or refreshed if configured), but `/auth/me` natively returns the new `stationId`. Clicking "Refresh" in any Member 4 view forces a context sync. Stale station data is wiped locally, and the new station's dataset replaces it seamlessly.

## 10. Main Error States
- **Network Errors (500s/Disconnect):** Render localized "Retry" blocks per-component instead of fatal full-page crashes.
- **Access Denied (403):** Recognized specifically as "Stale Assignment" prompting the operator to re-sync their session state.
- **Unassigned:** Clean warning UI, short-circuits expensive backend queries automatically.
- **Double-Submits:** Strictly guarded by local `isProcessing` lock IDs.

## 11. End-to-End Operator Web Flow
1. Operator logs in, accesses `/dashboard/operator`.
2. `OperatorContext` boots, loads `stationId=A`.
3. Overview renders KPI stats for Station A.
4. Operator clicks "Transfer Monitor" → Awaiting Transfer table loads Station A records.
5. Operator clicks "Pending" → Accepts an incoming transfer → Success Toast appears.
6. Operator uses the Mobile app (out-of-scope for React) to scan QR and finalize.
7. Web Operator clicks "Transaction History" → transfer appears in completed list. 
8. Operator clicks "View Details" to audit timestamps.
