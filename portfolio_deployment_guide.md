# DEPLOYMENT.md

Подробная инструкция по публикации статического портфолио-сайта на **React + Vite + Tailwind + React Router**.

Гайд рассчитан на текущую структуру сайта:

```txt
/en
/en/work
/en/work/project-slug
/en/about

/ru
/ru/work
/ru/work/project-slug
/ru/about
```

Сайт является **статическим SPA-приложением**: после сборки он превращается в папку `dist/`, которую можно публиковать на Vercel, GitHub Pages, обычном shared-хостинге, VPS или Object Storage.

---

## 0. Главное, что нужно понимать перед деплоем

Проект написан на React, но после команды:

```bash
npm run build
```

он становится обычным статическим сайтом:

```txt
dist/
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
└── projects/
    └── ...
```

Публиковать нужно **не весь проект**, а именно содержимое папки:

```txt
dist/
```

Исключение — Vercel/GitHub Actions, где хостинг сам запускает сборку из исходников.

---

## 1. Production-сборка локально

Перед любым деплоем проверь проект локально.

Установка зависимостей:

```bash
npm install
```

Запуск dev-режима:

```bash
npm run dev
```

Production-сборка:

```bash
npm run build
```

Локальный preview production-сборки:

```bash
npm run preview
```

Проверить в браузере:

```txt
http://localhost:4173/en
http://localhost:4173/ru
http://localhost:4173/en/work
http://localhost:4173/ru/work
http://localhost:4173/en/work/synthetic-plant
http://localhost:4173/ru/work/synthetic-plant
```

Если `npm run build` падает — деплоить нельзя. Сначала исправить ошибки.

---

## 2. Важный момент: React Router и fallback на `index.html`

Сайт использует `BrowserRouter`, а значит URL выглядят красиво:

```txt
/en/work/synthetic-plant
/ru/about
```

Но физически на сервере нет файлов:

```txt
/en/work/synthetic-plant.html
/ru/about.html
```

Есть только:

```txt
index.html
```

Поэтому сервер должен работать так:

```txt
Если файл реально существует — отдать файл.
Если файла нет — отдать index.html.
```

Это называется:

```txt
SPA fallback
history fallback
rewrite to index.html
```

Без этого:

```txt
/en открывается
/en/work открывается при переходе внутри сайта
но при обновлении страницы /en/work будет 404
```

Для каждого хостинга нужно отдельно настроить fallback.

---

# Часть 1. Деплой на Vercel

---

## 3. Почему Vercel — самый простой вариант

Vercel хорошо подходит для такого сайта, потому что:

```txt
подключается к GitHub
сам запускает npm install и npm run build
сам публикует dist
даёт preview-ссылки на каждый push / pull request
поддерживает кастомный домен
легко настроить fallback для SPA
```

Рекомендуемый вариант для первого production-деплоя.

---

## 4. Подготовка проекта к Vercel

Проверь `package.json`.

Должны быть scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Проверь, что локально проходит:

```bash
npm run build
```

---

## 5. Добавить `vercel.json`

В корне проекта создай файл:

```txt
vercel.json
```

Содержимое:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Зачем это нужно:

```txt
/en/work/synthetic-plant
/ru/about
/en/work
```

будут корректно открываться даже после обновления страницы.

---

## 6. Залить проект на GitHub

Если репозиторий ещё не создан:

```bash
git init
git add .
git commit -m "Initial portfolio site"
```

Создать репозиторий на GitHub.

Привязать remote:

