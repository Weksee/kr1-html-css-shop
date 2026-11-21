// ============================================================
// main.js — логика сайта WEETY Supercars.
// Подключается через defer ПОСЛЕ data.js (там PRODUCTS, CATEGORIES, BADGES).
// ============================================================

// ===== 1. Функции (строки, числа, логика) =====

// Форматирование цены: 65000000 -> «65 000 000 ₽»
function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

// Скидка в процентах: арифметические операторы
function calcDiscount(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((oldPrice - price) / oldPrice * 100);
}

// Значение характеристики из таблицы specs
function getSpec(product, key) {
  const row = product.specs.find((item) => item[0] === key);
  return row ? row[1] : '—';
}

// Статус товара: логические операторы и сравнение
function getStatus(product) {
  const inStock = getSpec(product, 'Наличие') === 'В наличии';
  const hasDiscount = calcDiscount(product.price, product.oldPrice) > 0;
  if (inStock && hasDiscount) return 'В наличии, действует скидка';
  if (inStock) return 'В наличии';
  return 'Под заказ';
}

// Краткое описание: шаблонная строка
function shortDescription(product) {
  const power = getSpec(product, 'Мощность');
  const acc = getSpec(product, 'Разгон 0–100 км/ч');
  return `${product.name} — ${power}, разгон 0–100 за ${acc}. ${getStatus(product)}.`;
}

function findProduct(id) { return PRODUCTS.find((p) => p.id === id); }
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }
function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
  return many;
}
function parseDate(str) { const [d, m, y] = str.split('.').map(Number); return new Date(y, m - 1, d).getTime(); }

// Безопасное создание элементов: текст только через textContent
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===== 2. Вывод результата функций в консоль =====
function consoleDemo() {
  const p = PRODUCTS[1];
  console.log('Название:', p.name, '| тип:', typeof p.name);
  console.log('Цена:', formatPrice(p.price), '| тип:', typeof p.price);
  console.log('Скидка, %:', calcDiscount(p.price, p.oldPrice));
  console.log('Статус:', getStatus(p));
  console.log('Описание:', shortDescription(p));
  console.log('Цена > 40 млн и есть скидка?', p.price > 40000000 && Boolean(p.oldPrice));
}

// ===== 3. Отзывы: данные из data.js + свои из localStorage =====
const REVIEWS_KEY = 'weety:reviews';
function loadMyReviews() {
  try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || []; } catch (e) { return []; }
}
function saveMyReviews(list) {
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(list)); } catch (e) { /* хранилище недоступно */ }
}
function getAllReviews(productId) {
  const base = [];
  PRODUCTS.forEach((p) => p.reviews.forEach((r) => base.push({ ...r, productId: p.id, mine: false })));
  const all = base.concat(loadMyReviews().map((r) => ({ ...r, mine: true })));
  const list = productId ? all.filter((r) => r.productId === productId) : all;
  return list;
}
function addReview(review) {
  const list = loadMyReviews();
  list.push({ ...review, id: Date.now(), date: new Date().toLocaleDateString('ru-RU') });
  saveMyReviews(list);
}
function deleteReview(id) { saveMyReviews(loadMyReviews().filter((r) => r.id !== id)); }

function reviewNode(r, onDelete) {
  const col = el('div', 'col-md-6 col-lg-4');
  const box = el('article', 'review' + (r.mine ? ' review--mine' : ''));
  const head = el('div', 'd-flex align-items-center gap-3 mb-3');
  head.append(el('div', 'avatar', r.name.trim().charAt(0).toUpperCase()));
  const who = el('div');
  who.append(el('div', 'fw-semibold', r.name));
  who.append(el('small', 'text-secondary', r.date + (r.mine ? ' · ваш отзыв' : '')));
  head.append(who);
  box.append(head);
  const rating = el('div', 'stars mb-2', stars(r.rating));
  rating.setAttribute('aria-label', `Оценка ${r.rating} из 5`);
  box.append(rating);
  const prod = findProduct(r.productId);
  if (prod) {
    const link = el('a', 'small d-block mb-2', prod.name);
    link.href = 'product.html?id=' + prod.id;
    box.append(link);
  }
  box.append(el('p', 'mb-0', r.text));
  if (r.mine && onDelete) {
    const del = el('button', 'btn btn-sm btn-outline-danger mt-3', 'Удалить');
    del.type = 'button';
    del.addEventListener('click', () => onDelete(r.id));
    box.append(del);
  }
  col.append(box);
  return col;
}

