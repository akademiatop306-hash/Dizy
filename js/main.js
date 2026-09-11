/* ============================================================
   СКРИПТЫ САЙТА — Виктор © 2026
   ============================================================ */

'use strict';

/* ---------- УТИЛИТЫ ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* Хранилище */
const store = {
    get(key, fallback) {
        try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
        catch (e) { return fallback; }
    },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
};

/* ---------- ПРЕЛОДЕР ---------- */
window.addEventListener('load', () => {
    const preloader = $('#preloader');
    if (preloader) {
        setTimeout(() => preloader.classList.add('hidden'), 500);
        setTimeout(() => preloader.remove(), 1300);
    }
});

/* ---------- ШАПКА: фон при скролле ---------- */
const header = $('#header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- МОБИЛЬНОЕ МЕНЮ ---------- */
const burger = $('#burger');
const navMenu = $('#navMenu');
burger.addEventListener('click', () => {
    burger.classList.toggle('active');
    navMenu.classList.toggle('open');
});
$$('#navMenu a').forEach(link => link.addEventListener('click', () => {
    burger.classList.remove('active');
    navMenu.classList.remove('open');
}));

/* ---------- СЧЁТЧИКИ В HERO ---------- */
function animateCounters(root) {
    $$('[data-count]', root || document).forEach(el => {
        const target = +el.dataset.count;
        const duration = 1800;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased);
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

/* ---------- REVEAL ПРИ СКРОЛЛЕ ---------- */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            const counters = $$('[data-count]', entry.target);
            if (counters.length) animateCounters(entry.target);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

$$('.reveal').forEach(el => {
    const delay = el.dataset.delay;
    if (delay) el.style.transitionDelay = `${delay}ms`;
    revealObserver.observe(el);
});
/* Пересчёт для динамических карточек услуг */
function observeReveals(root) {
    $$('.reveal', root).forEach(el => {
        if (!el.classList.contains('visible')) revealObserver.observe(el);
    });
}

/* ---------- СВЕЧЕНИЕ ЗА КУРСОРОМ ---------- */
const glow = $('#cursorGlow');
if (glow && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', e => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top = `${e.clientY}px`;
    });
}

/* ---------- ЗВУК УВЕДОМЛЕНИЯ ---------- */
let audioEnabled = false;
function ensureAudio() {
    if (audioEnabled) return Promise.resolve();
    return new Promise(resolve => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.resume().then(() => { audioEnabled = true; resolve(); });
    });
}
function playNotification(double = true) {
    try {
        ensureAudio().then(() => {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = double ? [880, 1174] : [784];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                const t = ctx.currentTime + i * 0.16;
                gain.gain.setValueAtTime(0.0001, t);
                gain.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
                osc.start(t); osc.stop(t + 0.4);
            });
        });
    } catch (e) { /* браузер без поддержки */ }
}