```bash
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## 7. Подключить проект в Vercel

В интерфейсе Vercel:

```txt
Add New...
→ Project
→ Import Git Repository
→ выбрать репозиторий
```

Настройки обычно определяются автоматически.

Проверь:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Нажать:

```txt
Deploy
```

---

## 8. Проверить Vercel-деплой

После публикации проверить:

```txt
https://your-project.vercel.app/en
https://your-project.vercel.app/ru
https://your-project.vercel.app/en/work
https://your-project.vercel.app/ru/work
https://your-project.vercel.app/en/work/synthetic-plant
https://your-project.vercel.app/ru/work/synthetic-plant
```

Обязательно проверить обновление страницы:

```txt
Открыть /en/work/synthetic-plant
Нажать F5
```

Если после F5 нет 404 — fallback работает.

---

## 9. Подключение домена на Vercel

В проекте Vercel:

```txt
Settings
→ Domains
→ Add Domain
```

Добавить домен:

```txt
example.com
www.example.com
```

Vercel покажет DNS-записи, которые нужно прописать у регистратора домена.

Обычно это один из вариантов:

```txt
A record
CNAME record
```

После обновления DNS проверить:

```txt
https://example.com/en
https://example.com/ru
```

---

## 10. Обновление сайта на Vercel

После первого деплоя процесс такой:

```bash
git add .
git commit -m "Update portfolio"
git push
```

Vercel сам пересоберёт сайт.

---

# Часть 2. Деплой на GitHub Pages

---

## 11. Когда выбирать GitHub Pages

GitHub Pages подходит, если:

```txt
нужен бесплатный хостинг
сайт публичный
не критичен кастомный серверный fallback
хочется всё держать внутри GitHub
```

Но для SPA с `BrowserRouter` GitHub Pages менее удобен, чем Vercel, потому что обычный fallback на `index.html` там не настраивается так же просто.

---

## 12. Два типа GitHub Pages

Есть два основных сценария.

### User / Organization site

Репозиторий называется:

```txt
USERNAME.github.io
```

Сайт открывается по адресу:

```txt
https://USERNAME.github.io/
```

В этом случае `base` обычно:

```js
base: "/"
```

### Project site

Репозиторий называется, например:

```txt
portfolio
```

Сайт открывается по адресу:

```txt
https://USERNAME.github.io/portfolio/
```

В этом случае нужно учитывать поддиректорию `/portfolio/`.

---

## 13. Вариант A: GitHub Pages для `USERNAME.github.io`

Это самый простой вариант для GitHub Pages.

Если репозиторий называется:

```txt
USERNAME.github.io
```

то `vite.config.js` может остаться без `base`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Маршруты сайта будут:

```txt
https://USERNAME.github.io/en
https://USERNAME.github.io/ru
https://USERNAME.github.io/en/work
```

---

## 14. Вариант B: GitHub Pages для project site `/repo-name/`

Если сайт открывается по адресу:

```txt
https://USERNAME.github.io/portfolio/
```

тогда Vite должен собирать ассеты с base:

```txt
/portfolio/
```

В `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/portfolio/",
  plugins: [react(), tailwindcss()],
});
```

Но важно: если используется `BrowserRouter`, нужно также учесть basename.

В `App.jsx`:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
  <ScrollToTop />
  <AppShell />
</BrowserRouter>
```

Для обычного деплоя в корень домена `BASE_URL` будет `/`.

Для GitHub Pages project site будет `/portfolio/`.

---

## 15. GitHub Actions workflow

Создай файл:

```txt
.github/workflows/deploy.yml
```

Содержимое:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 16. Настроить GitHub Pages

В репозитории GitHub:

```txt
Settings
→ Pages
→ Build and deployment
→ Source: GitHub Actions
```

После этого каждый push в `main` будет запускать деплой.

---

## 17. Проблема SPA fallback на GitHub Pages

GitHub Pages не умеет нормально переписывать все неизвестные URL на `index.html` как Vercel или nginx.

Что может произойти:

```txt
/en/work/synthetic-plant открывается при переходе внутри сайта
но после F5 появляется 404
```

Есть три решения.

---

## 18. Решение 1: использовать HashRouter

Самый простой технически, но URL менее красивые.

URL будут такими:

```txt
https://USERNAME.github.io/#/en
https://USERNAME.github.io/#/en/work
https://USERNAME.github.io/#/en/work/synthetic-plant
```

Для этого в `App.jsx` заменить:

```jsx
import { BrowserRouter } from "react-router-dom";
```

на:

```jsx
import { HashRouter } from "react-router-dom";
```

И заменить:

```jsx
<BrowserRouter>
  <ScrollToTop />
  <AppShell />
</BrowserRouter>
```

на:

```jsx
<HashRouter>
  <ScrollToTop />
  <AppShell />
</HashRouter>
```

Минус:

```txt
URL менее красивые
```

Плюс:

```txt
почти не надо настраивать сервер
хорошо работает на GitHub Pages
```

---

## 19. Решение 2: оставить BrowserRouter и добавить `404.html`

Можно использовать обходной путь: сделать `404.html`, который возвращает пользователя в приложение.

