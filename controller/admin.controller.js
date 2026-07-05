const { asyncHandler } = require('../utils/asyncHandler');
const { apiResponse } = require('../utils/apiResponse');
const User = require('../model/user.model');
const Course = require('../model/course.model');
const Submission = require('../model/submission.model');
const Cashout = require('../model/cashout.model');

const formatMoney = (value) => `$${Number(value || 0).toLocaleString()}`;
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getDashboardSummary = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeUsers,
    premiumUsers,
    normalUsers,
    trainerCount,
    teamLeaderCount,
    totalCourses,
    todayUsers,
    weekUsers,
    monthUsers,
    todayEarnings,
    weekEarnings,
    monthEarnings,
    latestUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'premiumuser' }),
    User.countDocuments({ role: 'normaluser' }),
    User.countDocuments({ role: 'trainer' }),
    User.countDocuments({ role: 'teamleader' }),
    Course.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    User.aggregate([{ $match: { createdAt: { $gte: startOfToday } } }, { $group: { _id: null, total: { $sum: '$earnings' } } }]),
    User.aggregate([{ $match: { createdAt: { $gte: startOfWeek } } }, { $group: { _id: null, total: { $sum: '$earnings' } } }]),
    User.aggregate([{ $match: { createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$earnings' } } }]),
    User.find({}).select('name fullname email phone role status createdAt').sort({ createdAt: -1 }).limit(8),
  ]);

  return {
    totalUsers,
    activeUsers,
    premiumUsers,
    normalUsers,
    trainerCount,
    teamLeaderCount,
    totalCourses,
    todayUsers,
    weekUsers,
    monthUsers,
    todayEarnings: todayEarnings[0]?.total || 0,
    weekEarnings: weekEarnings[0]?.total || 0,
    monthEarnings: monthEarnings[0]?.total || 0,
    latestUsers,
  };
};

const getDashboardStats = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary();
  return apiResponse(res, 200, 'Dashboard statistics fetched successfully', summary);
});

