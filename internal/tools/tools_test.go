package tools_test

import (
	"testing"

	"github.com/open-termkit/open-termkit/internal/tools"
)

func TestCatalogContainsCoreTools(t *testing.T) {
	catalog := tools.Catalog()
	want := map[string]bool{"tmux": false, "codex": false, "claude": false, "opencode": false, "pi": false}
	for _, tool := range catalog {
		if _, ok := want[tool.Name]; ok {
			want[tool.Name] = true
			if tool.Binary == "" || len(tool.InstallCommands) == 0 {
				t.Fatalf("tool %s is missing binary or install commands", tool.Name)
			}
		}
	}
	for name, found := range want {
		if !found {
			t.Fatalf("catalog missing %s", name)
		}
	}
}
