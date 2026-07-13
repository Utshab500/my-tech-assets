# Quick Setup Steps
Here's how to install Java and Maven on Mac using Homebrew (the easiest approach):

**1. Install Homebrew** (if you don't have it)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**2. Install Java**
```bash
brew install openjdk
```
Then symlink it so macOS can find it:
```bash
sudo ln -sfn $(brew --prefix)/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk
```

**3. Add Java to your PATH**

Add this to your `~/.zshrc` (or `~/.bash_profile` if using bash):
```bash
export JAVA_HOME=$(brew --prefix)/opt/openjdk
export PATH="$JAVA_HOME/bin:$PATH"
```
Then reload it:
```bash
source ~/.zshrc
```

**4. Install Maven**
```bash
brew install maven
```

**5. Verify everything works**
```bash
java -version
mvn -version
```

You should see version info for both. That's it — Maven will use the Java you just installed automatically.

---

**Tip:** If you need to manage multiple Java versions (e.g. Java 17 and 21), look into `jenv` — it lets you switch between them per project.