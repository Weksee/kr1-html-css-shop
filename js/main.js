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
  list.push({ ...review, user: currentUser() ? currentUser().email : null, id: Date.now(), date: new Date().toLocaleDateString('ru-RU') });
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
      <button class="fav-btn" type="button" data-fav="${p.id}" aria-pressed="${isFav(p.id)}" aria-label="Избранное: ${escapeHtml(p.name)}"><i class="bi ${isFav(p.id) ? 'bi-heart-fill' : 'bi-heart'}"></i></button>
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
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button></div>
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
    orders.push({ car: currentId, name: data.get('name'), phone: data.get('phone'), pay: data.get('pay'), date: new Date().toISOString(), user: currentUser() ? currentUser().email : null });
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
    const u = currentUser();
    if (u) { orderForm.elements.name.value = u.name; orderForm.elements.phone.value = u.phone || ''; }
    orderModal.show();
  });
}

// ===== 8. Форма отзыва =====
function initReviewForm(form, fixedId, afterAdd) {
  const select = form.querySelector('select[name="productId"]');
  const u = currentUser();
  if (u) form.elements.name.value = u.name;
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
    document.getElementById('pFav').dataset.fav = p.id;
    syncFav();
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

// ===== 10. Избранное =====
const FAV_KEY = 'weety:favs';
function getFavs() { try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; } }
function isFav(id) { return getFavs().includes(id); }
function toggleFav(id) {
  const list = getFavs();
  const i = list.indexOf(id);
  if (i >= 0) list.splice(i, 1); else list.push(id);
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
  syncFav();
  document.dispatchEvent(new CustomEvent('favschange'));
  const p = findProduct(id);
  toast(i >= 0 ? `Удалено из избранного: ${p.name}` : `Добавлено в избранное: ${p.name}`);
}
function syncFav() {
  const favs = getFavs();
  document.querySelectorAll('[data-fav]').forEach((btn) => {
    const on = favs.includes(btn.dataset.fav);
    btn.setAttribute('aria-pressed', String(on));
    const icon = btn.querySelector('i');
    if (icon) icon.className = 'bi ' + (on ? 'bi-heart-fill' : 'bi-heart');
    const label = btn.querySelector('.fav-label');
    if (label) label.textContent = on ? 'В избранном' : 'В избранное';
  });
  const badge = document.getElementById('favCount');
  if (badge) { badge.textContent = favs.length; badge.hidden = favs.length === 0; }
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-fav]');
  if (btn) toggleFav(btn.dataset.fav);
});

// ===== 11. Аккаунт (хранится в localStorage; учебная реализация) =====
const USERS_KEY = 'weety:users', SESSION_KEY = 'weety:session';
function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (e) { return []; } }
function saveUsers(list) { try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch (e) {} }
function simpleHash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return String(h); }
function currentUser() {
  try { const email = localStorage.getItem(SESSION_KEY); return getUsers().find((u) => u.email === email) || null; } catch (e) { return null; }
}
function logout() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
function initHeader() {
  syncFav();
  const u = currentUser(), link = document.getElementById('accLink');
  if (link && u) { link.setAttribute('aria-label', 'Личный кабинет: ' + u.name); link.title = u.name; link.querySelector('i').className = 'bi bi-person-check-fill text-success'; }
}

pages.favorites = function () {
  const grid = document.getElementById('favGrid'), empty = document.getElementById('favEmpty'), info = document.getElementById('favInfo');
  function render() {
    const list = getFavs().map(findProduct).filter(Boolean);
    empty.hidden = list.length > 0;
    info.textContent = list.length ? `В избранном: ${list.length} ${plural(list.length, 'автомобиль', 'автомобиля', 'автомобилей')}` : '';
    if (list.length) fillCards(grid, list); else grid.replaceChildren();
    syncFav();
  }
  document.addEventListener('favschange', render);
  render();
};

