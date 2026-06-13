/* ===========================================================
   MythWorld frontend logic — talks to the Express API
   =========================================================== */

const CATEGORIES = {
  divine:        { label: "Divine Encounters",        icon: "🕯️", class: "seal-divine",        color: "var(--divine)" },
  supernatural:  { label: "Supernatural & Ghosts",     icon: "👻", class: "seal-supernatural",  color: "var(--supernatural)" },
  cryptid:       { label: "Cryptids & Strange Creatures", icon: "🐾", class: "seal-cryptid",     color: "var(--cryptid)" },
  myth:          { label: "Myths & Legends",          icon: "📜", class: "seal-myth",           color: "var(--myth)" },
  dream:         { label: "Premonitions & Dreams",    icon: "🌙", class: "seal-dream",          color: "var(--dream)" },
  unexplained:   { label: "Unexplained Phenomena",    icon: "❓", class: "seal-unexplained",     color: "var(--unexplained)" },
};

const LIBRARY_TEXTS = [
  {
    id: 'l1',
    title: 'On Apparitions and the Restless Dead',
    author: 'Anonymous, 17th century compilation',
    summary: 'A collection of regional accounts describing how the dead were believed to linger near unfinished business, and the rituals communities used to "settle" a haunting.',
    body: "Across many old village records, a recurring pattern appears: a person dies suddenly or with something left unresolved, and soon after, household objects begin to move, doors are heard opening, or a figure is glimpsed in familiar rooms. Local healers and elders did not usually treat this as frightening on its own — many communities saw it as a sign that the dead were 'checking in' rather than threatening anyone.\n\nCommon responses recorded include leaving a small offering of food or drink in the room where the activity occurred, speaking aloud to acknowledge the presence, and completing any task the person left unfinished (settling a debt, delivering a message, or finishing a piece of work). In several accounts, activity is described as stopping once these steps were taken.\n\nA second pattern involves clocks and timepieces stopping at the moment of death — a motif found in many cultures, often interpreted less as a curse and more as a kind of natural marker, a way the household 'recorded' the moment without anyone touching the dial.",
  },
  {
    id: 'l2',
    title: 'Field Notes on Forest Companions',
    author: "Traveler's journal, region unspecified",
    summary: 'Notes comparing cryptid sightings from different forested regions, looking for shared traits in how witnesses describe size, movement, and behavior.',
    body: "Reviewing dozens of independent accounts of large, upright, bipedal figures seen briefly at the edge of forest roads at night, several details recur with surprising consistency despite witnesses never having spoken to each other: the figure is almost always described as moving 'too smoothly' for its apparent size, often keeping pace with a vehicle for a short distance before vanishing at a curve or break in the treeline.\n\nMost witnesses report no sound — no footfalls, no breaking branches — which several note as more unsettling than the sighting itself. Sightings cluster heavily around dusk and just after, and along roads bordered by dense, old-growth trees rather than younger managed forest.\n\nWhile conventional explanations (deer standing briefly on hind legs, bears, optical effects from headlights) account for some reports, the consistency of the 'silent pacing' detail across unrelated regions remains, by the journal author's own admission, the hardest detail to explain away.",
  },
  {
    id: 'l3',
    title: 'A Short Treatise on Premonitory Dreams',
    author: 'Collected lecture notes, source uncertain',
    summary: 'An overview of how premonitory dreams have historically been recorded, categorized, and discussed by both skeptics and believers.',
    body: "Premonitory dreams — dreams that seem to anticipate a future event — have been recorded in personal diaries, letters, and oral histories for centuries, almost always noted only after the fact. This creates an obvious difficulty: dreams are rarely written down in detail until something happens that makes them feel significant in hindsight.\n\nSkeptical researchers point to the sheer number of dreams a person has over a lifetime, arguing that by chance alone some will resemble real events closely enough to feel uncanny. They also note that memory of a dream can shift after an event occurs, unconsciously aligning the recalled dream more closely with what actually happened.\n\nThose who take these reports seriously point to cases where the dream was described to another person — in detail, including specific unusual images — before the event occurred, removing the issue of after-the-fact memory distortion. Such cases are rarer, but recur across very different cultures and time periods, which some researchers consider notable in itself, regardless of the underlying explanation.",
  },
];