const renderAdminPage = asyncHandler(async (req, res) => {
  const page = req.params.page || 'dashboard';
  const summary = await getDashboardSummary();

  const pageMeta = {
    dashboard: { title: 'Dashboard', description: 'Overview of your team management system.' },
    users: { title: 'Users', description: 'Manage your registered users.' },
    'premium-users': { title: 'Premium Users', description: 'View premium users and their activity.' },
    trainer: { title: 'Trainer', description: 'Monitor trainer accounts and assignments.' },
    'team-leader': { title: 'Team Leader', description: 'Track team leaders and team performance.' },
    courses: { title: 'Courses', description: 'Manage available courses and unlock rules.' },
    cashout: { title: 'Cashout', description: 'Review payout requests.' },
    submissions: { title: 'Submissions', description: 'Review premium user submissions.' },
    profile: { title: 'Profile', description: 'Manage your profile details.' },
    settings: { title: 'Settings', description: 'Adjust platform settings.' },
  };

  const selectedMeta = pageMeta[page] || pageMeta.dashboard;

  let contentHtml = '';

  if (page === 'users') {
    const query = req.query || {};
    const search = String(query.search || '').trim();
    const roleFilter = String(query.role || '').trim();
    const statusFilter = String(query.status || '').trim();
    const sortBy = String(query.sortBy || 'createdAt');
    const sortOrder = String(query.sortOrder || 'desc');
    const currentPage = Math.max(1, Number(query.page || 1));
    const perPage = 10;
    const skip = (currentPage - 1) * perPage;

    const filter = {};
    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (roleFilter) filter.role = roleFilter;
    if (statusFilter) filter.status = statusFilter;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const [users, totalUsers, trainers, teamLeaders] = await Promise.all([
      User.find(filter).select('name fullname email phone role status balance earnings trainer teamLeader createdAt').sort(sort).skip(skip).limit(perPage),
      User.countDocuments(filter),
      User.find({ role: 'trainer' }).select('_id fullname name email').sort({ createdAt: -1 }),
      User.find({ role: 'teamleader' }).select('_id fullname name email').sort({ createdAt: -1 }),
    ]);

    const selectedUserId = String(query.view || '');
    const selectedUser = selectedUserId ? await User.findById(selectedUserId).select('-password') : null;
    const totalPages = Math.max(1, Math.ceil(totalUsers / perPage));
    const queryParams = new URLSearchParams({ search, role: roleFilter, status: statusFilter, sortBy, sortOrder, page: currentPage, view: selectedUserId }).toString();

    contentHtml = `
      <div class="section-header">
        <h2>User management</h2>
        <p>${totalUsers} users found. Use the controls below to search, filter, sort, and manage accounts.</p>
      </div>
      <div class="toolbar-card">
        <form method="get" action="/admin/users" class="toolbar-row">
          <input type="text" name="search" value="${escapeHtml(search)}" placeholder="Search name, email, phone" />
          <select name="role">
            <option value="">All roles</option>
            <option value="normaluser" ${roleFilter === 'normaluser' ? 'selected' : ''}>Normal User</option>
            <option value="premiumuser" ${roleFilter === 'premiumuser' ? 'selected' : ''}>Premium User</option>
            <option value="trainer" ${roleFilter === 'trainer' ? 'selected' : ''}>Trainer</option>
            <option value="teamleader" ${roleFilter === 'teamleader' ? 'selected' : ''}>Team Leader</option>
            <option value="admin" ${roleFilter === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
          <select name="status">
            <option value="">All status</option>
            <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${statusFilter === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="pending" ${statusFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="blocked" ${statusFilter === 'blocked' ? 'selected' : ''}>Blocked</option>
          </select>
          <select name="sortBy">
            <option value="createdAt" ${sortBy === 'createdAt' ? 'selected' : ''}>Created</option>
            <option value="fullname" ${sortBy === 'fullname' ? 'selected' : ''}>Name</option>
            <option value="email" ${sortBy === 'email' ? 'selected' : ''}>Email</option>
            <option value="role" ${sortBy === 'role' ? 'selected' : ''}>Role</option>
          </select>
          <select name="sortOrder">
            <option value="desc" ${sortOrder === 'desc' ? 'selected' : ''}>Descending</option>
            <option value="asc" ${sortOrder === 'asc' ? 'selected' : ''}>Ascending</option>
          </select>
          <button type="submit">Apply</button>
        </form>
      </div>
      ${selectedUser ? `
        <div class="profile-card">
          <h3>${escapeHtml(selectedUser.name || selectedUser.fullname || 'User profile')}</h3>
          <p><strong>Email:</strong> ${escapeHtml(selectedUser.email || 'N/A')}</p>
          <p><strong>Phone:</strong> ${escapeHtml(selectedUser.phone || 'N/A')}</p>
          <p><strong>Role:</strong> ${escapeHtml(selectedUser.role || 'normaluser')}</p>
          <p><strong>Status:</strong> ${escapeHtml(selectedUser.status || 'active')}</p>
          <p><strong>Balance:</strong> ${formatMoney(selectedUser.balance)}</p>
          <p><strong>Earnings:</strong> ${formatMoney(selectedUser.earnings)}</p>
        </div>` : ''}
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${users.map((user) => `
                <tr>
                  <td>${escapeHtml(user.name || user.fullname || 'N/A')}</td>
                  <td>${escapeHtml(user.email)}</td>
                  <td>${escapeHtml(user.phone || 'N/A')}</td>
                  <td>${escapeHtml(user.role)}</td>
                  <td><span class="badge ${escapeHtml(user.status)}">${escapeHtml(user.status)}</span></td>
                  <td>
                    <div class="action-stack">
                      <a class="tiny-link" href="/admin/users?${new URLSearchParams({ search, role: roleFilter, status: statusFilter, sortBy, sortOrder, page: currentPage, view: user._id }).toString()}">View</a>
                      <form method="post" action="/admin/users/manage" class="inline-form">
                        <input type="hidden" name="userId" value="${user._id}" />
                        <input type="hidden" name="search" value="${escapeHtml(search)}" />
                        <input type="hidden" name="role" value="${escapeHtml(roleFilter)}" />
                        <input type="hidden" name="status" value="${escapeHtml(statusFilter)}" />
                        <input type="hidden" name="sortBy" value="${escapeHtml(sortBy)}" />
                        <input type="hidden" name="sortOrder" value="${escapeHtml(sortOrder)}" />
                        <input type="hidden" name="page" value="${currentPage}" />
                        <button type="submit" name="action" value="activate">Activate</button>
                        <button type="submit" name="action" value="deactivate">Deactivate</button>
                        <button type="submit" name="action" value="upgrade-premium">Premium</button>
                        <button type="submit" name="action" value="delete-user" class="danger" onclick="return confirm('Delete this user?')">Delete</button>
                      </form>
                      <form method="post" action="/admin/users/manage" class="inline-form assign-form">
                        <input type="hidden" name="userId" value="${user._id}" />
                        <input type="hidden" name="search" value="${escapeHtml(search)}" />
                        <input type="hidden" name="role" value="${escapeHtml(roleFilter)}" />
                        <input type="hidden" name="status" value="${escapeHtml(statusFilter)}" />
                        <input type="hidden" name="sortBy" value="${escapeHtml(sortBy)}" />
                        <input type="hidden" name="sortOrder" value="${escapeHtml(sortOrder)}" />
                        <input type="hidden" name="page" value="${currentPage}" />
                        <select name="trainerId">
                          <option value="">Assign Trainer</option>
                          ${trainers.map((trainer) => `<option value="${trainer._id}" ${String(user.trainer) === String(trainer._id) ? 'selected' : ''}>${escapeHtml(trainer.name || trainer.fullname || trainer.email)}</option>`).join('')}
                        </select>
                        <button type="submit" name="action" value="assign-trainer">Save</button>
                      </form>
                      <form method="post" action="/admin/users/manage" class="inline-form assign-form">
                        <input type="hidden" name="userId" value="${user._id}" />
                        <input type="hidden" name="search" value="${escapeHtml(search)}" />
                        <input type="hidden" name="role" value="${escapeHtml(roleFilter)}" />
                        <input type="hidden" name="status" value="${escapeHtml(statusFilter)}" />
                        <input type="hidden" name="sortBy" value="${escapeHtml(sortBy)}" />
                        <input type="hidden" name="sortOrder" value="${escapeHtml(sortOrder)}" />
                        <input type="hidden" name="page" value="${currentPage}" />
                        <select name="teamLeaderId">
                          <option value="">Assign Team Leader</option>
                          ${teamLeaders.map((leader) => `<option value="${leader._id}" ${String(user.teamLeader) === String(leader._id) ? 'selected' : ''}>${escapeHtml(leader.name || leader.fullname || leader.email)}</option>`).join('')}
                        </select>
                        <button type="submit" name="action" value="assign-teamleader">Save</button>
                      </form>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <a class="page-link ${currentPage <= 1 ? 'disabled' : ''}" href="/admin/users?${new URLSearchParams({ search, role: roleFilter, status: statusFilter, sortBy, sortOrder, page: Math.max(1, currentPage - 1) }).toString()}">Previous</a>
          <span>Page ${currentPage} of ${totalPages}</span>
          <a class="page-link ${currentPage >= totalPages ? 'disabled' : ''}" href="/admin/users?${new URLSearchParams({ search, role: roleFilter, status: statusFilter, sortBy, sortOrder, page: currentPage + 1 }).toString()}">Next</a>
        </div>
      </div>`;
  } else if (page === 'premium-users') {
    const users = await User.find({ role: 'premiumuser' }).select('name fullname email phone status createdAt').sort({ createdAt: -1 }).limit(20);
    contentHtml = `
      <div class="section-header">
        <h2>Premium users</h2>
        <p>${users.length} premium accounts available.</p>
      </div>
      <div class="card-grid">
        ${users.map((user) => `
          <div class="mini-card">
            <h3>${user.name || user.fullname || 'Premium user'}</h3>
            <p>${user.email}</p>
            <small>Status: ${user.status}</small>
          </div>`).join('')}
      </div>`;
  } else if (page === 'trainer') {
    const users = await User.find({ role: 'trainer' }).select('name fullname email phone status createdAt').sort({ createdAt: -1 }).limit(20);
    contentHtml = `
      <div class="section-header">
        <h2>Trainers</h2>
        <p>${users.length} trainers assigned to this system.</p>
      </div>
      <div class="card-grid">
        ${users.map((user) => `
          <div class="mini-card">
            <h3>${user.name || user.fullname || 'Trainer'}</h3>
            <p>${user.email}</p>
            <small>Status: ${user.status}</small>
          </div>`).join('')}
      </div>`;
  } else if (page === 'team-leader') {
    const users = await User.find({ role: 'teamleader' }).select('name fullname email phone status createdAt').sort({ createdAt: -1 }).limit(20);
    contentHtml = `
      <div class="section-header">
        <h2>Team leaders</h2>
        <p>${users.length} team leaders currently available.</p>
      </div>
      <div class="card-grid">
        ${users.map((user) => `
          <div class="mini-card">
            <h3>${user.name || user.fullname || 'Team leader'}</h3>
            <p>${user.email}</p>
            <small>Status: ${user.status}</small>
          </div>`).join('')}
      </div>`;
  } else if (page === 'courses') {
    const courses = await Course.find({}).sort({ createdAt: -1 }).limit(20);
    contentHtml = `
      <div class="section-header">
        <h2>Courses</h2>
        <p>${courses.length} courses in the catalog.</p>
      </div>
      <div class="card-grid">
        ${courses.map((course) => `
          <div class="mini-card">
            <h3>${course.title}</h3>
            <p>${course.description || 'No description provided.'}</p>
            <small>Status: ${course.status} • Daily unlock: ${course.dailyUnlock ? 'Yes' : 'No'}</small>
          </div>`).join('')}
      </div>`;
  } else if (page === 'cashout') {
    const cashouts = await Cashout.find({}).populate('user', 'name fullname email').sort({ createdAt: -1 }).limit(20);
    contentHtml = `
      <div class="section-header">
        <h2>Cashout requests</h2>
        <p>${cashouts.length} recent payout requests.</p>
      </div>
      <div class="table-card">
        <table>
          <thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Method</th></tr></thead>
          <tbody>
            ${cashouts.map((item) => `
              <tr>
                <td>${item.user?.name || item.user?.fullname || 'User'}</td>
                <td>${formatMoney(item.amount)}</td>
                <td><span class="badge ${item.status}">${item.status}</span></td>
                <td>${item.method}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } else if (page === 'submissions') {
    const submissions = await Submission.find({}).populate('user', 'name fullname email').populate('course', 'title').sort({ createdAt: -1 }).limit(20);
    contentHtml = `
      <div class="section-header">
        <h2>Submissions</h2>
        <p>${submissions.length} submissions pending review.</p>
      </div>
      <div class="table-card">
        <table>
          <thead><tr><th>User</th><th>Course</th><th>Status</th></tr></thead>
          <tbody>
            ${submissions.map((item) => `
              <tr>
                <td>${item.user?.name || item.user?.fullname || 'User'}</td>
                <td>${item.course?.title || 'Course'}</td>
                <td><span class="badge ${item.status}">${item.status}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } else if (page === 'profile') {
    contentHtml = `
      <div class="section-header">
        <h2>Profile</h2>
        <p>Profile management view is ready for future expansion.</p>
      </div>
      <div class="card-grid">
        <div class="mini-card"><h3>Personal info</h3><p>Update your name, email, and phone number here.</p></div>
        <div class="mini-card"><h3>Security</h3><p>Manage password and two-factor settings.</p></div>
      </div>`;
  } else if (page === 'settings') {
    contentHtml = `
      <div class="section-header">
        <h2>Settings</h2>
        <p>Application settings and preferences can be managed here.</p>
      </div>
      <div class="card-grid">
        <div class="mini-card"><h3>System preferences</h3><p>Configure core platform behavior.</p></div>
        <div class="mini-card"><h3>Notifications</h3><p>Set email and in-app alerts.</p></div>
      </div>`;
  } else {
    contentHtml = `
      <div class="section-header">
        <h2>Dashboard overview</h2>
        <p>Here is a quick snapshot of the current platform activity.</p>
      </div>
      <div class="stat-grid">
        <div class="stat-card"><h3>Total users</h3><p>${summary.totalUsers}</p></div>
        <div class="stat-card"><h3>Active users</h3><p>${summary.activeUsers}</p></div>
        <div class="stat-card"><h3>Premium users</h3><p>${summary.premiumUsers}</p></div>
        <div class="stat-card"><h3>Trainer count</h3><p>${summary.trainerCount}</p></div>
        <div class="stat-card"><h3>Team leader count</h3><p>${summary.teamLeaderCount}</p></div>
        <div class="stat-card"><h3>Total courses</h3><p>${summary.totalCourses}</p></div>
      </div>
      <div class="stat-grid secondary">
        <div class="stat-card"><h3>Today users</h3><p>${summary.todayUsers}</p></div>
        <div class="stat-card"><h3>7 days users</h3><p>${summary.weekUsers}</p></div>
        <div class="stat-card"><h3>30 days users</h3><p>${summary.monthUsers}</p></div>
        <div class="stat-card"><h3>Today earnings</h3><p>${formatMoney(summary.todayEarnings)}</p></div>
        <div class="stat-card"><h3>7 days earnings</h3><p>${formatMoney(summary.weekEarnings)}</p></div>
        <div class="stat-card"><h3>30 days earnings</h3><p>${formatMoney(summary.monthEarnings)}</p></div>
      </div>
      <div class="table-card">
        <h3>Latest users</h3>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
          <tbody>
            ${summary.latestUsers.map((user) => `
              <tr>
                <td>${user.name || user.fullname || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="badge ${user.status}">${user.status}</span></td>
                <td>${formatDate(user.createdAt)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${selectedMeta.title} | Admin Dashboard</title>
    <style>
      :root { color-scheme: dark; --bg:#07111f; --panel:#0f1b2d; --border:#1b2a42; --text:#e8eef8; --muted:#8ea4c2; --accent:#4f8cff; --green:#2ecc71; --orange:#f39c12; --red:#e74c3c; }
      * { box-sizing: border-box; }
      body { margin:0; font-family: Inter, Arial, sans-serif; background:var(--bg); color:var(--text); }
      .layout { display:flex; min-height:100vh; }
      .sidebar { width:260px; background:linear-gradient(180deg, #0f1b2d 0%, #101d31 100%); border-right:1px solid var(--border); padding:24px 16px; }
      .brand { font-size:1.2rem; font-weight:700; margin-bottom:24px; padding:8px 10px; border:1px solid var(--border); border-radius:12px; background:rgba(255,255,255,0.03); }
      .nav a { display:block; color:var(--text); text-decoration:none; padding:11px 12px; border-radius:10px; margin-bottom:8px; transition: 0.2s ease; }
      .nav a.active, .nav a:hover { background:#16253e; color:white; }
      .main { flex:1; padding:24px; }
      .topbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; gap:16px; }
      .topbar h1 { margin:0; font-size:1.5rem; }
      .topbar p { margin:6px 0 0; color:var(--muted); }
      .stat-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:18px; }
      .stat-card, .mini-card, .table-card, .toolbar-card, .profile-card { background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:16px; box-shadow: 0 10px 25px rgba(0,0,0,0.16); }
      .stat-card h3 { margin:0 0 8px; font-size:0.95rem; color:var(--muted); }
      .stat-card p { margin:0; font-size:1.45rem; font-weight:700; }
      .section-header { margin-bottom:16px; }
      .section-header h2 { margin:0 0 4px; }
      .section-header p { margin:0; color:var(--muted); }
      .card-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; }
      .mini-card h3 { margin:0 0 6px; }
      .mini-card p, .mini-card small { color:var(--muted); }
      table { width:100%; border-collapse:collapse; }
      th, td { text-align:left; padding:10px 8px; border-bottom:1px solid var(--border); }
      th { color:var(--muted); font-weight:600; }
      .badge { display:inline-block; padding:5px 8px; border-radius:999px; font-size:0.8rem; text-transform:capitalize; }
      .toolbar-row { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
      .toolbar-row input, .toolbar-row select, .toolbar-row button, .inline-form select, .inline-form button, .inline-form input { padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:#0c1728; color:var(--text); }
      .toolbar-row button, .inline-form button { background:var(--accent); cursor:pointer; }
      .inline-form button.danger { background:var(--red); }
      .table-wrap { overflow-x:auto; }
      .action-stack { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
      .inline-form { display:inline-flex; flex-wrap:wrap; gap:6px; align-items:center; }
      .tiny-link { color:var(--accent); text-decoration:none; font-size:0.9rem; }
      .pagination { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:14px; }
      .page-link { color:var(--accent); text-decoration:none; }
      .page-link.disabled { opacity:0.5; pointer-events:none; }
      .profile-card p { margin:6px 0; color:var(--muted); }
      .badge.active { background:rgba(46,204,113,0.15); color:var(--green); }
      .badge.pending { background:rgba(243,156,18,0.15); color:var(--orange); }
      .badge.blocked, .badge.rejected { background:rgba(231,76,60,0.15); color:var(--red); }
      @media (max-width: 900px) { .layout { flex-direction:column; } .sidebar { width:100%; border-right:0; border-bottom:1px solid var(--border); } .topbar { flex-direction:column; align-items:flex-start; } }
    </style>
  </head>
  <body>
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">Team Admin</div>
        <nav class="nav">
          <a class="${page === 'dashboard' ? 'active' : ''}" href="/admin/dashboard">Dashboard</a>
          <a class="${page === 'users' ? 'active' : ''}" href="/admin/users">Users</a>
          <a class="${page === 'premium-users' ? 'active' : ''}" href="/admin/premium-users">Premium Users</a>
          <a class="${page === 'trainer' ? 'active' : ''}" href="/admin/trainer">Trainer</a>
          <a class="${page === 'team-leader' ? 'active' : ''}" href="/admin/team-leader">Team Leader</a>
          <a class="${page === 'courses' ? 'active' : ''}" href="/admin/courses">Courses</a>
          <a class="${page === 'cashout' ? 'active' : ''}" href="/admin/cashout">Cashout</a>
          <a class="${page === 'submissions' ? 'active' : ''}" href="/admin/submissions">Submissions</a>
          <a class="${page === 'profile' ? 'active' : ''}" href="/admin/profile">Profile</a>
          <a class="${page === 'settings' ? 'active' : ''}" href="/admin/settings">Settings</a>
        </nav>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <h1>${selectedMeta.title}</h1>
            <p>${selectedMeta.description}</p>
          </div>
          <div class="stat-card" style="padding:10px 14px; min-width: 170px;">
            <h3 style="margin-bottom:4px;">Today</h3>
            <p>${summary.todayUsers} users</p>
          </div>
        </div>
        ${contentHtml}
      </main>
    </div>
  </body>
  </html>`;

  res.send(html);
});

const handleUserManagementAction = asyncHandler(async (req, res) => {
  const { action, userId, trainerId, teamLeaderId, search, role, status, sortBy, sortOrder, page } = req.body;

  if (!userId || !action) {
    return res.redirect('/admin/users');
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return res.redirect('/admin/users');
  }

  if (String(targetUser._id) === String(req.session?.user?.id)) {
    return res.redirect(`/admin/users?${new URLSearchParams({ search, role, status, sortBy, sortOrder, page }).toString()}`);
  }

  switch (action) {
    case 'activate':
      targetUser.status = 'active';
      break;
    case 'deactivate':
      targetUser.status = 'inactive';
      break;
    case 'upgrade-premium':
      targetUser.role = 'premiumuser';
      targetUser.status = 'active';
      break;
    case 'assign-trainer':
      if (!trainerId) {
        return res.redirect(`/admin/users?${new URLSearchParams({ search, role, status, sortBy, sortOrder, page }).toString()}`);
      }
      targetUser.trainer = trainerId;
      break;
    case 'assign-teamleader':
      if (!teamLeaderId) {
        return res.redirect(`/admin/users?${new URLSearchParams({ search, role, status, sortBy, sortOrder, page }).toString()}`);
      }
      targetUser.teamLeader = teamLeaderId;
      break;
    case 'delete-user':
      await User.findByIdAndDelete(userId);
      return res.redirect(`/admin/users?${new URLSearchParams({ search, role, status, sortBy, sortOrder, page }).toString()}`);
    default:
      break;
  }

  await targetUser.save();
  return res.redirect(`/admin/users?${new URLSearchParams({ search, role, status, sortBy, sortOrder, page }).toString()}`);
});

module.exports = {
  getDashboardStats,
  renderAdminPage,
  handleUserManagementAction,
};
