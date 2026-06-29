package store_test

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/store"
)

func TestStoreTerminalAndSSHProfiles(t *testing.T) {
	ctx := context.Background()
	s, err := store.Open(ctx, filepath.Join(t.TempDir(), "open-termkit.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()

	profiles, err := s.ListTerminalProfiles(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(profiles) != 1 || !profiles[0].IsDefault {
		t.Fatalf("expected one default profile, got %#v", profiles)
	}

	p := models.DefaultTerminalProfile()
	p.ID = models.NewID("profile")
	p.Name = "Test Shell"
	p.ShellCommand = "/bin/sh"
	p.Args = []string{"-l"}
	p.IsDefault = true
	if err := s.CreateTerminalProfile(ctx, p); err != nil {
		t.Fatal(err)
	}
	got, err := s.GetTerminalProfile(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.Name != "Test Shell" || !got.IsDefault || len(got.Args) != 1 {
		t.Fatalf("unexpected profile: %#v", got)
	}

	got.Name = "Renamed"
	got.IsDefault = false
	if err := s.UpdateTerminalProfile(ctx, got); err != nil {
		t.Fatal(err)
	}
	updated, err := s.GetTerminalProfile(ctx, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if updated.Name != "Renamed" || updated.IsDefault {
		t.Fatalf("unexpected updated profile: %#v", updated)
	}
	profiles, err = s.ListTerminalProfiles(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defaults := 0
	for _, profile := range profiles {
		if profile.IsDefault {
			defaults++
		}
	}
	if defaults != 1 {
		t.Fatalf("expected store to repair a single default profile, got %d in %#v", defaults, profiles)
	}

	emptySSHProfiles, err := s.ListSSHProfiles(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if emptySSHProfiles == nil || len(emptySSHProfiles) != 0 {
		t.Fatalf("expected empty non-nil ssh profile list, got %#v", emptySSHProfiles)
	}

	ssh := models.NormalizeSSHProfile(models.SSHProfile{
		ID:      models.NewID("ssh"),
		Name:    "dev",
		Host:    "example.com",
		User:    "lin",
		Enabled: true,
	})
	if err := s.CreateSSHProfile(ctx, ssh); err != nil {
		t.Fatal(err)
	}
	sshProfiles, err := s.ListSSHProfiles(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(sshProfiles) != 1 || sshProfiles[0].Port != 22 {
		t.Fatalf("unexpected ssh profiles: %#v", sshProfiles)
	}
}