pages.account = function () {
  const guest = document.getElementById('guestView'), userView = document.getElementById('userView');
  function show() {
    const u = currentUser();
    guest.hidden = !!u; userView.hidden = !u;
    if (!u) return;
    document.getElementById('uAvatar').textContent = u.name.charAt(0).toUpperCase();
    document.getElementById('uName').textContent = u.name;
    document.getElementById('uMail').textContent = u.email;
    const f = document.getElementById('profForm');
    f.elements.name.value = u.name; f.elements.phone.value = u.phone || '';
    document.getElementById('pfMail').value = u.email;
    // заявки
    const orders = JSON.parse(localStorage.getItem('weety:orders') || '[]').filter((o) => o.user === u.email).reverse();
    const body = document.getElementById('ordBody'); body.replaceChildren();
    orders.forEach((o) => {
      const car = findProduct(o.car), tr = document.createElement('tr');
      tr.append(el('td', 'text-nowrap', new Date(o.date).toLocaleDateString('ru-RU')), el('td', '', car ? car.name : o.car), el('td', '', o.pay));
      const st = el('td'); st.append(el('span', 'badge text-bg-warning', 'В обработке')); tr.append(st);
      body.append(tr);
    });
    document.getElementById('ordEmpty').hidden = orders.length > 0;
    // избранное
    const favs = getFavs().map(findProduct).filter(Boolean), fbox = document.getElementById('accFavs'); fbox.replaceChildren();
    favs.forEach((p) => {
      const row = el('div', 'fav-row');
      const img = el('img'); img.src = p.image; img.alt = p.name; img.width = 96; img.height = 64; img.loading = 'lazy';
      const info = el('div', 'flex-grow-1'); const a = el('a', 'fw-semibold', p.name); a.href = 'product.html?id=' + p.id;
      info.append(a, el('div', 'text-secondary small', formatPrice(p.price)));
      const rm = el('button', 'btn btn-sm btn-outline-danger', 'Убрать'); rm.type = 'button'; rm.dataset.fav = p.id;
      row.append(img, info, rm); fbox.append(row);
    });
    document.getElementById('favEmpty2').hidden = favs.length > 0;
    // отзывы
    const revs = loadMyReviews().filter((r) => r.user === u.email).map((r) => ({ ...r, mine: true }));
    const rbox = document.getElementById('accRevs'); rbox.replaceChildren(...revs.map((r) => reviewNode(r, (id) => { deleteReview(id); show(); })));
    document.getElementById('revEmpty').hidden = revs.length > 0;
    document.getElementById('stFav').textContent = favs.length;
    document.getElementById('stOrd').textContent = orders.length;
    document.getElementById('stRev').textContent = revs.length;
    initHeader();
  }
  document.addEventListener('favschange', () => { if (!userView.hidden) show(); });
  const loginErr = document.getElementById('loginErr'), regErr = document.getElementById('regErr');
  bindForm(document.getElementById('loginForm'), (d) => {
    const u = getUsers().find((x) => x.email === d.get('email').trim().toLowerCase());
    if (!u || u.pass !== simpleHash(d.get('pass'))) { loginErr.textContent = 'Неверный email или пароль.'; loginErr.hidden = false; return; }
    loginErr.hidden = true;
    try { localStorage.setItem(SESSION_KEY, u.email); } catch (e) {}
    toast(`Добро пожаловать, ${u.name}!`); show();
  });
  const regForm = document.getElementById('regForm');
  regForm.elements.pass2.addEventListener('input', () => {
    regForm.elements.pass2.setCustomValidity(regForm.elements.pass2.value === regForm.elements.pass.value ? '' : 'Пароли не совпадают');
  });
  regForm.elements.pass.addEventListener('input', () => regForm.elements.pass2.dispatchEvent(new Event('input')));
  bindForm(regForm, (d) => {
    const email = d.get('email').trim().toLowerCase(), users = getUsers();
    if (users.some((x) => x.email === email)) { regErr.textContent = 'Пользователь с таким email уже существует.'; regErr.hidden = false; return; }
    regErr.hidden = true;
    users.push({ name: d.get('name').trim(), email, phone: d.get('phone'), pass: simpleHash(d.get('pass')) });
    saveUsers(users);
    try { localStorage.setItem(SESSION_KEY, email); } catch (e) {}
    toast('Аккаунт создан. Добро пожаловать!'); show();
  });
  document.getElementById('profForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) { f.classList.add('was-validated'); return; }
    const users = getUsers(), u = users.find((x) => x.email === currentUser().email);
    u.name = f.elements.name.value.trim(); u.phone = f.elements.phone.value;
    saveUsers(users); toast('Профиль сохранён.'); show();
  });
  maskPhone(document.getElementById('profForm').elements.phone);
  document.getElementById('logoutBtn').addEventListener('click', () => { logout(); toast('Вы вышли из аккаунта.'); show(); const l = document.getElementById('accLink'); l.querySelector('i').className = 'bi bi-person-circle'; l.setAttribute('aria-label', 'Личный кабинет'); });
  show();
};