/* ---------- ТОСТЫ ---------- */
const toast = $('#toast');
let toastTimer;
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle('toast-error', isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ============================================================
   УСЛУГИ
   ============================================================ */
const ICONS = ['🛠️', '🎨', '📈', '⚙️', '💼', '🚀', '🔧', '📱'];

const DEFAULT_SERVICES = [
    { name: 'Дизайн логотипа', desc: 'Уникальный логотип под вашу нишу: анализ конкурентов, концепции и файлы во всех форматах.', price: '5 000 ₽' },
    { name: 'Разработка сайта', desc: 'Современный адаптивный сайт под ключ: дизайн, вёрстка, домен и хостинг.', price: '25 000 ₽' },
    { name: 'SEO-продвижение', desc: 'Выводим сайт в топ поисковых систем и каждую неделю присылаем отчёт о позициях.', price: '10 000 ₽' },
];

function getServices() {
    return store.get('services', DEFAULT_SERVICES);
}
function saveServices(list) {
    store.set('services', list);
}

function renderServices() {
    const grid = $('#servicesGrid');
    grid.innerHTML = getServices().map((s, i) => `
        <div class="service-card reveal">
            <div class="service-icon">${ICONS[i % ICONS.length]}</div>
            <h3>${escapeHtml(s.name)}</h3>
            <p class="desc">${escapeHtml(s.desc)}</p>
            <div class="service-bottom">
                <div class="service-price">${escapeHtml(s.price)}<small>за услугу</small></div>
                <button class="service-order" onclick="orderService(${i})">Заказать →</button>
            </div>
        </div>
    `).join('');
    observeReveals(grid);
}

function addService() {
    const name = $('#newServiceName').value.trim();
    const price = $('#newServicePrice').value.trim();
    const desc = $('#newServiceDesc').value.trim();
    if (!name || !price || !desc) {
        showToast('⚠️ Заполните все поля (название, описание, цена)', true);
        return;
    }
    const services = getServices();
    services.push({ name, price, desc });
    saveServices(services);
    renderServices();
    ['newServiceName', 'newServicePrice', 'newServiceDesc'].forEach(id => $(`#${id}`).value = '');
    showToast('✅ Услуга добавлена на сайт!');
    updatePreview();
}

/* Динамический предпросмотр карточки */
function updatePreview() {
    const name = $('#newServiceName').value.trim();
    const price = $('#newServicePrice').value.trim();
    const desc = $('#newServiceDesc').value.trim();
    const card = $('#addPreview');
    if (!card) return;
    $('h3', card).textContent = name || 'Название услуги';
    $('p', card).textContent = desc || 'Описание услуги появится здесь...';
    $('.ap-price', card).textContent = price || '10 000 ₽';
}
['newServiceName', 'newServicePrice', 'newServiceDesc'].forEach(id => {
    const el = $(`#${id}`);
    if (el) el.addEventListener('input', updatePreview);
});

/* Заказ услуги — подставляет в форму контакта */
function orderService(index) {
    const s = getServices()[index];
    const msgField = $('#contactMessage');
    msgField.value = `Хочу заказать: ${s.name} (${s.price}). Опишите детали — ждёт помощи:`;
    $('#contact').scrollIntoView({ behavior: 'smooth' });
    playNotification(true);
    showToast('📝 Сообщение подготовлено — проверьте и отправьте!');
}

/* ============================================================
   ФОРМА ОБРАТНОЙ СВЯЗИ
   ============================================================ */
function sendMessage(e) {
    e.preventDefault();
    const name = $('#contactName').value.trim();
    const email = $('#contactEmail').value.trim();
    const msg = $('#contactMessage').value.trim();

    if (!name || !email || !msg) {
        showToast('⚠️ Пожалуйста, заполните все поля', true);
        return;
    }

    /* Сохраняем заявку */
    const messages = store.get('contactMessages', []);
    messages.push({ name, email, msg, date: new Date().toLocaleString('ru-RU') });
    store.set('contactMessages', messages);

    /* Звук уведомления владельцу */
    playNotification(true);

    const success = $('#contactSuccess');
    success.classList.add('show');
    e.target.reset();
    setTimeout(() => success.classList.remove('show'), 5000);
    showToast('🔔 Заявка отправлена — я уже увидел уведомление!');
}

/* ============================================================
   ЧАТ С ПОДДЕРЖКОЙ
   ============================================================ */
const chatBox = $('#chatBox');
const chatMessages = $('#chatMessages');
const chatNotif = $('#chatNotif');

function toggleChat() {
    chatBox.classList.toggle('open');
    if (chatBox.classList.contains('open')) {
        chatNotif.style.display = 'none';
        $('#chatInput').focus();
        /* скрыть автоматическое приветствие повторно не надо */
    }
}

function appendMsg(text, who) {
    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${who}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping(show) {
    const typing = $('#typingIndicator');
    if (!typing) return;
    typing.classList.toggle('visible', show);
    if (show) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendQuick(text) {
    $('#chatInput').value = text;
    sendChat();
}

function sendChat() {
    const input = $('#chatInput');
    const text = input.value.trim();
    if (!text) return;

    appendMsg(text, 'user');
    input.value = '';
    playNotification(true);

    /* история чата */
    const history = store.get('chatHistory', []);
    history.push({ text, from: 'client', date: new Date().toISOString() });
    store.set('chatHistory', history);

    /* "печатает..." + автоответ в стиле референса */
    showTyping(true);
    const delay = 1400 + Math.random() * 1000;
    setTimeout(() => {
        showTyping(false);
        const replies = [
            'Спасибо за обращение! 🙌 Я уже вижу ваше сообщение и отвечу в ближайшее время.',
            'Принято! Давайте обсудим вашу задачу подробнее — напишите детали.',
            'Отличный вопрос! Я подготовлю для вас варианты и напишу в этом чате.',
            'Благодарю за сообщение! Ваша заявка в работе, я свяжусь с вами сегодня.'
        ];
        appendMsg(replies[Math.floor(Math.random() * replies.length)], 'support');
    }, delay);
}

/* Индикатор "печатает..." в HTML добавим динамически */
(function ensureTypingIndicator() {
    if ($('#typingIndicator')) return;
    const div = document.createElement('div');
    div.className = 'chat-typing';
    div.id = 'typingIndicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    $('#chatMessages').appendChild(div);
})();

/* ============================================================
   ESCAPE HTML (защита от XSS при добавлении услуг)
   ============================================================ */
function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, ch => map[ch]);
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================ */
renderServices();
updatePreview();