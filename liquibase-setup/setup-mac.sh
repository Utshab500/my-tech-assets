#!/bin/bash
# Bootstrap script for Liquibase development prerequisites on macOS.
# Safe to re-run: each step checks for existing state before acting.

# Liquibase requires Java; OpenJDK is the open-source distribution available via Homebrew.
if brew list openjdk &>/dev/null; then
  echo "=== OpenJDK already installed, skipping... ==="
else
  echo "=== Installing OpenJDK... ==="
  brew install openjdk
fi

# macOS does not pick up Homebrew-managed JDKs automatically.
# The symlink registers OpenJDK with the system Java launcher (/usr/libexec/java_home).
SYMLINK_PATH="/Library/Java/JavaVirtualMachines/openjdk.jdk"
if [ -e "$SYMLINK_PATH" ]; then
  echo "=== OpenJDK symlink already exists, skipping... ==="
else
  echo "=== Creating symlink for OpenJDK... ==="
  sudo ln -sfn "$(brew --prefix)/opt/openjdk/libexec/openjdk.jdk" "$SYMLINK_PATH"
fi

# JAVA_HOME must point to the Homebrew-managed JDK so that Maven and Liquibase
# resolve the correct runtime. grep guards against duplicate entries on re-runs.
ZSHRC="$HOME/.zshrc"
if ! grep -q 'JAVA_HOME=$(brew --prefix)/opt/openjdk' "$ZSHRC" 2>/dev/null; then
  echo "=== Adding JAVA_HOME exports to $ZSHRC... ==="
  {
    echo ''
    echo 'export JAVA_HOME=$(brew --prefix)/opt/openjdk'
    echo 'export PATH="$JAVA_HOME/bin:$PATH"'
  } >> "$ZSHRC"
  echo "=== JAVA_HOME exports added to $ZSHRC ==="
  source "$ZSHRC"
  echo "=== JAVA_HOME configured successfully ==="
else
  echo "=== JAVA_HOME already configured in $ZSHRC, skipping... ==="
fi

# Maven is the build tool used to run Liquibase via the liquibase-maven-plugin.
if brew list maven &>/dev/null; then
  echo "=== Maven already installed, skipping... ==="
else
  echo "=== Installing Maven... ==="
  brew install maven
fi

# Verify the installed versions so the caller can confirm everything is wired up correctly.
echo "=== Installed versions ==="
java --version
mvn --version
