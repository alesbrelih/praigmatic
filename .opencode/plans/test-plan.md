# US1.2: Configuration File Support Implementation Plan

## Overview

Implement a robust configuration system that supports YAML, JSON, and TOML formats, searches standard file locations with a defined priority order, respects environment variable overrides, and provides sensible defaults when configuration is missing. This forms the foundation for all other AIsolation features to access user settings.

## Acceptance Criteria

- [x] Implement config struct with all fields
- [x] Support YAML format parsing
- [x] Support JSON format parsing
- [x] Support TOML format parsing
- [x] Search config in standard locations: ~/.aisolation/config.yaml, config.json, config.toml
- [x] Support AISOLATION_CONFIG env variable override
- [x] Implement config file I/O operations

## Tasks

### - [ ] TASK: Define config types struct (Small)
**Purpose:** Establish the Go type structure that represents all configuration fields defined in the YAML/JSON schemas, providing type safety and validation.

**Steps:**
1. Create `pkg/types/config.go` with Config struct containing GitLab, Security, Managers, Proxy, and DefaultHardening fields
2. Define nested structs: GitLabConfig, SecurityConfig, ManagersConfig (with Lima sub-config), ProxyConfig
3. Add JSON/YAML struct tags for field serialization
4. Add basic validation methods to Config struct (e.g., ValidateURL, ValidateDuration)

**Files:** `pkg/types/config.go`

**Dependencies:** None

---

### - [ ] TASK: Implement config loading core logic (Medium)
  - ⚠️ NOTE: Testing note functionality
**Purpose:** Create the central config loading function that handles file discovery, format parsing, and environment variable overrides using Viper.

**Steps:**
1. Create `internal/config/config.go` with LoadConfig() function
2. Configure Viper to search in order: ~/.aisolation/config.yaml → config.json → config.toml
3. Set up environment variable binding with `AISOLATION_CONFIG` override support
4. Implement environment variable mapping (e.g., GITLAB_INSTANCE → gitlab.instance_url)
5. Add automatic home directory expansion for ~ in paths
6. Return error if no config file found (use defaults instead)

**Files:** `internal/config/config.go`

**Dependencies:** Task 1 (Define config types struct)

---

### - [ ] TASK: Add default values and validation (Medium)
**Purpose:** Ensure configuration is always usable by providing sensible defaults and validating loaded values before returning to callers.

