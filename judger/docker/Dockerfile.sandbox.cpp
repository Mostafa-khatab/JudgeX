# JudgeX C/C++ Sandbox Image
# Minimal Alpine-based image for secure code execution

FROM alpine:3.19

# Install C/C++ compiler and essential tools
RUN apk add --no-cache \
    gcc \
    g++ \
    libc-dev \
    libstdc++ \
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

# Default command (will be overridden)
CMD ["sh"]
