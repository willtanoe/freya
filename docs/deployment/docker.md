# Docker Deployment

Freya provides Docker images for both CPU-only and GPU-accelerated deployments, along with a Docker Compose configuration that bundles the API server with an Ollama inference backend.

## Quick Start

The container binds `0.0.0.0`, so an **API key is required** — the server
refuses to start on a non-loopback address without one. Set it first:

```bash
cd deploy/docker
cp .env.example .env
echo "FREYA_API_KEY=$(freya auth generate-key)" > .env   # or paste your own
```

Then start both the API server and an Ollama backend with Docker Compose:

```bash
docker compose up -d
```

`docker compose` reads `FREYA_API_KEY` from `.env` (or your shell
environment) and fails fast if it is unset. Clients must then send
`Authorization: Bearer <key>` on `/v1/*` and `/api/*` requests.

This brings up two services:

| Service  | Port  | Description                        |
|----------|-------|------------------------------------|
| `freya` | 8000  | Freya API server              |
| `ollama` | 11434 | Ollama inference engine            |

Verify the server is running:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status": "ok"}
```

## Docker Images

### CPU-Only Image (`Dockerfile`)

The default `Dockerfile` uses a multi-stage build based on `python:3.12-slim` to produce a minimal image.

**Build stages:**

1. **Builder stage** -- installs `uv` and the `freya[server]` package (which includes FastAPI, uvicorn, and all server dependencies) from the project source.
2. **Runtime stage** -- copies only the installed Python packages and application code from the builder, keeping the final image small.

```dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app
COPY pyproject.toml README.md ./
COPY src/ src/

RUN pip install --no-cache-dir uv && \
    uv pip install --system ".[server]"

FROM python:3.12-slim

COPY --from=builder /usr/local /usr/local
COPY --from=builder /app /app
WORKDIR /app

EXPOSE 8000

ENTRYPOINT ["freya"]
CMD ["serve", "--host", "0.0.0.0", "--port", "8000"]
```

Build it manually:

```bash
docker build -t freya:latest .
```

Run it standalone:

```bash
docker run -d -p 8000:8000 freya:latest
```

### GPU Image (`Dockerfile.gpu`)

The GPU image is built on `nvidia/cuda:12.4.0-runtime-ubuntu22.04` and includes the CUDA 12.4 runtime libraries, enabling GPU-accelerated inference when paired with a GPU-capable engine like vLLM or SGLang.

```dockerfile
FROM nvidia/cuda:12.4.0-runtime-ubuntu22.04 AS builder

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml README.md ./
COPY src/ src/

RUN pip install --no-cache-dir uv && \
    uv pip install --system ".[server]"

FROM nvidia/cuda:12.4.0-runtime-ubuntu22.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local /usr/local
COPY --from=builder /app /app
WORKDIR /app

EXPOSE 8000

ENTRYPOINT ["freya"]
CMD ["serve", "--host", "0.0.0.0", "--port", "8000"]
```

Build the GPU image:

```bash
docker build -f Dockerfile.gpu -t freya:gpu .
```

Run with GPU access (requires the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)):

```bash
docker run -d --gpus all -p 8000:8000 freya:gpu
```

!!! note "NVIDIA Container Toolkit required"
    The host machine must have the NVIDIA Container Toolkit installed for `--gpus` to work. See the [NVIDIA installation guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) for setup instructions.

## Docker Compose Configuration

The `docker-compose.yml` defines a complete deployment with the Freya API server and an Ollama backend:

```yaml
version: "3.9"

services:
  freya:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - FREYA_ENGINE_DEFAULT=ollama
      - FREYA_OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama
    restart: unless-stopped

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    restart: unless-stopped

volumes:
  ollama-models:
```

### Environment Variables

The `freya` service is configured through environment variables:

| Variable                      | Description                                             | Default                    |
|-------------------------------|---------------------------------------------------------|----------------------------|
| `FREYA_ENGINE_DEFAULT`   | Inference engine backend to use                         | `ollama`                   |
| `FREYA_OLLAMA_HOST`      | URL of the Ollama server (uses Docker service name)     | `http://ollama:11434`      |

