# Microsoft Container Registry .NET Images

This guide provides information on using Microsoft's official .NET container images from the Microsoft Container Registry (MCR) with the Web3 Crypto Streaming platform.

## Available .NET Images

Microsoft provides a wide range of .NET container images for different purposes:

### Base Images

- **SDK Images**: Full .NET SDK for building and developing
  ```bash
  docker pull mcr.microsoft.com/dotnet/sdk:7.0
  docker pull mcr.microsoft.com/dotnet/sdk:6.0
  ```

- **ASP.NET Runtime**: Optimized for running ASP.NET Core web applications
  ```bash
  docker pull mcr.microsoft.com/dotnet/aspnet:7.0
  docker pull mcr.microsoft.com/dotnet/aspnet:6.0
  ```

- **Runtime**: .NET Runtime for running .NET applications
  ```bash
  docker pull mcr.microsoft.com/dotnet/runtime:7.0
  docker pull mcr.microsoft.com/dotnet/runtime:6.0
  ```

- **Runtime Dependencies**: Just the dependencies for the .NET Runtime
  ```bash
  docker pull mcr.microsoft.com/dotnet/runtime-deps:7.0
  docker pull mcr.microsoft.com/dotnet/runtime-deps:6.0
  ```

### Application Frameworks

- **ASP.NET Core**: For web applications and APIs
  ```bash
  docker pull mcr.microsoft.com/dotnet/aspnet:7.0
  ```

- **Blazor**: For Blazor WebAssembly apps
  ```bash
  docker pull mcr.microsoft.com/dotnet/aspnet:7.0 # Use with Blazor Server
  ```

### Application Infrastructure

- **Monitor**: For application monitoring
  ```bash
  docker pull mcr.microsoft.com/dotnet/monitor:7
  ```

### DevOps Tools

- **PowerShell**: For automation scripts
  ```bash
  docker pull mcr.microsoft.com/powershell:7.3
  ```

## Using .NET Images with Web3 Crypto Streaming Platform

### Development Workflow

1. **Local Development with SDK Image**

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src

# Copy csproj files for restore
COPY ["WebStreamClient/WebStreamClient.csproj", "WebStreamClient/"]
RUN dotnet restore "WebStreamClient/WebStreamClient.csproj"

# Copy all source code
COPY . .
WORKDIR "/src/WebStreamClient"

# Build the application
RUN dotnet build "WebStreamClient.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "WebStreamClient.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Create final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WebStreamClient.dll"]
```

### Multi-Stage Builds for Smaller Production Images

```dockerfile
# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["WebStreamClient.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

# Final Stage - Using runtime image for smaller size
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WebStreamClient.dll"]
```

### Using with Docker Compose

```yaml
version: '3.8'

services:
  web-client:
    image: mcr.microsoft.com/dotnet/aspnet:6.0
    volumes:
      - ./publish:/app
    working_dir: /app
    command: dotnet WebStreamClient.dll
    ports:
      - "5000:80"
    networks:
      - web3-network
    depends_on:
      - database
      
  api-service:
    build:
      context: ./APIService
      dockerfile: Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=database;Port=5432;Database=streamdb;User Id=dbuser;Password=dbpassword;
    ports:
      - "5001:80"
    networks:
      - web3-network
    depends_on:
      - database
      
  database:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - SA_PASSWORD=Your_Strong_Password
      - ACCEPT_EULA=Y
    volumes:
      - dbdata:/var/opt/mssql
    networks:
      - web3-network

networks:
  web3-network:
    driver: bridge

volumes:
  dbdata:
```

## Advanced Scenarios

### Including Entity Framework Migrations in Docker Build

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["StreamingService.csproj", "./"]
RUN dotnet restore
COPY . .

# Run migrations during build process
RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"
RUN dotnet ef migrations script -o /app/migrations.sql

# Continue with build and publish
RUN dotnet build -c Release -o /app/build
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /app/migrations.sql .
ENTRYPOINT ["dotnet", "StreamingService.dll"]
```

### Optimized Image for Stream Processing

For a service that processes streaming content:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["StreamProcessor.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/runtime:6.0 AS final
# Install FFmpeg for media processing
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*
    
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "StreamProcessor.dll"]
```

## MCR Image Versioning Strategy

When using MCR images, you can specify versions in different ways:

- **Major version only**: `mcr.microsoft.com/dotnet/sdk:6` (automatically uses the latest 6.x)
- **Major.Minor**: `mcr.microsoft.com/dotnet/sdk:6.0` (uses the latest 6.0.x)
- **Major.Minor.Patch**: `mcr.microsoft.com/dotnet/sdk:6.0.13` (specific version)
- **Latest**: `mcr.microsoft.com/dotnet/sdk:latest` (latest release, not recommended for production)

## Image Update Strategy

For production environments, use specific versions and update through your CI/CD pipeline:

```yaml
# In your CI/CD pipeline
steps:
  - name: Update Docker Image Tags
    run: |
      sed -i 's/mcr.microsoft.com\/dotnet\/aspnet:6.0.12/mcr.microsoft.com\/dotnet\/aspnet:6.0.13/' docker-compose.yml
      git commit -am "Update .NET images to 6.0.13"
      git push
```

## Security Best Practices

1. **Use Official Images**: Always use official Microsoft images from MCR
2. **Specific Versions**: Use specific versions rather than `latest` tag
3. **Minimal Base Images**: Use the smallest image that meets your needs (runtime vs SDK)
4. **Non-root User**: Run containers as non-root when possible
5. **Scan for Vulnerabilities**: Regularly scan images for vulnerabilities

Example of running as non-root:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
# ...build steps...

FROM base AS final
COPY --from=publish /app/publish .
USER appuser
ENTRYPOINT ["dotnet", "WebStreamClient.dll"]
```

## Common Issues and Solutions

### Issue: Build failures with compiler errors
* *Solution**: Ensure your .NET SDK version in the Dockerfile matches your project's target framework

### Issue: Connection refused when accessing services
* *Solution**: Verify that you're exposing the correct ports and that your service is listening on 0.0.0.0 (not localhost)

### Issue: Startup errors
* *Solution**: Check that all environment variables are properly configured in your docker-compose file

## Useful Commands

```bash
# List all containers
docker ps -a

# View logs
docker logs container_name

# Shell into container
docker exec -it container_name bash

# Build specific service
docker-compose build web-client

# Update single service
docker-compose up -d --no-deps --build web-client
```

For more information on Microsoft Container Registry images, visit the [official MCR catalog](https://mcr.microsoft.com/en-us/catalog).