После сборки нужно, чтобы в `dist/` был файл:

```txt
404.html
```

Самый простой вариант — копировать `index.html` в `404.html`.

Добавь в `package.json` script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && cp dist/index.html dist/404.html",
    "preview": "vite preview"
  }
}
```

Для Windows `cp` может не сработать. Тогда лучше использовать Node-скрипт.

Создай файл:

```txt
scripts/copy-404.mjs
```

Содержимое:

```js
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("Copied dist/index.html to dist/404.html");
```

В `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build && node scripts/copy-404.mjs",
    "preview": "vite preview"
  }
}
```

Это не настоящий server rewrite, но для GitHub Pages часто достаточно.

---

## 20. Решение 3: использовать Vercel вместо GitHub Pages

Если нужны красивые URL без костылей:

```txt
/en/work/synthetic-plant
/ru/about
```

и чтобы всё работало после F5, проще использовать Vercel.

---

## 21. Проверка GitHub Pages

Проверить:

```txt
https://USERNAME.github.io/en
https://USERNAME.github.io/ru
https://USERNAME.github.io/en/work
https://USERNAME.github.io/ru/work
https://USERNAME.github.io/en/work/synthetic-plant
```

И обязательно:

```txt
Открыть deep link
Нажать F5
Проверить, что нет 404
```

---

# Часть 3. Публикация на обычном shared-хостинге

---

## 22. Что такое shared-хостинг в этом контексте

Российские хостинги вроде:

```txt
Beget
REG.RU
Timeweb
Sprinthost
Jino
другие Apache/nginx shared-хостинги
```

обычно позволяют загрузить файлы сайта через:

```txt
файловый менеджер панели управления
FTP
SFTP
SSH
```

Для React/Vite SPA тебе не нужен Node.js на сервере. Node нужен только локально или на build-сервере, чтобы собрать `dist/`.

На хостинг загружается уже готовая статическая сборка.

---

## 23. Общий пайплайн для shared-хостинга

Локально:

```bash
npm install
npm run build
```

После сборки появится:

```txt
dist/
```

На хостинг нужно загрузить **содержимое** папки `dist`, а не саму папку `dist`.

Правильно:

```txt
public_html/
├── index.html
├── assets/
└── projects/
```

Неправильно:

```txt
public_html/
└── dist/
    ├── index.html
    ├── assets/
    └── projects/
```

---

## 24. Куда загружать файлы

Название корневой папки зависит от хостинга.

Частые варианты:

```txt
public_html/
www/
www/domain.ru/
domains/domain.ru/public_html/
htdocs/
```

Нужна папка, из которой хостинг отдаёт сайт по домену.

Если сомневаешься — создай тестовый файл:

```txt
test.txt
```

с текстом:

```txt
hello
```

и проверь:

```txt
https://your-domain.ru/test.txt
```

Если файл открылся — это правильная папка.

---

## 25. Настройка fallback через `.htaccess` для Apache

На большинстве shared-хостингов работает Apache или Apache-compatible `.htaccess`.

В корне сайта рядом с `index.html` создай файл:

```txt
.htaccess
```

Содержимое:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^ index.html [L]
</IfModule>
```

Это означает:

```txt
если запрошенный файл существует — отдать его
если запрошенная папка существует — отдать её
иначе — отдать index.html
```

Так будут работать прямые ссылки:

```txt
/en/work/synthetic-plant
/ru/about
```

---

## 26. Если сайт лежит в подпапке

Например сайт открывается не так:

```txt
https://domain.ru/
```

а так:

```txt
https://domain.ru/portfolio/
```

Тогда нужно учитывать base.

В `vite.config.js`:

```js
export default defineConfig({
  base: "/portfolio/",
  plugins: [react(), tailwindcss()],
});
```

В `App.jsx`:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
  <ScrollToTop />
  <AppShell />
