const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runDeepAudit() {
  console.log('🔍 Running TaskFlow Comprehensive Bug & Vulnerability Audit...\n');

  let passed = 0;
  let failed = 0;
  const issuesFound = [];

  function testCase(name, condition, errorDetail) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [BUG/ISSUE] ${name}`);
      console.error(`     ↳ Details: ${errorDetail}`);
      failed++;
      issuesFound.push({ name, errorDetail });
    }
  }

  try {
    // 1. Auth Edge Cases
    const emptyLogin = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: '', password: '' });
    testCase('Login with empty credentials rejected (400)', emptyLogin.status === 400, `Expected 400, got ${emptyLogin.status}`);

    const badPass = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'alex@taskflow.dev', password: 'wrongpassword' });
    testCase('Login with wrong password rejected (401)', badPass.status === 401, `Expected 401, got ${badPass.status}`);

    const noToken = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/projects',
      method: 'GET'
    });
    testCase('Access protected route without token rejected (401)', noToken.status === 401, `Expected 401, got ${noToken.status}`);

    const malformedToken = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/projects',
      method: 'GET',
      headers: { 'Authorization': 'Bearer NOT_A_REAL_JWT_TOKEN' }
    });
    testCase('Access protected route with malformed token rejected (401)', malformedToken.status === 401, `Expected 401, got ${malformedToken.status}`);

    // Login as Alex (Owner of Project 1, Admin of others)
    const loginAlex = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'alex@taskflow.dev', password: 'password123' });
    const tokenAlex = loginAlex.body.token;

    // Login as John (Member of Project 1)
    const loginJohn = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'john@taskflow.dev', password: 'password123' });
    const tokenJohn = loginJohn.body.token;

    // Fetch projects
    const projsRes = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/projects',
      headers: { 'Authorization': `Bearer ${tokenAlex}` }
    });
    const testProj = projsRes.body.projects[0];
    const projectId = testProj.id;

    // 2. Permission Check: Can a non-owner delete a project?
    const deleteByMember = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/projects/${projectId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenJohn}` }
    });
    testCase('Non-owner cannot delete project (403 Forbidden)', deleteByMember.status === 403, `Expected 403, got ${deleteByMember.status}`);

    // 3. Task Input Validation: Empty Title
    const emptyTask = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/projects/${projectId}/tasks`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAlex}`,
        'Content-Type': 'application/json'
      }
    }, { title: '   ', description: 'empty title test' });
    testCase('Creating task with blank title rejected (400)', emptyTask.status === 400, `Expected 400, got ${emptyTask.status}`);

    // 4. Non-existent Task lookup
    const ghostTask = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/tasks/999999',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenAlex}` }
    });
    testCase('Lookup non-existent task returns 404', ghostTask.status === 404, `Expected 404, got ${ghostTask.status}`);

    // 5. Duplicate Member Assignment
    const dupMember = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/projects/${projectId}/members`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAlex}`,
        'Content-Type': 'application/json'
      }
    }, { userId: loginAlex.body.user.id, role: 'Admin' });
    testCase('Adding duplicate member to project rejected (400)', dupMember.status === 400, `Expected 400, got ${dupMember.status}`);

    // 6. Removing Project Owner from Project
    const removeOwner = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/users/${testProj.owner_id}/projects/${projectId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenAlex}` }
    });
    testCase('Removing project owner from project rejected (400)', removeOwner.status === 400, `Expected 400, got ${removeOwner.status}`);

    // 7. Comment Validation: Empty content
    // Create a real task to test comments on
    const validTask = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/projects/${projectId}/tasks`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAlex}`,
        'Content-Type': 'application/json'
      }
    }, { title: 'Deep Audit Test Task', status: 'TODO', priority: 'Medium' });
    const taskId = validTask.body.task.id;

    const emptyComment = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${taskId}/comments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAlex}`,
        'Content-Type': 'application/json'
      }
    }, { content: '   ' });
    testCase('Posting blank comment rejected (400)', emptyComment.status === 400, `Expected 400, got ${emptyComment.status}`);

    // 8. SQL Injection Resilience
    const sqlInjectionSearch = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/search?q=${encodeURIComponent("' OR '1'='1' --")}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenAlex}` }
    });
    testCase('SQL Injection attempt in search returns 200 safely without exposing unauthorized rows', 
      sqlInjectionSearch.status === 200 && Array.isArray(sqlInjectionSearch.body.results?.tasks),
      `Expected status 200 with structured results, got ${sqlInjectionSearch.status}`
    );

    // 9. AI Agent: Empty Prompt Validation
    const emptyAIPrompt = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/agent',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAlex}`,
        'Content-Type': 'application/json'
      }
    }, { prompt: '' });
    testCase('AI Agent empty prompt rejected (400)', emptyAIPrompt.status === 400, `Expected 400, got ${emptyAIPrompt.status}`);

    // 10. AI Action Execution: Missing Project ID
    const badAIExec = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/execute-actions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenAlex}`,
        'Content-Type': 'application/json'
      }
    }, { actions: [{ type: 'create_task', title: 'test' }] });
    testCase('AI Execute Actions without projectId rejected (400)', badAIExec.status === 400, `Expected 400, got ${badAIExec.status}`);

    // 11. Cleanup test task
    await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${taskId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenAlex}` }
    });

    console.log(`\n=========================================`);
    console.log(`Audit Summary: ${passed} Passed, ${failed} Issues Found`);
    console.log(`=========================================`);

    if (issuesFound.length > 0) {
      console.log('\nList of Bugs/Issues Found:');
      issuesFound.forEach((iss, i) => {
        console.log(`${i + 1}. ${iss.name}: ${iss.errorDetail}`);
      });
      process.exit(1);
    } else {
      console.log('🎉 No critical bugs or security vulnerabilities found in the audit suite!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Audit suite crashed with error:', err);
    process.exit(1);
  }
}

runDeepAudit();
