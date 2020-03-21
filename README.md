# Server

Скелет серверного приложения с использованием exser.

## Требования

- Node.js >= 8
- MongoDB >= 3

## Конфигурация

Настроойки всех сервисов проекта в файле `./config.js`

Локальные настройки в `./config-local.js` В них переопределяются общие настройки на значения,
которые не должны попасть в репозиторий. Например параметры доступа к базе.

База данных будет создана автоматически с именем, указанным в конфиге.

## Запуск для разработки

`npm install` Установка пакетов при развертывании или обновлениии кода.

`npm run init` Инициализация первичных данных

`npm start` Запуск сервера. Автоматически создаётся база, коллекции, индексы, если чего-то нет.

## Production

#### Настройка nginx

Пример настройки сервера nginx. Нужно поменять домен и пути к проекту.
Через общий домен отдаётся фронт, проксируются вебсокеты и апи запросы в node.js

```
server {
    listen      80;

    server_name project-name.ylab.io;

    client_max_body_size 1g;
    proxy_request_buffering off;

    # proxy rest api
    location ~ ^/api.*$ {
        proxy_redirect          off;
        proxy_set_header Host $host;
        proxy_set_header    X-Real-IP           $remote_addr;
        proxy_set_header    X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto   $scheme;
        proxy_set_header    X-Frame-Options     SAMEORIGIN;
        proxy_pass http://127.0.0.1:8130;
    }

    # proxy websokets
    location /ws {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://127.0.0.1:8132;
    }

    # files from backend
    location /uploads/ {
        root /home/user/project-name/server/public;
        try_files $uri /index.html;
    }

    # front html
    location / {
        root /home/user/project-name/front/dist;
        try_files $uri /index.html;
    }
}
```

#### Запуск приложения

`npm install pm2 -g` Установка менеджера процессов PM2.

`npm run init` Иницалиазция перед первым запуском. Будут созданы первичные данные.

`pm2 start process.json` Запуск сервера.

_Готово!_

PS. Если приложение в контейнере docker, то можно обойтись без pm2 и запускать напрямую `npm start`

---

`pm2 stop project-name` Остановка.

`pm2 restart project-name` Запуск/перезапуск.

`pm2 delete project-name` Удаление сервера из менеджера процессов.

`pm2 monit` Мониторинг процесса.

`pm2 logs project-name` Просмотр логов процессов

