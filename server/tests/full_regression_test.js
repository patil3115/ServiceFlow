const assert = require('node:assert');

const API_BASE = 'http://localhost:5000/api';
const CLIENT_BASE = 'http://localhost:5173';

let adminToken, agentToken, employeeToken, elenaToken;
let adminUser, agentUser, employeeUser, elenaUser;

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runRegressionSuite() {
  console.log('========================================================================');
  console.log('🚀 SERVICEFLOW FULL REGRESSION VERIFICATION (PHASE 15)');
  console.log('========================================================================\n');

  // --- SUITE 1: System Health & Frontend Dev Server ---
  console.log('[Suite 1: System Health & Reachability]');
  const health = await apiRequest('/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.data.status, 'healthy');
  assert.strictEqual(health.data.database.status, 'connected');
  console.log('  ✓ Backend API healthy and MongoDB connected');

  const clientRes = await fetch(CLIENT_BASE);
  assert.strictEqual(clientRes.status, 200);
  console.log('  ✓ Client Frontend server responding on port 5173\n');

  // --- SUITE 2: Authentication & RBAC ---
  console.log('[Suite 2: Authentication & Role-Based Access Control]');
  
  // Login standard users
  const adminLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@serviceflow.local', password: 'Admin@12345' })
  });
  assert.strictEqual(adminLogin.status, 200);
  adminToken = adminLogin.data.data.token;
  adminUser = adminLogin.data.data.user;

  const agentLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'agent@serviceflow.local', password: 'Agent@12345' })
  });
  assert.strictEqual(agentLogin.status, 200);
  agentToken = agentLogin.data.data.token;
  agentUser = agentLogin.data.data.user;

  const empLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'employee@serviceflow.local', password: 'Employee@12345' })
  });
  assert.strictEqual(empLogin.status, 200);
  employeeToken = empLogin.data.data.token;
  employeeUser = empLogin.data.data.user;

  const elenaLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'elena@serviceflow.local', password: 'Employee@12345' })
  });
  assert.strictEqual(elenaLogin.status, 200);
  elenaToken = elenaLogin.data.data.token;
  elenaUser = elenaLogin.data.data.user;
  console.log('  ✓ Standard organizational users authenticated (Admin, Agent, Employees)');

  // Test invalid credentials
  const badLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@serviceflow.local', password: 'WrongPassword' })
  });
  assert.strictEqual(badLogin.status, 401);
  console.log('  ✓ Invalid password rejected with 401 Unauthorized');

  // Test Register role-escalation prevention
  const testRegEmail = `test.emp.${Date.now()}@serviceflow.local`;
  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Reg Employee',
      email: testRegEmail,
      password: 'Password@123',
      department: 'Marketing',
      role: 'ADMIN' // Malicious role escalation attempt
    })
  });
  assert.strictEqual(regRes.status, 201);
  assert.strictEqual(regRes.data.data.user.role, 'EMPLOYEE', 'Role escalation must be forced to EMPLOYEE');
  console.log('  ✓ Role escalation prevented on registration (forced to EMPLOYEE)\n');

  // --- SUITE 3: Categories & Ticket CRUD ---
  console.log('[Suite 3: Incident Ticket Operations & Ownership Isolation]');
  const catRes = await apiRequest('/categories', {
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  assert.strictEqual(catRes.status, 200);
  assert.ok(catRes.data.data.length >= 7);
  console.log(`  ✓ Retrieved ${catRes.data.data.length} incident categories`);

  // Create Incident as Employee John
  const ticketCreate = await apiRequest('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({
      title: 'Regression Test: Core switch port flap',
      description: 'Core switch GigabitEthernet1/0/24 is flapping repeatedly during load tests.',
      category: 'Network',
      priority: 'CRITICAL',
      department: 'Engineering'
    })
  });
  assert.strictEqual(ticketCreate.status, 201);
  const createdTicket = ticketCreate.data.data;
  const tNum = createdTicket.ticketNumber;
  console.log(`  ✓ Incident created: ${tNum} (Priority: ${createdTicket.priority}, SLA: ${createdTicket.slaDeadline})`);

  // Ownership Isolation: Elena must receive 403 attempting to view John's unassigned ticket details or edit
  const forbiddenView = await apiRequest(`/tickets/${tNum}`, {
    headers: { Authorization: `Bearer ${elenaToken}` }
  });
  assert.strictEqual(forbiddenView.status, 403, 'Elena must not view John ticket');
  console.log('  ✓ Ownership isolation verified: Cross-employee ticket access returns 403 Forbidden\n');

  // --- SUITE 4: Finite State Machine Transitions ---
  console.log('[Suite 4: Ticket State Machine & Lifecycle Transitions]');
  
  // 1. Assign to Agent
  const assign = await apiRequest(`/tickets/${tNum}/assign`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ assignedTo: agentUser._id })
  });
  assert.strictEqual(assign.status, 200);
  assert.strictEqual(assign.data.data.status, 'ASSIGNED');
  console.log(`  ✓ OPEN -> ASSIGNED (Agent: ${agentUser.name})`);

  // 2. Start Work: ASSIGNED -> IN_PROGRESS
  const startWork = await apiRequest(`/tickets/${tNum}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ status: 'IN_PROGRESS', notes: 'Engaging network operations center' })
  });
  assert.strictEqual(startWork.status, 200);
  assert.strictEqual(startWork.data.data.status, 'IN_PROGRESS');
  console.log('  ✓ ASSIGNED -> IN_PROGRESS');

  // 3. Mark Pending: IN_PROGRESS -> PENDING
  const pending = await apiRequest(`/tickets/${tNum}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ status: 'PENDING', notes: 'Waiting for vendor SFP module diagnostic' })
  });
  assert.strictEqual(pending.status, 200);
  assert.strictEqual(pending.data.data.status, 'PENDING');
  console.log('  ✓ IN_PROGRESS -> PENDING');

  // 4. Resume: PENDING -> IN_PROGRESS
  const resume = await apiRequest(`/tickets/${tNum}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ status: 'IN_PROGRESS', notes: 'Vendor diagnostic completed' })
  });
  assert.strictEqual(resume.status, 200);
  assert.strictEqual(resume.data.data.status, 'IN_PROGRESS');
  console.log('  ✓ PENDING -> IN_PROGRESS');

  // 5. Post comment
  const comment = await apiRequest(`/tickets/${tNum}/comments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({ message: 'Verified that link stabilized after replacing SFP optics.' })
  });
  assert.strictEqual(comment.status, 201);
  console.log('  ✓ Discussion comment posted and appended');

  // 6. Resolve: IN_PROGRESS -> RESOLVED
  const resolve = await apiRequest(`/tickets/${tNum}/resolve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ notes: 'Replaced SFP transceiver module and cleaned optical patch interface.' })
  });
  assert.strictEqual(resolve.status, 200);
  assert.strictEqual(resolve.data.data.status, 'RESOLVED');
  assert.ok(resolve.data.data.resolution?.resolvedAt);
  console.log('  ✓ IN_PROGRESS -> RESOLVED');

  // 7. Reopen: RESOLVED -> IN_PROGRESS (by creator John)
  const reopen = await apiRequest(`/tickets/${tNum}/reopen`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({ reason: 'Port flapped one more time at 03:00 UTC.' })
  });
  assert.strictEqual(reopen.status, 200);
  assert.strictEqual(reopen.data.data.status, 'IN_PROGRESS');
  console.log('  ✓ RESOLVED -> IN_PROGRESS (Ticket Reopened successfully with reason)');

  // 8. Re-resolve ticket
  const reResolve = await apiRequest(`/tickets/${tNum}/resolve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ notes: 'Applied switch OS patch 17.6.4 and reseated switch fiber trunk.' })
  });
  assert.strictEqual(reResolve.status, 200);
  assert.strictEqual(reResolve.data.data.status, 'RESOLVED');
  console.log('  ✓ Re-resolved ticket');

  // 9. Close: RESOLVED -> CLOSED (by creator John)
  const close = await apiRequest(`/tickets/${tNum}/close`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({ reason: 'Port is running error-free for 24 hours. Confirmed closed.' })
  });
  assert.strictEqual(close.status, 200);
  assert.strictEqual(close.data.data.status, 'CLOSED');
  console.log('  ✓ RESOLVED -> CLOSED (Terminal state reached)');

  // 10. Attempt to reopen a CLOSED ticket -> should fail with 400 Bad Request
  const badReopen = await apiRequest(`/tickets/${tNum}/reopen`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({ reason: 'Trying to reopen closed ticket' })
  });
  assert.strictEqual(badReopen.status, 400);
  console.log('  ✓ Terminal state safeguard: Reopening a CLOSED ticket rejected with 400 Bad Request\n');

  // --- SUITE 5: SLA Telemetry & Breach Sync ---
  console.log('[Suite 5: SLA Telemetry & Compliance Reporting]');
  const slaCheck = await apiRequest(`/tickets/${tNum}/sla`, {
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  assert.strictEqual(slaCheck.status, 200);
  assert.ok(slaCheck.data.data.slaDeadline);
  console.log(`  ✓ Incident SLA telemetry verified (${slaCheck.data.data.summary})`);

  const slaReport = await apiRequest('/sla/report', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(slaReport.status, 200);
  assert.ok(slaReport.data.data.overall);
  console.log(`  ✓ SLA Performance Report retrieved (Compliance: ${slaReport.data.data.overall.complianceRate})`);

  const slaSync = await apiRequest('/sla/sync', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(slaSync.status, 200);
  console.log('  ✓ SLA breach synchronization executed\n');

  // --- SUITE 6: Audit Timeline Verification ---
  console.log('[Suite 6: Audit History & Narratives]');
  const auditTimeline = await apiRequest(`/tickets/${tNum}/audit-logs`, {
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  assert.strictEqual(auditTimeline.status, 200);
  assert.ok(auditTimeline.data.data.length >= 7, 'Should record all transitions in timeline');
  console.log(`  ✓ Verified ${auditTimeline.data.data.length} chronological audit events for ticket`);

  const systemAudit = await apiRequest('/audit-logs?page=1&limit=5', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(systemAudit.status, 200);
  assert.ok(systemAudit.data.data.length > 0);
  console.log(`  ✓ System-wide administrative audit stream queried (${systemAudit.data.meta.totalLogs} total events)\n`);

  // --- SUITE 7: Admin User Management & Safeguards ---
  console.log('[Suite 7: Admin User Governance & Lockout Protection]');
  
  // List users
  const userList = await apiRequest('/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(userList.status, 200);
  console.log(`  ✓ Admin user directory retrieved (${userList.data.data.length} users)`);

  // Attempt to demote sole admin
  const demoteSoleAdmin = await apiRequest(`/users/${adminUser._id}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ role: 'EMPLOYEE' })
  });
  assert.strictEqual(demoteSoleAdmin.status, 400);
  console.log('  ✓ Safeguard enforced: Demoting last active admin rejected with 400 Bad Request');

  // Attempt to deactivate sole admin
  const deactSoleAdmin = await apiRequest(`/users/${adminUser._id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ isActive: false })
  });
  assert.strictEqual(deactSoleAdmin.status, 400);
  console.log('  ✓ Safeguard enforced: Deactivating last active admin rejected with 400 Bad Request\n');

  console.log('========================================================================');
  console.log('🎉 ALL 7 REGRESSION SUITES PASSED WITH ZERO ERRORS OR WARNINGS!');
  console.log('========================================================================\n');
}

runRegressionSuite().catch((err) => {
  console.error('\n❌ FULL REGRESSION TEST FAILED:', err);
  process.exit(1);
});