let posts = [];
let activeCategory = null;
let currentUser = null; // { email, subscribed }
let currentPostId = null;

/* ===========================================================
   API HELPERS
   =========================================================== */
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const message = (data && data.error) || 'Something went wrong.';
    throw new Error(message);
  }
  return data;
}

/* ===========================================================
   INIT
   =========================================================== */
async function init() {
  await Promise.all([loadPosts(), loadSession()]);

  renderCategoryGrid();
  renderFeed();
  applyUserUI();

  document.getElementById('search-input').addEventListener('input', renderFeed);

  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => goTo(link.dataset.view));
  });

  document.getElementById('profile-icon').addEventListener('click', toggleDropdown);
  document.getElementById('login-action').addEventListener('click', openLogin);
  document.getElementById('logout-action').addEventListener('click', logout);

  document.getElementById('submit-form').addEventListener('submit', handleSubmit);
  document.getElementById('f-image').addEventListener('change', e => previewFile(e, 'image-preview', 'image-drop-label'));
  document.getElementById('f-video').addEventListener('change', e => previewFile(e, 'video-preview', 'video-drop-label'));

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('profile-dropdown');
    const icon = document.getElementById('profile-icon');
    if (!dropdown.contains(e.target) && !icon.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // Allow Enter key in login/signup fields
  ['login-password', 'login-email'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  });
  ['signup-password', 'signup-email'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') doSignup();
    });
  });
}

async function loadPosts() {
  try {
    posts = await api('/posts');
  } catch (e) {
    showToast('Could not load posts: ' + e.message);
    posts = [];
  }
}

async function loadSession() {
  try {
    const data = await api('/auth/me');
    currentUser = data.user || null;
  } catch (e) {
    currentUser = null;
  }
}

function applyUserUI() {
  if (currentUser) {
    document.getElementById('dropdown-email').textContent = currentUser.email;
    document.getElementById('login-action').style.display = 'none';
    document.getElementById('logout-action').style.display = 'block';
    document.getElementById('profile-icon').textContent = currentUser.email[0].toUpperCase();
  } else {
    document.getElementById('dropdown-email').textContent = 'Not signed in';
    document.getElementById('login-action').style.display = 'block';
    document.getElementById('logout-action').style.display = 'none';
    document.getElementById('profile-icon').textContent = '?';
  }
}

/* ===========================================================
   NAVIGATION
   =========================================================== */
function goTo(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  if (link) link.classList.add('active');

  if (viewName === 'library') renderLibraryView();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===========================================================
   CATEGORIES
   =========================================================== */
function renderCategoryGrid() {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const card = document.createElement('div');
    card.className = 'category-card' + (activeCategory === key ? ' active' : '');
    card.innerHTML = `
      <div class="seal ${cat.class}">${cat.icon}</div>
      <h4>${cat.label}</h4>
      <p>${posts.filter(p => p.category === key).length} filed</p>
    `;
    card.addEventListener('click', () => {
      activeCategory = (activeCategory === key) ? null : key;
      renderCategoryGrid();
      renderFeed();
      document.getElementById('feed-section').scrollIntoView({ behavior: 'smooth' });
    });
    grid.appendChild(card);
  });
}

function clearCategoryFilter() {
  activeCategory = null;
  renderCategoryGrid();
  renderFeed();
}

/* ===========================================================
   FEED
   =========================================================== */
