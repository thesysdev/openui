# Contributing Guidelines

Thank you for considering contributing to _openui_! This document provides guidelines for contributing.

## How to Contribute

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`) & make your changes.
3. Ensure your code follows our style guidelines.
4. Update the README.md & autogenerate docs if needed.
5. Open a Pull Request

## Windows Setup

If you are setting up the project on Windows, the `build:templates` script in `openui-cli` uses Unix shell commands (`rm -rf`, `mkdir -p`, `cp -R`) which fail when pnpm defaults to CMD as its shell.

To fix this, point pnpm to Git Bash before running `pnpm install`:

```bash
pnpm config set script-shell "C:\Program Files\Git\bin\bash.exe"
```

> **Note:** This assumes Git is installed at the default location. If not, run `where git` to find the correct path and replace accordingly.

## Bug Reports

Use Github Issues to report bugs. When reporting bugs, please include:

- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Your environment details

## Questions?

We're happy to help! Feel free to open an issue for any questions or concerns.
You can also join our [Discord](https://discord.gg/Pbv5PsqUSv) to chat with the team
