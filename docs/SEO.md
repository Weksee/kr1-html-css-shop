# Практика 13 — SEO сайта (бесплатные инструменты)

Использованы бесплатные открытые стандарты и инструменты, без платных фреймворков:

| Что | Где в проекте |
|---|---|
| Уникальные `<title>` и `<meta name="description">` на каждой странице | `<head>` каждого `.html`; для карточек авто — `js/main.js` (`pages.product`) |
| `canonical` (защита от дублей) | `<head>`, для авто обновляется скриптом |
| Open Graph + Twitter Card (красивая ссылка в соцсетях) | `<head>`, картинка `images/optimized/og-cover.jpg` (1200×630) |
| Schema.org JSON-LD: `AutoDealer`, `Product` (цена, наличие, рейтинг), `BreadcrumbList`, `ItemList` | `<head>` и `js/main.js` |
| `sitemap.xml` и `robots.txt` | корень проекта |
| `noindex` для личных страниц (кабинет, избранное) | `account.html`, `favorites.html` |
| Семантика: один `<h1>` на странице, `<header>/<main>/<footer>/<nav>/<article>`, хлебные крошки | все страницы |
| `lang="ru"`, адаптивный viewport, быстрая загрузка (defer, lazy, WebP) | все страницы |

Домен `https://weety-cars.ru` — условный. После публикации замените его в `sitemap.xml`, `robots.txt`, в `<head>` страниц и в константе `SITE_URL` (`js/main.js`).

## Проверка (бесплатно)
- Chrome → F12 → Lighthouse → категория **SEO**.
- https://search.google.com/test/rich-results — проверка разметки Product.
- https://validator.schema.org

## Где находятся alt-описания изображений (для показа преподавателю)
- Карточки авто (каталог, главная, избранное, похожие): `js/main.js`, функция `cardHtml` — `alt="Название — вид спереди"`.
- Фото на странице автомобиля: `product.html` (запасной alt) и `js/main.js` → `pages.product` → `img.alt`.
- Главный баннер: `index.html` → `alt="Красный суперкар Ferrari SF90 Stradale на трассе"`.
- Фото в «О нас»: `about.html`. Миниатюры в кабинете: `js/main.js` → `pages.account`.
- Проверка: Chrome → Lighthouse → Accessibility («Image elements have [alt] attributes»).
