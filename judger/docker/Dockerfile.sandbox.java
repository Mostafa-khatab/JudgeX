# JudgeX Java Sandbox Image
# Minimal Alpine-based image for secure Java code execution

FROM eclipse-temurin:17-jdk-alpine

# Install essential tools
RUN apk add --no-cache \
    coreutils \
    && rm -rf /var/cache/apk/*

# Use existing non-root user (nobody - UID 65534)
# RUN adduser -D -u 65534 -s /bin/false sandbox

# Create sandbox directory with proper permissions
RUN mkdir -p /sandbox && chown nobody:nobody /sandbox

# Set working directory
WORKDIR /sandbox

# Switch to non-root user
USER nobody

# Default command
CMD ["sh"]
