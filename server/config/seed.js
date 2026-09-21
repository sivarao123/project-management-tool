const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('Seeding TaskFlow database...');

  // 1. Clear existing data
  try {
    await db.query('DELETE FROM activity_logs');
    await db.query('DELETE FROM notifications');
    await db.query('DELETE FROM attachments');
    await db.query('DELETE FROM comments');
    await db.query('DELETE FROM task_labels');
    await db.query('DELETE FROM labels');
    await db.query('DELETE FROM tasks');
    await db.query('DELETE FROM project_members');
    await db.query('DELETE FROM projects');
    await db.query('DELETE FROM users');
  } catch (err) {
    console.warn('Error clearing tables:', err.message);
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Insert Users
  const u1 = await db.query(
    `INSERT INTO users (name, email, password_hash, avatar_url, role, bio)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      'Alex Morgan',
      'alex@taskflow.dev',
      passwordHash,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'Owner',
      'Lead Product Manager & System Architect at TaskFlow.'
    ]
  );
  const alexId = u1.rows[0].id;

  const u2 = await db.query(
    `INSERT INTO users (name, email, password_hash, avatar_url, role, bio)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      'Sarah Chen',
      'sarah@taskflow.dev',
      passwordHash,
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      'Admin',
      'Senior UI/UX Designer passionate about crafting delightful experiences.'
    ]
  );
  const sarahId = u2.rows[0].id;

  const u3 = await db.query(
    `INSERT INTO users (name, email, password_hash, avatar_url, role, bio)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      'John Doe',
      'john@taskflow.dev',
      passwordHash,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'Member',
      'Senior Full Stack Engineer specializing in Node.js, React, and databases.'
    ]
  );
  const johnId = u3.rows[0].id;

  console.log(`Created users: Alex (${alexId}), Sarah (${sarahId}), John (${johnId})`);

  // 3. Insert Projects
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const p1 = await db.query(
    `INSERT INTO projects (name, description, color, priority, start_date, due_date, status, is_archived, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      'E-Commerce Platform Redesign',
      'Next-generation digital commerce platform featuring modern headless architecture, lightning fast checkout, and real-time inventory management.',
      '#6366F1',
      'Urgent',
      today.toISOString().split('T')[0],
      nextMonth.toISOString().split('T')[0],
      'Active',
      0,
      alexId
    ]
  );
  const p1Id = p1.rows[0].id;

  const p2 = await db.query(
    `INSERT INTO projects (name, description, color, priority, start_date, due_date, status, is_archived, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      'Mobile App v2.0',
      'Revamp iOS and Android cross-platform mobile experience with offline-first caching and instant push notifications.',
      '#0EA5E9',
      'High',
      today.toISOString().split('T')[0],
      nextWeek.toISOString().split('T')[0],
      'Active',
      0,
      sarahId
    ]
  );
  const p2Id = p2.rows[0].id;

  // 4. Project Members
  // Project 1 members
  await db.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, [p1Id, alexId, 'Owner']);
  await db.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, [p1Id, sarahId, 'Admin']);
  await db.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, [p1Id, johnId, 'Member']);

  // Project 2 members
  await db.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, [p2Id, sarahId, 'Owner']);
  await db.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, [p2Id, alexId, 'Admin']);
  await db.query(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`, [p2Id, johnId, 'Member']);

  // 5. Labels for Project 1
  const lFrontend = (await db.query(`INSERT INTO labels (project_id, name, color) VALUES ($1, $2, $3) RETURNING id`, [p1Id, 'Frontend', '#3B82F6'])).rows[0].id;
  const lBackend = (await db.query(`INSERT INTO labels (project_id, name, color) VALUES ($1, $2, $3) RETURNING id`, [p1Id, 'Backend', '#10B981'])).rows[0].id;
  const lUIUX = (await db.query(`INSERT INTO labels (project_id, name, color) VALUES ($1, $2, $3) RETURNING id`, [p1Id, 'UI/UX', '#EC4899'])).rows[0].id;
  const lDevOps = (await db.query(`INSERT INTO labels (project_id, name, color) VALUES ($1, $2, $3) RETURNING id`, [p1Id, 'DevOps', '#8B5CF6'])).rows[0].id;
  const lUrgent = (await db.query(`INSERT INTO labels (project_id, name, color) VALUES ($1, $2, $3) RETURNING id`, [p1Id, 'Priority 1', '#EF4444'])).rows[0].id;

  // 6. Tasks for Project 1 across all 5 Columns: BACKLOG, TODO, IN PROGRESS, IN REVIEW, DONE
  // Helper date function
  const dayOffset = (days) => {
    const d = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  // Backlog
  const t1 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'Setup Redis caching for product catalog API',
      'Optimize query throughput for top 1000 SKU items by implementing an in-memory Redis cluster with cache invalidation on stock updates.',
      'BACKLOG',
      'High',
      0,
      johnId,
      alexId,
      dayOffset(14)
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t1, lBackend]);

  const t2 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'Design dark mode color tokens and contrast checks',
      'Ensure WCAG 2.1 AA accessibility standards for all dashboard charts, buttons, and alert states in both light and dark themes.',
      'BACKLOG',
      'Medium',
      1,
      sarahId,
      alexId,
      dayOffset(18)
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t2, lUIUX]);

  // TODO
  const t3 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'Implement OAuth2 Google & GitHub Single Sign-On',
      'Allow customers and staff to authenticate seamlessly via OAuth2 identity providers with automatic account linking.',
      'TODO',
      'Urgent',
      0,
      johnId,
      alexId,
      dayOffset(2)
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t3, lBackend]);
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t3, lUrgent]);

  const t4 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'Interactive Product Gallery with Pinch-to-Zoom',
      'Implement high-resolution image zoom and carousel navigation for product hero views on desktop and mobile viewports.',
      'TODO',
      'Medium',
      1,
      sarahId,
      alexId,
      dayOffset(5)
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t4, lFrontend]);
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t4, lUIUX]);

  // IN PROGRESS
  const t5 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'Stripe Payment Gateway & Webhook Reconciliation',
      'Integrate Stripe Checkout sessions, handle PaymentIntent webhooks, and automate order fulfillment records in PostgreSQL.',
      'IN PROGRESS',
      'Urgent',
      0,
      johnId,
      alexId,
      dayOffset(1)
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t5, lBackend]);
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t5, lUrgent]);

  const t6 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'Build Kanban Board with Smooth Drag & Drop',
      'Create responsive column lanes with smooth animations, real-time sync across connected peers via WebSockets, and position reordering.',
      'IN PROGRESS',
      'High',
      1,
      alexId,
      alexId,
      dayOffset(3)
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t6, lFrontend]);

  // IN REVIEW
  const t7 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'Navigation Header & Mobile Drawer Redesign',
      'Streamline global search, notifications popover, user avatar dropdown, and responsive drawer navigation.',
      'IN REVIEW',
      'Medium',
      0,
      sarahId,
      alexId,
      dayOffset(0) // Due today!
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t7, lUIUX]);
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t7, lFrontend]);

  // DONE
  const t8 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'JWT Authentication & Protected Routes Setup',
      'End-to-end token issuance, secure password hashing with bcrypt, session persistence, and role-based route guards.',
      'DONE',
      'Urgent',
      0,
      alexId,
      alexId,
      dayOffset(-2) // Completed 2 days ago
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t8, lBackend]);

  const t9 = (await db.query(
    `INSERT INTO tasks (project_id, title, description, status, priority, position, assignee_id, creator_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      p1Id,
      'CI/CD Pipeline with Automated Linting & Build Verification',
      'Setup GitHub Actions workflow to run automated tests and build checks on pull requests.',
      'DONE',
      'Low',
      1,
      alexId,
      alexId,
      dayOffset(-5)
    ]
  )).rows[0].id;
  await db.query(`INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2)`, [t9, lDevOps]);

  // 7. Comments for Task 5 (Stripe Checkout)
  const c1 = (await db.query(
    `INSERT INTO comments (task_id, user_id, parent_id, content, created_at)
     VALUES ($1, $2, NULL, $3, DATETIME('now', '-2 hours')) RETURNING id`,
    [t5, johnId, 'API integration and Stripe webhook listener are completed. Tested test card transactions successfully.']
  )).rows[0].id;

  const c2 = (await db.query(
    `INSERT INTO comments (task_id, user_id, parent_id, content, created_at)
     VALUES ($1, $2, $3, $4, DATETIME('now', '-1 hour')) RETURNING id`,
    [t5, sarahId, c1, 'Great work John! I will test the checkout modal styling on mobile viewports this afternoon.']
  )).rows[0].id;

  await db.query(
    `INSERT INTO comments (task_id, user_id, parent_id, content, created_at)
     VALUES ($1, $2, $3, $4, DATETIME('now', '-25 minutes'))`,
    [t5, alexId, c2, 'Excellent progress team. Once verified, let us deploy to the staging environment.']
  );

  // 8. Attachments for Task 5
  await db.query(
    `INSERT INTO attachments (task_id, uploader_id, file_name, file_url, file_size, file_type)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      t5,
      johnId,
      'stripe-checkout-flow.pdf',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      245000,
      'application/pdf'
    ]
  );

  // 9. Activity Logs for Project 1
  await db.query(
    `INSERT INTO activity_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, DATETIME('now', '-3 days'))`,
    [p1Id, alexId, 'created_project', 'project', p1Id, JSON.stringify({ name: 'E-Commerce Platform Redesign' })]
  );

  await db.query(
    `INSERT INTO activity_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, DATETIME('now', '-1 day'))`,
    [p1Id, alexId, 'created_task', 'task', t5, JSON.stringify({ title: 'Stripe Payment Gateway & Webhook Reconciliation' })]
  );

  await db.query(
    `INSERT INTO activity_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, DATETIME('now', '-2 hours'))`,
    [p1Id, johnId, 'moved_task', 'task', t5, JSON.stringify({ from: 'TODO', to: 'IN PROGRESS', title: 'Stripe Payment Gateway' })]
  );

  await db.query(
    `INSERT INTO activity_logs (project_id, user_id, action, entity_type, entity_id, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, DATETIME('now', '-25 minutes'))`,
    [p1Id, alexId, 'added_comment', 'comment', t5, JSON.stringify({ taskTitle: 'Stripe Payment Gateway' })]
  );

  // 10. Notifications
  await db.query(
    `INSERT INTO notifications (user_id, sender_id, type, title, message, link, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, DATETIME('now', '-2 hours'))`,
    [
      alexId,
      johnId,
      'comment',
      'New Comment',
      'John commented on "Stripe Payment Gateway & Webhook Reconciliation"',
      `/projects/${p1Id}?task=${t5}`,
      0
    ]
  );

  await db.query(
    `INSERT INTO notifications (user_id, sender_id, type, title, message, link, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, DATETIME('now', '-1 hour'))`,
    [
      alexId,
      sarahId,
      'mention',
      'Task Review',
      'Sarah moved "Navigation Header & Mobile Drawer Redesign" to IN REVIEW',
      `/projects/${p1Id}?task=${t7}`,
      0
    ]
  );

  await db.query(
    `INSERT INTO notifications (user_id, sender_id, type, title, message, link, is_read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, DATETIME('now', '-30 minutes'))`,
    [
      alexId,
      null,
      'deadline',
      'Deadline Today',
      '"Navigation Header & Mobile Drawer Redesign" is due today',
      `/projects/${p1Id}?task=${t7}`,
      0
    ]
  );

  console.log('TaskFlow database successfully seeded!');
  console.log('Demo Credentials:');
  console.log('  1. alex@taskflow.dev / password123 (Project Owner)');
  console.log('  2. sarah@taskflow.dev / password123 (Admin & Designer)');
  console.log('  3. john@taskflow.dev / password123 (Full Stack Engineer)');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = seed;
