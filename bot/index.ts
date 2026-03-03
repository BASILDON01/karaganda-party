import dotenv from "dotenv";
import { Bot, Keyboard } from "grammy";

// Load env from both .env and .env.local (Next-style)
dotenv.config();
dotenv.config({ path: ".env.local" });

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const token = requiredEnv("TELEGRAM_BOT_TOKEN");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const bot = new Bot(token);

bot.api.setMyCommands([
  { command: "start", description: "Запуск / меню" },
  { command: "help", description: "Как пользоваться" },
  { command: "login", description: "Ссылка для входа" },
]);

function mainKeyboard() {
  return new Keyboard()
    .text("Войти")
    .text("Проверить билет")
    .row()
    .text("Помощь")
    .resized();
}

bot.command("start", async (ctx) => {
  const payload = (ctx.match || "").trim();

  if (payload === "login") {
    await ctx.reply(
      `Чтобы войти на сайт, открой страницу:\n${siteUrl}/login`,
      { reply_markup: mainKeyboard() },
    );
    return;
  }

  if (payload.startsWith("verify_")) {
    const code = payload.slice("verify_".length);
    await ctx.reply(
      `Код получен: ${code}\n\nПроверка билетов пока не подключена к базе. Это следующий шаг.`,
      { reply_markup: mainKeyboard() },
    );
    return;
  }

  await ctx.reply(
    "Привет! Я бот FactorKZ.\n\n- Нажми «Войти» чтобы открыть страницу авторизации.\n- Нажми «Проверить билет» чтобы отправить QR-код.",
    { reply_markup: mainKeyboard() },
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Как пользоваться:\n\n1) Для входа: открой /login на сайте и авторизуйся через Telegram.\n2) Для проверки билета: отправь сюда код вида QR-XXXXXXXXXXXX.\n\nДальше можно подключить настоящую проверку (API + БД).",
    { reply_markup: mainKeyboard() },
  );
});

bot.command("login", async (ctx) => {
  await ctx.reply(`Ссылка для входа:\n${siteUrl}/login`, {
    reply_markup: mainKeyboard(),
  });
});

bot.hears("Войти", async (ctx) => {
  await ctx.reply(`Открой страницу:\n${siteUrl}/login`, {
    reply_markup: mainKeyboard(),
  });
});

bot.hears("Помощь", async (ctx) => {
  await ctx.reply(
    "Если что-то не работает, проверь переменные окружения (TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SITE_URL) и что бот запущен командой `npm run bot`.",
    { reply_markup: mainKeyboard() },
  );
});

bot.hears("Проверить билет", async (ctx) => {
  await ctx.reply("Отправь сюда QR-код билета (например: QR-ABC123...)", {
    reply_markup: mainKeyboard(),
  });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (!/^QR-[A-Z0-9-]{6,}$/i.test(text)) return;

  try {
    const res = await fetch(`${siteUrl}/api/tickets/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qrCode: text }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      const reason = data?.error;
      if (reason === "already_used") {
        await ctx.reply("Этот билет уже был использован ранее 🚫", {
          reply_markup: mainKeyboard(),
        });
      } else if (reason === "not_found") {
        await ctx.reply("Билет с таким кодом не найден ❌", {
          reply_markup: mainKeyboard(),
        });
      } else {
        await ctx.reply("Не удалось проверить билет. Попробуйте ещё раз позже.", {
          reply_markup: mainKeyboard(),
        });
      }
      return;
    }

    const ticket = data.ticket;
    await ctx.reply(
      [
        "✅ Билет действителен и помечен как использованный.",
        "",
        `Событие: ${ticket.party.name}`,
        `Тип: ${ticket.ticketType.name} x${ticket.quantity}`,
        `Место: ${ticket.party.venue.name}`,
      ].join("\n"),
      { reply_markup: mainKeyboard() },
    );
  } catch {
    await ctx.reply("Произошла ошибка при проверке билета. Попробуйте позже.", {
      reply_markup: mainKeyboard(),
    });
  }
});

bot.catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Bot error:", err);
});

async function main() {
  await bot.start({
    onStart: (info) => {
      // eslint-disable-next-line no-console
      console.log(`Bot started as @${info.username}`);
    },
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Bot failed to start:", e);
  process.exitCode = 1;
});

