const SUPA_URL = 'https://ltjbusdajhrjtcqthffb.supabase.co';
const SUPA_KEY = 'iyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0amJ1c2RhamhyanRjcXRoZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTkyMjMsImV4cCI6MjA5MzM5NTIyM30.r6BYVyQXuSxBIgvZYyVcDzgki4ZlL8jIh-kGyH66i8I';

const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name).classList.add('active');
}

function showToast(msg, isError) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast' + (isError ? ' error' : '');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function updateChar() {
    document.getElementById('charCount').textContent = document.getElementById('msgInput').value.length;
}

async function sendMessage() {
    const text = document.getElementById('msgInput').value.trim();
    if (!text) { showToast('কিছু একটা লিখুন!', true); return; }
    const btn = document.getElementById('sendBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Sending...';
    const { error } = await sb.from('messages').insert({ content: text });
    btn.disabled = false;
    btn.textContent = '⟶ SEND ANONYMOUSLY';
    if (error) { showToast('Error: ' + error.message, true); return; }
    document.getElementById('msgInput').value = '';
    updateChar();
    showToast('✓ Message sent anonymously!');
}

function openAdminLogin() {
    document.getElementById('loginErr').textContent = '';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPass').value = '';
    document.getElementById('loginModal').classList.add('open');
}

function closeModal() {
    document.getElementById('loginModal').classList.remove('open');
}

async function doLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const pass = document.getElementById('adminPass').value;
    const errEl = document.getElementById('loginErr');
    const btn = document.getElementById('loginBtn');
    errEl.textContent = '';
    if (!email || !pass) { errEl.textContent = 'Email ও password দিন'; return; }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Logging in...';
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    btn.disabled = false;
    btn.textContent = 'LOGIN →';
    if (error) { errEl.textContent = 'ভুল email বা password'; return; }
    closeModal();
    showScreen('admin');
    loadMessages();
}

async function adminLogout() {
    await sb.auth.signOut();
    showScreen('user');
    showToast('Logged out');
}

async function loadMessages() {
    const countEl = document.getElementById('msgCount');
    const listEl = document.getElementById('msgList');
    countEl.innerHTML = '<span class="spinner"></span>Loading...';
    listEl.innerHTML = '';
    const { data, error } = await sb.from('messages').select('*').order('created_at', { ascending: false });
    if (error) { countEl.textContent = 'Error: ' + error.message; return; }
    countEl.textContent = data.length + ' টি message পাওয়া গেছে';
    if (!data.length) {
        listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div>এখনো কোনো message নেই</div></div>';
        return;
    }
    listEl.innerHTML = data.map(m => {
        const d = new Date(m.created_at);
        const time = d.toLocaleDateString('bn-BD') + ' • ' + d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
        const safeId = CSS.escape(m.id);
        return `<div class="msg-item" id="item-${m.id}">
        <div class="msg-actions">
          <button class="action-btn copy" onclick="copyMsg('${m.id}', this)" title="Copy">⧉</button>
          <button class="action-btn del" onclick="deleteMsg('${m.id}')" title="Delete">✕</button>
        </div>
        <div class="msg-text">${escHtml(m.content)}</div>
        <div class="msg-time">${time}</div>
      </div>`;
    }).join('');
}

function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function copyMsg(id, btn) {
    const textEl = document.querySelector('#item-' + id + ' .msg-text');
    try {
        await navigator.clipboard.writeText(textEl.textContent);
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = '⧉', 1500);
        showToast('Copied!');
    } catch (e) { showToast('Copy failed', true); }
}

async function deleteMsg(id) {
    const { error } = await sb.from('messages').delete().eq('id', id);
    if (error) { showToast('Delete failed', true); return; }
    const el = document.getElementById('item-' + id);
    if (el) { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => loadMessages(), 350); }
    showToast('Deleted');
}

document.getElementById('loginModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});
document.getElementById('adminEmail').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('adminPass').focus(); });
document.getElementById('adminPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('msgInput').addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) sendMessage(); });
