.PHONY: build test frontend backend dev-backend dev-frontend

build: frontend backend

frontend:
	cd web && npm install && npm run build

backend:
	go build -o bin/open-termkit ./cmd/open-termkit

test:
	go test ./...

dev-backend:
	go run ./cmd/open-termkit serve --port 8765

dev-frontend:
	cd web && npm install && npm run dev

