// ============================================================
// main.js — общее поведение сайта.
// Подключается на всех страницах ПОСЛЕ products.js (там данные).
// ============================================================

// ===== 1. Вспомогательные функции =====

// Экранирование: чтобы текст пользователя не стал HTML-кодом
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39' };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

// 65000000 -> «65 000 000 руб.»
function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' руб.';
}

function findProduct(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function starsText(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

// Склонение: 1 отзыв, 2 отзыва, 5 отзывов
function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// ===== 2. Высота шапки (нужна для sticky-фильтра) =====

const siteHeader = document.querySelector('.site-header');

function updateHeaderHeight() {
  if (siteHeader) {
    document.documentElement.style.setProperty('--header-height', siteHeader.offsetHeight + 'px');
  }
}

updateHeaderHeight();
window.addEventListener('resize', updateHeaderHeight);

// ===== 3. Кнопка «Наверх» =====

const toTopButton = document.querySelector('.to-top');

if (toTopButton) {
  const toggleToTop = () => {
    toTopButton.classList.toggle('to-top--visible', window.scrollY > 300);
  };

  window.addEventListener('scroll', toggleToTop, { passive: true });
  toggleToTop();

  toTopButton.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== 4. Проверка форм (заявка и отзыв) =====

function getErrorMessage(field) {
  const state = field.validity;

  if (state.valueMissing) {
    return field.type === 'checkbox' ? 'Необходимо ваше согласие' : 'Заполните это поле';
  }
  if (state.typeMismatch) return 'Введите корректный e-mail';
  if (state.tooShort) return 'Минимум символов: ' + field.minLength;
  if (state.patternMismatch) return 'Формат: +7 (900) 000-00-00';
  return field.validationMessage;
}

// Показать (или убрать, если message пустое) ошибку под полем
function setFieldError(field, message) {
  const wrapper = field.closest('.order-form__field');
  if (!wrapper) return;

  let error = wrapper.querySelector('.order-form__error');

  if (!message) {
    field.removeAttribute('aria-invalid');
    if (error) error.remove();
    return;
  }

  field.setAttribute('aria-invalid', 'true');

  if (!error) {
    error = document.createElement('small');
    error.className = 'order-form__error';
    error.setAttribute('role', 'alert');
    wrapper.append(error);
  }
  error.textContent = message;
}

function clearErrors(form) {
  Array.from(form.elements).forEach((element) => setFieldError(element, ''));
}

// true — всё верно; иначе показывает ошибки и ставит курсор в первое поле с ошибкой
function validateForm(form) {
  let firstInvalid = null;

  Array.from(form.elements).forEach((element) => {
    if (!element.willValidate) return;

    if (element.type === 'text' || element.tagName === 'TEXTAREA') {
      element.value = element.value.trim();
    }

    if (element.checkValidity()) {
      setFieldError(element, '');
    } else {
      setFieldError(element, getErrorMessage(element));
      firstInvalid = firstInvalid || element;
    }
  });

  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

// Ошибка исчезает, как только пользователь исправил поле
['input', 'change'].forEach((eventName) => {
  document.addEventListener(eventName, (event) => {
    const field = event.target;
    if (field.getAttribute && field.getAttribute('aria-invalid') === 'true' && field.checkValidity()) {
      setFieldError(field, '');
    }
  });
});

// Маска телефона: +7 (900) 000-00-00
function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  if (!digits) return '';

  let result = '+7 (' + digits.slice(0, 3);
  if (digits.length > 3) result += ') ' + digits.slice(3, 6);
  if (digits.length > 6) result += '-' + digits.slice(6, 8);
  if (digits.length > 8) result += '-' + digits.slice(8, 10);
  return result;
}

document.addEventListener('input', (event) => {
  if (event.target.matches('input[type="tel"]')) {
    event.target.value = formatPhone(event.target.value);
  }
});

// ===== 5. Уведомление об успехе =====

const successMessage = document.getElementById('success-message');
let messageTimer;

function showSuccess(text) {
  if (!successMessage) return;
  successMessage.textContent = text;
  successMessage.hidden = false;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => {
    successMessage.hidden = true;
  }, 4000);
}

// ===== 6. Модальное окно заявки (index.html) и форма заявки =====

const orderDialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const selectedProductInput = document.getElementById('selected-product');
const dialogProduct = document.getElementById('dialog-product');

// Нельзя выбрать дату связи в прошлом
const dateInput = document.getElementById('order-date');
if (dateInput) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);
}

