const express = require('express')
const session = require('express-session')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session({
  secret: 'workshop-todo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3_600_000 },
}))

// ── In-memory stores ───────────────────────────────────────────────────────

const users = new Map()
const tasks = new Map()
let nextTaskId = 1
let nextUserId = 2

// Pre-seeded test user (password stored as plain text for simplicity)
users.set('test@example.com', { id: 1, email: 'test@example.com', password: 'password123' })

function findUserById(id) {
  for (const u of users.values()) {
    if (u.id === id) return u
  }
  return null
}

function tasksForUser(userId) {
  return [...tasks.values()].filter(t => t.userId === userId)
}

// ── Auth middleware ────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/login')
  next()
}

// ── Login ──────────────────────────────────────────────────────────────────

app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/')
  res.send(loginPage())
})

app.post('/login', (req, res) => {
  const { email, password } = req.body
  const user = users.get(email)
  if (!user || user.password !== password) {
    return res.send(loginPage('Email o contraseña incorrectos'))
  }
  req.session.userId = user.id
  res.redirect('/')
})

// ── Register ───────────────────────────────────────────────────────────────

app.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/')
  res.send(registerPage())
})

app.post('/register', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.send(registerPage('Email y contraseña son requeridos'))
  }
  if (users.has(email)) {
    return res.send(registerPage('Este email ya está registrado'))
  }
  const id = nextUserId++
  users.set(email, { id, email, password })
  req.session.userId = id
  res.redirect('/')
})

// ── Logout ─────────────────────────────────────────────────────────────────

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'))
})

// ── Dashboard ──────────────────────────────────────────────────────────────

app.get('/', requireAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase()
  const user = findUserById(req.session.userId)
  let list = tasksForUser(req.session.userId)
  if (q) list = list.filter(t => t.title.toLowerCase().includes(q))
  res.send(dashboardPage(user, list, req.query.q || ''))
})

// ── Tasks ──────────────────────────────────────────────────────────────────

app.post('/tasks', requireAuth, (req, res) => {
  const { title, description, deadline } = req.body
  if (!title || !title.trim()) {
    const user = findUserById(req.session.userId)
    const list = tasksForUser(req.session.userId)
    return res.send(dashboardPage(user, list, '', 'El título es requerido'))
  }
  const id = nextTaskId++
  tasks.set(id, {
    id,
    userId: req.session.userId,
    title: title.trim(),
    description: (description || '').trim(),
    deadline: deadline || '',
    completed: false,
  })
  res.redirect('/')
})

app.post('/tasks/:id/complete', requireAuth, (req, res) => {
  const task = tasks.get(Number(req.params.id))
  if (task && task.userId === req.session.userId) {
    task.completed = !task.completed
  }
  res.redirect('/')
})

app.post('/tasks/:id/delete', requireAuth, (req, res) => {
  const task = tasks.get(Number(req.params.id))
  if (task && task.userId === req.session.userId) {
    tasks.delete(Number(req.params.id))
  }
  res.redirect('/')
})

// ── HTML templates ─────────────────────────────────────────────────────────

