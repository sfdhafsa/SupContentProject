import db from '../../../config/db.js';
import { UserModel } from '../../../models/user.model.js';
import { notificationTypes } from '../../../utils/notificationTypes.js';

const env = globalThis.process?.env || {};

const getSmtpConfig = () => ({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587', 10),
  user: env.SMTP_USER,
  pass: env.SMTP_PASS || env.SMTP_PASSWORD,
  from: env.EMAIL_FROM || env.SMTP_FROM || env.SMTP_USER,
  secure: env.SMTP_SECURE === 'true',
});

const isConfigured = (config) =>
  config.host && config.port && config.from && config.user && config.pass;

const sendEmail = async ({ to, subject, text }) => {
  const config = getSmtpConfig();

  if (!isConfigured(config)) {
    globalThis.console.warn('[EMAIL] SMTP is not configured. Email notification skipped.');
    return false;
  }

  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    requireTLS: !config.secure && env.SMTP_STARTTLS !== 'false',
    ignoreTLS: !config.secure && env.SMTP_STARTTLS === 'false',
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
  });

  return true;
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

  if (type === notificationTypes.REPORT_CREATED) {
    return 'A new report is waiting for review in the admin panel.';
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
