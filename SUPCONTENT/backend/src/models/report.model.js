import pool from "../config/db.js";

let reportStatusConstraintReady = false;

export const ReportModel = {
  async ensureStatusConstraint() {
    if (reportStatusConstraintReady) return;

    await pool.query(
      `
      UPDATE reports
      SET status = CASE
        WHEN status = 'APPROVED' THEN 'RESOLVED'
        WHEN status = 'REJECTED' THEN 'REVIEWED'
        ELSE status
      END
      WHERE status IN ('APPROVED', 'REJECTED');
      `
    );

    await pool.query(
      `
      ALTER TABLE reports
      DROP CONSTRAINT IF EXISTS reports_status_check;
      `
    );

    await pool.query(
      `
      ALTER TABLE reports
      ADD CONSTRAINT reports_status_check
      CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED'));
      `
    );

    reportStatusConstraintReady = true;
  },

  async create({
    reporter_user_id,
    target_type,
    target_id,
    reason,
  }) {
    await this.ensureStatusConstraint();

    const { rows } = await pool.query(
      `
      INSERT INTO reports (
        reporter_user_id,
        target_type,
        target_id,
        reason
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [
        reporter_user_id,
        target_type,
        target_id,
        reason,
      ]
    );

    return rows[0];
  },

  async findOpenByReporterAndTarget({
    reporter_user_id,
    target_type,
    target_id,
  }) {
    await this.ensureStatusConstraint();

    const { rows } = await pool.query(
      `
      SELECT *
      FROM reports
      WHERE reporter_user_id = $1
      AND target_type = $2
      AND target_id = $3
      AND status = 'PENDING'
      LIMIT 1;
      `,
      [
        reporter_user_id,
        target_type,
        target_id,
      ]
    );

    return rows[0] || null;
  },

  async findAll({ status } = {}) {
    await this.ensureStatusConstraint();

    const values = [];
    const statusFilter = status ? "WHERE r.status = $1" : "";

    if (status) {
      values.push(status);
    }

    const { rows } = await pool.query(
      `
      SELECT
        r.*,
        reporter.username AS reporter_username,
        handler.username AS handler_username,
        CASE
          WHEN r.target_type = 'REVIEW' THEN review_author.username
          WHEN r.target_type = 'COMMENT' THEN comment_author.username
          ELSE NULL
        END AS target_author_username,
        CASE
          WHEN r.target_type = 'REVIEW' THEN rv.text
          WHEN r.target_type = 'COMMENT' THEN c.text
          ELSE NULL
        END AS target_text
      FROM reports r
      JOIN users reporter ON reporter.id = r.reporter_user_id
      LEFT JOIN users handler ON handler.id = r.handled_by
      LEFT JOIN reviews rv ON r.target_type = 'REVIEW' AND rv.id = r.target_id
      LEFT JOIN users review_author ON review_author.id = rv.user_id
      LEFT JOIN comments c ON r.target_type = 'COMMENT' AND c.id = r.target_id
      LEFT JOIN users comment_author ON comment_author.id = c.user_id
      ${statusFilter}
      ORDER BY r.created_at DESC;
      `,
      values
    );

    return rows;
  },

  async findById(reportId) {
    await this.ensureStatusConstraint();

    const { rows } = await pool.query(
      `
      SELECT *
      FROM reports
      WHERE id = $1;
      `,
      [reportId]
    );

    return rows[0] || null;
  },

  async updateStatus({
    report_id,
    status,
    handled_by,
  }) {
    await this.ensureStatusConstraint();

    const { rows } = await pool.query(
      `
      UPDATE reports
      SET
        status = $1,
        handled_by = $2,
        handled_at = NOW()
      WHERE id = $3
      RETURNING *;
      `,
      [
        status,
        handled_by,
        report_id,
      ]
    );

    return rows[0] || null;
  },
};
