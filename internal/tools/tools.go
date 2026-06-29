package tools

import (
	"bytes"
	"context"
	"errors"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/store"
)

func Catalog() []models.Tool {
	return []models.Tool{
		{
			Name:            "tmux",
			DisplayName:     "tmux",
			Category:        "terminal",
			Binary:          "tmux",
			InstallCommands: packageCommands("tmux", "tmux"),
			ProfileCommand:  []string{"tmux", "new-session", "-A", "-s", "main"},
		},
		{
			Name:        "codex",
			DisplayName: "Codex CLI",
			Category:    "agent",
			Binary:      "codex",
			InstallCommands: []models.InstallCommand{
				{Label: "npm", Args: []string{"npm", "install", "-g", "@openai/codex"}},
			},
			ProfileCommand: []string{"codex"},
		},
		{
			Name:        "claude",
			DisplayName: "Claude Code",
			Category:    "agent",
			Binary:      "claude",
			InstallCommands: []models.InstallCommand{
				{Label: "npm", Args: []string{"npm", "install", "-g", "@anthropic-ai/claude-code"}},
			},
			ProfileCommand: []string{"claude"},
		},
		{
			Name:        "opencode",
			DisplayName: "opencode",
			Category:    "agent",
			Binary:      "opencode",
			InstallCommands: []models.InstallCommand{
				{Label: "npm", Args: []string{"npm", "install", "-g", "opencode-ai"}},
			},
			ProfileCommand: []string{"opencode"},
		},
		{
			Name:        "pi",
			DisplayName: "Pi",
			Category:    "agent",
			Binary:      "pi",
			InstallCommands: []models.InstallCommand{
				{Label: "npm", Args: []string{"npm", "install", "-g", "@earendil-works/pi-coding-agent"}},
			},
			ProfileCommand: []string{"pi"},
		},
	}
}

func Detect(ctx context.Context, catalog []models.Tool) []models.Tool {
	now := time.Now().UTC()
	out := make([]models.Tool, 0, len(catalog))
	for _, t := range catalog {
		t.LastCheckedAt = now
		if path, err := exec.LookPath(t.Binary); err == nil && path != "" {
			t.Installed = true
			t.Version = version(ctx, t.Binary)
		}
		out = append(out, t)
	}
	return out
}

func DetectAndStore(ctx context.Context, s *store.Store) ([]models.Tool, error) {
	tools := Detect(ctx, Catalog())
	for _, t := range tools {
		if err := s.UpsertTool(ctx, t); err != nil {
			return nil, err
		}
	}
	return tools, nil
}

func Install(ctx context.Context, t models.Tool, commandIndex int) (string, error) {
	if commandIndex < 0 || commandIndex >= len(t.InstallCommands) {
		return "", errors.New("install command index is out of range")
	}
	args := t.InstallCommands[commandIndex].Args
	if len(args) == 0 {
		return "", errors.New("install command is empty")
	}
	cmd := exec.CommandContext(ctx, args[0], args[1:]...)
	var buf bytes.Buffer
	cmd.Stdout = &buf
	cmd.Stderr = &buf
	err := cmd.Run()
	return buf.String(), err
}

func Find(catalog []models.Tool, name string) (models.Tool, bool) {
	for _, t := range catalog {
		if t.Name == name {
			return t, true
		}
	}
	return models.Tool{}, false
}

func packageCommands(display string, packageName string) []models.InstallCommand {
	var cmds []models.InstallCommand
	switch runtime.GOOS {
	case "darwin":
		cmds = append(cmds, models.InstallCommand{Label: "Homebrew", Args: []string{"brew", "install", packageName}})
	case "linux":
		cmds = append(cmds,
			models.InstallCommand{Label: "apt", Args: []string{"sudo", "apt-get", "install", "-y", packageName}},
			models.InstallCommand{Label: "dnf", Args: []string{"sudo", "dnf", "install", "-y", packageName}},
			models.InstallCommand{Label: "pacman", Args: []string{"sudo", "pacman", "-S", "--noconfirm", packageName}},
		)
	default:
		cmds = append(cmds, models.InstallCommand{Label: "manual", Args: []string{"echo", "Install " + display + " with your package manager"}})
	}
	return cmds
}

func version(parent context.Context, binary string) string {
	ctx, cancel := context.WithTimeout(parent, 3*time.Second)
	defer cancel()
	for _, args := range [][]string{{"--version"}, {"version"}, {"-V"}} {
		cmd := exec.CommandContext(ctx, binary, args...)
		raw, err := cmd.CombinedOutput()
		if err == nil {
			line := strings.TrimSpace(string(raw))
			if line != "" {
				if idx := strings.IndexByte(line, '\n'); idx >= 0 {
					line = line[:idx]
				}
				return line
			}
		}
	}
	return ""
}
