package ptyws

import "testing"

func TestTerminalEnvDefaultsRealTerminal(t *testing.T) {
	env := terminalEnv([]string{"PATH=/bin", "TERM=dumb"}, nil)
	values := envMap(env)
	if values["TERM"] != "xterm-256color" {
		t.Fatalf("expected TERM=xterm-256color, got %q in %#v", values["TERM"], env)
	}
	if values["COLORTERM"] != "truecolor" {
		t.Fatalf("expected COLORTERM=truecolor, got %q in %#v", values["COLORTERM"], env)
	}
}

func TestTerminalEnvProfileOverridesDefaults(t *testing.T) {
	env := terminalEnv([]string{"PATH=/bin"}, map[string]string{
		"TERM":      "screen-256color",
		"COLORTERM": "24bit",
	})
	values := envMap(env)
	if values["TERM"] != "screen-256color" {
		t.Fatalf("expected profile TERM override, got %q in %#v", values["TERM"], env)
	}
	if values["COLORTERM"] != "24bit" {
		t.Fatalf("expected profile COLORTERM override, got %q in %#v", values["COLORTERM"], env)
	}
}

func envMap(env []string) map[string]string {
	values := make(map[string]string, len(env))
	for _, item := range env {
		for i, ch := range item {
			if ch == '=' {
				values[item[:i]] = item[i+1:]
				break
			}
		}
	}
	return values
}
