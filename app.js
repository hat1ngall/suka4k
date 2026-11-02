import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createSessionToken, hashPassword, normalizeEmail, tokenHash, validPassword, verifyPassword } from './auth.js';
import { resolve } from 'node:path';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';
const CATALOG_PRODUCTS = Object.freeze(['Fortnite','Valorant','PUBG Mobile','Xbox','PlayStation Store','Zenless Zone Zero','Marvel Rivals','Roblox','Apple','Standoff 2','Minecraft','Google Play','Riot Games','Amazon','Netflix','Apex Legends','Electronic Arts','Battle.net','Steam Gifts','ExitLag','Telegram Stars','Nintendo','ChatGPT / OpenAI','Spotify','Free Fire','Steam','Honkai: Star Rail']);
const COOKIE = 'voreq_session';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '00'.repeat(64);
export function createApp(pool, { production = process.env.NODE_ENV === 'production', publicDir = resolve('public') } = {}) {
  const app = express();
  if (production) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '8kb' }));
  app.use(cookieParser());
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(['/api/auth', '/api/admin', '/api/promo'], (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const source = req.get('origin') || req.get('referer');
    try {
      const sourceUrl = new URL(source);
      if (sourceUrl.origin === `${req.protocol}://${req.get('host')}`) return next();
    } catch { /* reject absent or invalid Origin/Referer */ }
    return res.status(403).json({ error: 'Запрос отклонён. Обновите страницу и попробуйте снова.' });
  });
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Слишком много попыток. Попробуйте позже.' } });
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/', maxAge: MAX_AGE };
  const sendError = (res, error) => { console.error('Auth request failed:', error); res.status(500).json({ error: 'Ошибка сервера. Попробуйте позже.' }); };
  const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(error => sendError(res, error));
  const issueSession = async (res, user) => {
    const token = createSessionToken();
    await pool.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')', [tokenHash(token), user.id]);
    res.cookie(COOKIE, token, cookieOptions);
    return { id: user.id, email: user.email, nickname: user.nickname ?? null, bonus_balance: user.bonus_balance ?? 0 };
  };
  app.get('/api/health', wrap(async (req, res) => { await pool.query('SELECT 1'); res.json({ ok: true }); }));
  app.post('/api/auth/register', authLimiter, wrap(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!email || !validPassword(password)) return res.status(400).json({ error: 'Укажите корректную почту и пароль от 8 до 128 символов.' });
    const nickname = typeof req.body?.nickname === 'string' ? req.body.nickname.trim() : '';
    if (nickname.length < 2 || nickname.length > 40) return res.status(400).json({ error: 'Укажите никнейм от 2 до 40 символов.' });
    if (req.body?.consent !== true) return res.status(400).json({ error: 'Для регистрации необходимо согласие на обработку персональных данных.' });
    const passwordHash = await hashPassword(password);
    let result;
    try { result = await pool.query('INSERT INTO users (id, email, password_hash, nickname, consent_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, nickname, bonus_balance', [randomUUID(), email, passwordHash, nickname]); }
    catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'Аккаунт с такой почтой уже существует.' }); throw error; }
    return res.status(201).json({ user: await issueSession(res, result.rows[0]) });
  }));
  app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!email || !validPassword(password)) return res.status(401).json({ error: 'Неверная почта или пароль.' });
    const result = await pool.query('SELECT id, email, nickname, password_hash, bonus_balance FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!(await verifyPassword(password, user?.password_hash || DUMMY_HASH)) || !user) return res.status(401).json({ error: 'Неверная почта или пароль.' });
    return res.json({ user: await issueSession(res, user) });
  }));
  app.get('/api/auth/me', wrap(async (req, res) => {
    const token = req.cookies[COOKIE];
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return res.json({ user: null });
    const result = await pool.query('SELECT u.id, u.email, u.nickname, u.bonus_balance, u.purchase_blocked FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW()', [tokenHash(token)]);
    return res.json({ user: result.rows[0] || null });
  }));
  app.post('/api/auth/logout', wrap(async (req, res) => {
    const token = req.cookies[COOKIE];
    if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
    res.clearCookie(COOKIE, { httpOnly: true, secure: production, sameSite: 'lax', path: '/' });
    return res.json({ user: null });
  }));
  // The admin password is configured on the server, never in browser code.
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const adminSecretHash = adminPassword.length >= 16 ? createHash('sha256').update(adminPassword).digest('hex') : null;
  const adminCookie = 'mupple_admin';
  const adminOptions = { httpOnly: true, secure: production, sameSite: 'strict', path: '/api/admin', maxAge: 8 * 60 * 60 * 1000 };
  const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Слишком много попыток. Попробуйте позже.' } });
  const promoLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Слишком много запросов. Попробуйте позже.' } });
  const normalizePromo = value => typeof value === 'string' ? value.trim().toUpperCase() : '';
  const validPromo = code => /^[A-Z0-9_-]{3,32}$/.test(code);
  const requireAdmin = wrap(async (req, res, next) => {
    const token = req.cookies[adminCookie];
    if (!adminSecretHash || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: 'Войдите в админ-панель.' });
    const result = await pool.query('SELECT 1 FROM admin_sessions WHERE token_hash = $1 AND secret_hash = $2 AND expires_at > NOW()', [tokenHash(token), adminSecretHash]);
    if (!result.rows.length) return res.status(401).json({ error: 'Войдите в админ-панель.' });
    next();
  });
  app.post('/api/admin/login', adminLimiter, wrap(async (req, res) => {
    if (!adminSecretHash) return res.status(503).json({ error: 'Пароль администратора ещё не настроен на сервере.' });
    const password = typeof req.body?.password === 'string' && req.body.password.length <= 1024 ? req.body.password : '';
    const candidate = createHash('sha256').update(password).digest();
    if (!timingSafeEqual(candidate, Buffer.from(adminSecretHash, 'hex'))) return res.status(401).json({ error: 'Неверный пароль.' });
    const token = createSessionToken();
    await pool.query("INSERT INTO admin_sessions (token_hash, secret_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '8 hours')", [tokenHash(token), adminSecretHash]);
    res.cookie(adminCookie, token, adminOptions);
    return res.json({ ok: true });
  }));
  app.post('/api/admin/logout', requireAdmin, wrap(async (req, res) => {
    await pool.query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash(req.cookies[adminCookie])]);
    res.clearCookie(adminCookie, { httpOnly: true, secure: production, sameSite: 'strict', path: '/api/admin' });
    res.json({ ok: true });
  }));
  app.get('/api/admin/promos', requireAdmin, wrap(async (req, res) => {
    const result = await pool.query('SELECT code, percent, active, created_at FROM promo_codes ORDER BY created_at DESC');
    res.json({ promos: result.rows });
  }));
  app.post('/api/admin/promos', requireAdmin, wrap(async (req, res) => {
    const code = normalizePromo(req.body?.code);
    const percent = Number(req.body?.percent);
    if (!validPromo(code) || !Number.isInteger(percent) || percent < 1 || percent > 100) return res.status(400).json({ error: 'Код: 3–32 латинских буквы, цифры, _ или -. Скидка: от 1 до 100%.' });
    try {
      await pool.query('INSERT INTO promo_codes (code, percent) VALUES ($1, $2)', [code, percent]);
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Такой промокод уже существует.' });
      throw error;
    }
    res.status(201).json({ code, percent });
  }));
  app.post('/api/admin/promos/deactivate', requireAdmin, wrap(async (req, res) => {
    const code = normalizePromo(req.body?.code);
    if (!validPromo(code)) return res.status(400).json({ error: 'Некорректный промокод.' });
    const result = await pool.query('UPDATE promo_codes SET active = FALSE WHERE code = $1 RETURNING code', [code]);
    if (!result.rows.length) return res.status(404).json({ error: 'Промокод не найден.' });
    res.json({ ok: true });
  }));
  app.post('/api/admin/promos/delete', requireAdmin, wrap(async (req, res) => {
    const code = normalizePromo(req.body?.code);
    if (!validPromo(code)) return res.status(400).json({ error: 'Некорректный промокод.' });
    const result = await pool.query('DELETE FROM promo_codes WHERE code = $1 RETURNING code', [code]);
    if (!result.rows.length) return res.status(404).json({ error: 'Промокод не найден.' });
    res.json({ ok: true });
  }));
  // A sales row represents a confirmed paid order, not a browser-side cart.
  app.get('/api/admin/stats', requireAdmin, wrap(async (req, res) => {
    const periods = { day: 1, week: 7, month: 30 };
    const period = typeof req.query.period === 'string' && Object.hasOwn(periods, req.query.period) ? req.query.period : 'week';
    const users = await pool.query('SELECT COUNT(*)::integer AS total FROM users');
    const summary = await pool.query(`SELECT COUNT(*)::integer AS recorded_orders,
      COUNT(*) FILTER (WHERE (paid_at AT TIME ZONE 'Europe/Moscow')::date = (NOW() AT TIME ZONE 'Europe/Moscow')::date)::integer AS orders_today,
      COALESCE(SUM(rub_amount) FILTER (WHERE (paid_at AT TIME ZONE 'Europe/Moscow')::date = (NOW() AT TIME ZONE 'Europe/Moscow')::date), 0) AS rub_today,
      COALESCE(SUM(bonus_amount) FILTER (WHERE (paid_at AT TIME ZONE 'Europe/Moscow')::date = (NOW() AT TIME ZONE 'Europe/Moscow')::date), 0) AS bonus_today,
      COUNT(*) FILTER (WHERE bonus_amount > 0 AND (paid_at AT TIME ZONE 'Europe/Moscow')::date = (NOW() AT TIME ZONE 'Europe/Moscow')::date)::integer AS bonus_orders_today
      FROM sales_orders`);
    const daily = await pool.query(`WITH days AS (
      SELECT generate_series(((NOW() AT TIME ZONE 'Europe/Moscow')::date - ($1::integer - 1))::timestamp, ((NOW() AT TIME ZONE 'Europe/Moscow')::date)::timestamp, INTERVAL '1 day')::date AS day
    ) SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
      COUNT(sales_orders.id) FILTER (WHERE sales_orders.rub_amount > 0)::integer AS rub_orders,
      COUNT(sales_orders.id) FILTER (WHERE sales_orders.bonus_amount > 0)::integer AS bonus_orders
      FROM days LEFT JOIN sales_orders ON (sales_orders.paid_at AT TIME ZONE 'Europe/Moscow')::date = days.day
      GROUP BY days.day ORDER BY days.day`, [periods[period]]);
    const data = summary.rows[0];
    res.json({ registered_users: Number(users.rows[0].total), orders_available: Number(data.recorded_orders) > 0,
      orders_today: Number(data.orders_today), rub_today: Number(data.rub_today), bonus_today: Number(data.bonus_today),
      bonus_orders_today: Number(data.bonus_orders_today), period, timezone: 'Europe/Moscow', series: daily.rows });
  }));
  app.get('/api/admin/users', requireAdmin, wrap(async (req, res) => {
    const page = Math.max(1, Math.min(1000000, Number.parseInt(req.query.page, 10) || 1));
    const result = await pool.query('SELECT id, email, nickname, bonus_balance, purchase_blocked, created_at, consent_at FROM users ORDER BY created_at DESC, id LIMIT 51 OFFSET $1', [(page - 1) * 50]);
    res.json({ users: result.rows.slice(0, 50), page, has_more: result.rows.length > 50 });
  }));
  app.post('/api/admin/users/:id/block', requireAdmin, wrap(async (req, res) => {
    if (typeof req.body?.blocked !== 'boolean') return res.status(400).json({ error: 'Некорректное состояние блокировки.' });
    const result = await pool.query('UPDATE users SET purchase_blocked = $2 WHERE id = $1 RETURNING id, purchase_blocked', [req.params.id, req.body.blocked]);
    if (!result.rows.length) return res.status(404).json({ error: 'Пользователь не найден.' });
    res.json({ user: result.rows[0] });
  }));
  app.post('/api/admin/users/:id/bonus', requireAdmin, wrap(async (req, res) => {
    const value = req.body?.balance;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 999999999999.99 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) return res.status(400).json({ error: 'Укажите неотрицательный баланс с точностью до двух знаков.' });
    const result = await pool.query('UPDATE users SET bonus_balance = $2 WHERE id = $1 RETURNING id, bonus_balance', [req.params.id, value.toFixed(2)]);
    if (!result.rows.length) return res.status(404).json({ error: 'Пользователь не найден.' });
    res.json({ user: result.rows[0] });
  }));
  app.post('/api/admin/users/:id/password', requireAdmin, wrap(async (req, res) => {
    if (!validPassword(req.body?.password)) return res.status(400).json({ error: 'Пароль должен содержать от 8 до 128 символов.' });
    const passwordHash = await hashPassword(req.body.password);
    const result = await pool.query('WITH changed AS (UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id), revoked AS (DELETE FROM sessions WHERE user_id IN (SELECT id FROM changed)) SELECT id FROM changed', [req.params.id, passwordHash]);
    if (!result.rows.length) return res.status(404).json({ error: 'Пользователь не найден.' });
    res.json({ ok: true });
  }));
  const readPrices = async () => {
    const result = await pool.query('SELECT product_name, price_rub, updated_at FROM catalog_prices');
    const prices = new Map(result.rows.map(row => [row.product_name, row]));
    return CATALOG_PRODUCTS.map(name => ({ name, price_rub: prices.get(name)?.price_rub ?? null, updated_at: prices.get(name)?.updated_at ?? null }));
  };
  app.get('/api/catalog/prices', wrap(async (req, res) => res.json({ products: await readPrices() })));
  app.get('/api/admin/prices', requireAdmin, wrap(async (req, res) => res.json({ products: await readPrices() })));
  app.post('/api/admin/prices', requireAdmin, wrap(async (req, res) => {
    const { name, price } = req.body || {};
    if (!CATALOG_PRODUCTS.includes(name) || (price !== null && (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 9999999999.99 || Math.abs(price * 100 - Math.round(price * 100)) > 1e-6))) return res.status(400).json({ error: 'Укажите товар и корректную цену в рублях.' });
    await pool.query('INSERT INTO catalog_prices (product_name, price_rub) VALUES ($1, $2) ON CONFLICT (product_name) DO UPDATE SET price_rub = EXCLUDED.price_rub, updated_at = NOW()', [name, price === null ? null : price.toFixed(2)]);
    res.json({ ok: true });
  }));
  app.post('/api/promo/check', promoLimiter, wrap(async (req, res) => {
    const code = normalizePromo(req.body?.code);
    if (!validPromo(code)) return res.status(400).json({ error: 'Промокод не найден.' });
    const result = await pool.query('SELECT code, percent FROM promo_codes WHERE code = $1 AND active = TRUE', [code]);
    if (!result.rows.length) return res.status(404).json({ error: 'Промокод не найден или больше не действует.' });
    res.json(result.rows[0]);
  }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Страница не найдена.' }));
  app.use(express.static(publicDir, { extensions: ['html'] }));
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Некорректные данные.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Запрос слишком большой.' });
    return sendError(res, error);
  });
  return app;
}
