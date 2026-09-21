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

async function runTests() {
  console.log('🧪 Starting TaskFlow Comprehensive Verification Suite...');
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
    // 1. Health check
    const health = await request({ hostname: '127.0.0.1', port: 5001, path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.body.status === 'healthy', 'API Health Check returns 200 and healthy');

    // 2. User login
    const login = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'alex@taskflow.dev', password: 'password123' });

    assert(login.status === 200 && login.body.token, 'Login succeeds and returns JWT token');
    const token = login.body.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 3. User /me verification
    const me = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/me',
      method: 'GET',
      headers: authHeaders
    });
    assert(me.status === 200 && me.body.user.email === 'alex@taskflow.dev', 'Current user session verified via /api/auth/me');

    // 4. Fetch projects
    const projs = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/projects',
      method: 'GET',
      headers: authHeaders
    });
    assert(projs.status === 200 && Array.isArray(projs.body.projects) && projs.body.projects.length > 0, 'Fetched active projects list');
    const testProjectId = projs.body.projects[0].id;

    // 5. Fetch project tasks
    const tasks = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/projects/${testProjectId}/tasks`,
      method: 'GET',
      headers: authHeaders
    });
    assert(tasks.status === 200 && Array.isArray(tasks.body.tasks) && tasks.body.tasks.length > 0, 'Fetched project tasks for Kanban columns');

    // 6. Create a new task in Kanban column
    const newTask = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/projects/${testProjectId}/tasks`,
      method: 'POST',
      headers: authHeaders
    }, {
      title: 'Automated Test Verification Task',
      description: 'Verifying end-to-end task lifecycle and real-time syncing.',
      status: 'TODO',
      priority: 'Urgent'
    });
    assert(newTask.status === 201 && newTask.body.task.title === 'Automated Test Verification Task', 'Created new task in project');
    const createdTaskId = newTask.body.task.id;

    // 7. Move task from TODO to IN PROGRESS
    const moveTask = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${createdTaskId}`,
      method: 'PUT',
      headers: authHeaders
    }, { status: 'IN PROGRESS' });
    assert(moveTask.status === 200 && moveTask.body.task.status === 'IN PROGRESS', 'Moved task status from TODO -> IN PROGRESS');

    // 8. Add a comment to the task
    const comment = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${createdTaskId}/comments`,
      method: 'POST',
      headers: authHeaders
    }, { content: 'Automated test comment on task' });
    assert(comment.status === 201 && comment.body.comment.content === 'Automated test comment on task', 'Posted comment to task');

    // 9. Fetch task comments
    const getComments = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${createdTaskId}/comments`,
      method: 'GET',
      headers: authHeaders
    });
    assert(getComments.status === 200 && getComments.body.comments.length > 0, 'Fetched threaded comments for task');

    // 10. Fetch notifications
    const notifs = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/notifications',
      method: 'GET',
      headers: authHeaders
    });
    assert(notifs.status === 200 && Array.isArray(notifs.body.notifications), 'Fetched user notifications');

    // 11. Global search
    const search = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/search?q=Commerce',
      method: 'GET',
      headers: authHeaders
    });
    assert(search.status === 200 && search.body.results.projects.length > 0, 'Global search returns matching projects');

    // 12. Clean up test task
    const deleteTask = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${createdTaskId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteTask.status === 200 && deleteTask.body.success, 'Cleaned up / deleted test task');

    console.log(`\n🎉 Verification Complete: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
