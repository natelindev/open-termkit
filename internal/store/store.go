package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/open-termkit/open-termkit/internal/models"
	_ "modernc.org/sqlite"
)

type Store struct {
	db   *sql.DB
	path string
}

func Open(ctx context.Context, path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	s := &Store{db: db, path: path}
	if err := s.migrate(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}
	if err := s.EnsureDefaultProfile(ctx); err != nil {
		_ = db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) Path() string {
	return s.path
}

func (s *Store) DB() *sql.DB {
	return s.db
}

func (s *Store) migrate(ctx context.Context) error {
	stmts := []string{
		`PRAGMA foreign_keys = ON;`,
		`CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			applied_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS terminal_profiles (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			shell_command TEXT NOT NULL,
			args_json TEXT NOT NULL,
			env_json TEXT NOT NULL,
			cwd TEXT NOT NULL,
			theme TEXT NOT NULL,
			font_family TEXT NOT NULL,
			font_size INTEGER NOT NULL,
			keybindings_json TEXT NOT NULL,
			wterm_settings_json TEXT NOT NULL,
			is_default INTEGER NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS ssh_profiles (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			host TEXT NOT NULL,
			user TEXT NOT NULL,
			port INTEGER NOT NULL,
			identity_file TEXT NOT NULL,
			proxy_jump TEXT NOT NULL,
			notes TEXT NOT NULL,
			enabled INTEGER NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value_json TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS setup_state (
			key TEXT PRIMARY KEY,
			value_json TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS tools (
			name TEXT PRIMARY KEY,
			display_name TEXT NOT NULL,
			category TEXT NOT NULL,
			binary TEXT NOT NULL,
			installed INTEGER NOT NULL,
			version TEXT NOT NULL,
			install_commands_json TEXT NOT NULL,
			profile_command_json TEXT NOT NULL,
			last_checked_at TEXT NOT NULL
		);`,
		`INSERT OR IGNORE INTO schema_migrations(version, applied_at)
			VALUES (1, datetime('now'));`,
	}
	for _, stmt := range stmts {
		if _, err := s.db.ExecContext(ctx, stmt); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) EnsureDefaultProfile(ctx context.Context) error {
	var count int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM terminal_profiles`).Scan(&count); err != nil {
		return err
	}
	if count == 0 {
		return s.CreateTerminalProfile(ctx, models.DefaultTerminalProfile())
	}
	var defaultCount int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM terminal_profiles WHERE is_default = 1`).Scan(&defaultCount); err != nil {
		return err
	}
	if defaultCount > 0 {
		return nil
	}
	_, err := s.db.ExecContext(ctx, `UPDATE terminal_profiles SET is_default = 1 WHERE id = (SELECT id FROM terminal_profiles ORDER BY created_at ASC LIMIT 1)`)
	return err
}

func (s *Store) ListTerminalProfiles(ctx context.Context) ([]models.TerminalProfile, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, shell_command, args_json, env_json, cwd, theme, font_family, font_size, keybindings_json, wterm_settings_json, is_default, created_at, updated_at FROM terminal_profiles ORDER BY is_default DESC, name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var profiles []models.TerminalProfile
	for rows.Next() {
		p, err := scanTerminalProfile(rows)
		if err != nil {
			return nil, err
		}
		profiles = append(profiles, p)
	}
	return profiles, rows.Err()
}

func (s *Store) GetTerminalProfile(ctx context.Context, id string) (models.TerminalProfile, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id, name, shell_command, args_json, env_json, cwd, theme, font_family, font_size, keybindings_json, wterm_settings_json, is_default, created_at, updated_at FROM terminal_profiles WHERE id = ?`, id)
	return scanTerminalProfile(row)
}

func (s *Store) DefaultTerminalProfile(ctx context.Context) (models.TerminalProfile, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id, name, shell_command, args_json, env_json, cwd, theme, font_family, font_size, keybindings_json, wterm_settings_json, is_default, created_at, updated_at FROM terminal_profiles ORDER BY is_default DESC, created_at ASC LIMIT 1`)
	return scanTerminalProfile(row)
}