### Volumes

The `ollama-models` named volume persists downloaded models across container restarts, so models do not need to be re-pulled after a `docker compose down` / `docker compose up` cycle.

### Service Dependencies

The `freya` service declares `depends_on: ollama`, ensuring the Ollama container starts before the API server. Both services use `restart: unless-stopped` to automatically recover from crashes.

## Custom Configuration

### Mounting a Configuration File

To use a custom `config.toml`, mount it into the container at the expected path (`~/.freya/config.toml`, which is `/root/.freya/config.toml` in the container):

```yaml
services:
  freya:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./my-config.toml:/root/.freya/config.toml:ro
    environment:
      - FREYA_ENGINE_DEFAULT=ollama
      - FREYA_OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama
    restart: unless-stopped
```

### Persisting Data

To persist telemetry data, memory databases, and trace records across container restarts, mount the entire Freya data directory:

```yaml
services:
  freya:
    # ... other config ...
    volumes:
      - freya-data:/root/.freya

volumes:
  ollama-models:
  freya-data:
```

This preserves:

- `telemetry.db` -- inference call telemetry records
- `memory.db` -- the default SQLite memory backend
- `traces.db` -- interaction trace records
- `config.toml` -- user configuration

### Using the GPU Image with Compose

To use the GPU Dockerfile in your Compose setup, change the `dockerfile` field and add GPU resource reservations:

```yaml
services:
  freya:
    build:
      context: .
      dockerfile: Dockerfile.gpu
    ports:
      - "8000:8000"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    environment:
      - FREYA_ENGINE_DEFAULT=ollama
      - FREYA_OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama
    restart: unless-stopped
```

## Health Check

The API server exposes a `GET /health` endpoint that checks whether the underlying inference engine is responsive:

```bash
curl http://localhost:8000/health
```

A healthy response returns HTTP 200:

```json
{"status": "ok"}
```

An unhealthy engine returns HTTP 503:

```json
{"detail": "Engine unhealthy"}
```

You can integrate this into your Docker Compose healthcheck:

```yaml
services:
  freya:
    # ... other config ...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

## Building Custom Images

### Adding Extra Dependencies

To include additional engine backends (such as vLLM or ColBERT memory), modify the install command in the Dockerfile:

```dockerfile
RUN pip install --no-cache-dir uv && \
    uv pip install --system ".[server,inference-vllm,memory-colbert]"
```

### Overriding the Default Command

The entrypoint is `freya` and the default command is `serve --host 0.0.0.0 --port 8000`. Override the command to change server options:

```bash
docker run -d -p 9000:9000 freya:latest \
  serve --host 0.0.0.0 --port 9000 --engine ollama --model qwen3:8b
```

Or in Docker Compose:

```yaml
services:
  freya:
    build: .
    command: ["serve", "--host", "0.0.0.0", "--port", "9000", "--model", "qwen3:8b"]
    ports:
      - "9000:9000"
```

### Available CLI Options for `freya serve`

| Option               | Description                                         |
|----------------------|-----------------------------------------------------|
| `--host`             | Bind address (default: from config, typically `0.0.0.0`) |
| `--port`             | Port number (default: from config, typically `8000`)     |
| `-e` / `--engine`    | Engine backend (`ollama`, `vllm`, `llamacpp`, `sglang`)  |
| `-m` / `--model`     | Default model name                                       |
| `-a` / `--agent`     | Agent for non-streaming requests (`simple`, `orchestrator`, `react`, `openhands`) |

## Pulling Models

After starting the Ollama container, you need to pull at least one model before the API server can serve requests:

```bash
docker compose exec ollama ollama pull qwen3:8b
```

Verify models are available through the API:

```bash
curl http://localhost:8000/v1/models
```
