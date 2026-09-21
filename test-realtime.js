const http = require('http');
const path = require('path');
const { io } = require(path.join(__dirname, 'client/node_modules/socket.io-client'));

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

async function runRealTimeTests() {
  console.log('⚡ Starting TaskFlow Multi-Window Real-Time Collaboration Test...');
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
    // 1. Authenticate User A (Alex Morgan - Project Owner)
    const loginA = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'alex@taskflow.dev', password: 'password123' });
    assert(loginA.status === 200 && loginA.body.token, 'Window A (Alex) authenticated successfully');
    const tokenA = loginA.body.token;
    const userA = loginA.body.user;

    // 2. Authenticate User B (Sarah Chen - Project Admin)
    const loginB = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'sarah@taskflow.dev', password: 'password123' });
    assert(loginB.status === 200 && loginB.body.token, 'Window B (Sarah) authenticated successfully');
    const tokenB = loginB.body.token;
    const userB = loginB.body.user;

    // 3. Get shared project ID
    const projsA = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/projects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const projectId = projsA.body.projects[0].id;
    console.log(`  ℹ️ Testing real-time synchronization on Project ID: ${projectId} ("${projsA.body.projects[0].name}")`);

    // 4. Connect Window A Socket
    const socketA = io('http://127.0.0.1:5001', {
      transports: ['websocket'],
      forceNew: true
    });
    await new Promise((resolve) => {
      socketA.on('connect', () => {
        socketA.emit('user:online', { id: userA.id, name: userA.name, email: userA.email });
        socketA.emit('join:project', projectId);
        resolve();
      });
    });
    assert(socketA.connected, 'Window A socket connected and joined project room');

    // 5. Connect Window B Socket
    const socketB = io('http://127.0.0.1:5001', {
      transports: ['websocket'],
      forceNew: true
    });
    await new Promise((resolve) => {
      socketB.on('connect', () => {
        socketB.emit('user:online', { id: userB.id, name: userB.name, email: userB.email });
        socketB.emit('join:project', projectId);
        resolve();
      });
    });
    assert(socketB.connected, 'Window B socket connected and joined project room');

    // Setup Event Tracking for Window B
    const receivedEventsB = [];
    socketB.on('task:created', (data) => {
      receivedEventsB.push({ type: 'task:created', data });
    });
    socketB.on('task:updated', (data) => {
      receivedEventsB.push({ type: 'task:updated', data });
    });
    socketB.on('comment:created', (data) => {
      receivedEventsB.push({ type: 'comment:created', data });
    });
    socketB.on('task:deleted', (data) => {
      receivedEventsB.push({ type: 'task:deleted', data });
    });

    // Helper to wait for an event in Window B
    function waitForEvent(eventType, timeoutMs = 4000) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          const found = receivedEventsB.find(e => e.type === eventType);
          if (found) {
            clearInterval(checkInterval);
            resolve(found.data);
          }
        }, 50);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error(`Timed out waiting for socket event "${eventType}" in Window B`));
        }, timeoutMs);
      });
    }

    // 6. Window A creates a task via REST API -> Window B should receive 'task:created'
    const createWait = waitForEvent('task:created');
    const createdTaskRes = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/projects/${projectId}/tasks`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      }
    }, {
      title: 'Real-Time Sync Verification Card',
      description: 'Testing live card movement across multiple browser windows without page refresh.',
      status: 'TODO',
      priority: 'Urgent'
    });

    assert(createdTaskRes.status === 201, 'Window A successfully created task via API');
    const newTaskId = createdTaskRes.body.task.id;

    const taskCreatedEvent = await createWait;
    assert(
      taskCreatedEvent && taskCreatedEvent.id === newTaskId && taskCreatedEvent.title === 'Real-Time Sync Verification Card',
      'Window B received "task:created" event immediately via WebSocket'
    );

    // 7. Window A moves task from TODO -> IN PROGRESS -> Window B should receive 'task:updated'
    // Clear previously matched events
    receivedEventsB.length = 0;
    const moveWait = waitForEvent('task:updated');
    const moveRes = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${newTaskId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'IN PROGRESS' });

    assert(moveRes.status === 200, 'Window A moved task to IN PROGRESS');
    const taskUpdatedEvent = await moveWait;
    assert(
      taskUpdatedEvent && taskUpdatedEvent.id === newTaskId && taskUpdatedEvent.status === 'IN PROGRESS',
      'Window B instantly received "task:updated" (status: IN PROGRESS) - Live Kanban movement verified!'
    );

    // 8. Window A posts a comment -> Window B should receive 'comment:created'
    receivedEventsB.length = 0;
    const commentWait = waitForEvent('comment:created');
    const commentRes = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${newTaskId}/comments`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenA}`,
        'Content-Type': 'application/json'
      }
    }, { content: 'Testing real-time live comment thread updates across windows.' });

    assert(commentRes.status === 201, 'Window A posted comment to task');
    const commentCreatedEvent = await commentWait;
    assert(
      commentCreatedEvent && commentCreatedEvent.taskId === newTaskId && commentCreatedEvent.comment.content.includes('Testing real-time live comment'),
      'Window B received "comment:created" event in real time'
    );

    // 9. Window A deletes the task -> Window B should receive 'task:deleted'
    receivedEventsB.length = 0;
    const deleteWait = waitForEvent('task:deleted');
    const deleteRes = await request({
      hostname: '127.0.0.1',
      port: 5001,
      path: `/api/tasks/${newTaskId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${tokenA}`
      }
    });

    assert(deleteRes.status === 200, 'Window A deleted the test task');
    const taskDeletedEvent = await deleteWait;
    assert(
      taskDeletedEvent && taskDeletedEvent.taskId === newTaskId,
      'Window B received "task:deleted" event in real time - Card removed from board!'
    );

    // Close sockets
    socketA.disconnect();
    socketB.disconnect();

    console.log(`\n🎉 Real-Time Verification Complete: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal real-time test error:', err);
    process.exit(1);
  }
}

runRealTimeTests();
