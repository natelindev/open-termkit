package syncbundle

import (
	"context"
	"encoding/json"
	"time"

	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/store"
)

const BundleVersion = 1

type Bundle struct {
	Version          int                      `json:"version"`
	ExportedAt       time.Time                `json:"exportedAt"`
	TerminalProfiles []models.TerminalProfile `json:"terminalProfiles"`
	SSHProfiles      []models.SSHProfile      `json:"sshProfiles"`
	Settings         map[string]any           `json:"settings"`
	SetupState       map[string]any           `json:"setupState"`
	Tools            []models.Tool            `json:"tools"`
}

func Export(ctx context.Context, s *store.Store) (Bundle, error) {
	profiles, err := s.ListTerminalProfiles(ctx)
	if err != nil {
		return Bundle{}, err
	}
	sshProfiles, err := s.ListSSHProfiles(ctx)
	if err != nil {
		return Bundle{}, err
	}
	settings, err := s.ListSettings(ctx)
	if err != nil {
		return Bundle{}, err
	}
	setupState, err := s.ListSetupState(ctx)
	if err != nil {
		return Bundle{}, err
	}
	tools, err := s.ListTools(ctx)
	if err != nil {
		return Bundle{}, err
	}
	return Bundle{
		Version:          BundleVersion,
		ExportedAt:       time.Now().UTC(),
		TerminalProfiles: profiles,
		SSHProfiles:      sshProfiles,
		Settings:         settings,
		SetupState:       setupState,
		Tools:            tools,
	}, nil
}

func Encode(ctx context.Context, s *store.Store) ([]byte, error) {
	bundle, err := Export(ctx, s)
	if err != nil {
		return nil, err
	}
	return json.MarshalIndent(bundle, "", "  ")
}

func Import(ctx context.Context, s *store.Store, raw []byte) (Bundle, error) {
	var bundle Bundle
	if err := json.Unmarshal(raw, &bundle); err != nil {
		return Bundle{}, err
	}
	for _, p := range bundle.TerminalProfiles {
		if _, err := s.GetTerminalProfile(ctx, p.ID); err == nil {
			if err := s.UpdateTerminalProfile(ctx, p); err != nil {
				return Bundle{}, err
			}
			continue
		}
		if err := s.CreateTerminalProfile(ctx, p); err != nil {
			return Bundle{}, err
		}
	}
	for _, p := range bundle.SSHProfiles {
		if _, err := s.GetSSHProfile(ctx, p.ID); err == nil {
			if err := s.UpdateSSHProfile(ctx, p); err != nil {
				return Bundle{}, err
			}
			continue
		}
		if err := s.CreateSSHProfile(ctx, p); err != nil {
			return Bundle{}, err
		}
	}
	for k, v := range bundle.Settings {
		if err := s.UpsertSetting(ctx, k, v); err != nil {
			return Bundle{}, err
		}
	}
	for k, v := range bundle.SetupState {
		if err := s.UpsertSetupState(ctx, k, v); err != nil {
			return Bundle{}, err
		}
	}
	for _, t := range bundle.Tools {
		if err := s.UpsertTool(ctx, t); err != nil {
			return Bundle{}, err
		}
	}
	return bundle, nil
}