function h(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h(title)} — Todo App</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f3f4f6; color: #111827; }
    .wrap { max-width: 640px; margin: 48px auto; padding: 0 20px; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; }
    h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 16px; }
    .card { background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 16px; }
    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 4px; }
    input[type=text], input[type=email], input[type=password], input[type=date] {
      width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem;
    }
    input:focus { outline: 2px solid #6366f1; outline-offset: 1px; border-color: transparent; }
    .btn { display: inline-block; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover { background: #4f46e5; }
    .btn-danger  { background: #ef4444; color: #fff; }
    .btn-danger:hover { background: #dc2626; }
    .btn-ghost  { background: #e5e7eb; color: #374151; }
    .btn-ghost:hover { background: #d1d5db; }
    .btn-sm { padding: 4px 10px; font-size: 0.8rem; }
    .error { color: #dc2626; background: #fef2f2; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 0.875rem; }
    a { color: #6366f1; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .user-info { font-size: 0.8rem; color: #6b7280; display: flex; align-items: center; gap: 10px; }
    .search-row { display: flex; gap: 8px; margin-bottom: 2px; }
    .search-row input { flex: 1; }
    .task-list { padding-bottom: 4px; }
    .task-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .task-item:last-child { border-bottom: none; }
    .task-check { margin-top: 2px; width: 16px; height: 16px; cursor: pointer; accent-color: #6366f1; flex-shrink: 0; }
    .task-body { flex: 1; min-width: 0; }
    .task-title { font-size: 0.9rem; font-weight: 500; }
    .task-title.done { text-decoration: line-through; color: #9ca3af; }
    .task-desc { font-size: 0.8rem; color: #6b7280; margin-top: 2px; }
    .task-date { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }
    .badge { display: inline-block; padding: 1px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 500; flex-shrink: 0; }
    .badge-done    { background: #d1fae5; color: #065f46; }
    .badge-pending { background: #fee2e2; color: #991b1b; }
    .empty { text-align: center; color: #9ca3af; padding: 28px; font-size: 0.875rem; }
    .modal-bg { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 50; align-items: center; justify-content: center; }
    .modal-bg.open { display: flex; }
    .modal { background: #fff; border-radius: 10px; padding: 24px; width: min(400px, 90vw); }
    .modal h3 { margin-bottom: 10px; }
    .modal p  { font-size: 0.875rem; color: #6b7280; margin-bottom: 20px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
  </style>
</head>
<body>
  <div class="wrap">
    ${body}
  </div>
  <script>
    function openDeleteModal(taskId) {
      document.getElementById('delete-form').action = '/tasks/' + taskId + '/delete';
      document.getElementById('delete-modal').classList.add('open');
    }
    function closeDeleteModal() {
      document.getElementById('delete-modal').classList.remove('open');
    }
  </script>
</body>
</html>`
}

function loginPage(error = '') {
  return layout('Iniciar sesión', `
    <h1>Todo App</h1>
    <div class="card">
      <h2>Iniciar sesión</h2>
      ${error ? `<p class="error" role="alert">${h(error)}</p>` : ''}
      <form method="POST" action="/login">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="tu@email.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" name="password" placeholder="••••••••" required autocomplete="current-password">
        </div>
        <button type="submit" class="btn btn-primary">Iniciar sesión</button>
      </form>
      <p style="margin-top:16px;font-size:.875rem">¿No tienes cuenta? <a href="/register">Regístrate</a></p>
    </div>
  `)
}

function registerPage(error = '') {
  return layout('Registro', `
    <h1>Todo App</h1>
    <div class="card">
      <h2>Crear cuenta</h2>
      ${error ? `<p class="error" role="alert">${h(error)}</p>` : ''}
      <form method="POST" action="/register">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="tu@email.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" name="password" placeholder="••••••••" required autocomplete="new-password">
        </div>
        <button type="submit" class="btn btn-primary">Crear cuenta</button>
      </form>
      <p style="margin-top:16px;font-size:.875rem">¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
    </div>
  `)
}

function dashboardPage(user, list, q = '', error = '') {
  const items = list.length === 0
    ? `<p class="empty">No hay tareas. ¡Agrega una arriba!</p>`
    : list.map(t => `
      <div class="task-item" data-task-id="${t.id}">
        <form method="POST" action="/tasks/${t.id}/complete" style="display:contents">
          <input
            class="task-check"
            type="checkbox"
            ${t.completed ? 'checked' : ''}
            onchange="this.form.submit()"
            aria-label="Marcar como ${t.completed ? 'pendiente' : 'completada'}"
          >
        </form>
        <div class="task-body">
          <div class="task-title ${t.completed ? 'done' : ''}">${h(t.title)}</div>
          ${t.description ? `<div class="task-desc">${h(t.description)}</div>` : ''}
          ${t.deadline   ? `<div class="task-date">Fecha límite: ${h(t.deadline)}</div>` : ''}
        </div>
        <span class="badge ${t.completed ? 'badge-done' : 'badge-pending'}">
          ${t.completed ? 'Completada' : 'Pendiente'}
        </span>
        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="openDeleteModal(${t.id})"
          aria-label="Eliminar tarea ${h(t.title)}"
        >Eliminar</button>
      </div>
    `).join('')

  return layout('Dashboard', `
    <div class="topbar">
      <h1>Mis tareas</h1>
      <div class="user-info">
        <span>${h(user.email)}</span>
        <form method="POST" action="/logout" style="display:inline">
          <button type="submit" class="btn btn-ghost btn-sm">Salir</button>
        </form>
      </div>
    </div>

    <div class="card">
      <h2>Nueva tarea</h2>
      ${error ? `<p class="error" role="alert">${h(error)}</p>` : ''}
      <form method="POST" action="/tasks">
        <div class="form-group">
          <label for="title">Título *</label>
          <input type="text" id="title" name="title" placeholder="¿Qué necesitas hacer?">
        </div>
        <div class="form-group">
          <label for="description">Descripción</label>
          <input type="text" id="description" name="description" placeholder="Detalles opcionales">
        </div>
        <div class="form-group">
          <label for="deadline">Fecha límite</label>
          <input type="date" id="deadline" name="deadline">
        </div>
        <button type="submit" class="btn btn-primary">Agregar tarea</button>
      </form>
    </div>

    <div class="card" style="padding-bottom:8px">
      <form method="GET" action="/" class="search-row" style="margin-bottom:16px">
        <input type="text" name="q" placeholder="Buscar tareas..." value="${h(q)}" aria-label="Buscar tareas">
        <button type="submit" class="btn btn-ghost btn-sm">Buscar</button>
        ${q ? `<a href="/" class="btn btn-ghost btn-sm" style="display:flex;align-items:center">Limpiar</a>` : ''}
      </form>
      <div class="task-list">${items}</div>
    </div>

    <div class="modal-bg" id="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div class="modal">
        <h3 id="delete-modal-title">¿Eliminar tarea?</h3>
        <p>Esta acción no se puede deshacer.</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" onclick="closeDeleteModal()">Cancelar</button>
          <form id="delete-form" method="POST" action="/tasks/0/delete" style="display:inline">
            <button type="submit" class="btn btn-danger">Eliminar</button>
          </form>
        </div>
      </div>
    </div>
  `)
}

app.listen(PORT, () => {
  console.log(`Todo App → http://localhost:${PORT}`)
  console.log('Test user: test@example.com / password123')
})

module.exports = app
