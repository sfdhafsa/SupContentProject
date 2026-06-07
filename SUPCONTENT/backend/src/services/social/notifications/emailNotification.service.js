import net from 'net';
import tls from 'tls';
import { Buffer } from 'buffer';
import db from '../../../config/db.js';
import { UserModel } from '../../../models/user.model.js';
import { notificationTypes } from '../../../utils/notificationTypes.js';

const env = globalThis.process?.env || {};
const SMTP_TIMEOUT_MS = 10000;

const getSmtpConfig = () => ({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587', 10),
  user: env.SMTP_USER,
  pass: env.SMTP_PASSWORD,
  from: env.SMTP_FROM || env.SMTP_USER,
  secure: env.SMTP_SECURE === 'true',
});

const isConfigured = (config) =>
  config.host && config.port && config.from;

const extractEmailAddress = (value) => {
  const match = String(value).match(/<([^>]+)>/);
  return match ? match[1] : String(value);
};

const readResponse = (socket) => new Promise((resolve, reject) => {
  let buffer = '';
  const timer = globalThis.setTimeout(() => {
    cleanup();
    reject(new Error('SMTP response timeout'));
  }, SMTP_TIMEOUT_MS);

  const cleanup = () => {
    globalThis.clearTimeout(timer);
    socket.off('data', onData);
    socket.off('error', onError);
  };

  const onError = (err) => {
    cleanup();
    reject(err);
  };

  const onData = (chunk) => {
    buffer += chunk.toString('utf8');
    const lines = buffer.split(/\r?\n/).filter(Boolean);
    const lastLine = lines[lines.length - 1];

    if (/^\d{3} /.test(lastLine)) {
      cleanup();
      resolve(buffer);
    }
  };

  socket.on('data', onData);
  socket.on('error', onError);
});

const sendCommand = async (socket, command, expectedCodes, { sensitive = false } = {}) => {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);
  const code = parseInt(response.slice(0, 3), 10);

  if (!expectedCodes.includes(code)) {
    const label = sensitive ? '[sensitive]' : command;
    throw new Error(`SMTP command failed (${label}): ${response.trim()}`);
  }

  return response;
};

const connectSmtp = async (config) => new Promise((resolve, reject) => {
  const socket = config.secure
    ? tls.connect(config.port, config.host, { servername: config.host })
    : net.createConnection(config.port, config.host);

  const timer = globalThis.setTimeout(() => {
    socket.destroy();
    reject(new Error('SMTP connection timeout'));
  }, SMTP_TIMEOUT_MS);

  socket.once('error', (err) => {
    globalThis.clearTimeout(timer);
    reject(err);
  });

  socket.once('connect', async () => {
    try {
      await readResponse(socket);
      globalThis.clearTimeout(timer);
      resolve(socket);
    } catch (err) {
      globalThis.clearTimeout(timer);
      reject(err);
    }
  });
});

const upgradeToTls = async (socket, config) => new Promise((resolve, reject) => {
  const secureSocket = tls.connect({
    socket,
    servername: config.host,
  }, () => resolve(secureSocket));

  secureSocket.once('error', reject);
});

const encodeHeader = (value) => String(value).replace(/\r?\n/g, ' ');

const buildEmail = ({ from, to, subject, text }) => [
  `From: ${encodeHeader(from)}`,
  `To: ${encodeHeader(to)}`,
  `Subject: ${encodeHeader(subject)}`,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  '',
  text,
].join('\r\n');

const sendEmail = async ({ to, subject, text }) => {
  const config = getSmtpConfig();

  if (!isConfigured(config)) {
    globalThis.console.warn('[EMAIL] SMTP is not configured. Email notification skipped.');
    return false;
  }

  let socket = await connectSmtp(config);

  try {
    await sendCommand(socket, `EHLO ${env.SMTP_EHLO_DOMAIN || 'localhost'}`, [250]);

    if (!config.secure && env.SMTP_STARTTLS !== 'false') {
      await sendCommand(socket, 'STARTTLS', [220]);
      socket = await upgradeToTls(socket, config);
      await sendCommand(socket, `EHLO ${env.SMTP_EHLO_DOMAIN || 'localhost'}`, [250]);
    }

    if (config.user && config.pass) {
      await sendCommand(socket, 'AUTH LOGIN', [334]);
      await sendCommand(socket, Buffer.from(config.user).toString('base64'), [334], { sensitive: true });
      await sendCommand(socket, Buffer.from(config.pass).toString('base64'), [235], { sensitive: true });
    }

    await sendCommand(socket, `MAIL FROM:<${extractEmailAddress(config.from)}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
    await sendCommand(socket, 'DATA', [354]);

    const message = buildEmail({
      from: config.from,
      to,
      subject,
      text,
    }).replace(/^\./gm, '..');

    await sendCommand(socket, `${message}\r\n.`, [250]);
    await sendCommand(socket, 'QUIT', [221]);
    return true;
  } finally {
    socket.end();
  }
};

const findMovieById = async (movieId) => {
  if (!movieId) return null;

  const { rows } = await db.query(
    `SELECT id, title, external_id
     FROM movies
     WHERE id = $1`,
    [movieId]
  );

  return rows[0] || null;
};

const buildNotificationMessage = async ({ actorUserId, type, entityType, entityId }) => {
  const actor = actorUserId ? await UserModel.findById(actorUserId) : null;
  const actorName = actor?.username || 'Someone';

  if (type === notificationTypes.MOVIE_RECOMMENDATION && entityType === 'MOVIE_RECOMMENDATION') {
    const payload = JSON.parse(entityId || '{}');
    const [sourceMovie, recommendedMovie] = await Promise.all([
      findMovieById(payload.sourceMovieId),
      findMovieById(payload.recommendationMovieId),
    ]);

    if (sourceMovie?.title && recommendedMovie?.title) {
      return `because you added "${sourceMovie.title}", you might enjoy "${recommendedMovie.title}"`;
    }
  }

  if (type === notificationTypes.FOLLOW) {
    return `${actorName} started following you.`;
  }

  if (type === notificationTypes.REVIEW_LIKE) {
    return `${actorName} liked your review.`;
  }

  if (type === notificationTypes.REVIEW_COMMENT) {
    return `${actorName} commented on your review.`;
  }

  if (type === notificationTypes.COMMENT_REPLY) {
    return `${actorName} replied to your comment.`;
  }

  if (type === notificationTypes.MESSAGE) {
    return `${actorName} sent you a message.`;
  }

  return 'You have a new notification on SUPCONTENT.';
};

export const sendNotificationEmail = async ({
  userId,
  actorUserId = null,
  type,
  entityType = null,
  entityId = null,
}) => {
  const recipient = await UserModel.findById(userId);
  if (!recipient?.email) return false;

  const message = await buildNotificationMessage({
    actorUserId,
    type,
    entityType,
    entityId,
  });

  return await sendEmail({
    to: recipient.email,
    subject: 'SUPCONTENT notification',
    text: message,
  });
};
