import dotenv from "dotenv";
import { Bot, Context, Keyboard } from "grammy";

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

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function fetchBotUser(telegramId: number): Promise<{
  user: { name: string; avatar?: string; createdAt: string };
  activeTicketsCount: number;
} | null> {
  try {
    const res = await fetch(
      `${siteUrl}/api/bot/user?telegram_id=${telegramId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || !data?.user) return null;
    return {
      user: data.user,
      activeTicketsCount: data.activeTicketsCount ?? 0,
    };
  } catch {
    return null;
  }
}

function mainKeyboard(hasProfile: boolean) {
  const kb = new Keyboard();
  if (hasProfile) {
    kb.text("👤 Мой профиль").text("🎫 Проверить билет");
  } else {
    kb.text("Войти").text("🎫 Проверить билет");
  }
  kb.row().text("Помощь");
  return kb.resized();
}

bot.api.setMyCommands([
  { command: "start", description: "Запуск / меню" },
  { command: "help", description: "Как пользоваться" },
  { command: "login", description: "Ссылка для входа" },
]);

bot.command("start", async (ctx) => {
  const payload = (ctx.match || "").trim();
  const telegramId = ctx.from?.id;
  const profile = telegramId ? await fetchBotUser(telegramId) : null;
  const hasProfile = !!profile;

  if (payload === "login") {
    await ctx.reply(
      `Чтобы войти на сайт, открой страницу:\n${siteUrl}/login`,
      { reply_markup: mainKeyboard(hasProfile) },
    );
    return;
  }

  if (payload.startsWith("verify_")) {
    const code = payload.slice("verify_".length);
    await ctx.reply(
      `Код получен: ${code}\n\nОтправь этот код сюда текстом для проверки билета.`,
      { reply_markup: mainKeyboard(hasProfile) },
    );
    return;
  }

  const welcome = hasProfile
    ? `С возвращением, ${profile!.user.name}! 👋\n\nВыбери действие в меню ниже.`
    : "Привет! Я бот FactorKZ.\n\nНажми «Войти», чтобы авторизоваться на сайте, или «Проверить билет» для проверки QR-кода.";
  await ctx.reply(welcome, { reply_markup: mainKeyboard(hasProfile) });
});

bot.command("help", async (ctx) => {
  const profile = ctx.from?.id ? await fetchBotUser(ctx.from.id) : null;
  const text = profile
    ? "Здесь ты уже в аккаунте. Нажми «Мой профиль» для информации или «Проверить билет», чтобы ввести QR-код."
    : "Для входа открой сайт и авторизуйся через Telegram. Для проверки билета отправь сюда код вида QR-XXXXXXXXXXXX.";
  await ctx.reply(text, { reply_markup: mainKeyboard(!!profile) });
});

bot.command("login", async (ctx) => {
  const profile = ctx.from?.id ? await fetchBotUser(ctx.from.id) : null;
  const text = profile
    ? `Ты уже в аккаунте. Профиль на сайте:\n${siteUrl}/profile`
    : `Ссылка для входа:\n${siteUrl}/login`;
  await ctx.reply(text, { reply_markup: mainKeyboard(!!profile) });
});

bot.hears("Войти", async (ctx) => {
  const profile = ctx.from?.id ? await fetchBotUser(ctx.from.id) : null;
  if (profile) {
    await ctx.reply(
      `Ты уже в аккаунте. Нажми «Мой профиль» для информации или открой:\n${siteUrl}/profile`,
      { reply_markup: mainKeyboard(true) },
    );
  } else {
    await ctx.reply(`Открой страницу:\n${siteUrl}/login`, {
      reply_markup: mainKeyboard(false),
    });
  }
});

bot.hears("👤 Мой профиль", sendProfile);
bot.hears("Мой профиль", sendProfile);

async function sendProfile(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;
  const profile = await fetchBotUser(telegramId);
  if (!profile) {
    await ctx.reply("Сначала войди на сайт через кнопку «Войти».", {
      reply_markup: mainKeyboard(false),
    });
    return;
  }
  const { user, activeTicketsCount } = profile;
  const regDate = new Date(user.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const profileUrl = `${siteUrl}/profile`;
  const text =
    `👤 <b>Мой профиль</b>\n\n` +
    `├ Имя: <b>${escapeHtml(user.name)}</b>\n` +
    `├ В аккаунте с: ${regDate}\n` +
    `├ Активных билетов: <b>${activeTicketsCount}</b>\n` +
    `└ Профиль на сайте: ${profileUrl}`;
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard(true),
  });
}

bot.hears("Помощь", async (ctx) => {
  const profile = ctx.from?.id ? await fetchBotUser(ctx.from.id) : null;
  await ctx.reply(
    "По вопросам билетов и входа пиши в поддержку — контакты на сайте в разделе «Помощь».",
    { reply_markup: mainKeyboard(!!profile) },
  );
});

bot.hears("🎫 Проверить билет", async (ctx) => {
  const profile = ctx.from?.id ? await fetchBotUser(ctx.from.id) : null;
  await ctx.reply("Отправь сюда QR-код билета (например: QR-ABC123...)", {
    reply_markup: mainKeyboard(!!profile),
  });
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  if (!/^QR-[A-Z0-9-]{6,}$/i.test(text)) return;

  const telegramId = ctx.from?.id;
  const profile = telegramId ? await fetchBotUser(telegramId) : null;
  const hasProfile = !!profile;

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
          reply_markup: mainKeyboard(hasProfile),
        });
      } else if (reason === "not_found") {
        await ctx.reply("Билет с таким кодом не найден ❌", {
          reply_markup: mainKeyboard(hasProfile),
        });
      } else {
        await ctx.reply("Не удалось проверить билет. Попробуйте ещё раз позже.", {
          reply_markup: mainKeyboard(hasProfile),
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
      { reply_markup: mainKeyboard(hasProfile) },
    );
  } catch {
    await ctx.reply("Произошла ошибка при проверке билета. Попробуйте позже.", {
      reply_markup: mainKeyboard(hasProfile),
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

