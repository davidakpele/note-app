const pool = require('../db/pool');

class NotesRepository {
  /**
   * Insert a new note row.
   * @param {{ title: string, content?: string }} 
   * @returns {Promise<Object>} 
   */
  async create({ title, content = null }) {
    const { rows } = await pool.query(
      `INSERT INTO notes (title, content)
       VALUES ($1, $2)
       RETURNING *`,
      [title, content]
    );
    return rows[0];
  }

  /**
   * Return all notes ordered newest-first.
   * @returns {Promise<Object[]>}
   */
  async findAll() {
    const { rows } = await pool.query(
      `SELECT * FROM notes ORDER BY created_at DESC`
    );
    return rows;
  }

  /**
   * Return a single note by primary key.
   * @param {string} id  UUID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT * FROM notes WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  }

  /**
   * Update title and/or content of an existing note.
   * @param {string} 
   * @param {{ title: string, content?: string }} 
   * @returns {Promise<Object|null>}
   */
  async update(id, { title, content = null }) {
    const { rows } = await pool.query(
      `UPDATE notes
          SET title   = $1,
              content = $2
        WHERE id = $3
        RETURNING *`,
      [title, content, id]
    );
    return rows[0] ?? null;
  }

  /**
   * Delete a note by primary key.
   * @param {string} id
   * @returns {Promise<boolean>} 
   */
  async delete(id) {
    const { rowCount } = await pool.query(
      `DELETE FROM notes WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }
}

module.exports = new NotesRepository();