function openOrderDialog(productId) {
  const product = findProduct(productId);

  if (selectedProductInput) {
    selectedProductInput.value = product ? product.name : '';
  }

  // Показываем в окне, какой автомобиль заказывает пользователь
  if (dialogProduct && product) {
    document.getElementById('dialog-product-img').src = product.image;
    document.getElementById('dialog-product-img').alt = product.name;
    document.getElementById('dialog-product-name').textContent = product.name;
    document.getElementById('dialog-product-price').textContent = formatPrice(product.price);
    dialogProduct.hidden = false;
  }

  // Тема заявки выбирается сама
  const topic = document.getElementById('order-topic');
  if (topic) topic.value = 'product';

  orderDialog.showModal();
  document.getElementById('order-name').focus();
}

// Кнопки «Заказать» создаются скриптом, поэтому слушаем клики на всём документе
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-product]');
  if (button && orderDialog) {
    openOrderDialog(button.dataset.product);
  }
});

if (orderDialog) {
  // Закрытие: кнопка «Закрыть», крестик (data-close-dialog) или клик по тёмному фону
  orderDialog.addEventListener('click', (event) => {
    const isCloseButton = event.target.closest('[data-close-dialog]');
    const isBackdrop = event.target === orderDialog;

    if (isCloseButton || isBackdrop) {
      orderDialog.close();
    }
  });

  // При любом закрытии (в том числе клавишей Esc) очищаем окно
  orderDialog.addEventListener('close', () => {
    if (orderForm) {
      orderForm.reset();
      clearErrors(orderForm);
    }
    if (selectedProductInput) selectedProductInput.value = '';
    if (dialogProduct) dialogProduct.hidden = true;
  });
}

if (orderForm) {
  orderForm.addEventListener('submit', (event) => {
    // Настоящую отправку отменяем (backend пока не подключён)
    event.preventDefault();

    if (!validateForm(orderForm)) return;

    orderForm.reset();
    if (orderDialog) orderDialog.close();
    showSuccess('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
  });
}

// order.html?product=sf90 — товар выбирается в списке автоматически
const productSelect = document.getElementById('order-product');
if (productSelect) {
  const productId = new URLSearchParams(location.search).get('product');
  if (productId && findProduct(productId)) {
    productSelect.value = productId;
  }
}

// ===== 7. Карточки товаров, категории, хлебные крошки =====

function renderCard(product, withOrderButton) {
  const badge = BADGES[product.badge];
  const oldPrice = product.oldPrice
    ? `<span class="product-card__old-price">${formatPrice(product.oldPrice)}</span> `
    : '';

  return `
    <article class="product-card ${badge.card}">
      <a class="product-card__media" href="product.html?id=${product.id}">
        <img class="product-card__image" src="${product.image}" alt="${product.name}" loading="lazy">
      </a>
      <span class="product-card__badge ${badge.badge}">${badge.text}</span>
      <h3 class="product-card__title">${product.name}</h3>
      <p class="product-card__description">${product.short}</p>
      <p class="product-card__price">${oldPrice}${formatPrice(product.price)}</p>
      <div class="product-card__actions">
        <a class="button ${withOrderButton ? 'button--secondary' : 'button--primary'}" href="product.html?id=${product.id}">Подробнее</a>
        ${withOrderButton ? `<button class="button button--primary" type="button" data-product="${product.id}">Заказать</button>` : ''}
      </div>
    </article>`;
}

function fillGrid(container, list, withOrderButton) {
  container.innerHTML = list.map((product) => renderCard(product, withOrderButton)).join('');
}

function renderCategoryCards(container, exceptKey) {
  container.innerHTML = Object.entries(CATEGORIES)
    .filter(([key]) => key !== exceptKey)
    .map(([key, category]) => {
      const count = PRODUCTS.filter((product) => product.category === key).length;
      return `
        <a class="category-card" href="category.html?cat=${key}">
          <h3 class="category-card__title">${category.title}</h3>
          <p class="category-card__text">${category.text}</p>
          <span class="category-card__count">Моделей: ${count}</span>
        </a>`;
    })
    .join('');
}

function setBreadcrumbs(items) {
  const nav = document.getElementById('breadcrumbs');
  if (!nav) return;

  nav.innerHTML = items
    .map((item) => item.href
      ? `<a class="breadcrumbs__link" href="${item.href}">${item.text}</a>`
      : `<span class="breadcrumbs__current">${item.text}</span>`)
    .join('');
}

// Блоки с атрибутами: data-products (товары), data-order (с кнопкой «Заказать»), data-categories
document.querySelectorAll('[data-products]').forEach((container) => {
  fillGrid(container, PRODUCTS, container.hasAttribute('data-order'));
});

document.querySelectorAll('[data-categories]').forEach((container) => {
  renderCategoryCards(container);
});

// ===== 8. Отзывы =====

function reviewHtml(review, product) {
  return `
    <article class="review">
      <div class="review__head">
        <strong class="review__author">${escapeHtml(review.name)}</strong>
        <span class="review__stars" role="img" aria-label="Оценка ${review.rating} из 5">${starsText(review.rating)}</span>
        <time class="review__date">${review.date}</time>
      </div>
      <p class="review__text">${escapeHtml(review.text)}</p>
      ${product ? `<a class="review__product" href="product.html?id=${product.id}">${product.name}</a>` : ''}
    </article>`;
}

// Отзывы на главной: по одному на каждый автомобиль
const homeReviews = document.getElementById('home-reviews');
if (homeReviews) {
  homeReviews.innerHTML = PRODUCTS.map((product) => reviewHtml(product.reviews[0], product)).join('');
}

// Новые отзывы хранятся в браузере (localStorage), пока нет backend
function loadReviews(productId) {
  try {
    return JSON.parse(localStorage.getItem('reviews:' + productId)) || [];
  } catch {
    return [];
  }
}

function saveReviews(productId, list) {
  try {
    localStorage.setItem('reviews:' + productId, JSON.stringify(list));
  } catch {
    // хранилище недоступно — отзыв просто не сохранится после обновления
  }
}

// ===== 9. Страница

function initCatalog() {
  const grid = document.getElementById('catalog-grid');
  const form = document.getElementById('filters-form');
  if (!grid || !form) return;

  const count = document.getElementById('catalog-count');
  const empty = document.getElementById('catalog-empty');

  function applyFilters() {
    const categories = Array.from(form.querySelectorAll('input[name="category"]:checked'))
      .map((input) => input.value);
    const priceFrom = (parseFloat(form.elements['price-from'].value) || 0) * 1000000;
    const priceTo = (parseFloat(form.elements['price-to'].value) || Infinity) * 1000000;
    const sort = form.elements['sort'].value;

    const list = PRODUCTS.filter((product) =>
      (categories.length === 0 || categories.includes(product.category)) &&
      product.price >= priceFrom &&
      product.price <= priceTo
    );

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);

    fillGrid(grid, list, false);
    count.textContent = 'Найдено автомобилей: ' + list.length;
    empty.hidden = list.length > 0;
  }

  form.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });
  form.addEventListener('reset', () => setTimeout(applyFilters, 0));

  applyFilters();
}

