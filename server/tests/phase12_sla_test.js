import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${data.message}`);
  return data.data.token;
}

async function runTests() {
  console.log('--- Starting Phase 12: SLA Management Verification ---');

  // 1. Log in users
  const adminToken = await login('admin@serviceflow.local', 'Admin@12345');
  const agentToken = await login('agent@serviceflow.local', 'Agent@12345');
  const employeeToken = await login('employee@serviceflow.local', 'Employee@12345');
  const elenaToken = await login('elena@serviceflow.local', 'Employee@12345');
  console.log('✓ Users authenticated');

  // 2. Fetch an existing ticket (e.g. INC-1001) as Admin
  const ticketRes = await fetch(`${BASE_URL}/tickets/INC-1001/sla`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const ticketSla = await ticketRes.json();
  assert.strictEqual(ticketRes.status, 200, 'Admin should be able to get ticket SLA');
  assert.strictEqual(ticketSla.success, true);
  assert.ok(ticketSla.data.ticketNumber, 'ticketNumber should be present');
  assert.ok(ticketSla.data.slaDeadline, 'slaDeadline should be present');
  console.log('✓ GET /api/tickets/INC-1001/sla (Admin):', {
    ticketNumber: ticketSla.data.ticketNumber,
    priority: ticketSla.data.priority,
    status: ticketSla.data.status,
    urgencyLevel: ticketSla.data.urgencyLevel,
    isBreached: ticketSla.data.isBreached,
    summary: ticketSla.data.summary
  });

  // 3. Verify Employee access control on ticket SLA
  // Find a ticket created by Elena vs Employee
  const employeeTicketsRes = await fetch(`${BASE_URL}/tickets`, {
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  const empTicketsData = await employeeTicketsRes.json();
  assert.ok(empTicketsData.data.length > 0, 'Employee should have tickets');
  const empTicketNumber = empTicketsData.data[0].ticketNumber;

  // Employee accessing their own ticket SLA -> 200
  const ownSlaRes = await fetch(`${BASE_URL}/tickets/${empTicketNumber}/sla`, {
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  assert.strictEqual(ownSlaRes.status, 200, 'Employee can view SLA for their own ticket');
  console.log(`✓ GET /api/tickets/${empTicketNumber}/sla (Own Ticket) -> 200`);

  // Elena accessing Employee's ticket SLA -> 403
  const forbiddenSlaRes = await fetch(`${BASE_URL}/tickets/${empTicketNumber}/sla`, {
    headers: { Authorization: `Bearer ${elenaToken}` }
  });
  assert.strictEqual(forbiddenSlaRes.status, 403, 'Elena must not view Employee ticket SLA');
  console.log('✓ Employee cross-ticket SLA isolation verified (403 Forbidden)');

  // 4. Test SLA Compliance Report
  // Employee accessing report -> 403 Forbidden
  const empReportRes = await fetch(`${BASE_URL}/sla/report`, {
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  assert.strictEqual(empReportRes.status, 403, 'Employee cannot view SLA report');
  console.log('✓ GET /api/sla/report forbidden for Employee (403)');

  // Agent accessing report -> 200
  const agentReportRes = await fetch(`${BASE_URL}/sla/report`, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  const agentReportData = await agentReportRes.json();
  assert.strictEqual(agentReportRes.status, 200, 'Agent can view SLA report');
  assert.ok(agentReportData.data.overall, 'Overall stats should be returned');
  console.log('✓ GET /api/sla/report (Agent): Compliance rate:', agentReportData.data.overall.complianceRate);

  // Admin accessing report -> 200
  const adminReportRes = await fetch(`${BASE_URL}/sla/report`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminReportData = await adminReportRes.json();
  assert.strictEqual(adminReportRes.status, 200);
  assert.ok(adminReportData.data.priorityBreakdown, 'priorityBreakdown metrics present');
  console.log('✓ GET /api/sla/report (Admin) breakdown:', {
    totalTickets: adminReportData.data.overall.totalTickets,
    totalBreached: adminReportData.data.overall.totalBreached,
    complianceRate: adminReportData.data.overall.complianceRate
  });

  // 5. Test SLA Sync
  // Employee attempting sync -> 403
  const empSyncRes = await fetch(`${BASE_URL}/sla/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  assert.strictEqual(empSyncRes.status, 403, 'Employee cannot trigger SLA sync');
  console.log('✓ POST /api/sla/sync forbidden for Employee (403)');

  // Admin triggering sync -> 200
  const adminSyncRes = await fetch(`${BASE_URL}/sla/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminSyncData = await adminSyncRes.json();
  assert.strictEqual(adminSyncRes.status, 200, 'Admin can trigger SLA sync');
  assert.strictEqual(adminSyncData.success, true);
  console.log('✓ POST /api/sla/sync (Admin):', adminSyncData.data);

  console.log('\n===========================================');
  console.log('🎉 PHASE 12: ALL SLA MANAGEMENT TESTS PASSED!');
  console.log('===========================================\n');
}

runTests().catch(err => {
  console.error('❌ Phase 12 Test Failed:', err);
  process.exit(1);
});
