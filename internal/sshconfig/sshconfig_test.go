package sshconfig_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/open-termkit/open-termkit/internal/app"
	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/sshconfig"
)

func TestImportKeyAndWriteConfig(t *testing.T) {
	root := t.TempDir()
	paths := app.Paths{
		HomeDir:          root,
		SSHDir:           filepath.Join(root, ".ssh"),
		SSHManagedDir:    filepath.Join(root, ".ssh", "open-termkit"),
		SSHManagedConfig: filepath.Join(root, ".ssh", "open-termkit", "config"),
		SSHUserConfig:    filepath.Join(root, ".ssh", "config"),
	}

	first, err := sshconfig.ImportKey(paths, strings.NewReader("PRIVATE KEY"), "id test")
	if err != nil {
		t.Fatal(err)
	}
	second, err := sshconfig.ImportKey(paths, strings.NewReader("PRIVATE KEY 2"), "id test")
	if err != nil {
		t.Fatal(err)
	}
	if first == second {
		t.Fatalf("expected duplicate import to choose a unique file")
	}
	info, err := os.Stat(first)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Fatalf("expected 0600 key permissions, got %v", info.Mode().Perm())
	}

	profiles := []models.SSHProfile{
		{ID: "ssh_1", Name: "dev", Host: "example.com", User: "lin", Port: 2222, IdentityFile: first, Enabled: true},
		{ID: "ssh_2", Name: "off", Host: "off.example.com", Enabled: false},
	}
	if err := sshconfig.WriteManagedConfig(paths, profiles); err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(paths.SSHManagedConfig)
	if err != nil {
		t.Fatal(err)
	}
	text := string(raw)
	if !strings.Contains(text, "Host dev") || !strings.Contains(text, "Port 2222") || strings.Contains(text, "off.example.com") {
		t.Fatalf("unexpected managed config:\n%s", text)
	}

	changed, err := sshconfig.EnsureInclude(paths)
	if err != nil {
		t.Fatal(err)
	}
	if !changed {
		t.Fatalf("expected first include call to modify user config")
	}
	changed, err = sshconfig.EnsureInclude(paths)
	if err != nil {
		t.Fatal(err)
	}
	if changed {
		t.Fatalf("expected second include call to be idempotent")
	}
}
