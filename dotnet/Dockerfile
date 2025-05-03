# Build Stage - Using Alpine-based SDK image for smaller size and better security
FROM mcr.microsoft.com/dotnet/sdk:6.0-alpine AS build
WORKDIR /src

# Install necessary build dependencies
RUN apk add --no-cache bash curl tzdata

# Copy csproj and restore dependencies
COPY ["WebStreamClient.csproj", "./"]
RUN dotnet restore -r linux-musl-x64

# Copy all files and build
COPY . .
RUN dotnet build "WebStreamClient.csproj" -c Release -o /app/build -r linux-musl-x64

# Publish the application
RUN dotnet publish "WebStreamClient.csproj" -c Release -o /app/publish -r linux-musl-x64 --no-restore --self-contained false

# Runtime Stage - Using Alpine-based runtime for optimal size
FROM mcr.microsoft.com/dotnet/aspnet:6.0-alpine AS runtime
WORKDIR /app

# Add timezone and curl support for healthchecks
RUN apk add --no-cache tzdata curl

# Create non-root user for better security
RUN adduser --disabled-password --gecos "" --home /app appuser && \
    chown -R appuser:appuser /app

# Copy published files from build stage
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app

# Set runtime environment variables
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    TZ=UTC \
    ASPNETCORE_URLS=http://+:5000

# Switch to non-root user
USER appuser

# Set health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD curl -f http://localhost:5000/health || exit 1

# Set the entrypoint
ENTRYPOINT ["dotnet", "WebStreamClient.dll"]