// ===== 10. Страница категории: category.html?cat=italy =====

function initCategory() {
  const root = document.getElementById('category-root');
  if (!root) return;

  const key = new URLSearchParams(location.search).get('cat');
  const category = CATEGORIES[key];

  // Без параметра (или с неверным) показываем список всех категорий
  if (!category) {
    document.title = 'Категории — SuperCars';
    setBreadcrumbs([{ text: 'Главная', href: 'index.html' }, { text: 'Категории' }]);
    root.innerHTML = `
      <section class="section">
        <h1 class="section__title">Категории</h1>
        <p>Выберите категорию автомобилей.</p>
        <div class="categories-grid" data-categories></div>
      </section>`;
    renderCategoryCards(root.querySelector('[data-categories]'));
    return;
  }

  const list = PRODUCTS.filter((product) => product.category === key);

  document.title = category.title + ' — SuperCars';
  setBreadcrumbs([
    { text: 'Главная', href: 'index.html' },
    { text: 'Категории', href: 'category.html' },
    { text: category.title }
  ]);

  root.innerHTML = `
    <section class="section">
      <h1 class="section__title">${category.title}</h1>
      <p>${category.text}</p>
      <p class="section__note">Моделей в категории: ${list.length}</p>
      <div class="products-grid" id="category-grid"></div>
    </section>
    <section class="section">
      <h2 class="section__title">Другие категории</h2>
      <div class="categories-grid" id="other-categories"></div>
    </section>`;

  fillGrid(document.getElementById('category-grid'), list, false);
  renderCategoryCards(document.getElementById('other-categories'), key);
}

// ===== 11. Страница товара: product.html?id=sf90 =====

