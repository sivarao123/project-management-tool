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

async function runAITests() {
  console.log('🤖 Starting TaskFlow Agentic AI Comprehensive Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate
    const login = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'alex@taskflow.dev', password: 'password123' });
    assert(login.status === 200 && login.body.token, 'Authenticated as Alex Morgan (Project Owner)');
    const token = login.body.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Fetch projects
    const projs = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/projects',
      headers: authHeaders
    });
    const projectId = projs.body.projects[0].id;
    console.log(`  ℹ️ Targeting Project ID: ${projectId} ("${projs.body.projects[0].name}")`);

    // 3. Test Agent Chat - Feature Decomposition
    const agentDecompose = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/agent',
      method: 'POST',
      headers: authHeaders
    }, {
      prompt: 'Break down payment checkout flow into sprint user stories',
      projectId
    });
    assert(agentDecompose.status === 200, 'Agent Chat endpoint returns 200 OK');
    assert(Array.isArray(agentDecompose.body.thoughts) && agentDecompose.body.thoughts.length >= 3, 'Agent generated multi-step reasoning trace');
    assert(Array.isArray(agentDecompose.body.actions) && agentDecompose.body.actions.length >= 3, 'Agent synthesized actionable sprint tasks with acceptance criteria');
    assert(agentDecompose.body.response.includes('Sprint Breakdown'), 'Agent generated structured executive summary');

    // 4. Test Agent Chat - Workload Balancing
    const agentWorkload = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/agent',
      method: 'POST',
      headers: authHeaders
    }, {
      prompt: 'Analyze team workload and balance tasks',
      projectId
    });
    assert(agentWorkload.status === 200 && agentWorkload.body.response.includes('Workload'), 'Agent evaluated team bandwidth and active tasks');

    // 5. Test Dedicated Feature Breakdown Endpoint
    const breakdown = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/breakdown',
      method: 'POST',
      headers: authHeaders
    }, {
      prompt: 'Apple Pay & Google Pay One-Click Checkout',
      projectId
    });
    assert(breakdown.status === 200 && breakdown.body.actions.length === 4, 'Dedicated Breakdown endpoint generated 4 user stories');

    // 6. Test Task Specification & Subtask Enhancer
    const enhance = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/enhance-task',
      method: 'POST',
      headers: authHeaders
    }, {
      title: 'Biometric FaceID Login',
      description: 'Support FaceID on iOS'
    });
    assert(enhance.status === 200, 'Task Enhancer returned 200 OK');
    assert(enhance.body.enhancedDescription.includes('Acceptance Criteria'), 'Task Enhancer generated structured acceptance criteria');
    assert(Array.isArray(enhance.body.suggestedSubtasks) && enhance.body.suggestedSubtasks.length === 4, 'Task Enhancer generated subtask checklist');

    // 7. Test Sprint Health & Standup
    const standup = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/standup',
      method: 'POST',
      headers: authHeaders
    }, { projectId });
    assert(standup.status === 200 && standup.body.summary.includes('Sprint Intelligence Briefing'), 'Standup endpoint generated sprint intelligence briefing');

    // 8. Test Action Execution (PostgreSQL insertion)
    const execAction = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/ai/execute-actions',
      method: 'POST',
      headers: authHeaders
    }, {
      projectId,
      actions: [
        {
          type: 'create_task',
          title: 'Automated Agent Action Verification Card',
          description: 'Verified by test-ai-agent suite',
          status: 'TODO',
          priority: 'High'
        }
      ]
    });
    assert(execAction.status === 200 && execAction.body.executedCount === 1, 'Executed AI action into PostgreSQL database');
    const createdTaskId = execAction.body.results[0].taskId;

    // 9. Clean up created task
    const cleanup = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${createdTaskId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    assert(cleanup.status === 200, 'Cleaned up verification task from database');

    console.log(`\n🎉 Agentic AI Verification Complete: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal AI test error:', err);
    process.exit(1);
  }
}

runAITests();
