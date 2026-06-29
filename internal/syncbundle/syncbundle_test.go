package syncbundle_test

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/store"
	"github.com/open-termkit/open-termkit/internal/syncbundle"
)

func TestExportImportRoundTrip(t *testing.T) {
	ctx := context.Background()
	src, err := store.Open(ctx, filepath.Join(t.TempDir(), "src.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer src.Close()

	ssh := models.NormalizeSSHProfile(models.SSHProfile{
		ID:           models.NewID("ssh"),
		Name:         "prod",
		Host:         "prod.example.com",
		User:         "deploy",
		IdentityFile: "/tmp/not-exported-as-content",
		Enabled:      true,
	})
	if err := src.CreateSSHProfile(ctx, ssh); err != nil {
		t.Fatal(err)
	}
	raw, err := syncbundle.Encode(ctx, src)
	if err != nil {
		t.Fatal(err)
	}

	dst, err := store.Open(ctx, filepath.Join(t.TempDir(), "dst.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer dst.Close()
	bundle, err := syncbundle.Import(ctx, dst, raw)
	if err != nil {
		t.Fatal(err)
	}
	if bundle.Version != syncbundle.BundleVersion {
		t.Fatalf("unexpected bundle version: %d", bundle.Version)
	}
	sshProfiles, err := dst.ListSSHProfiles(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(sshProfiles) != 1 || sshProfiles[0].IdentityFile != "/tmp/not-exported-as-content" {
		t.Fatalf("unexpected imported ssh profiles: %#v", sshProfiles)
	}
}
