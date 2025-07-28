# Contributing to BambooHR MCP Server

Thank you for your interest in contributing to the BambooHR MCP Server! This is an unofficial, community-driven open source project that helps integrate BambooHR with Claude Desktop.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
- Check if the bug has already been reported by searching existing [issues](../../issues)
- Ensure you can reproduce the bug with the latest version
- Collect relevant information (BambooHR API version, Node.js version, etc.)

When submitting a bug report, please include:
- Clear, descriptive title
- Detailed description of the problem
- Steps to reproduce
- Expected vs. actual behavior  
- Environment details (Node.js version, OS, etc.)
- Relevant log output (with sensitive data redacted)

### Suggesting Features

Feature requests are welcome! Before submitting:
- Check if the feature has already been requested
- Consider if it fits the project's scope (BambooHR integration)
- Think about how it would benefit other users

### Contributing Code

#### Development Setup

1. **Fork the repository** and clone your fork:
   ```bash
   git clone https://github.com/your-username/bamboo-mcp-server.git
   cd bamboo-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (for testing):
   ```bash
   cp .env.example .env
   # Edit .env with your BambooHR credentials (for testing only)
   ```

4. **Run the development setup**:
   ```bash
   npm run dev        # Start development server
   npm run lint       # Check code style
   npm run typecheck  # Verify TypeScript
   npm test          # Run tests
   ```

#### Code Standards

- **TypeScript**: All code must be properly typed (no `any` types)
- **ESLint**: Code must pass linting with our configuration
- **Formatting**: Use Prettier for consistent formatting
- **Logging**: Use structured logging with Pino (no `console.*`)
- **Security**: Never commit API keys or sensitive data

#### Architecture Guidelines

This project follows a **single-file architecture** by design:
- Main implementation stays in `src/bamboo-mcp.ts`
- Keep the design simple and maintainable
- Avoid over-engineering or unnecessary abstractions
- Maintain compatibility with MCP specification

#### Testing Requirements

All contributions must include appropriate tests:
- **Unit tests** for new functions/tools
- **Integration tests** for BambooHR API interactions
- **Type tests** for complex type definitions
- Maintain or improve code coverage

Run tests with:
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Coverage report
```

#### Commit Guidelines

We follow [Conventional Commits](https://conventionalcommits.org/):

```bash
feat: add employee performance analytics tool
fix: resolve timeout issue in API requests
docs: update setup guide for Windows users
test: add comprehensive tool validation tests
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions/modifications
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `ci`: CI/CD changes

#### Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines above

3. **Test thoroughly**:
   ```bash
   npm run validate  # Runs all checks
   ```

4. **Commit your changes** using conventional commit format

5. **Push to your fork** and create a pull request

6. **Fill out the PR template** completely

7. **Respond to feedback** from maintainers

#### Pull Request Requirements

- [ ] Code follows style guidelines and passes linting
- [ ] All tests pass and coverage is maintained
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format
- [ ] PR description clearly explains the changes
- [ ] Breaking changes are clearly marked

## Development Guidelines

### BambooHR API Integration

When working with BambooHR APIs:
- Always use the existing `bambooGet()` function
- Implement proper error handling for API failures
- Add appropriate caching for expensive operations
- Include request logging for debugging
- Test with various API response scenarios

### MCP Tool Development

When adding new MCP tools:
- Follow the existing tool pattern
- Use Zod schemas for parameter validation
- Provide clear descriptions and examples
- Implement comprehensive error handling
- Add structured logging with tool context
- Include both success and failure test cases

### Security Considerations

- Never log sensitive data (API keys, personal info)
- Use the redaction features in the logger
- Validate all user inputs
- Follow principle of least privilege
- Report security issues privately (see [SECURITY.md](SECURITY.md))

## Release Process

Releases are handled by maintainers:
1. Version bump using semantic versioning
2. Update CHANGELOG.md
3. Create GitHub release with DXT attachment
4. Publish to npm registry
5. Update documentation if needed

## Getting Help

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Search existing [issues](../../issues) or create a new one
- **Discussions**: Use [GitHub Discussions](../../discussions) for questions

## Recognition

Contributors are recognized in:
- Git commit history
- GitHub contributor list
- CHANGELOG.md for significant contributions
- Special thanks in release notes

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers the project.

---

Thank you for contributing to the BambooHR MCP Server! Your efforts help the entire community.