import assert from 'node:assert';

const API_BASE = 'http://localhost:5000/api';
const CLIENT_BASE = 'http://localhost:5173';

async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${data.message}`);
  return { token: data.data.token, user: data.data.user };
}

async function runTests() {
  console.log('--- Starting Phase 14: Frontend & End-to-End Workflow Verification ---');

  // 1. Verify Vite Dev Server is responding
  const clientRes = await fetch(CLIENT_BASE);
  assert.strictEqual(clientRes.status, 200, 'Client dev server should be reachable on port 5173');
  const clientHtml = await clientRes.text();
  assert.ok(clientHtml.includes('ServiceFlow') || clientHtml.includes('root'), 'Client HTML should render properly');
  console.log('✓ Vite Frontend dev server responsive at http://localhost:5173');

  // 2. Authenticate users
  const admin = await login('admin@serviceflow.local', 'Admin@12345');
  const agent = await login('agent@serviceflow.local', 'Agent@12345');
  const employee = await login('employee@serviceflow.local', 'Employee@12345');
  console.log('✓ All 3 role actors authenticated');

  // 3. Verify Frontend API Data Fetching contract:
  // Categories
  const catRes = await fetch(`${API_BASE}/categories`, {
    headers: { Authorization: `Bearer ${employee.token}` }
  });
  const catData = await catRes.json();
  assert.strictEqual(catRes.status, 200);
  assert.ok(catData.data.length > 0, 'Categories must be available for ticket creation form');
  console.log(`✓ Categories loaded for TicketCreatePage (${catData.data.length} categories)`);

  // Dashboards by role
  const empDash = await (await fetch(`${API_BASE}/dashboard`, { headers: { Authorization: `Bearer ${employee.token}` } })).json();
  assert.strictEqual(empDash.success, true);
  assert.ok(empDash.data.metrics, 'Employee dashboard metrics loaded');

  const agentDash = await (await fetch(`${API_BASE}/dashboard/agent`, { headers: { Authorization: `Bearer ${agent.token}` } })).json();
  assert.strictEqual(agentDash.success, true);
  assert.ok(agentDash.data.metrics, 'Agent dashboard metrics loaded');

  const adminDash = await (await fetch(`${API_BASE}/dashboard/admin`, { headers: { Authorization: `Bearer ${admin.token}` } })).json();
  assert.strictEqual(adminDash.success, true);
  assert.ok(adminDash.data.categoryDistribution, 'Admin dashboard category breakdown loaded');
  console.log('✓ Role-specific dashboards verified for Employee, Agent, and Admin');

  // 4. End-to-End Incident Lifecycle via Frontend Endpoints
  console.log('\n--- Testing Full End-to-End Incident Lifecycle ---');

  // Step A: Employee creates an incident
  const createRes = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${employee.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Monitors flickering after desk relocation',
      description: 'Dual monitors disconnect intermittently when dock cable is moved.',
      category: 'Hardware',
      priority: 'HIGH',
      department: 'Engineering'
    })
  });
  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  const ticketNumber = createData.data.ticketNumber;
  console.log(`✓ Step A: Employee created incident ${ticketNumber} (Status: OPEN, Priority: HIGH)`);

  // Step B: Support Agent views the incident and assigns it to herself
  const assignRes = await fetch(`${API_BASE}/tickets/${ticketNumber}/assign`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ assignedTo: agent.user._id })
  });
  const assignData = await assignRes.json();
  assert.strictEqual(assignRes.status, 200);
  assert.strictEqual(assignData.data.status, 'ASSIGNED');
  console.log(`✓ Step B: Agent self-assigned ticket ${ticketNumber} (Status: ASSIGNED)`);

  // Step C: Support Agent moves ticket to IN_PROGRESS and adds a comment
  const progressRes = await fetch(`${API_BASE}/tickets/${ticketNumber}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'IN_PROGRESS', notes: 'Testing replacement Thunderbolt cable' })
  });
  const progressData = await progressRes.json();
  assert.strictEqual(progressRes.status, 200);
  assert.strictEqual(progressData.data.status, 'IN_PROGRESS');

  const commentRes = await fetch(`${API_BASE}/tickets/${ticketNumber}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: 'I have dispatched a technician with a replacement 40Gbps Thunderbolt cable.' })
  });
  const commentData = await commentRes.json();
  assert.strictEqual(commentRes.status, 201);
  console.log(`✓ Step C: Agent transitioned to IN_PROGRESS and posted comment`);

  // Step D: Support Agent resolves the incident
  const resolveRes = await fetch(`${API_BASE}/tickets/${ticketNumber}/resolve`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${agent.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notes: 'Replaced faulty cable and upgraded docking station firmware. Verified dual 4K output.' })
  });
  const resolveData = await resolveRes.json();
  assert.strictEqual(resolveRes.status, 200);
  assert.strictEqual(resolveData.data.status, 'RESOLVED');
  assert.ok(resolveData.data.resolution?.notes);
  console.log(`✓ Step D: Agent resolved ticket ${ticketNumber} with resolution summary`);

  // Step E: Employee accepts resolution and closes ticket
  const closeRes = await fetch(`${API_BASE}/tickets/${ticketNumber}/close`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${employee.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Flickering resolved completely. Thank you!' })
  });
  const closeData = await closeRes.json();
  assert.strictEqual(closeRes.status, 200);
  assert.strictEqual(closeData.data.status, 'CLOSED');
  console.log(`✓ Step E: Employee confirmed resolution and closed ticket ${ticketNumber}`);

  // Step F: Verify SLA Telemetry and Audit Timeline
  const slaRes = await fetch(`${API_BASE}/tickets/${ticketNumber}/sla`, {
    headers: { Authorization: `Bearer ${employee.token}` }
  });
  const slaResult = await slaRes.json();
  assert.strictEqual(slaRes.status, 200);
  assert.strictEqual(slaResult.data.clockStopped, true);
  console.log(`✓ Step F1: SLA Clock stopped upon closure (${slaResult.data.summary})`);

  const auditRes = await fetch(`${API_BASE}/tickets/${ticketNumber}/audit-logs`, {
    headers: { Authorization: `Bearer ${employee.token}` }
  });
  const auditResult = await auditRes.json();
  assert.strictEqual(auditRes.status, 200);
  assert.ok(auditResult.data.length >= 5, 'Should have recorded at least 5 audit lifecycle events');
  console.log(`✓ Step F2: Chronological audit timeline contains ${auditResult.data.length} events`);

  console.log('\n=====================================================================');
  console.log('🎉 PHASE 14: FRONTEND & END-TO-END WORKFLOW INTEGRATION PASSED!');
  console.log('=====================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Phase 14 Test Failed:', err);
  process.exit(1);
});