func (s *Store) CreateTerminalProfile(ctx context.Context, p models.TerminalProfile) error {
	p = models.NormalizeTerminalProfile(p)
	if p.IsDefault {
		if _, err := s.db.ExecContext(ctx, `UPDATE terminal_profiles SET is_default = 0`); err != nil {
			return err
		}
	}
	_, err := s.db.ExecContext(ctx, `INSERT INTO terminal_profiles (id, name, shell_command, args_json, env_json, cwd, theme, font_family, font_size, keybindings_json, wterm_settings_json, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.Name, p.ShellCommand, mustJSON(p.Args), mustJSON(p.Env), p.Cwd, p.Theme, p.FontFamily, p.FontSize, mustJSON(p.Keybindings), mustJSON(p.WTermSettings), boolInt(p.IsDefault), formatTime(p.CreatedAt), formatTime(p.UpdatedAt))
	return err
}

func (s *Store) UpdateTerminalProfile(ctx context.Context, p models.TerminalProfile) error {
	if p.ID == "" {
		return errors.New("profile id is required")
	}
	existing, err := s.GetTerminalProfile(ctx, p.ID)
	if err != nil {
		return err
	}
	p.CreatedAt = existing.CreatedAt
	p = models.NormalizeTerminalProfile(p)
	if p.IsDefault {
		if _, err := s.db.ExecContext(ctx, `UPDATE terminal_profiles SET is_default = 0 WHERE id <> ?`, p.ID); err != nil {
			return err
		}
	}
	res, err := s.db.ExecContext(ctx, `UPDATE terminal_profiles SET name = ?, shell_command = ?, args_json = ?, env_json = ?, cwd = ?, theme = ?, font_family = ?, font_size = ?, keybindings_json = ?, wterm_settings_json = ?, is_default = ?, updated_at = ? WHERE id = ?`,
		p.Name, p.ShellCommand, mustJSON(p.Args), mustJSON(p.Env), p.Cwd, p.Theme, p.FontFamily, p.FontSize, mustJSON(p.Keybindings), mustJSON(p.WTermSettings), boolInt(p.IsDefault), formatTime(p.UpdatedAt), p.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return s.EnsureDefaultProfile(ctx)
}

func (s *Store) DeleteTerminalProfile(ctx context.Context, id string) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM terminal_profiles WHERE id = ?`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return s.EnsureDefaultProfile(ctx)
}

func (s *Store) ListSSHProfiles(ctx context.Context) ([]models.SSHProfile, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, host, user, port, identity_file, proxy_jump, notes, enabled, created_at, updated_at FROM ssh_profiles ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	profiles := make([]models.SSHProfile, 0)
	for rows.Next() {
		p, err := scanSSHProfile(rows)
		if err != nil {
			return nil, err
		}
		profiles = append(profiles, p)
	}
	return profiles, rows.Err()
}

func (s *Store) GetSSHProfile(ctx context.Context, id string) (models.SSHProfile, error) {
	row := s.db.QueryRowContext(ctx, `SELECT id, name, host, user, port, identity_file, proxy_jump, notes, enabled, created_at, updated_at FROM ssh_profiles WHERE id = ?`, id)
	return scanSSHProfile(row)
}

func (s *Store) CreateSSHProfile(ctx context.Context, p models.SSHProfile) error {
	p = models.NormalizeSSHProfile(p)
	_, err := s.db.ExecContext(ctx, `INSERT INTO ssh_profiles (id, name, host, user, port, identity_file, proxy_jump, notes, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.Name, p.Host, p.User, p.Port, p.IdentityFile, p.ProxyJump, p.Notes, boolInt(p.Enabled), formatTime(p.CreatedAt), formatTime(p.UpdatedAt))
	return err
}

func (s *Store) UpdateSSHProfile(ctx context.Context, p models.SSHProfile) error {
	if p.ID == "" {
		return errors.New("ssh profile id is required")
	}
	existing, err := s.GetSSHProfile(ctx, p.ID)
	if err != nil {
		return err
	}
	p.CreatedAt = existing.CreatedAt
	p = models.NormalizeSSHProfile(p)
	res, err := s.db.ExecContext(ctx, `UPDATE ssh_profiles SET name = ?, host = ?, user = ?, port = ?, identity_file = ?, proxy_jump = ?, notes = ?, enabled = ?, updated_at = ? WHERE id = ?`,
		p.Name, p.Host, p.User, p.Port, p.IdentityFile, p.ProxyJump, p.Notes, boolInt(p.Enabled), formatTime(p.UpdatedAt), p.ID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *Store) DeleteSSHProfile(ctx context.Context, id string) error {
	res, err := s.db.ExecContext(ctx, `DELETE FROM ssh_profiles WHERE id = ?`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (s *Store) UpsertSetting(ctx context.Context, key string, value any) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
		key, mustJSON(value), formatTime(time.Now().UTC()))
	return err
}

func (s *Store) ListSettings(ctx context.Context) (map[string]any, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT key, value_json FROM settings ORDER BY key ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]any{}
	for rows.Next() {
		var key, raw string
		if err := rows.Scan(&key, &raw); err != nil {
			return nil, err
		}
		var value any
		if err := json.Unmarshal([]byte(raw), &value); err != nil {
			return nil, err
		}
		out[key] = value
	}
	return out, rows.Err()
}

func (s *Store) UpsertSetupState(ctx context.Context, key string, value any) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO setup_state (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
		key, mustJSON(value), formatTime(time.Now().UTC()))
	return err
}

func (s *Store) ListSetupState(ctx context.Context) (map[string]any, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT key, value_json FROM setup_state ORDER BY key ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]any{}
	for rows.Next() {
		var key, raw string
		if err := rows.Scan(&key, &raw); err != nil {
			return nil, err
		}
		var value any
		if err := json.Unmarshal([]byte(raw), &value); err != nil {
			return nil, err
		}
		out[key] = value
	}
	return out, rows.Err()
}

func (s *Store) UpsertTool(ctx context.Context, t models.Tool) error {
	_, err := s.db.ExecContext(ctx, `INSERT INTO tools (name, display_name, category, binary, installed, version, install_commands_json, profile_command_json, last_checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET display_name = excluded.display_name, category = excluded.category, binary = excluded.binary, installed = excluded.installed, version = excluded.version, install_commands_json = excluded.install_commands_json, profile_command_json = excluded.profile_command_json, last_checked_at = excluded.last_checked_at`,
		t.Name, t.DisplayName, t.Category, t.Binary, boolInt(t.Installed), t.Version, mustJSON(t.InstallCommands), mustJSON(t.ProfileCommand), formatTime(t.LastCheckedAt))
	return err
}

func (s *Store) ListTools(ctx context.Context) ([]models.Tool, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT name, display_name, category, binary, installed, version, install_commands_json, profile_command_json, last_checked_at FROM tools ORDER BY category ASC, display_name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Tool
	for rows.Next() {
		t, err := scanTool(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanTerminalProfile(row rowScanner) (models.TerminalProfile, error) {
	var p models.TerminalProfile
	var args, env, keybindings, wtermSettings, created, updated string
	var isDefault int
	err := row.Scan(&p.ID, &p.Name, &p.ShellCommand, &args, &env, &p.Cwd, &p.Theme, &p.FontFamily, &p.FontSize, &keybindings, &wtermSettings, &isDefault, &created, &updated)
	if err != nil {
		return p, err
	}
	_ = json.Unmarshal([]byte(args), &p.Args)
	_ = json.Unmarshal([]byte(env), &p.Env)
	_ = json.Unmarshal([]byte(keybindings), &p.Keybindings)
	_ = json.Unmarshal([]byte(wtermSettings), &p.WTermSettings)
	p.IsDefault = isDefault == 1
	p.CreatedAt = parseTime(created)
	p.UpdatedAt = parseTime(updated)
	return p, nil
}

func scanSSHProfile(row rowScanner) (models.SSHProfile, error) {
	var p models.SSHProfile
	var enabled int
	var created, updated string
	err := row.Scan(&p.ID, &p.Name, &p.Host, &p.User, &p.Port, &p.IdentityFile, &p.ProxyJump, &p.Notes, &enabled, &created, &updated)
	if err != nil {
		return p, err
	}
	p.Enabled = enabled == 1
	p.CreatedAt = parseTime(created)
	p.UpdatedAt = parseTime(updated)
	return p, nil
}

func scanTool(row rowScanner) (models.Tool, error) {
	var t models.Tool
	var installed int
	var commands, profileCommand, checked string
	err := row.Scan(&t.Name, &t.DisplayName, &t.Category, &t.Binary, &installed, &t.Version, &commands, &profileCommand, &checked)
	if err != nil {
		return t, err
	}
	_ = json.Unmarshal([]byte(commands), &t.InstallCommands)
	_ = json.Unmarshal([]byte(profileCommand), &t.ProfileCommand)
	t.Installed = installed == 1
	t.LastCheckedAt = parseTime(checked)
	return t, nil
}

func mustJSON(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		panic(fmt.Sprintf("marshal json: %v", err))
	}
	return string(b)
}

func boolInt(v bool) int {
	if v {
		return 1
	}
	return 0
}

func formatTime(t time.Time) string {
	if t.IsZero() {
		t = time.Now().UTC()
	}
	return t.UTC().Format(time.RFC3339Nano)
}

func parseTime(raw string) time.Time {
	t, err := time.Parse(time.RFC3339Nano, raw)
	if err != nil {
		return time.Time{}
	}
	return t
}