**Steps:**
1. Add ApplyDefaults() method to Config struct
2. Set defaults: GitLab instance URL (https://gitlab.com), token expiry (2h), audit_logging (false), default_hardening (basic)
3. Implement Validate() method that checks required fields and valid formats
4. Add validation for: URL format, time durations, file paths exist (optional)
5. Return structured errors with field names for invalid configs
6. Document default values in Config struct comments

**Files:** `internal/config/config.go` (extend from Task 2)

**Dependencies:** Task 2 (Implement config loading core logic)

---

### - [ ] TASK: Implement config file I/O operations (Medium)
**Purpose:** Provide read and write operations for config files to support the CLI config command and allow users to modify settings programmatically.

**Steps:**
1. Create `internal/config/file.go` with ReadConfig(path) and WriteConfig(path, config) functions
2. Implement format detection from file extension (.yaml, .json, .toml)
3. Add path validation and directory existence checks
4. Handle file permissions (read 644, write 600 for sensitive configs)
5. Add atomic write support (write to temp file, then rename)
6. Implement backup functionality for existing config files

**Files:** `internal/config/file.go`

**Dependencies:** Task 1 (Define config types struct)

---

### - [ ] TASK: Create encryption helper module (Small)
**Purpose:** Provide encryption/decryption utilities for sensitive config values like tokens and passwords.

**Steps:**
1. Create `internal/config/encryption.go` with Encrypt() and Decrypt() functions
2. Use AES-256-GCM for encryption with random nonces
3. Implement key generation from user-provided passphrase
4. Add base64 encoding for encrypted values in config files
5. Include key validation to prevent decryption failures
6. Document encryption format in code comments

**Files:** `internal/config/encryption.go`

**Dependencies:** None

---

### - [ ] TASK: Implement CLI config command (Large)
**Purpose:** Create user-facing config commands for viewing, setting, testing, and validating configuration files.

**Steps:**
1. Create `internal/cli/config.go` with NewConfigCommand() and subcommands
2. Implement `config list` to display all current config values (mask sensitive fields)
3. Implement `config get <key>` to retrieve single config value
4. Implement `config set <key> <value>` to update config value and write file
5. Implement `config unset <key>` to remove config value and revert to default
6. Implement `config test <provider>` to validate GitLab/Git provider connectivity
7. Implement `config validate` to check config file syntax and validity
8. Add `--format` flag for JSON/YAML output on list command

**Files:** `internal/cli/config.go`

**Dependencies:** Tasks 2-4 (Config loading, validation, I/O operations)

---

### - [ ] TASK: Add config auto-loading to CLI root (Small)
**Purpose:** Integrate config loading into CLI initialization so all commands have access to configuration without manual loading.

**Steps:**
1. Modify `internal/cli/root.go` to load config on startup
2. Add PreRunE hook to root command that calls config.Load()
3. Store loaded config in a global variable or context
4. Handle config errors gracefully (log warning, use defaults)
5. Add --config flag support for custom config file path
6. Update root command help text to reflect config loading behavior

**Files:** `internal/cli/root.go`

**Dependencies:** Tasks 2-3 (Config loading and validation)

---

### - [ ] TASK: Create comprehensive test suite (Medium)
**Purpose:** Ensure config system works correctly across formats, edge cases, and error conditions.

**Steps:**
1. Create `internal/config/config_test.go` with table-driven tests
2. Test config loading with each format (YAML, JSON, TOML)
3. Test environment variable overrides
4. Test default value application
5. Test validation with invalid URLs, durations, paths
6. Test config file I/O (read, write, format detection)
7. Test encryption/decryption round-trips
8. Create test fixtures for each config format
9. Test missing config file behavior (defaults used)
10. Test AISOLATION_CONFIG env variable override

**Files:** `internal/config/config_test.go`, `internal/config/file_test.go`, `test/fixtures/config/`

**Dependencies:** Tasks 1-5 (All config implementation tasks)

---

## Phase Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| **Phase 1: Exploration** | SKIP | Codebase is small and well-documented; complete development guide, schema definitions, and existing code structure already reviewed |
| **Phase 2: Clarification** | SKIP | Requirements are crystal clear with specific acceptance criteria, YAML/JSON/TOML schemas defined in development guide, no architectural ambiguity |
| **Phase 3: Task Analysis** | COMPLETE | Unknowns: None (tech stack and schema fully documented). Complexity: Medium (1-4hr total, multiple interconnected components) |
| **Phase 4: Research** | SKIP | Viper's capabilities for multi-format config and environment variable management are well-understood; this is a standard Go pattern |
| **Phase 5: Synthesis** | SKIP | No research phase completed; single straightforward implementation path |
| **Phase 6: Task Breakdown** | COMPLETE | Created 8 tasks: 4 Small, 3 Medium, 1 Large. All tasks follow task detail formula with clear purpose, steps, files, and dependencies |
| **Phase 7: Create Plan File** | COMPLETE | Plan file created with complete template including Phase Decisions section documenting all evaluations |

## Architecture Overview

The configuration system uses a layered approach:

1. **Type Layer** (`pkg/types/config.go`) - Pure data structures with validation methods
2. **Core Layer** (`internal/config/config.go`) - Loading, merging, validation using Viper
3. **I/O Layer** (`internal/config/file.go`) - File operations with format detection
4. **Encryption Layer** (`internal/config/encryption.go`) - Sensitive value protection
5. **CLI Layer** (`internal/cli/config.go`) - User-facing commands
6. **Integration Layer** (`internal/cli/root.go`) - Auto-loading into CLI

**Data Flow:**
```
CLI Start → Load Config → Read File(s) → Parse → Apply Env Vars → Validate → Apply Defaults → Ready to Use
```

## Technical Decisions

### 1. Use Viper for Multi-Format Config
**Decision:** Leverage existing Viper dependency for config loading
**Rationale:**
- Already available as dependency (github.com/spf13/viper v1.21.0)
- Native support for YAML, JSON, TOML
- Built-in environment variable binding
- Automatic search and precedence handling
- Well-maintained and battle-tested

### 2. Config File Search Order
**Decision:** Search in strict priority order
1. `~/.aisolation/config.yaml`
2. `~/.aisolation/config.json`
3. `~/.aisolation/config.toml`
4. `AISOLATION_CONFIG` environment variable (explicit override)

**Rationale:**
- Matches development guide specification
- Standard config directory (~/.aisolation/) consistent with tools like Docker, kubectl
- YAML as default (most popular, readable)
- Environment variable as final override for CI/CD and temporary configs

### 3. Environment Variable Naming Convention
**Decision:** Two-tier approach
- Flat names for overrides: `GITLAB_INSTANCE`, `GITLAB_TOKEN`, `AISOLATION_AUDIT_LOG`
- Structured mapping for nested config: `gitlab.instance_url` maps to `GITLAB_INSTANCE`

**Rationale:**
- Familiar convention used by Docker, AWS CLI, kubectl
- Backward compatible with existing env vars in development guide
- Easy to remember and use

### 4. Validation Strategy
**Decision:** Fail-fast with clear error messages
- Required fields: Return error if missing
- Format validation: Check URL patterns, time durations
- Optional fields: Use defaults

**Rationale:**
- Early error detection prevents runtime failures
- Clear error messages guide users to fix issues
- Optional fields have sensible defaults so users don't need full config

### 5. Sensitive Value Encryption
**Decision:** Optional AES-256-GCM encryption for token fields
- Plaintext storage allowed for development convenience
- Encryption recommended for production
- Key from user passphrase or key file

**Rationale:**
- Doesn't force encryption on all users (eases onboarding)
- Provides security when needed
- AES-256-GCM is standard, secure, and built-in to Go

### 6. Default Value Strategy
**Decision:** Conservative defaults for safety
- `gitlab.instance_url`: https://gitlab.com
- `gitlab.token_expiry`: 2h
- `security.audit_logging`: false
- `default_hardening`: basic

**Rationale:**
- GitLab.com as most common use case
- 2h balances security and convenience
- Audit logging disabled by default (opt-in)
- Basic hardening is secure without being restrictive

## Integration Points

### 1. CLI Root Command
**Location:** `internal/cli/root.go`
**Integration:** Add PreRunE hook to load config before any command runs
**Impact:** All subcommands automatically have access to config

### 2. Git Token Generation
**Location:** `internal/git/` (future implementation)
**Integration:** Read GitLab config from loaded Config struct
**Impact:** Token generation uses configured GitLab instance and credentials

### 3. Proxy Configuration
**Location:** `internal/proxy/` (future implementation)
**Integration:** Read proxy port, log level, format from loaded Config struct
**Impact:** Proxy behavior controlled by config file

### 4. Manager Configuration
**Location:** `managers/lima/` (future implementation)
**Integration:** Read Lima-specific config (distro, CPU, memory, disk) from loaded Config struct
**Impact:** VM creation uses configured defaults

### 5. Security Hardening
**Location:** `internal/security/` (future implementation)
**Integration:** Read audit logging, token lifetime settings from loaded Config struct
**Impact:** Security behavior controlled by config file

## Security Considerations

### 1. Sensitive Data in Config Files
**Risk:** Tokens and credentials stored in plaintext
**Mitigation:**
- Provide encryption utilities (AES-256-GCM)
- Mask sensitive values in `config list` output
- Document security best practices
- Recommend file permissions (600 for ~/.aisolation/config.yaml)

### 2. Environment Variable Exposure
**Risk:** Environment variables visible in process list, logs, shell history
**Mitigation:**
- Document security risks clearly
- Recommend config file for sensitive values
- Add warning when loading tokens from env vars
- Avoid logging sensitive values

### 3. Config File Permissions
**Risk:** World-readable config files expose credentials
**Mitigation:**
- Enforce 600 permissions when writing config files
- Warn if config file has 644 or more permissive permissions
- Check permissions on load and log warning

### 4. Path Traversal
**Risk:** Malicious config file paths could write to unexpected locations
**Mitigation:**
- Validate paths are within expected directories
- Use filepath.Clean to sanitize paths
- Reject paths with ../ or absolute paths outside home directory

### 5. Unvalidated Input
**Risk:** Malformed config files cause panics or crashes
**Mitigation:**
- Robust error handling with clear messages
- Validate all fields before using
- Use safe parsing (Viper handles this)
- Return errors instead of panicking

## Testing Strategy

### 1. Unit Tests
**Coverage:** 80%+ target
**Focus:**
- Config loading with each format
- Environment variable overrides
- Default value application
- Validation logic
- File I/O operations
- Encryption/decryption

### 2. Table-Driven Tests
**Pattern:** Use Go's table-driven test pattern
**Scenarios:**
- Valid configs (all formats)
- Invalid configs (missing required fields, bad URLs, bad durations)
- Missing config files (defaults used)
- Environment variable overrides
- Partial configs (some fields missing)

### 3. Integration Tests
**Focus:**
- CLI config commands
- Config auto-loading integration
- End-to-end workflows

### 4. Test Fixtures
**Location:** `test/fixtures/config/`
**Files:**
- `valid.yaml`, `valid.json`, `valid.toml`
- `invalid-url.yaml`, `invalid-duration.json`
- `partial.yaml`, `partial.json`
- `encrypted.yaml`

### 5. Edge Cases
**Test scenarios:**
- Empty config files
- Config with only comments (YAML)
- Config with invalid UTF-8
- Config file without read permissions
- Config directory without write permissions
- Malformed JSON/YAML/TOML

## Risk Points

### 1. Viper Version Compatibility
**Risk:** Existing Viper version (v1.21.0) might not support all needed features
**Mitigation:**
- Verify Viper supports required features (multi-format, env binding)
- Document assumptions about Viper capabilities
- Upgrade Viper if needed (but maintain backward compatibility)

### 2. Home Directory Expansion
**Risk:** ~ expansion might fail on all platforms
**Mitigation:**
- Use os.UserHomeDir() for cross-platform support
- Test on Linux, macOS, Windows
- Handle errors gracefully (return clear error message)

### 3. Concurrent Config Access
**Risk:** Multiple goroutines accessing config simultaneously could cause race conditions
**Mitigation:**
- Use sync.Once for lazy loading
- Provide thread-safe Getters
- Document that config is read-only after loading
- Add mutex if config can be reloaded at runtime

### 4. Encryption Key Management
**Risk:** Users losing encryption keys makes configs unrecoverable
**Mitigation:**
- Document key backup procedures
- Recommend storing key in password manager
- Provide key recovery warnings
- Consider supporting multiple decryption methods

### 5. Config File Migration
**Risk:** Future schema changes break existing config files
**Mitigation:**
- Use struct tags with optional fields
- Document config file format versioning strategy
- Add migration path if schema changes
- Provide backward compatibility layer

## Dependencies

### External Dependencies (Already Available)
- `github.com/spf13/viper v1.21.0` - Config loading
- `github.com/spf13/cobra v1.10.2` - CLI framework
- `go.yaml.in/yaml/v3 v3.0.4` - YAML parsing (via Viper)
- `github.com/pelletier/go-toml/v2 v2.2.4` - TOML parsing (via Viper)

### Internal Dependencies
- `pkg/types/config.go` - Type definitions (must be created)
- `internal/cli/root.go` - CLI integration (must be modified)
- `cmd/aisolation/main.go` - Entry point (no changes needed)

### Future Dependencies (Out of Scope)
- `internal/git/` - Will use GitLab config
- `internal/proxy/` - Will use proxy config
- `managers/lima/` - Will use Lima config
- `internal/security/` - Will use security config

## Implementation Notes

### File Structure
```
pkg/types/
  └── config.go              # Config type definitions

internal/config/
  ├── config.go              # Core loading, validation, defaults
  ├── file.go                # File I/O operations
  ├── encryption.go          # Encryption utilities
  └── config_test.go         # Comprehensive test suite

internal/cli/
  └── config.go              # CLI config commands

test/fixtures/config/
  ├── valid.yaml
  ├── valid.json
  ├── valid.toml
  ├── invalid.yaml
  └── encrypted.yaml
```

### Code Organization Principles
1. **Separation of concerns:** Types in pkg/, logic in internal/, CLI in internal/cli/
2. **Testability:** Pure functions, dependency injection where needed
3. **Error handling:** Always return errors, never panic from user input
4. **Logging:** Use structured logging, consistent log levels
5. **Documentation:** Comments on exported functions, examples in godoc

### Performance Considerations
1. Config is loaded once at CLI startup, not per command
2. No need for hot-reloading (restart CLI to pick up config changes)
3. Lazy loading of optional components (encryption only when needed)
4. Efficient file I/O (read entire file, not line-by-line)

### Error Messages
**Format:** Clear, actionable, includes field names
**Examples:**
- "Invalid gitlab.instance_url: must be a valid URL"
- "Config file not found: using defaults"
- "Failed to parse config.yaml: invalid YAML at line 15"
- "Encryption key not found: run 'aisolation config init-key' to create one"

### Backward Compatibility
- No breaking changes to existing CLI
- Config loading is additive (no config = defaults)
- Environment variables work independently of config file
- Config file format is stable, extensible (optional new fields)

### Success Criteria Verification
- [ ] Config file is loaded automatically from ~/.aisolation/config.yaml
  - **Verify:** `internal/cli/root.go` PreRunE hook calls Load()
- [ ] Environment variables override file settings
  - **Verify:** Tests with env vars set before config load
- [ ] Config validation catches invalid values
  - **Verify:** Tests with invalid URLs, durations, paths
- [ ] Missing config creates sensible defaults
  - **Verify:** Tests with no config file, check default values applied