// ===== 12. Тема: светлая / тёмная с круговым «наплывом» =====
function setTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  try { localStorage.setItem('weety:theme', theme); } catch (e) {}
  const icon = document.querySelector('#themeBtn i');
  if (icon) icon.className = 'bi ' + (theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0b0b0d' : '#f5f5f8';
}
function initTheme() {
  const btn = document.getElementById('themeBtn');
  setTheme(document.documentElement.getAttribute('data-bs-theme') || 'dark');
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const clip = [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setTheme(next); return; }
    if (document.startViewTransition) {
      const t = document.startViewTransition(() => setTheme(next));
      t.ready.then(() => document.documentElement.animate({ clipPath: clip }, { duration: 750, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }));
    } else {
      // Запасной вариант: круг цвета новой темы расширяется от кнопки
      const overlay = el('div');
      overlay.style.cssText = `position:fixed;inset:0;z-index:3000;pointer-events:none;background:${next === 'dark' ? '#0b0b0d' : '#f5f5f8'}`;
      document.body.append(overlay);
      overlay.animate({ clipPath: clip }, { duration: 650, easing: 'ease-in-out' }).onfinish = () => {
        setTheme(next);
        overlay.animate({ opacity: [1, 0] }, { duration: 300 }).onfinish = () => overlay.remove();
      };
    }
  });
}

