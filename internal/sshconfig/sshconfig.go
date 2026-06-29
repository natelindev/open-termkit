package sshconfig

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/open-termkit/open-termkit/internal/app"
	"github.com/open-termkit/open-termkit/internal/models"
)

var safeNameRE = regexp.MustCompile(`[^A-Za-z0-9._-]+`)

func SafeKeyName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		name = "imported-key"
	}
	name = safeNameRE.ReplaceAllString(name, "-")
	name = strings.Trim(name, "-.")
	if name == "" {
		return "imported-key"
	}
	return name
}

func ImportKeyFromPath(paths app.Paths, sourcePath string, preferredName string) (string, error) {
	f, err := os.Open(sourcePath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	name := preferredName
	if name == "" {
		name = filepath.Base(sourcePath)
	}
	return ImportKey(paths, f, name)
}

func ImportKey(paths app.Paths, r io.Reader, preferredName string) (string, error) {
	if err := os.MkdirAll(paths.SSHManagedDir, 0o700); err != nil {
		return "", err
	}
	name := SafeKeyName(preferredName)
	target := filepath.Join(paths.SSHManagedDir, name)
	if _, err := os.Stat(target); err == nil {
		ext := filepath.Ext(name)
		stem := strings.TrimSuffix(name, ext)
		if stem == "" {
			stem = "imported-key"
		}
		for i := 1; ; i++ {
			candidate := filepath.Join(paths.SSHManagedDir, fmt.Sprintf("%s-%d%s", stem, i, ext))
			if _, err := os.Stat(candidate); os.IsNotExist(err) {
				target = candidate
				break
			}
		}
	}

	var buf bytes.Buffer
	if _, err := io.Copy(&buf, io.LimitReader(r, 4<<20)); err != nil {
		return "", err
	}
	if buf.Len() == 0 {
		return "", fmt.Errorf("private key is empty")
	}
	if err := os.WriteFile(target, buf.Bytes(), 0o600); err != nil {
		return "", err
	}
	if err := os.Chmod(target, 0o600); err != nil {
		return "", err
	}
	return target, nil
}

func WriteManagedConfig(paths app.Paths, profiles []models.SSHProfile) error {
	if err := os.MkdirAll(paths.SSHManagedDir, 0o700); err != nil {
		return err
	}
	var b strings.Builder
	b.WriteString("# Managed by open-termkit. Edit profiles in open-termkit instead of this file.\n\n")
	for _, p := range profiles {
		if !p.Enabled || p.Host == "" || p.Name == "" {
			continue
		}
		b.WriteString("Host " + escapeHostAlias(p.Name) + "\n")
		b.WriteString("  HostName " + p.Host + "\n")
		if p.User != "" {
			b.WriteString("  User " + p.User + "\n")
		}
		if p.Port > 0 && p.Port != 22 {
			b.WriteString(fmt.Sprintf("  Port %d\n", p.Port))
		}
		if p.IdentityFile != "" {
			b.WriteString("  IdentityFile " + p.IdentityFile + "\n")
			b.WriteString("  IdentitiesOnly yes\n")
		}
		if p.ProxyJump != "" {
			b.WriteString("  ProxyJump " + p.ProxyJump + "\n")
		}
		b.WriteString("\n")
	}
	if err := os.WriteFile(paths.SSHManagedConfig, []byte(b.String()), 0o600); err != nil {
		return err
	}
	return os.Chmod(paths.SSHManagedConfig, 0o600)
}

func EnsureInclude(paths app.Paths) (bool, error) {
	includeLine := "Include " + paths.SSHManagedConfig
	if err := os.MkdirAll(paths.SSHDir, 0o700); err != nil {
		return false, err
	}
	raw, err := os.ReadFile(paths.SSHUserConfig)
	if err != nil && !os.IsNotExist(err) {
		return false, err
	}
	if strings.Contains(string(raw), includeLine) || strings.Contains(string(raw), "Include ~/.ssh/open-termkit/config") {
		return false, nil
	}
	var b strings.Builder
	if len(raw) > 0 {
		b.Write(raw)
		if !strings.HasSuffix(string(raw), "\n") {
			b.WriteString("\n")
		}
	}
	b.WriteString("\n# open-termkit managed SSH profiles\n")
	b.WriteString(includeLine)
	b.WriteString("\n")
	if err := os.WriteFile(paths.SSHUserConfig, []byte(b.String()), 0o600); err != nil {
		return false, err
	}
	return true, os.Chmod(paths.SSHUserConfig, 0o600)
}

func escapeHostAlias(alias string) string {
	alias = strings.TrimSpace(alias)
	alias = strings.ReplaceAll(alias, " ", "-")
	return alias
}
