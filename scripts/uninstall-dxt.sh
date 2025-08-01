#!/bin/bash

# BambooHR MCP DXT Extension Uninstaller
# This script searches for and removes the BambooHR MCP DXT extension from Claude Desktop
# Supports macOS, Windows (WSL/Git Bash), and Linux

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="bamboohr-mcp"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    echo "BambooHR MCP DXT Extension Uninstaller"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --dry-run          Show what would be removed without actually removing"
    echo "  --force            Skip confirmation prompts"
    echo "  --verbose, -v       Verbose output"
    echo "  --all-claude       Remove ALL Claude Desktop data (DANGEROUS!)"
    echo ""
    echo "Examples:"
    echo "  $0                      # Interactive uninstall"
    echo "  $0 --dry-run           # Preview what would be removed"
    echo "  $0 --force             # Uninstall without prompts"
    echo ""
}

# Default options
DRY_RUN=false
VERBOSE=false
FORCE=false
ALL_CLAUDE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            log_info "🔍 Dry run mode - no files will be removed"
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --all-claude)
            ALL_CLAUDE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Function to safely remove files/directories
safe_remove() {
    local target="$1"
    local description="$2"
    
    if [[ -e "$target" ]]; then
        if [[ "$DRY_RUN" == "true" ]]; then
            log_warning "🗑️  Would remove: $target"
            if [[ "$VERBOSE" == "true" ]]; then
                ls -la "$target" 2>/dev/null || true
            fi
        else
            if [[ "$VERBOSE" == "true" ]]; then
                log_info "Removing: $target"
            fi
            rm -rf "$target"
            log_success "✅ Removed: $description"
        fi
        return 0
    else
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "❌ Not found: $target"
        fi
        return 1
    fi
}

# Function to detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        CYGWIN*|MINGW*|MSYS*)
            echo "windows"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Function to search for and list BambooHR MCP DXT installations
