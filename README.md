# WEETY Supercars — магазин суперкаров (Bootstrap 5)

Многостраничный адаптивный сайт на HTML, CSS, Bootstrap 5 и JavaScript.

## Страницы
- `index.html` — главная (hero, преимущества, популярные авто, отзывы)
- `catalog.html` — каталог: поиск, фильтры, сортировка, таблица сравнения
- `product.html?id=...` — карточка авто, характеристики, заказ, отзывы
- `reviews.html` — все отзывы + форма добавления своего отзыва
- `about.html` — о нас + карта
- `contacts.html` — адрес, телефон, время работы, почта, форма, карта

## Структура
`css/style.css`, `js/data.js` (данные), `js/main.js` (логика, подключён через defer), `images/` (фото без изменений).

## Что реализовано
- Адаптивная вёрстка (Bootstrap grid), responsive images (`img-fluid`, `object-fit`, `width/height`, `loading="lazy"`), адаптивные формы и таблицы (`table-responsive`).
- Доступность: `alt` у изображений, подписи полей, ARIA только где нужно (`aria-label`, `aria-current`, `aria-live`), видимый фокус.
- JavaScript: строки, числа, логические значения, объекты; арифметические/сравнения/логические операторы; функции `formatPrice`, `calcDiscount`, `getStatus`, `shortDescription`; результат выводится в консоль (F12); текст на страницу — через `textContent`.
- Отзывы сохраняются в `localStorage` (можно добавить, посмотреть все, удалить свои).

## Lighthouse
Запустить в Chrome (F12 → Lighthouse), скриншот сохранить в `docs/`.
