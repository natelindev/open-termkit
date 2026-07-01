ARG GO_VERSION=1.26-alpine
ARG DEBIAN_VERSION=bookworm-slim

FROM --platform=$BUILDPLATFORM golang:${GO_VERSION} AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY cmd/ ./cmd/
COPY internal/ ./internal/
COPY web/embed.go ./web/embed.go
COPY web/dist ./web/dist

ARG TARGETOS=linux
ARG TARGETARCH
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o /out/open-termkit ./cmd/open-termkit

FROM debian:${DEBIAN_VERSION} AS runtime

LABEL org.opencontainers.image.title="open-termkit" \
      org.opencontainers.image.description="Local terminal environment with a Go API and embedded React web UI" \
      org.opencontainers.image.source="https://github.com/open-termkit/open-termkit"

RUN set -eux; \
    apt-get -o Acquire::Retries=5 update; \
    apt-get -o Acquire::Retries=5 install -y --no-install-recommends \
        bash \
        ca-certificates \
        openssh-client; \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 10001 open-termkit \
    && useradd --uid 10001 --gid open-termkit --create-home --home-dir /home/open-termkit --shell /bin/bash open-termkit \
    && mkdir -p /home/open-termkit/.open-termkit /home/open-termkit/.ssh \
    && chown -R open-termkit:open-termkit /home/open-termkit

COPY --from=builder /out/open-termkit /usr/local/bin/open-termkit

USER open-termkit
WORKDIR /home/open-termkit

ENV HOME=/home/open-termkit \
    SHELL=/bin/bash

EXPOSE 8765

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bash -ec 'exec 3<>/dev/tcp/127.0.0.1/8765; printf "GET /api/health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n" >&3; grep -q "\"ok\":true" <&3'

ENTRYPOINT ["open-termkit"]
CMD ["serve", "--host", "0.0.0.0", "--port", "8765"]