function initProduct() {
  const root = document.getElementById('product-root');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const product = findProduct(id) || PRODUCTS[0];
  const badge = BADGES[product.badge];
  const category = CATEGORIES[product.category];
  const stock = product.specs.find((row) => row[0] === 'Наличие')[1];
  const related = PRODUCTS.filter((item) => item.id !== product.id);

  document.title = product.name + ' — SuperCars';
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.content = product.short;

  setBreadcrumbs([
    { text: 'Главная', href: 'index.html' },
    { text: 'Каталог', href: 'catalog.html' },
    { text: category.title, href: 'category.html?cat=' + product.category },
    { text: product.name }
  ]);

  root.innerHTML = `
    <article class="product-page">
      <div class="product-page__gallery">
        <img class="product-page__image" src="${product.image}" alt="${product.name}">
        <span class="product-card__badge ${badge.badge}">${badge.text}</span>
      </div>

      <div class="product-page__info">
        <p class="product-page__brand">${category.title}</p>
        <h1 class="product-page__title">${product.name}</h1>
        <a class="product-page__rating" id="product-rating" href="#reviews"></a>
        <p class="product-page__price">
          ${product.oldPrice ? `<span class="product-card__old-price">${formatPrice(product.oldPrice)}</span>` : ''}
          ${formatPrice(product.price)}
        </p>
        <p class="product-page__stock">Наличие: <strong>${stock}</strong></p>
        <p>${product.description}</p>

        <ul class="stats">
          ${product.stats.map(([value, label]) => `
            <li class="stats__item">
              <span class="stats__value">${value}</span>
              <span class="stats__label">${label}</span>
            </li>`).join('')}
        </ul>

        <div class="product-page__actions">
          <a class="button button--primary" href="order.html?product=${product.id}">Оставить заявку</a>
          <a class="button button--secondary" href="catalog.html">Назад в каталог</a>
        </div>
      </div>
    </article>

    <section class="section">
      <table class="product-table">
        <caption class="product-table__caption">Характеристики</caption>
        <thead>
          <tr>
            <th class="product-table__head">Параметр</th>
            <th class="product-table__head">Значение</th>
          </tr>
        </thead>
        <tbody>
          ${product.specs.map(([name, value]) => `
            <tr>
              <td class="product-table__cell">${name}</td>
              <td class="product-table__cell">${value}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="section reviews" id="reviews">
      <h2 class="section__title">Отзывы покупателей</h2>
      <p class="reviews__summary" id="reviews-summary"></p>
      <div class="reviews__list" id="reviews-list"></div>

      <form class="review-form" id="review-form" novalidate>
        <h3 class="review-form__title">Оставить отзыв</h3>

        <div class="order-form__field">
          <label class="order-form__label" for="review-name">Ваше имя</label>
          <input class="order-form__input" id="review-name" name="author" type="text"
                 minlength="2" maxlength="40" placeholder="Например, Иван" required>
        </div>

        <div class="order-form__field">
          <label class="order-form__label" for="review-rating">Оценка</label>
          <select class="order-form__select" id="review-rating" name="rating" required>
            <option value="">Выберите оценку</option>
            <option value="5">5 — отлично</option>
            <option value="4">4 — хорошо</option>
            <option value="3">3 — нормально</option>
            <option value="2">2 — плохо</option>
            <option value="1">1 — ужасно</option>
          </select>
        </div>

        <div class="order-form__field">
          <label class="order-form__label" for="review-text">Отзыв</label>
          <textarea class="order-form__textarea" id="review-text" name="text" rows="4"
                    minlength="10" maxlength="500" placeholder="Расскажите о своих впечатлениях" required></textarea>
        </div>

        <button class="button button--primary" type="submit">Отправить отзыв</button>
      </form>
    </section>

    <section class="section">
      <h2 class="section__title">Похожие автомобили</h2>
      <div class="products-grid" id="related-grid"></div>
    </section>`;

  fillGrid(document.getElementById('related-grid'), related, false);

  // Список отзывов: свои (из localStorage) + стандартные из pro



ducts.js
  function renderReviews() {
    const all = [...loadReviews(product.id), ...product.reviews];
    const average = all.reduce((sum, review) => sum + review.rating, 0) / all.length;
    const averageText = average.toFixed(1).replace('.', ',');
    const countText = all.length + ' ' + plural(all.length, 'отзыв', 'отзыва', 'отзывов');

    document.getElementById('reviews-summary').innerHTML =
      `Средняя оценка: <strong>${averageText}</strong> из 5 · ${countText}`;
    document.getElementById('product-rating').textContent = `★ ${averageText} · ${countText}`;
    document.getElementById('reviews-list').innerHTML = all.map((review) => reviewHtml(review)).join('');
  }

  renderReviews();

  const reviewForm = document.getElementById('review-form');
  reviewForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateForm(reviewForm)) return;

    const saved = loadReviews(product.id);
    saved.unshift({
      name: reviewForm.elements['author'].value,
      rating: Number(reviewForm.elements['rating'].value),
      date: new Date().toLocaleDateString('ru-RU'),
      text: reviewForm.elements['text'].value
    });
    saveReviews(product.id, saved);

    reviewForm.reset();
    renderReviews();
    showSuccess('Спасибо! Ваш отзыв добавлен.');
  });
}

initCatalog();
initCategory();
initProduct();