// ===== 4. Карточки автомобилей =====
function cardHtml(p) {
  const b = BADGES[p.badge];
  const disc = calcDiscount(p.price, p.oldPrice);
  const badgeClass = p.badge === 'discount' ? 'bg-danger' : p.badge === 'new' ? 'bg-success' : 'bg-warning text-dark';
  const badgeText = disc ? `−${disc}%` : b.text;
  return `
  <div class="col-sm-6 col-lg-4 reveal">
    <article class="car-card">
      <a class="car-card__media" href="product.html?id=${p.id}" aria-label="Подробнее: ${escapeHtml(p.name)}">
        <span class="badge ${badgeClass} car-card__badge">${badgeText}</span>
        <img src="${p.image}" alt="${escapeHtml(p.name)} — вид спереди" width="678" height="452" loading="lazy">
      </a>
      <div class="car-card__body">
        <h3 class="h5">${escapeHtml(p.name)}</h3>
        <p class="text-secondary small flex-grow-1">${escapeHtml(p.short)}</p>
        <div class="mb-3">
          <div class="car-card__price">${formatPrice(p.price)}</div>
          ${p.oldPrice ? `<div class="old-price">${formatPrice(p.oldPrice)}</div>` : ''}
          <small class="${getSpec(p, 'Наличие') === 'В наличии' ? 'text-success' : 'text-warning'}"><i class="bi bi-circle-fill small"></i> ${getStatus(p)}</small>
        </div>
        <div class="d-flex gap-2">
          <a class="btn btn-outline-light flex-fill" href="product.html?id=${p.id}">Подробнее</a>
          <button class="btn btn-red flex-fill" type="button" data-order="${p.id}">Купить</button>
        </div>
      </div>
    </article>
  </div>`;
}
function fillCards(container, list) {
  container.innerHTML = list.map(cardHtml).join('');
  observeReveal();
}

// ===== 5. Эффекты: появление, счётчики, кнопка «наверх» =====
let revealObserver;
function observeReveal() {
  if (!('IntersectionObserver' in window)) { document.querySelectorAll('.reveal').forEach((n) => n.classList.add('visible')); return; }
  revealObserver = revealObserver || new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal:not(.visible)').forEach((n) => revealObserver.observe(n));
}
function initCounters() {
  const nodes = document.querySelectorAll('[data-count]');
  if (!nodes.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const node = e.target, target = Number(node.dataset.count), t0 = performance.now();
      const tick = (now) => {
        const k = Math.min((now - t0) / 1400, 1);
        node.textContent = Math.round(target * k) + (node.dataset.suffix || '');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(node);
    });
  }, { threshold: 0.5 });
  nodes.forEach((n) => io.observe(n));
}
function initToTop() {
  const btn = el('button', 'btn btn-red', '↑');
  btn.id = 'toTop'; btn.type = 'button'; btn.setAttribute('aria-label', 'Наверх');
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.append(btn);
  window.addEventListener('scroll', () => { btn.style.display = window.scrollY > 500 ? 'block' : 'none'; });
}
function toast(message) {
  let wrap = document.getElementById('toasts');
  if (!wrap) {
    wrap = el('div', 'toast-container position-fixed top-0 end-0 p-3');
    wrap.id = 'toasts'; wrap.style.zIndex = 2000; document.body.append(wrap);
  }
  const t = el('div', 'toast align-items-center text-bg-success border-0');
  t.setAttribute('role', 'status');
  const row = el('div', 'd-flex');
  row.append(el('div', 'toast-body', message));
  const x = el('button', 'btn-close btn-close-white me-2 m-auto'); x.type = 'button'; x.setAttribute('data-bs-dismiss', 'toast'); x.setAttribute('aria-label', 'Закрыть');
  row.append(x); t.append(row); wrap.append(t);
  const inst = new bootstrap.Toast(t, { delay: 3500 }); inst.show();
  t.addEventListener('hidden.bs.toast', () => t.remove());
}