search_installations() {
    local os=$(detect_os)
    local found_count=0
    
    if [[ "$VERBOSE" == "true" ]]; then
        log_info "🔍 Searching for BambooHR MCP DXT installations..." >&2
    fi
    
    # Search Claude Desktop directories
    case $os in
        "macos")
            local claude_dirs=(
                "$HOME/Library/Application Support/Claude"
            )
            ;;
        "windows")
            local claude_dirs=()
            [[ -n "${APPDATA:-}" ]] && claude_dirs+=("$APPDATA/Claude")
            [[ -n "${LOCALAPPDATA:-}" ]] && claude_dirs+=("$LOCALAPPDATA/Claude" "$LOCALAPPDATA/AnthropicClaude")
            claude_dirs+=("/c/Users/$USER/AppData/Roaming/Claude" "/c/Users/$USER/AppData/Local/Claude")
            ;;
        "linux")
            local claude_dirs=(
                "${XDG_CONFIG_HOME:-$HOME/.config}/Claude"
                "${XDG_DATA_HOME:-$HOME/.local/share}/Claude"
            )
            ;;
    esac
    
    # Search in Claude directories
    for base_path in "${claude_dirs[@]}"; do
        [[ ! -d "$base_path" ]] && continue
        
        if [[ "$VERBOSE" == "true" ]]; then
            log_info "Checking: $base_path" >&2
        fi
        
        # Check for extension directories
        for ext_subdir in "extensions" "Extensions" "dxt" "DXT" "Claude Extensions"; do
            local ext_dir="$base_path/$ext_subdir"
            if [[ -d "$ext_dir" ]]; then
                # Look for bamboohr directories (exact match)
                for bamboo_name in "$PROJECT_NAME" "bamboohr-mcp" "bamboohr" "BambooHR" "bamboo-mcp"; do
                    local bamboo_path="$ext_dir/$bamboo_name"
                    if [[ -e "$bamboo_path" ]]; then
                        echo "$bamboo_path"
                        if [[ "$VERBOSE" == "true" ]]; then
                            log_success "📦 Found directory: $bamboo_path" >&2
                        fi
                        ((found_count++))
                    fi
                done
                
                # Look for bamboohr directories (pattern match)
                for bamboo_dir in "$ext_dir"/*bamboo*; do
                    if [[ -d "$bamboo_dir" ]]; then
                        echo "$bamboo_dir"
                        if [[ "$VERBOSE" == "true" ]]; then
                            log_success "📦 Found directory: $bamboo_dir" >&2
                        fi
                        ((found_count++))
                    fi
                done
                
                # Look for DXT files
                for dxt_pattern in "*bamboo*.dxt" "*BambooHR*.dxt"; do
                    for dxt_file in "$ext_dir"/$dxt_pattern; do
                        if [[ -f "$dxt_file" ]]; then
                            echo "$dxt_file"
                            if [[ "$VERBOSE" == "true" ]]; then
                                log_success "📦 Found DXT: $dxt_file" >&2
                            fi
                            ((found_count++))
                        fi
                    done
                done
            fi
        done
        
        # Check base directory for DXT files
        for dxt_pattern in "*bamboo*.dxt" "*BambooHR*.dxt"; do
            for dxt_file in "$base_path"/$dxt_pattern; do
                if [[ -f "$dxt_file" ]]; then
                    echo "$dxt_file"
                    if [[ "$VERBOSE" == "true" ]]; then
                        log_success "📦 Found DXT in Claude: $dxt_file" >&2
                    fi
                    ((found_count++))
                fi
            done
        done
    done
    
    # Search common locations
    for search_path in "." "./dist" "../dist" "$HOME/Downloads" "$HOME/Desktop"; do
        if [[ -d "$search_path" ]]; then
            for dxt_pattern in "*bamboo*.dxt" "*BambooHR*.dxt"; do
                for dxt_file in "$search_path"/$dxt_pattern; do
                    if [[ -f "$dxt_file" ]]; then
                        echo "$dxt_file"
                        if [[ "$VERBOSE" == "true" ]]; then
                            log_info "📦 Found local DXT: $dxt_file" >&2
                        fi
                        ((found_count++))
                    fi
                done
            done
        fi
    done
    
    return $found_count
}

# Function to show Claude Desktop process status
check_claude_running() {
    if pgrep -f -i claude >/dev/null 2>&1; then
        log_warning "⚠️  Claude Desktop appears to be running"
        log_info "For best results, please close Claude Desktop before uninstalling extensions"
        
        if [[ "$FORCE" == "false" ]] && [[ "$DRY_RUN" == "false" ]]; then
            echo -n "Continue anyway? (y/n): "
            read -r response
            if [[ "$response" != "y" && "$response" != "Y" ]]; then
                log_info "Operation cancelled"
                exit 0
            fi
        fi
    else
        log_info "✅ Claude Desktop is not running"
    fi
}

# Function to remove BambooHR MCP installations
remove_installations() {
    local temp_file=$(mktemp)
    
    # Get list of installations
    search_installations > "$temp_file"
    local found_count=$?
    local installation_count=$(wc -l < "$temp_file" | tr -d ' ')
    
    if [[ $installation_count -eq 0 ]]; then
        log_info "✅ No BambooHR MCP DXT installations found"
        rm -f "$temp_file"
        return 0
    fi
    
    log_info "Found $installation_count BambooHR MCP installation(s)"
    
    if [[ "$FORCE" == "false" ]] && [[ "$DRY_RUN" == "false" ]]; then
        echo ""
        log_warning "⚠️  The following will be removed:"
        while IFS= read -r installation; do
            [[ -n "$installation" ]] && echo "   • $installation"
        done < "$temp_file"
        echo ""
        echo -n "Continue with removal? (y/n): "
        read -r response
        if [[ "$response" != "y" && "$response" != "Y" ]]; then
            log_info "Operation cancelled"
            rm -f "$temp_file"
            exit 0
        fi
    fi
    
    local removed_count=0
    while IFS= read -r installation; do
        [[ -z "$installation" ]] && continue
        if safe_remove "$installation" "BambooHR MCP installation"; then
            ((removed_count++))
        fi
    done < "$temp_file"
    
    rm -f "$temp_file"
    
    if [[ "$DRY_RUN" == "false" ]]; then
        log_success "🎉 Removed $removed_count installation(s)"
    else
        log_info "🔍 Would remove $removed_count installation(s)"
    fi
}

# Function to clean up Claude Desktop completely (dangerous)
cleanup_all_claude() {
    if [[ "$ALL_CLAUDE" == "false" ]]; then
        return 0
    fi
    
    log_warning "⚠️  🚨 DANGER: This will remove ALL Claude Desktop data! 🚨"
    log_warning "This includes all extensions, settings, and cached data"
    
    if [[ "$FORCE" == "false" ]] && [[ "$DRY_RUN" == "false" ]]; then
        echo -n "Type 'DELETE ALL CLAUDE DATA' to confirm: "
        read -r confirmation
        if [[ "$confirmation" != "DELETE ALL CLAUDE DATA" ]]; then
            log_info "Operation cancelled"
            return 0
        fi
    fi
    
    local os=$(detect_os)
    local removed_count=0
    
    case $os in
        "macos")
            local claude_paths=(
                "$HOME/Library/Application Support/Claude"
                "$HOME/Library/Preferences/com.anthropic.Claude.plist"
                "$HOME/Library/Caches/com.anthropic.Claude"
                "$HOME/Library/Saved Application State/com.anthropic.Claude.savedState"
            )
            ;;
        "windows")
            local claude_paths=()
            [[ -n "${APPDATA:-}" ]] && claude_paths+=("$APPDATA/Claude")
            [[ -n "${LOCALAPPDATA:-}" ]] && claude_paths+=("$LOCALAPPDATA/Claude" "$LOCALAPPDATA/AnthropicClaude")
            ;;
        "linux")
            local claude_paths=(
                "${XDG_CONFIG_HOME:-$HOME/.config}/Claude"
                "${XDG_DATA_HOME:-$HOME/.local/share}/Claude"
                "${XDG_CACHE_HOME:-$HOME/.cache}/Claude"
            )
            ;;
    esac
    
    for path in "${claude_paths[@]}"; do
        if safe_remove "$path" "Claude Desktop data"; then
            ((removed_count++))
        fi
    done
    
    if [[ "$DRY_RUN" == "false" ]]; then
        log_success "🗑️  Removed $removed_count Claude Desktop data locations"
        log_warning "You'll need to reconfigure Claude Desktop from scratch"
    fi
}

# Main execution function
main() {
    echo "🚀 BambooHR MCP DXT Extension Uninstaller"
    echo "========================================="
    
    # Check if Claude Desktop is running
    check_claude_running
    
    # Show OS information
    local os=$(detect_os)
    log_info "🖥️  Operating System: $os"
    
    # Find and remove BambooHR MCP installations
    remove_installations
    
    # Clean up all Claude data if requested
    cleanup_all_claude
    
    # Final summary
    echo ""
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "🔍 Dry run completed - no files were actually removed"
        log_info "Run without --dry-run to perform actual uninstallation"
    else
        log_success "✅ BambooHR MCP DXT uninstallation completed!"
        
        echo ""
        log_info "📝 Next steps:"
        log_info "1. Restart Claude Desktop if it was running"
        log_info "2. Verify the extension is no longer listed in Settings → Extensions"
        log_info "3. To reinstall: ./scripts/build-dxt.sh && install the generated DXT file"
    fi
}

# Run main function with all arguments
main "$@"