# Docker Documentation

This directory contains Docker configuration files for containerizing the voting application.

## Files

- `Dockerfile` - Defines the container image for the application
- `docker-compose.yml` - Defines the multi-container setup
- `postgres_data/` - Directory for persistent PostgreSQL data

## Building and Running

### Build the Docker Image

```bash
make docker-build
```

### Run with Docker Compose

```bash
make docker-compose
```

## Available Docker Commands

- `make docker-build` - Build the Docker image
- `make docker-run` - Run the container
- `make docker-stop` - Stop running containers
- `make docker-clean` - Remove stopped containers
- `make docker-rm` - Remove the Docker image
- `make docker-save` - Save the image to a tar file
- `make docker-send` - Send the image to a remote server
- `make docker-load` - Load the image on a remote server

## Deployment

The application can be deployed to a remote server using the following steps:

1. Build and save the image:
   ```bash
   make docker-save
   ```

2. Send the image to the remote server:
   ```bash
   make docker-send
   ```

3. Load the image on the remote server:
   ```bash
   make docker-load
   ```

## Container Configuration

The application runs on port 1095 inside the container. Make sure this port is available on your host machine.

## Data Persistence

PostgreSQL data is persisted in the `postgres_data/` directory. This ensures that your data survives container restarts. 