package models

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"os/exec"
	"strconv"
	"time"
)

type TerminalProfile struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	ShellCommand  string            `json:"shellCommand"`
	Args          []string          `json:"args"`
	Env           map[string]string `json:"env"`
	Cwd           string            `json:"cwd"`
	Theme         string            `json:"theme"`
	FontFamily    string            `json:"fontFamily"`
	FontSize      int               `json:"fontSize"`
	Keybindings   map[string]string `json:"keybindings"`
	WTermSettings map[string]any    `json:"wtermSettings"`
	IsDefault     bool              `json:"isDefault"`
	CreatedAt     time.Time         `json:"createdAt"`
	UpdatedAt     time.Time         `json:"updatedAt"`
}

type SSHProfile struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Host         string    `json:"host"`
	User         string    `json:"user"`
	Port         int       `json:"port"`
	IdentityFile string    `json:"identityFile"`
	ProxyJump    string    `json:"proxyJump"`
	Notes        string    `json:"notes"`
	Enabled      bool      `json:"enabled"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Setting struct {
	Key       string    `json:"key"`
	Value     any       `json:"value"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type InstallCommand struct {
	Label string   `json:"label"`
	Args  []string `json:"args"`
}

type Tool struct {
	Name            string           `json:"name"`
	DisplayName     string           `json:"displayName"`
	Category        string           `json:"category"`
	Binary          string           `json:"binary"`
	Installed       bool             `json:"installed"`
	Version         string           `json:"version"`
	InstallCommands []InstallCommand `json:"installCommands"`
	ProfileCommand  []string         `json:"profileCommand"`
	LastCheckedAt   time.Time        `json:"lastCheckedAt"`
}

func NewID(prefix string) string {
	var b [6]byte
	_, _ = rand.Read(b[:])
	return prefix + "_" + strconv.FormatInt(time.Now().UnixNano(), 36) + hex.EncodeToString(b[:])
}

func DefaultShellCommand() string {
	if zsh, err := exec.LookPath("zsh"); err == nil {
		return zsh
	}
	if shell := os.Getenv("SHELL"); shell != "" {
		if resolved, err := exec.LookPath(shell); err == nil {
			return resolved
		}
		if _, err := os.Stat(shell); err == nil {
			return shell
		}
	}
	if bash, err := exec.LookPath("bash"); err == nil {
		return bash
	}
	return "/bin/sh"
}

func DefaultTerminalProfile() TerminalProfile {
	shell := DefaultShellCommand()
	home, _ := os.UserHomeDir()

	now := time.Now().UTC()
	return TerminalProfile{
		ID:           NewID("profile"),
		Name:         "Local Shell",
		ShellCommand: shell,
		Args:         []string{},
		Env:          map[string]string{},
		Cwd:          home,
		Theme:        "monokai",
		FontFamily:   "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
		FontSize:     14,
		Keybindings:  map[string]string{},
		WTermSettings: map[string]any{
			"cursorBlink": true,
			"autoResize":  true,
		},
		IsDefault: true,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func NormalizeTerminalProfile(p TerminalProfile) TerminalProfile {
	if p.ID == "" {
		p.ID = NewID("profile")
	}
	if p.Name == "" {
		p.Name = "Untitled Profile"
	}
	if p.ShellCommand == "" {
		p.ShellCommand = DefaultShellCommand()
	}
	if p.Env == nil {
		p.Env = map[string]string{}
	}
	if p.Args == nil {
		p.Args = []string{}
	}
	if p.Keybindings == nil {
		p.Keybindings = map[string]string{}
	}
	if p.WTermSettings == nil {
		p.WTermSettings = map[string]any{}
	}
	if p.Theme == "" {
		p.Theme = "monokai"
	}
	if p.FontFamily == "" {
		p.FontFamily = "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace"
	}
	if p.FontSize == 0 {
		p.FontSize = 14
	}
	now := time.Now().UTC()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	p.UpdatedAt = now
	return p
}

func NormalizeSSHProfile(p SSHProfile) SSHProfile {
	if p.ID == "" {
		p.ID = NewID("ssh")
	}
	if p.Name == "" {
		p.Name = p.Host
	}
	if p.Port == 0 {
		p.Port = 22
	}
	now := time.Now().UTC()
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	p.UpdatedAt = now
	return p
}