// ===== 6. Формы: валидация, маска телефона =====
function maskPhone(input) {
  input.addEventListener('input', () => {
    let d = input.value.replace(/\D/g, '');
    if (d.startsWith('8') || d.startsWith('7')) d = d.slice(1);
    d = d.slice(0, 10);
    let out = '+7';
    if (d.length) out += ' (' + d.slice(0, 3);
    if (d.length >= 3) out += ') ' + d.slice(3, 6);
    if (d.length >= 6) out += '-' + d.slice(6, 8);
    if (d.length >= 8) out += '-' + d.slice(8, 10);
    input.value = d.length ? out : '';
  });
}
function bindForm(form, onValid) {
  form.noValidate = true;
  form.querySelectorAll('input[type="tel"]').forEach(maskPhone);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    onValid(new FormData(form));
    form.reset(); form.classList.remove('was-validated');
  });
}

// ===== 7. Модальное окно заказа =====
let orderModal, orderForm;
function initOrderModal() {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <div class="modal fade" id="orderModal" tabindex="-1" aria-labelledby="orderTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
      <div class="modal-header border-secondary"><h2 class="modal-title h5" id="orderTitle">Оформить заявку</h2>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Закрыть"></button></div>
      <form id="orderForm" novalidate><div class="modal-body">
        <p class="text-secondary" id="orderCar"></p>
        <div class="mb-3"><label for="oName" class="form-label">Ваше имя</label>
          <input class="form-control" id="oName" name="name" required minlength="2" autocomplete="name"><div class="invalid-feedback">Введите имя (минимум 2 символа).</div></div>
        <div class="mb-3"><label for="oPhone" class="form-label">Телефон</label>
          <input class="form-control" id="oPhone" name="phone" type="tel" required pattern="\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}" placeholder="+7 (___) ___-__-__" autocomplete="tel"><div class="invalid-feedback">Введите телефон полностью.</div></div>
        <div class="mb-3"><label for="oPay" class="form-label">Способ покупки</label>
          <select class="form-select" id="oPay" name="pay"><option>Наличные</option><option>Кредит</option><option>Лизинг</option><option>Trade-in</option></select></div>
        <div class="form-check"><input class="form-check-input" type="checkbox" id="oAgree" required><label class="form-check-label" for="oAgree">Согласен на обработку данных</label><div class="invalid-feedback">Необходимо согласие.</div></div>
      </div><div class="modal-footer border-secondary"><button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">Отмена</button><button type="submit" class="btn btn-red">Отправить</button></div></form>
    </div></div></div>`;
  document.body.append(wrap.firstElementChild);
  orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
  orderForm = document.getElementById('orderForm');
  let currentId = null;
  bindForm(orderForm, (data) => {
    const orders = JSON.parse(localStorage.getItem('weety:orders') || '[]');
    orders.push({ car: currentId, name: data.get('name'), phone: data.get('phone'), pay: data.get('pay'), date: new Date().toISOString() });
    try { localStorage.setItem('weety:orders', JSON.stringify(orders)); } catch (e) {}
    orderModal.hide();
    toast(`Заявка отправлена, ${data.get('name')}! Менеджер свяжется с вами в течение 15 минут.`);
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-order]');
    if (!btn) return;
    const p = findProduct(btn.dataset.order);
    currentId = p.id;
    document.getElementById('orderCar').textContent = `${p.name} — ${formatPrice(p.price)}`;
    orderModal.show();
  });
}

// ===== 8. Форма отзыва =====
function initReviewForm(form, fixedId, afterAdd) {
  const select = form.querySelector('select[name="productId"]');
  if (select) select.append(...PRODUCTS.map((p) => { const o = el('option', '', p.name); o.value = p.id; return o; }));
  bindForm(form, (data) => {
    addReview({ productId: fixedId || data.get('productId'), name: data.get('name').trim(), rating: Number(data.get('rating')), text: data.get('text').trim() });
    toast('Спасибо! Ваш отзыв добавлен.');
    afterAdd();
  });
}

// ===== 9. Страницы =====
const pages = {
  home() {
    const featured = PRODUCTS.filter((p) => p.badge === 'hit' || p.badge === 'discount').slice(0, 6);
    fillCards(document.getElementById('popular'), featured);
    const latest = getAllReviews().sort((a, b) => parseDate(b.date) - parseDate(a.date)).slice(0, 3);
    const box = document.getElementById('home-reviews');
    latest.forEach((r) => box.append(reviewNode(r)));
  },

  catalog() {
    const grid = document.getElementById('grid'), count = document.getElementById('count');
    const q = document.getElementById('q'), cat = document.getElementById('cat'), sort = document.getElementById('sort'), price = document.getElementById('price'), priceOut = document.getElementById('priceOut'), stock = document.getElementById('stock');
    const params = new URLSearchParams(location.search);
    if (params.get('cat')) cat.value = params.get('cat');
    function apply() {
      priceOut.textContent = formatPrice(Number(price.value));
      let list = PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(q.value.trim().toLowerCase()) &&
        (cat.value === 'all' || p.category === cat.value) &&
        p.price <= Number(price.value) &&
        (!stock.checked || getSpec(p, 'Наличие') === 'В наличии'));
      const s = sort.value;
      if (s === 'asc') list.sort((a, b) => a.price - b.price);
      if (s === 'desc') list.sort((a, b) => b.price - a.price);
      if (s === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
      count.textContent = `Найдено: ${list.length} ${plural(list.length, 'автомобиль', 'автомобиля', 'автомобилей')}`;
      if (list.length) fillCards(grid, list);
      else grid.innerHTML = '<div class="col-12 text-center text-secondary py-5">Ничего не найдено. Измените фильтры.</div>';
    }
    [q, cat, sort, price, stock].forEach((n) => n.addEventListener('input', apply));
    document.getElementById('reset').addEventListener('click', () => { q.value = ''; cat.value = 'all'; sort.value = 'default'; price.value = price.max; stock.checked = false; apply(); });
    apply();
    // Сравнительная таблица
    const tbody = document.getElementById('compare');
    PRODUCTS.forEach((p) => {
      const tr = document.createElement('tr');
      const a = el('td'); const link = el('a', '', p.name); link.href = 'product.html?id=' + p.id; a.append(link);
      tr.append(a, el('td', '', getSpec(p, 'Мощность')), el('td', '', getSpec(p, 'Разгон 0–100 км/ч')), el('td', '', getSpec(p, 'Макс. скорость')), el('td', 'text-nowrap', formatPrice(p.price)));
      tbody.append(tr);
    });
  },

  product() {
    const id = new URLSearchParams(location.search).get('id');
    const p = findProduct(id) || PRODUCTS[0];
    document.title = `${p.name} — WEETY Supercars`;
    document.getElementById('bc').textContent = p.name;
    document.getElementById('pName').textContent = p.name;
    const img = document.getElementById('pImg'); img.src = p.image; img.alt = `${p.name} — фото автомобиля`;
    document.getElementById('pDesc').textContent = p.description;
    document.getElementById('pPrice').textContent = formatPrice(p.price);
    const disc = calcDiscount(p.price, p.oldPrice);
    document.getElementById('pOld').textContent = disc ? `${formatPrice(p.oldPrice)} · скидка ${disc}%` : '';
    document.getElementById('pStatus').textContent = getStatus(p);
    document.getElementById('pOrder').dataset.order = p.id;
    document.getElementById('pCat').textContent = CATEGORIES[p.category].title;
    const stats = document.getElementById('pStats');
    p.stats.forEach(([v, l]) => { const c = el('div', 'col-4'); const b = el('div', 'spec-stat'); b.append(el('strong', '', v), el('small', 'text-secondary', l)); c.append(b); stats.append(c); });
    const tb = document.getElementById('pSpecs');
    p.specs.forEach(([k, v]) => { const tr = document.createElement('tr'); tr.append(el('th', 'fw-normal text-secondary', k), el('td', '', v)); tb.append(tr); });
    // Отзывы
    const list = document.getElementById('pReviews'), avg = document.getElementById('pAvg');
    function renderReviews() {
      const rs = getAllReviews(p.id).sort((a, b) => parseDate(b.date) - parseDate(a.date) || (b.id || 0) - (a.id || 0));
      list.replaceChildren(...rs.map((r) => reviewNode(r, (rid) => { deleteReview(rid); renderReviews(); })));
      const mean = rs.reduce((s, r) => s + r.rating, 0) / (rs.length || 1);
      avg.textContent = rs.length ? `${mean.toFixed(1)} из 5 · ${rs.length} ${plural(rs.length, 'отзыв', 'отзыва', 'отзывов')}` : 'Пока нет отзывов';
    }
    initReviewForm(document.getElementById('reviewForm'), p.id, renderReviews);
    renderReviews();
    // Похожие
    fillCards(document.getElementById('related'), PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 3));
  },

  reviews() {
    const list = document.getElementById('allReviews'), info = document.getElementById('info');
    const fCar = document.getElementById('fCar'), fSort = document.getElementById('fSort'), fMine = document.getElementById('fMine');
    fCar.append(...PRODUCTS.map((p) => { const o = el('option', '', p.name); o.value = p.id; return o; }));
    function render() {
      let rs = getAllReviews(fCar.value === 'all' ? null : fCar.value);
      if (fMine.checked) rs = rs.filter((r) => r.mine);
      if (fSort.value === 'new') rs.sort((a, b) => parseDate(b.date) - parseDate(a.date) || (b.id || 0) - (a.id || 0));
      if (fSort.value === 'high') rs.sort((a, b) => b.rating - a.rating);
      if (fSort.value === 'low') rs.sort((a, b) => a.rating - b.rating);
      list.replaceChildren(...rs.map((r) => reviewNode(r, (id) => { deleteReview(id); render(); })));
      if (!rs.length) list.append(el('p', 'text-secondary text-center py-4', 'Отзывов не найдено.'));
      info.textContent = `Показано: ${rs.length} ${plural(rs.length, 'отзыв', 'отзыва', 'отзывов')}`;
      // Сводка по оценкам
      const all = getAllReviews();
      const mean = all.reduce((s, r) => s + r.rating, 0) / all.length;
      document.getElementById('avgNum').textContent = mean.toFixed(1);
      document.getElementById('avgStars').textContent = stars(Math.round(mean));
      document.getElementById('avgTotal').textContent = `${all.length} ${plural(all.length, 'отзыв', 'отзыва', 'отзывов')}`;
      const bars = document.getElementById('bars'); bars.replaceChildren();
      for (let n = 5; n >= 1; n--) {
        const c = all.filter((r) => r.rating === n).length, pct = Math.round(c / all.length * 100);
        const row = el('div', 'd-flex align-items-center gap-2 mb-1');
        const bar = el('div', 'progress flex-grow-1'); bar.style.height = '8px';
        const fill = el('div', 'progress-bar bg-warning'); fill.style.width = pct + '%'; bar.append(fill);
        row.append(el('small', '', n + ' ★'), bar, el('small', 'text-secondary', String(c)));
        bars.append(row);
      }
    }
    [fCar, fSort, fMine].forEach((n) => n.addEventListener('input', render));
    initReviewForm(document.getElementById('reviewForm'), null, render);
    render();
  },

  contacts() {
    bindForm(document.getElementById('contactForm'), (d) => toast(`Спасибо, ${d.get('name')}! Сообщение отправлено.`));
  },
  about() {}
};

// ===== 10. Запуск =====
document.addEventListener('DOMContentLoaded', () => {
  initOrderModal();
  initToTop();
  const page = document.body.dataset.page;
  if (pages[page]) pages[page]();
  observeReveal();
  initCounters();
  consoleDemo();
});