</BrowserRouter>
```

В `.htaccess` внутри папки `/portfolio/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /portfolio/

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^ index.html [L]
</IfModule>
```

---

## 27. Если на хостинге nginx

На VPS или некоторых хостингах может использоваться nginx.

Для nginx нужен `try_files`.

Пример server block:

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  root /var/www/example.com/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

После изменения конфига:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

На обычном shared-хостинге доступ к nginx config обычно не дают. Тогда нужно искать настройку fallback в панели или использовать Apache `.htaccess`, если он поддерживается.

---

## 28. Beget

Общий сценарий для Beget:

```txt
1. Собрать сайт локально: npm run build
2. Открыть панель Beget
3. Создать сайт / привязать домен
4. Открыть файловый менеджер или FTP/SFTP
5. Найти корневую папку сайта
6. Загрузить содержимое dist/
7. Добавить .htaccess для SPA fallback
8. Проверить /en, /ru и deep links
```

Для загрузки можно использовать:

```txt
файловый менеджер
FTP-клиент
SFTP-клиент
```

Например:

```txt
FileZilla
WinSCP
Cyberduck
```

---

## 29. REG.RU

Общий сценарий для REG.RU:

```txt
1. Собрать сайт локально: npm run build
2. Зайти в панель управления хостингом
3. Открыть файловый менеджер или подключиться по FTP/SFTP
4. Найти папку сайта
5. Очистить старые файлы, если нужно
6. Загрузить содержимое dist/
7. Добавить .htaccess
8. Проверить сайт
```

Проверить:

```txt
https://domain.ru/en
https://domain.ru/ru
https://domain.ru/en/work
https://domain.ru/ru/work/project-slug
```

Если при обновлении `/ru/work/project-slug` появляется 404 — не работает fallback. Проверить `.htaccess`.

---

## 30. Timeweb

Общий сценарий для Timeweb:

```txt
1. Собрать сайт локально: npm run build
2. Открыть панель Timeweb
3. Найти домен и корневую папку сайта
4. Загрузить содержимое dist/ через файловый менеджер, FTP или SFTP
5. Добавить .htaccess рядом с index.html
6. Проверить прямые URL
```

Важно: для такого статического сайта не нужно запускать Node.js на хостинге.

Node.js нужен только для сборки:

```txt
npm install
npm run build
```

После этого сервер отдаёт готовые HTML/CSS/JS-файлы.

---

## 31. Проверка shared-хостинга

После загрузки проверить:

```txt
https://domain.ru/en
https://domain.ru/ru
https://domain.ru/en/work
https://domain.ru/ru/work
https://domain.ru/en/work/synthetic-plant
https://domain.ru/ru/work/synthetic-plant
```

Потом обязательно проверить deep link:

```txt
1. Открыть https://domain.ru/ru/work/synthetic-plant
2. Нажать F5
3. Проверить, что нет 404
```

Если 404 есть:

```txt
.htaccess не загружен
.htaccess лежит не там
mod_rewrite отключён
сервер не Apache
сайт лежит в подпапке, но RewriteBase неправильный
```

---

# Часть 4. Публикация через Object Storage / S3

---

## 32. Когда выбирать Object Storage

Object Storage подходит, если:

```txt
сайт полностью статический
много изображений и видео
нужна хорошая отдача статики
планируется CDN
не нужен серверный backend
```

Российские варианты:

```txt
Yandex Object Storage
Selectel Object Storage
другие S3-compatible хранилища
```

---

## 33. Общий пайплайн Object Storage

```txt
1. Собрать сайт: npm run build
2. Создать bucket
3. Включить static website hosting
4. Сделать bucket публичным или настроить публичный доступ к объектам
5. Загрузить содержимое dist/
6. Настроить index document: index.html
7. Настроить error document: index.html или fallback/redirect на index.html
8. Подключить домен
9. Подключить HTTPS/CDN, если нужно
```

---

## 34. Важный момент про SPA fallback в Object Storage

Для SPA важно, чтобы запросы вроде:

```txt
/ru/work/synthetic-plant
```

возвращали:

```txt
index.html
```

В разных Object Storage это настраивается по-разному:

```txt
error document = index.html
routing rule / redirect
CDN rule
```

Если Object Storage не умеет нормально отдавать `index.html` для неизвестных путей, то возможны 404 при обновлении deep link.

В таком случае варианты:

```txt
использовать CDN с rewrite rules
использовать HashRouter
выбрать Vercel / VPS / хостинг с .htaccess
```

---

## 35. Yandex Object Storage

Общий сценарий:

```txt
1. Создать bucket
2. Включить hosting static website
3. Загрузить содержимое dist/
4. Указать index.html как главную страницу
5. Настроить страницу ошибки / redirect так, чтобы SPA-route возвращал index.html
6. Сделать файлы доступными публично
7. Подключить домен через DNS
8. При необходимости подключить CDN и сертификат
```

Проверить:

```txt
https://your-domain.ru/en
https://your-domain.ru/ru
https://your-domain.ru/ru/work/synthetic-plant
```

Обязательно нажать F5 на deep link.

---

## 36. Selectel Object Storage

Общий сценарий:

```txt
1. Создать S3 bucket
2. Включить static website hosting
3. Настроить index page
4. Настроить error page / fallback
5. Загрузить содержимое dist/
6. Настроить публичный доступ
7. Подключить домен
8. При необходимости подключить CDN
```

Для SPA особенно важно проверить:

```txt
/en/work/project-slug + F5
/ru/work/project-slug + F5
```

---

# Часть 5. Деплой на VPS

---

## 37. Когда выбирать VPS

VPS нужен, если:

```txt
хочется полный контроль над сервером
нужно настроить nginx
нужно несколько сайтов
нужно подключать backend в будущем
нужна кастомная инфраструктура
```

Для текущего статического портфолио VPS не обязателен. Vercel или обычного shared-хостинга достаточно.

---

## 38. Пример деплоя на VPS с nginx

Локально:

```bash
npm run build
```

Загрузить `dist/` на сервер, например:

```bash
scp -r dist/* user@server:/var/www/portfolio/
```

nginx config:

```nginx
server {
  listen 80;
  server_name example.com www.example.com;

  root /var/www/portfolio;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Проверка nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Для HTTPS обычно используют:

```bash
certbot
```

---

# Часть 6. Домен и DNS

---

## 39. Что такое DNS в этом контексте

Домен должен указывать на хостинг.

Обычно используются записи:

```txt
A      указывает домен на IP-адрес
CNAME  указывает поддомен на другой домен
TXT    нужен для подтверждений и сервисных настроек
```

Примеры:

```txt
example.com      A      123.123.123.123
www.example.com  CNAME  example.com
```

На Vercel чаще нужно прописать записи, которые показывает сама Vercel-панель.

На shared-хостинге можно:

```txt
использовать DNS хостинга
или прописать A-запись на IP хостинга
```

---

## 40. www и non-www

Лучше выбрать основную версию:

```txt
https://example.com
```

или:

```txt
https://www.example.com
```

И вторую версию редиректить на основную.

Например:

```txt
www.example.com → example.com
```

или наоборот.

---

## 41. HTTPS

Для production-сайта нужен HTTPS.

Обычно варианты:

```txt
Vercel — выпускает сертификат автоматически
GitHub Pages — поддерживает HTTPS для Pages
shared-хостинг — обычно Let's Encrypt в панели
VPS — certbot / Let's Encrypt
Object Storage — через CDN / сертификатный менеджер
```

После подключения домена проверить:

```txt
https://domain.ru/en
https://domain.ru/ru
```

---

# Часть 7. Обновление сайта после публикации

---

## 42. Vercel / GitHub Actions

Если сайт подключён к Git:

```bash
git add .
git commit -m "Update portfolio"
git push
```

После push хостинг сам соберёт и опубликует сайт.

---

## 43. Shared-хостинг вручную

Если деплой через FTP/SFTP:

```bash
npm run build
```

Затем:

```txt
1. Открыть dist/
2. Загрузить содержимое dist/ на сервер
3. Не забыть .htaccess
4. Проверить сайт
```

Если файлы старой сборки мешают, можно перед загрузкой очистить папку сайта, но осторожно:

```txt
не удаляй важные файлы хостинга
не удаляй папки почты / logs / service-файлы
```

Лучше очищать только файлы текущего сайта:

```txt
index.html
assets/
projects/
```

---

## 44. Object Storage вручную

```bash
npm run build
```

Затем загрузить содержимое `dist/` в bucket.

Важно:

```txt
старые assets могут остаться в bucket
это обычно не страшно
но можно периодически чистить старые файлы
```

Если используешь CDN, после обновления иногда нужно очистить cache.

---

# Часть 8. Чеклист перед production

---

## 45. Чеклист

```txt
[ ] npm install проходит
[ ] npm run dev работает
[ ] npm run build проходит
[ ] npm run preview работает
[ ] /en открывается
[ ] /ru открывается
[ ] /en/work открывается
[ ] /ru/work открывается
[ ] /en/work/project-slug открывается
[ ] /ru/work/project-slug открывается
[ ] переключатель EN/RU работает
[ ] все изображения загружаются
[ ] видео работают
[ ] прямые URL работают после F5
[ ] fallback на index.html настроен
[ ] домен подключён
[ ] HTTPS включён
[ ] нет красных ошибок в Console
[ ] нет битых ссылок на медиа
```

---

# Часть 9. Частые ошибки деплоя

---

## 46. После деплоя пустая страница

Проверить Console.

Частые причины:

```txt
неверный base в vite.config.js
сайт загружен в подпапку, но base не настроен
assets не загрузились
загружена папка dist внутрь public_html, а не содержимое dist
ошибка в путях к JS/CSS
```

---

## 47. Главная открывается, но `/en/work/project` даёт 404 после F5

Не настроен SPA fallback.

Решение:

```txt
Vercel — vercel.json rewrites
Apache — .htaccess
nginx — try_files
GitHub Pages — HashRouter или 404.html fallback
Object Storage — error document / redirect / CDN rewrite
```

---

## 48. Картинки не отображаются

Проверить пути.

Файл:

```txt
public/projects/robot-arm/cover.jpg
```

В коде:

```js
src: "/projects/robot-arm/cover.jpg"
```

После build файл должен оказаться здесь:

```txt
dist/projects/robot-arm/cover.jpg
```

Если его нет — файл лежит не в `public`.

---

## 49. На GitHub Pages не грузятся CSS/JS

Если сайт опубликован как project site:

```txt
https://USERNAME.github.io/portfolio/
```

проверь `vite.config.js`:

```js
export default defineConfig({
  base: "/portfolio/",
  plugins: [react(), tailwindcss()],
});
```

И `BrowserRouter`:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

---

## 50. На shared-хостинге скачивается файл вместо открытия сайта

Возможные причины:

```txt
неправильные MIME types
сервер неверно настроен
загружен архив, а не распакованные файлы
index.html отсутствует в корне сайта
```

Проверить, что в корне сайта есть:

```txt
index.html
assets/
projects/
.htaccess
```

---

## 51. `.htaccess` не работает

Возможные причины:

```txt
сервер не Apache
AllowOverride отключён
mod_rewrite отключён
.htaccess не загрузился, потому что файл скрытый
.htaccess лежит не в корне сайта
RewriteBase неправильный
```

На Windows скрытые файлы могут не отображаться. Проверь, что файл действительно называется:

```txt
.htaccess
```

а не:

```txt
.htaccess.txt
```

---

# Часть 10. Что выбрать

---

## 52. Рекомендация по выбору хостинга

### Самый простой вариант

```txt
Vercel
```

Подходит для:

```txt
быстрого деплоя
GitHub workflow
preview-ссылок
красивых URL
минимума ручной настройки
```

---

### Самый простой бесплатный вариант внутри GitHub

```txt
GitHub Pages
```

Подходит для:

```txt
публичного проекта
простого бесплатного хостинга
демо-версии
```

Но нужно учитывать SPA fallback.

---

### Российский shared-хостинг

```txt
Beget / REG.RU / Timeweb / аналогичный хостинг
```

Подходит, если:

```txt
домен и хостинг уже куплены
нужна российская инфраструктура
удобнее загружать файлы вручную
```

Главное:

```txt
загрузить содержимое dist/
добавить .htaccess
проверить deep links после F5
```

---

### Object Storage + CDN

```txt
Yandex Object Storage
Selectel Object Storage
```

Подходит, если:

```txt
много тяжёлых медиа
нужна хорошая отдача статики
нужен CDN
```

Главное:

```txt
настроить fallback для SPA
проверить direct links
```

---

## 53. Мой рекомендуемый вариант для этого портфолио

Для первой production-версии:

```txt
Vercel + GitHub + custom domain
```

Почему:

```txt
быстро
надёжно
минимум ручных действий
легко обновлять через git push
нормально работает React Router
удобно тестировать preview-ссылки
```

Если нужен именно российский хостинг:

```txt
Beget / Timeweb / REG.RU shared hosting
+
ручная загрузка dist/
+
.htaccess fallback
```

Если в будущем будет очень много видео и изображений:

```txt
Vercel для сайта
+
Object Storage / CDN для тяжёлых медиа
```
