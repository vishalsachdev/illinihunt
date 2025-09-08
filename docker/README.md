# IlliniHunt Docker Deployment

This document explains how to build and run the `illinihunt` application using Docker.

## Prerequisites

- Docker installed on your system.
- A `.env.local` file in the root of this project with your Supabase credentials. You can create one by copying `.env.example`.

## Building the Image

To build the Docker image, run the following command from the root of this project:

```bash
docker build -f docker/Dockerfile -t illinihunt .
```

## Running the Container

To run the container locally, use the following command. This will use the `.env.local` file from your project root.

```bash
docker run -d -p 8080:80 --env-file .env.local --name illinihunt-app illinihunt
```

The application will be available at [http://localhost:8080](http://localhost:8080).

## Multi-Platform Builds

To build an image that is compatible with both ARM and AMD/Intel architectures (for example, for deploying to a Kubernetes cluster with a different architecture than your local machine), use the `docker buildx` command:

```bash
docker buildx build --platform linux/amd64,linux/arm64 -f docker/Dockerfile -t <your-registry>/illinihunt . --push
```
Replace `<your-registry>` with the path to your Docker registry.