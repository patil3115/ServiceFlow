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
  return { token: data.data.token, user: data.data.user };
}

async function runTests() {
  console.log('--- Starting Phase 13: Admin User Management Verification ---');

  // 1. Authenticate users across roles
  const { token: adminToken, user: adminUser } = await login('admin@serviceflow.local', 'Admin@12345');
  const { token: agentToken } = await login('agent@serviceflow.local', 'Agent@12345');
  const { token: employeeToken } = await login('employee@serviceflow.local', 'Employee@12345');
  console.log('✓ Users authenticated across all roles');

  // 2. Test Access Control Guards
  // Non-admin roles must be blocked with 403 Forbidden
  const empAccessRes = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${employeeToken}` }
  });
  assert.strictEqual(empAccessRes.status, 403, 'Employee cannot access user management');

  const agentAccessRes = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${agentToken}` }
  });
  assert.strictEqual(agentAccessRes.status, 403, 'Support Agent cannot access user management');
  console.log('✓ Access control verified: Non-admin requests receive 403 Forbidden');

  // 3. Admin User Listing & Filtering
  const adminListRes = await fetch(`${BASE_URL}/users?page=1&limit=10`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminListData = await adminListRes.json();
  assert.strictEqual(adminListRes.status, 200, 'Admin can list users');
  assert.strictEqual(adminListData.success, true);
  assert.ok(adminListData.data.length >= 4, 'Should list seeded users');
  assert.ok(adminListData.meta, 'Pagination meta should be present');
  console.log(`✓ Admin listed ${adminListData.data.length} users (Total: ${adminListData.meta.totalUsers})`);

  // Search by keyword
  const searchRes = await fetch(`${BASE_URL}/users?search=elena`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const searchData = await searchRes.json();
  assert.strictEqual(searchRes.status, 200);
  assert.strictEqual(searchData.data.length, 1);
  assert.strictEqual(searchData.data[0].email, 'elena@serviceflow.local');
  const targetUserId = searchData.data[0]._id;
  console.log('✓ Search by query "elena" resolved successfully');

  // Filter by role
  const agentFilterRes = await fetch(`${BASE_URL}/users?role=SUPPORT_AGENT`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const agentFilterData = await agentFilterRes.json();
  assert.strictEqual(agentFilterRes.status, 200);
  assert.ok(agentFilterData.data.every(u => u.role === 'SUPPORT_AGENT'));
  console.log('✓ Filter by role=SUPPORT_AGENT verified');

  // 4. Single User Retrieval with Activity Telemetry
  const userDetailRes = await fetch(`${BASE_URL}/users/${targetUserId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const userDetailData = await userDetailRes.json();
  assert.strictEqual(userDetailRes.status, 200);
  assert.ok(userDetailData.data.user, 'User object should be returned');
  assert.ok(userDetailData.data.activity, 'Activity telemetry should be returned');
  assert.ok(typeof userDetailData.data.activity.ticketsCreatedCount === 'number');
  console.log('✓ GET /api/users/:id returned user telemetry:', {
    name: userDetailData.data.user.name,
    ticketsCreatedCount: userDetailData.data.activity.ticketsCreatedCount
  });

  // 5. Test Role Update (Promotion & Demotion)
  // Promote Elena to SUPPORT_AGENT
  const promoteRes = await fetch(`${BASE_URL}/users/${targetUserId}/role`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'SUPPORT_AGENT' })
  });
  const promoteData = await promoteRes.json();
  assert.strictEqual(promoteRes.status, 200);
  assert.strictEqual(promoteData.data.role, 'SUPPORT_AGENT');
  console.log('✓ Elena promoted to SUPPORT_AGENT successfully');

  // Demote Elena back to EMPLOYEE
  const demoteRes = await fetch(`${BASE_URL}/users/${targetUserId}/role`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'EMPLOYEE' })
  });
  const demoteData = await demoteRes.json();
  assert.strictEqual(demoteRes.status, 200);
  assert.strictEqual(demoteData.data.role, 'EMPLOYEE');
  console.log('✓ Elena reverted to EMPLOYEE successfully');

  // 6. Test Status Activation / Deactivation
  // Deactivate Elena
  const deactivateRes = await fetch(`${BASE_URL}/users/${targetUserId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isActive: false })
  });
  const deactivateData = await deactivateRes.json();
  assert.strictEqual(deactivateRes.status, 200);
  assert.strictEqual(deactivateData.data.isActive, false);
  console.log('✓ Elena deactivated (isActive: false)');

  // Reactivate Elena
  const reactivateRes = await fetch(`${BASE_URL}/users/${targetUserId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isActive: true })
  });
  const reactivateData = await reactivateRes.json();
  assert.strictEqual(reactivateRes.status, 200);
  assert.strictEqual(reactivateData.data.isActive, true);
  console.log('✓ Elena reactivated (isActive: true)');

  // 7. Verify Critical Safeguards: Last Administrator Protection
  // Attempting to demote sole admin Alex Vance
  const demoteAdminRes = await fetch(`${BASE_URL}/users/${adminUser._id}/role`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'EMPLOYEE' })
  });
  const demoteAdminData = await demoteAdminRes.json();
  assert.strictEqual(demoteAdminRes.status, 400, 'Must not allow demoting last active administrator');
  assert.strictEqual(demoteAdminData.success, false);
  console.log('✓ Last admin demotion safeguard verified (400 Bad Request):', demoteAdminData.message);

  // Attempting to deactivate sole admin Alex Vance
  const deactivateAdminRes = await fetch(`${BASE_URL}/users/${adminUser._id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ isActive: false })
  });
  const deactivateAdminData = await deactivateAdminRes.json();
  assert.strictEqual(deactivateAdminRes.status, 400, 'Must not allow deactivating last active administrator');
  assert.strictEqual(deactivateAdminData.success, false);
  console.log('✓ Last admin deactivation safeguard verified (400 Bad Request):', deactivateAdminData.message);

  // 8. Verify Audit Logs recorded user modifications
  const auditRes = await fetch(`${BASE_URL}/audit-logs?action=USER_ROLE_CHANGED`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const auditData = await auditRes.json();
  assert.strictEqual(auditRes.status, 200);
  assert.ok(auditData.data.length >= 2, 'Should have at least 2 USER_ROLE_CHANGED logs');
  console.log('✓ USER_ROLE_CHANGED verified in AuditLog narrative:', auditData.data[0].narrative);

  const statusAuditRes = await fetch(`${BASE_URL}/audit-logs?action=USER_STATUS_CHANGED`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const statusAuditData = await statusAuditRes.json();
  assert.strictEqual(statusAuditRes.status, 200);
  assert.ok(statusAuditData.data.length >= 2, 'Should have at least 2 USER_STATUS_CHANGED logs');
  console.log('✓ USER_STATUS_CHANGED verified in AuditLog narrative:', statusAuditData.data[0].narrative);

  console.log('\n======================================================');
  console.log('🎉 PHASE 13: ALL ADMIN USER MANAGEMENT TESTS PASSED!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Phase 13 Test Failed:', err);
  process.exit(1);
});
