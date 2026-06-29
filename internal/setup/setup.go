package setup

import (
	"context"
	"os/exec"
	"time"

	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/store"
	"github.com/open-termkit/open-termkit/internal/tools"
)

type Result struct {
	Profiles []models.TerminalProfile `json:"profiles"`
	Tools    []models.Tool            `json:"tools"`
	State    map[string]any           `json:"state"`
}

func Run(ctx context.Context, s *store.Store) (Result, error) {
	if err := s.EnsureDefaultProfile(ctx); err != nil {
		return Result{}, err
	}
	detected, err := tools.DetectAndStore(ctx, s)
	if err != nil {
		return Result{}, err
	}
	if err := createPresetProfiles(ctx, s, detected); err != nil {
		return Result{}, err
	}
	if err := s.UpsertSetupState(ctx, "completedAt", time.Now().UTC()); err != nil {
		return Result{}, err
	}
	profiles, err := s.ListTerminalProfiles(ctx)
	if err != nil {
		return Result{}, err
	}
	state, err := s.ListSetupState(ctx)
	if err != nil {
		return Result{}, err
	}
	return Result{Profiles: profiles, Tools: detected, State: state}, nil
}

func createPresetProfiles(ctx context.Context, s *store.Store, detected []models.Tool) error {
	existing, err := s.ListTerminalProfiles(ctx)
	if err != nil {
		return err
	}
	has := func(name string) bool {
		for _, p := range existing {
			if p.Name == name {
				return true
			}
		}
		return false
	}
	create := func(name string, command string, args []string) error {
		if has(name) {
			return nil
		}
		p := models.DefaultTerminalProfile()
		p.ID = models.NewID("profile")
		p.Name = name
		p.ShellCommand = command
		p.Args = args
		p.IsDefault = false
		existing = append(existing, p)
		return s.CreateTerminalProfile(ctx, p)
	}
	if bash, err := exec.LookPath("bash"); err == nil {
		if err := create("Bash", bash, nil); err != nil {
			return err
		}
	}
	if zsh, err := exec.LookPath("zsh"); err == nil {
		if err := create("Zsh", zsh, nil); err != nil {
			return err
		}
	}
	for _, t := range detected {
		if !t.Installed || len(t.ProfileCommand) == 0 {
			continue
		}
		name := t.DisplayName
		if t.Name == "tmux" {
			name = "tmux main"
		}
		if err := create(name, t.ProfileCommand[0], t.ProfileCommand[1:]); err != nil {
			return err
		}
	}
	return nil
}