function renderFeed() {
  const grid = document.getElementById('feed-grid');
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const clearBtn = document.getElementById('clear-filter');

  let filtered = posts.slice().reverse();

  if (activeCategory) {
    filtered = filtered.filter(p => p.category === activeCategory);
    document.getElementById('feed-eyebrow').textContent = CATEGORIES[activeCategory].label;
    document.getElementById('feed-title').textContent = CATEGORIES[activeCategory].icon + ' ' + CATEGORIES[activeCategory].label;
    clearBtn.style.display = 'inline-block';
  } else {
    document.getElementById('feed-eyebrow').textContent = 'All filed cases';
    document.getElementById('feed-title').textContent = 'The Archive';
    clearBtn.style.display = 'none';
  }

  if (query) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.place.toLowerCase().includes(query) ||
      p.name.toLowerCase().includes(query)
    );
  }

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state">No cases match your search yet. Be the first to file one in this category.</div>`;
    return;
  }

  filtered.forEach(post => {
    const cat = CATEGORIES[post.category];
    const card = document.createElement('div');
    card.className = 'case-card';
    card.innerHTML = `
      <img class="photo" src="${post.image}" alt="" loading="lazy" />
      <div class="stamp" style="color:${cat.color}">${cat.icon}</div>
      <div class="case-body">
        <span class="tag">${cat.label}</span>
        <h3>${escapeHtml(post.title)}</h3>
        <div class="excerpt">${escapeHtml(post.description.slice(0, 110))}${post.description.length > 110 ? '…' : ''}</div>
        <div class="case-meta">
          <span>Filed by ${escapeHtml(post.name)}</span>
          <span>${escapeHtml(post.place)}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openPost(post.id));
    grid.appendChild(card);
  });
}

/* ===========================================================
   POST DETAIL
   =========================================================== */
async function openPost(id) {
  currentPostId = id;

  // Refresh single post for latest comments
  try {
    const fresh = await api('/posts/' + id);
    const idx = posts.findIndex(p => p.id === id);
    if (idx >= 0) posts[idx] = fresh;
  } catch (e) { /* fall back to cached */ }

  const post = posts.find(p => p.id === id);
  const cat = CATEGORIES[post.category];
  const content = document.getElementById('post-detail-content');

  let mediaHtml = '';
  if (post.image) mediaHtml += `<img class="media" src="${post.image}" alt="" />`;
  if (post.video) mediaHtml += `<video class="media" src="${post.video}" controls></video>`;

  content.innerHTML = `
    <div class="back" onclick="goTo('home')">&larr; Back to archive</div>
    <span class="tag" style="color:${cat.color}">${cat.icon} ${cat.label}</span>
    <h2>${escapeHtml(post.title)}</h2>
    <div class="meta-row">
      <span>Filed by ${escapeHtml(post.name)}</span>
      <span>${escapeHtml(post.place)}</span>
    </div>
    ${mediaHtml}
    <div class="description">${escapeHtml(post.description)}</div>
    <div class="comments">
      <h4>Comments &amp; Theories (${post.comments.length})</h4>
      <div id="comments-list"></div>
      ${currentUser ? `
        <div class="comment-form">
          <textarea id="new-comment" placeholder="Share your thoughts, similar experiences, or theories..."></textarea>
          <button class="btn solid" id="comment-btn" onclick="submitComment()">Post comment</button>
        </div>
      ` : `
        <div class="comment-form">
          <button class="btn ghost" onclick="openLogin()">Log in to comment</button>
        </div>
      `}
    </div>
  `;

  renderComments(post);
  goTo('post');
}

function renderComments(post) {
  const list = document.getElementById('comments-list');
  if (post.comments.length === 0) {
    list.innerHTML = `<div style="color:var(--mist); font-size:13px;">No comments yet. Be the first to respond.</div>`;
    return;
  }
  list.innerHTML = post.comments.map(c => `
    <div class="comment">
      <div class="who">${escapeHtml(c.who)}</div>
      <div>${escapeHtml(c.text)}</div>
    </div>
  `).join('');
}

async function submitComment() {
  const textarea = document.getElementById('new-comment');
  const text = textarea.value.trim();
  if (!text) return;

  const btn = document.getElementById('comment-btn');
  btn.disabled = true;
  btn.textContent = 'Posting...';

  try {
    const comment = await api(`/posts/${currentPostId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    const post = posts.find(p => p.id === currentPostId);
    post.comments.push(comment);
    textarea.value = '';
    renderComments(post);
    document.querySelector('#view-post .comments h4').textContent = `Comments & Theories (${post.comments.length})`;
  } catch (e) {
    showToast(e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Post comment';
  }
}

/* ===========================================================
   SUBMIT FORM
   =========================================================== */
function previewFile(event, previewId, labelId) {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const preview = document.getElementById(previewId);
  preview.src = url;
  preview.style.display = 'block';
  document.getElementById(labelId).textContent = file.name;
}

async function handleSubmit(e) {
  e.preventDefault();

  const errorBox = document.getElementById('submit-error');
  errorBox.classList.remove('show');

  if (!currentUser) {
    showToast('Please log in before submitting a report.');
    openLogin();
    return;
  }

  const category = document.getElementById('f-category').value;
  const title = document.getElementById('f-title').value.trim();
  const name = document.getElementById('f-name').value.trim();
  const place = document.getElementById('f-place').value.trim();
  const description = document.getElementById('f-description').value.trim();

  if (!category || !title || !name || !place || !description) {
    errorBox.textContent = 'Please fill in all required fields.';
    errorBox.classList.add('show');
    return;
  }

  const formData = new FormData();
  formData.append('category', category);
  formData.append('title', title);
  formData.append('name', name);
  formData.append('place', place);
  formData.append('description', description);

  const imageFile = document.getElementById('f-image').files[0];
  const videoFile = document.getElementById('f-video').files[0];
  if (imageFile) formData.append('image', imageFile);
  if (videoFile) formData.append('video', videoFile);

  const submitBtn = document.getElementById('submit-btn');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span>Filing report...';

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report.');

    posts.push(data);
    e.target.reset();
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('video-preview').style.display = 'none';
    document.getElementById('image-drop-label').textContent = 'Click or drop an image';
    document.getElementById('video-drop-label').textContent = 'Click or drop a video';

    renderCategoryGrid();
    renderFeed();
    showToast('Your report has been filed. Thank you for sharing.');
    goTo('home');
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('show');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/* ===========================================================
   AUTH (login / signup)
   =========================================================== */
function toggleDropdown() {
  document.getElementById('profile-dropdown').classList.toggle('open');
}

function openLogin() {
  document.getElementById('profile-dropdown').classList.remove('open');
  document.getElementById('auth-error').classList.remove('show');
  document.getElementById('login-overlay').classList.add('open');
}

function closeLogin() {
  document.getElementById('login-overlay').classList.remove('open');
}

function switchAuthTab(tab) {
  document.getElementById('auth-error').classList.remove('show');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('step-login').classList.toggle('active', tab === 'login');
  document.getElementById('step-signup').classList.toggle('active', tab === 'signup');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorBox = document.getElementById('auth-error');
  errorBox.classList.remove('show');

  if (!email || !password) {
    errorBox.textContent = 'Please enter your email and password.';
    errorBox.classList.add('show');
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Logging in...';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    currentUser = data;
    applyUserUI();
    closeLogin();
    showToast('Signed in as ' + currentUser.email);
    if (currentPostId) openPost(currentPostId);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log in';
  }
}

async function doSignup() {
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errorBox = document.getElementById('auth-error');
  errorBox.classList.remove('show');

  if (!email || !password) {
    errorBox.textContent = 'Please enter an email and password.';
    errorBox.classList.add('show');
    return;
  }
  if (password.length < 6) {
    errorBox.textContent = 'Password must be at least 6 characters.';
    errorBox.classList.add('show');
    return;
  }

  const btn = document.getElementById('signup-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Creating account...';

  try {
    const data = await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    currentUser = data;
    applyUserUI();
    closeLogin();
    showToast('Welcome to MythWorld, ' + currentUser.email);
    if (currentPostId) openPost(currentPostId);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign up';
  }
}

async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (e) { /* ignore */ }
  currentUser = null;
  applyUserUI();
  document.getElementById('profile-dropdown').classList.remove('open');
  showToast('Signed out.');
  if (currentPostId) openPost(currentPostId);
  if (document.getElementById('view-library').classList.contains('active')) renderLibraryView();
}

/* ===========================================================
   LIBRARY
   =========================================================== */
function renderLibraryView() {
  const container = document.getElementById('library-content');
  if (!container) return;

  const subscribed = currentUser && currentUser.subscribed;

  if (!subscribed) {
    container.innerHTML = `
      <div class="icon">📜</div>
      <h3>The Ancient Library</h3>
      <p>A growing collection of old texts, folklore, and esoteric writings — readable directly in MythWorld with a subscription.</p>
      <span class="badge">${LIBRARY_TEXTS.length} texts available</span>
      <div>
        <button class="btn solid" onclick="subscribeLibrary()">${currentUser ? 'Subscribe to unlock' : 'Log in to subscribe'}</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="icon">📜</div>
    <h3>The Ancient Library</h3>
    <p style="margin-bottom:8px;">You're subscribed — enjoy the archive.</p>
    <button class="btn ghost" style="margin-bottom:24px;" onclick="unsubscribeLibrary()">Unsubscribe</button>
    <div id="library-list" style="text-align:left; display:flex; flex-direction:column; gap:16px;"></div>
  `;

  const list = document.getElementById('library-list');
  LIBRARY_TEXTS.forEach(text => {
    const item = document.createElement('div');
    item.className = 'library-list-item';
    item.innerHTML = `
      <h4 style="font-style:italic; font-size:17px; margin-bottom:6px;">${escapeHtml(text.title)}</h4>
      <div class="tag" style="color:var(--gold); margin-bottom:8px; display:block;">${escapeHtml(text.author)}</div>
      <p style="font-size:13px; color:var(--mist); margin:0;">${escapeHtml(text.summary)}</p>
    `;
    item.addEventListener('click', () => openLibraryText(text.id));
    list.appendChild(item);
  });
}

function openLibraryText(id) {
  const text = LIBRARY_TEXTS.find(t => t.id === id);
  if (!text) return;
  const container = document.getElementById('library-content');
  container.innerHTML = `
    <div class="back" style="text-align:left; cursor:pointer; color:var(--gold); font-family:'Space Mono', monospace; font-size:12px; margin-bottom:20px;" onclick="renderLibraryView()">&larr; Back to library</div>
    <h3 style="text-align:left;">${escapeHtml(text.title)}</h3>
    <div class="tag" style="color:var(--gold); display:block; text-align:left; margin-bottom:18px;">${escapeHtml(text.author)}</div>
    <div style="text-align:left; color:var(--parchment-dim); font-size:15px; white-space:pre-wrap;">${escapeHtml(text.body)}</div>
  `;
}

async function subscribeLibrary() {
  if (!currentUser) {
    openLogin();
    return;
  }
  try {
    await api('/library/subscribe', { method: 'POST' });
    currentUser.subscribed = true;
    renderLibraryView();
    showToast('Subscribed! The Library is now unlocked.');
  } catch (e) {
    showToast(e.message);
  }
}

async function unsubscribeLibrary() {
  try {
    await api('/library/unsubscribe', { method: 'POST' });
    currentUser.subscribed = false;
    renderLibraryView();
    showToast('Unsubscribed from the Library.');
  } catch (e) {
    showToast(e.message);
  }
}

/* ===========================================================
   UTIL
   =========================================================== */
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
