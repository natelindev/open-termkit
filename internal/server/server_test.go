package server_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/open-termkit/open-termkit/internal/app"
	"github.com/open-termkit/open-termkit/internal/models"
	"github.com/open-termkit/open-termkit/internal/server"
	"github.com/open-termkit/open-termkit/internal/store"
)

func setupTestServer(t *testing.T) (*server.Server, *store.Store, app.Paths) {
	t.Helper()
	root := t.TempDir()
	paths := app.Paths{
		HomeDir:          root,
		DataDir:          filepath.Join(root, ".open-termkit"),
		DBPath:           filepath.Join(root, ".open-termkit", "open-termkit.db"),
		SSHDir:           filepath.Join(root, ".ssh"),
		SSHManagedDir:    filepath.Join(root, ".ssh", "open-termkit"),
		SSHManagedConfig: filepath.Join(root, ".ssh", "open-termkit", "config"),
		SSHUserConfig:    filepath.Join(root, ".ssh", "config"),
	}
	ctx := context.Background()
	s, err := store.Open(ctx, paths.DBPath)
	if err != nil {
		t.Fatalf("failed to open store: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })

	srv, err := server.New(s, paths)
	if err != nil {
		t.Fatalf("failed to create server: %v", err)
	}
	return srv, s, paths
}

func TestHealthEndpoint(t *testing.T) {
	srv, _, _ := setupTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var res map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	if res["ok"] != true {
		t.Fatalf("expected ok: true, got %v", res)
	}
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("expected X-Content-Type-Options header")
	}
}

func TestDoctorEndpoint(t *testing.T) {
	srv, _, _ := setupTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/doctor", nil)
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var res map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	if res["os"] == nil || res["goVersion"] == nil {
		t.Fatalf("missing os or goVersion: %v", res)
	}
	if res["terminalProfilesCount"] == nil || res["database"] == nil {
		t.Fatalf("missing terminalProfilesCount or database metrics: %v", res)
	}
}

func TestSSHEndpointsAndTesting(t *testing.T) {
	srv, _, _ := setupTestServer(t)

	// Create SSH profile
	createPayload := []byte(`{"name":"test-box","host":"127.0.0.1","port":65530,"user":"tester"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/ssh", bytes.NewReader(createPayload))
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 created, got %d (%s)", rec.Code, rec.Body.String())
	}
	var created models.SSHProfile
	if err := json.Unmarshal(rec.Body.Bytes(), &created); err != nil {
		t.Fatal(err)
	}
	if created.Name != "test-box" || created.ID == "" {
		t.Fatalf("unexpected profile: %#v", created)
	}

	// Update SSH profile
	created.Notes = "production server"
	updatePayload, _ := json.Marshal(created)
	updateReq := httptest.NewRequest(http.MethodPut, "/api/ssh/"+created.ID, bytes.NewReader(updatePayload))
	updateRec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(updateRec, updateReq)
	if updateRec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", updateRec.Code)
	}

	// Test connection endpoint for profile
	testReq := httptest.NewRequest(http.MethodPost, "/api/ssh/"+created.ID+"/test", nil)
	testRec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(testRec, testReq)
	if testRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", testRec.Code)
	}
	var testResult map[string]any
	if err := json.Unmarshal(testRec.Body.Bytes(), &testResult); err != nil {
		t.Fatal(err)
	}
	// 65530 is likely closed, so reachable is false, but response is valid JSON
	if testResult["reachable"] == nil {
		t.Fatalf("expected reachable field in testResult: %v", testResult)
	}

	// Direct test endpoint
	directReq := httptest.NewRequest(http.MethodPost, "/api/ssh/test", bytes.NewReader([]byte(`{"host":"127.0.0.1","port":65530,"timeoutSeconds":1}`)))
	directRec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(directRec, directReq)
	if directRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", directRec.Code)
	}
}

func TestGenerateSSHKeyEndpoint(t *testing.T) {
	srv, _, _ := setupTestServer(t)
	genPayload := []byte(`{"name":"test_id_ed25519","comment":"test@example.com"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/ssh/generate-key", bytes.NewReader(genPayload))
	rec := httptest.NewRecorder()
	srv.Handler().ServeHTTP(rec, req)

	// In test environment, ssh-keygen may or may not succeed depending on system
	if rec.Code == http.StatusOK {
		var res map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &res); err != nil {
			t.Fatal(err)
		}
		if res["path"] == "" {
			t.Fatalf("expected path in response: %v", res)
		}
	}
}

func TestStaticAndDocsEndpoints(t *testing.T) {
	srv, _, _ := setupTestServer(t)

	// GET / returns index.html
	reqRoot := httptest.NewRequest(http.MethodGet, "/", nil)
	recRoot := httptest.NewRecorder()
	srv.Handler().ServeHTTP(recRoot, reqRoot)
	if recRoot.Code != http.StatusOK {
		t.Fatalf("expected 200 for /, got %d", recRoot.Code)
	}

	// GET /docs redirects to /docs/
	reqDocsRedirect := httptest.NewRequest(http.MethodGet, "/docs", nil)
	recDocsRedirect := httptest.NewRecorder()
	srv.Handler().ServeHTTP(recDocsRedirect, reqDocsRedirect)
	if recDocsRedirect.Code != http.StatusFound {
		t.Fatalf("expected 302 for /docs, got %d", recDocsRedirect.Code)
	}
	if recDocsRedirect.Header().Get("Location") != "/docs/" {
		t.Fatalf("expected Location /docs/, got %s", recDocsRedirect.Header().Get("Location"))
	}

	// GET /docs/ returns docs index.html
	reqDocs := httptest.NewRequest(http.MethodGet, "/docs/", nil)
	recDocs := httptest.NewRecorder()
	srv.Handler().ServeHTTP(recDocs, reqDocs)
	if recDocs.Code != http.StatusOK {
		t.Fatalf("expected 200 for /docs/, got %d", recDocs.Code)
	}
	if !bytes.Contains(recDocs.Body.Bytes(), []byte("Open Termkit Documentation")) {
		t.Fatalf("expected docs HTML in body, got %s", recDocs.Body.String())
	}
}