// ===== 13. Виджет чата поддержки =====
const CHAT_KEY = 'weety:chat';
function botReply(text) {
  const t = text.toLowerCase();
  const has = (...words) => words.some((w) => t.includes(w));
  const prices = PRODUCTS.map((p) => p.price);
  if (has('привет', 'здравств', 'добрый', 'хай')) return { text: 'Здравствуйте! Рады вас видеть. Чем могу помочь: подобрать авто, рассказать про доставку или кредит?' };
  const found = PRODUCTS.filter((p) => p.name.toLowerCase().split(' ').some((w) => w.length > 3 && t.includes(w.replace('á', 'a'))) || (has('ламбо') && p.name.includes('Lambo')) || (has('феррари') && p.name.includes('Ferrari')) || (has('макларен') && p.name.includes('McLaren')) || (has('порш') && p.name.includes('Porsche')) || (has('ауди') && p.name.includes('Audi')));
  if (found.length) return { text: 'Нашёл подходящие модели: ' + found.map((p) => `${p.name} — ${formatPrice(p.price)}`).join('; ') + '.', links: found.slice(0, 3).map((p) => ({ label: p.name, href: 'product.html?id=' + p.id })) };
  if (has('скидк', 'акци', 'дешев')) {
    const d = PRODUCTS.filter((p) => calcDiscount(p.price, p.oldPrice) > 0);
    return { text: 'Сейчас действуют скидки: ' + d.map((p) => `${p.name} −${calcDiscount(p.price, p.oldPrice)}%`).join('; ') + '.', links: [{ label: 'Открыть каталог', href: 'catalog.html' }] };
  }
  if (has('цен', 'стоим', 'сколько', 'дорого', 'бюджет')) return { text: `Цены в каталоге — от ${formatPrice(Math.min(...prices))} до ${formatPrice(Math.max(...prices))}. Фильтр по цене есть на странице каталога.`, links: [{ label: 'Каталог', href: 'catalog.html' }] };
  if (has('доставк', 'привез', 'привоз')) return { text: 'Доставляем в закрытом автовозе по всей России. Срок — от 2 до 10 дней в зависимости от города, страховка включена.' };
  if (has('кредит', 'рассрочк', 'лизинг', 'ипотек')) return { text: 'Кредит — одобрение за 1 день, первоначальный взнос от 20%. Для компаний доступен лизинг. Оставьте заявку на странице автомобиля.' };
  if (has('trade', 'трейд', 'обмен', 'выкуп')) return { text: 'Принимаем ваш автомобиль в trade-in: бесплатная оценка за 30 минут.' };
  if (has('тест', 'драйв', 'посмотреть', 'смотр', 'приех')) return { text: 'Тест-драйв можно записать по телефону +7 (495) 123-45-67 или через форму в контактах. Ждём вас в салоне!', links: [{ label: 'Контакты', href: 'contacts.html' }] };
  if (has('гаран')) return { text: 'На все автомобили действует гарантия до 24 месяцев. Перед продажей проводим 150-точечную диагностику.' };
  if (has('налич')) { const n = PRODUCTS.filter((p) => getSpec(p, 'Наличие') === 'В наличии').length; return { text: `Сейчас в наличии ${n} из ${PRODUCTS.length} моделей, остальные — под заказ.` }; }
  if (has('адрес', 'где', 'находит', 'добраться', 'проехать')) return { text: 'Мы находимся по адресу: г. Москва, Пресненская наб., 12. Карта — на странице контактов.', links: [{ label: 'Показать на карте', href: 'contacts.html' }] };
  if (has('врем', 'работает', 'график', 'часы', 'открыт')) return { text: 'Работаем ежедневно с 09:00 до 21:00.' };
  if (has('телефон', 'позвон', 'связ', 'почт', 'контакт', 'оператор', 'менеджер')) return { text: 'Телефон: +7 (495) 123-45-67, почта: info@weety-cars.ru. Менеджер ответит в рабочее время.', links: [{ label: 'Контакты', href: 'contacts.html' }] };
  if (has('спасиб', 'благодар')) return { text: 'Пожалуйста! Если появятся вопросы — пишите.' };
  if (has('пока', 'до свид')) return { text: 'До встречи! Хорошего дня.' };
  return { text: 'Не уверен, что понял вопрос. Попробуйте выбрать тему ниже или позвоните нам: +7 (495) 123-45-67.' };
}
function initChat() {
  const btn = el('button', 'btn btn-red', '');
  btn.id = 'chatBtn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Открыть чат с поддержкой'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'chatPanel');
  btn.innerHTML = '<i class="bi bi-chat-dots-fill"></i><span class="dot"></span>';
  const panel = el('section', '');
  panel.id = 'chatPanel'; panel.setAttribute('aria-label', 'Чат с поддержкой');
  panel.innerHTML = `
    <div class="chat__head"><i class="bi bi-headset fs-4"></i><div class="flex-grow-1"><div class="fw-semibold">Поддержка WEETY</div><small>● онлайн, отвечаем сразу</small></div>
      <button type="button" class="btn-close" id="chatClear" aria-label="Закрыть чат"></button></div>
    <div class="chat__log" id="chatLog" role="log" aria-live="polite"></div>
    <div class="chat__chips" id="chatChips"></div>
    <form class="chat__form" id="chatForm" autocomplete="off"><label class="visually-hidden" for="chatInput">Ваше сообщение</label>
      <input class="form-control" id="chatInput" placeholder="Напишите вопрос…" maxlength="200" required>
      <button class="btn btn-red" type="submit" aria-label="Отправить"><i class="bi bi-send-fill"></i></button></form>`;
  document.body.append(panel, btn);
  const log = panel.querySelector('#chatLog'), input = panel.querySelector('#chatInput'), chips = panel.querySelector('#chatChips');
  let history = [];
  try { history = JSON.parse(localStorage.getItem(CHAT_KEY)) || []; } catch (e) {}
  const save = () => { try { localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-40))); } catch (e) {} };
  function draw(m) {
    const b = el('div', 'msg ' + (m.from === 'me' ? 'msg--me' : 'msg--bot'));
    b.append(el('span', '', m.text));
    (m.links || []).forEach((l) => { const a = el('a', 'btn btn-sm btn-outline-danger d-block', l.label); a.href = l.href; b.append(a); });
    log.append(b); log.scrollTop = log.scrollHeight;
  }
  function say(m) { history.push(m); save(); draw(m); }
  function ask(text) {
    say({ from: 'me', text });
    const typing = el('div', 'msg msg--bot typing'); typing.innerHTML = '<span></span><span></span><span></span>'; typing.setAttribute('aria-label', 'Оператор печатает');
    log.append(typing); log.scrollTop = log.scrollHeight;
    setTimeout(() => { typing.remove(); say({ from: 'bot', ...botReply(text) }); }, 600 + Math.random() * 600);
  }
  ['Доставка', 'Кредит', 'Скидки', 'Тест-драйв', 'Контакты'].forEach((c) => {
    const b = el('button', 'btn btn-sm btn-outline-danger rounded-pill', c); b.type = 'button';
    b.addEventListener('click', () => ask(c)); chips.append(b);
  });
  history.forEach(draw);
  function open(on) {
    panel.classList.toggle('open', on);
    btn.setAttribute('aria-expanded', String(on));
    btn.querySelector('.dot').style.display = on ? 'none' : '';
    if (on) {
      if (!history.length) { const u = currentUser(); say({ from: 'bot', text: `${u ? u.name + ', здравствуйте' : 'Здравствуйте'}! Я виртуальный помощник WEETY. Спросите про автомобили, доставку, кредит или выберите тему ниже.` }); }
      input.focus();
    } else btn.focus();
  }
  btn.addEventListener('click', () => open(!panel.classList.contains('open')));
  panel.querySelector('#chatClear').addEventListener('click', () => open(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) open(false); });
  panel.querySelector('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim(); if (!text) return;
    input.value = ''; ask(text);
  });
}

// ===== 14. Запуск =====
document.addEventListener('DOMContentLoaded', () => {
  initOrderModal();
  initToTop();
  initTheme();
  initChat();
  const page = document.body.dataset.page;
  if (pages[page]) pages[page]();
  initHeader();
  observeReveal();
  initCounters();
  consoleDemo();
});
