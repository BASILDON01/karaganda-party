# Оплата через Kaspi и Halyk

Платформа поддерживает два режима оплаты:

- **Тестовый** (по умолчанию): при нажатии «Оплатить» билеты создаются сразу, без реального списания денег.
- **Боевой**: создаётся счёт у агрегатора → пользователь переходит на страницу оплаты (Kaspi Pay / Halyk) → после успешной оплаты вебхук подтверждает платёж → билеты создаются и появляются в «Мои билеты».

---

## 1. Режим и переменные окружения

В `.env.local` (и на сервере) задайте:

```env
# Режим: test — билеты сразу; live — редирект на оплату и вебхук
PAYMENT_MODE=test

# Для боевой оплаты (один из агрегаторов)
# ApiPay.kz (Kaspi Pay)
APIPAY_API_KEY=ваш_ключ
APIPAY_BASE_URL=https://api.apipay.kz

# Или общий ключ (если агрегатор один)
# PAYMENT_API_KEY=ваш_ключ

# URL сайта для ссылки «вернуться после оплаты»
NEXT_PUBLIC_APP_URL=https://ваш-сайт.kz
```

Пока `PAYMENT_MODE` не `live` или ключ не задан, используется тестовый режим.

---

## 2. Kaspi Pay (через ApiPay.kz)

1. Регистрация на [apipay.kz](https://apipay.kz).
2. Подключение Kaspi Business как «Кассир» (поддержка в WhatsApp).
3. В личном кабинете ApiPay получить **API ключ** и настроить **Webhook URL**:  
   `https://ваш-сайт.kz/api/payment/webhook`
4. В `.env.local` выставить:
   - `PAYMENT_MODE=live`
   - `APIPAY_API_KEY=...`
   - `APIPAY_BASE_URL=` — уточнить в документации ApiPay (например `https://api.apipay.kz` или другой из их инструкции).

Формат создания счёта в коде: `POST {APIPAY_BASE_URL}/v1/invoices` с телом:

- `amount` — сумма в тенге (число)
- `external_order_id` — наш `orderId`
- `description` — описание (например «Билеты: Название пати»)
- `return_url` — куда вернуть пользователя после оплаты (у нас уже подставляется `.../payment/success?orderId=...`)

Ответ агрегатора должен содержать ссылку на оплату в поле `payment_url`, `url` или `link`, и идентификатор счёта в `id` или `invoice_id`. Если у ApiPay другие имена полей — их можно добавить в `src/lib/payment-provider.ts`.

Вебхук от ApiPay должен передавать наш `external_order_id` и статус оплаты (`status: paid` или аналог). В `src/app/api/payment/webhook/route.ts` обрабатываются поля `external_order_id`, `order_id`, `status`, `id`/`invoice_id`.

---

## 3. Halyk Bank (через ePayment / Halyk ID)

Для приёма оплаты картами Halyk и Halyk ID используется платформа [epayment.kz](https://epayment.kz):

1. Обращение в Halyk: halykid@halykbank.kz для получения тестовых/боевых данных (TerminalID, ClientID, ClientSecret).
2. Документация API: [epayment.kz/docs](https://epayment.kz/docs/api).
3. Обычно нужен отдельный поток: OAuth → создание платежа → редирект на платёжную страницу. Его можно реализовать в том же `payment-provider.ts` (отдельная функция под ePayment) и вызывать из того же места, где сейчас вызывается `createPaymentInvoice`, в зависимости от `paymentMethod: 'halyk'`.

Сейчас в коде один провайдер (под ApiPay-подобный API). Для Halyk можно:

- добавить в `payment-provider.ts` ветку по `paymentMethod === 'halyk'`: получать токен ePayment, создавать платеж, возвращать `paymentUrl` и `invoiceId`;
- вебхук ePayment (если есть) настроить на тот же `POST /api/payment/webhook`, доработав разбор тела под их формат (маппинг их `order_id`/`invoice_id` и статуса на наш заказ).

---

## 4. Что уже сделано в коде

- **Заказы**: при выборе «Оплатить» в боевом режиме создаётся заказ в `data/orders.json`, вызывается агрегатор, пользователь перенаправляется на `paymentUrl`.
- **Возврат**: после оплаты пользователь попадает на `/payment/success?orderId=...`; страница опрашивает `GET /api/payment/order/[orderId]` и показывает «Оплата прошла» или «Ожидаем подтверждение».
- **Вебхук**: `POST /api/payment/webhook` принимает от агрегатора уведомление об оплате, находит заказ по `external_order_id`/`order_id`/`invoice_id`, помечает заказ как оплаченный, создаёт билеты и обновляет счётчики проданных.

Если у выбранного агрегатора другой формат запроса/ответа или вебхука — достаточно поправить `src/lib/payment-provider.ts` и `src/app/api/payment/webhook/route.ts` под их API.
