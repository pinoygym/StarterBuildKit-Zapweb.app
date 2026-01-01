#!/usr/bin/env python3
"""
Script to convert remaining API route handlers to use asyncHandler
This handles the bulk conversion of route files following the pattern:
- Add asyncHandler import
- Convert export async function to export const = asyncHandler
- Replace NextResponse.json with Response.json
- Remove NextResponse from imports (keep NextRequest if needed)
"""

import re
import os
import subprocess
from pathlib import Path

# Files to skip
SKIP_FILES = {
    'app/api/settings/database/backup/route.ts',
    'app/api/settings/database/restore/route.ts',
    'app/api/upload/route.ts',
}

def convert_route_file(file_path):
    """Convert a single route file to use asyncHandler"""

    # Check if should skip
    rel_path = str(file_path).replace('/home/user/buenasv2/', '')
    if any(skip in rel_path for skip in SKIP_FILES):
        print(f"⏭️  Skipping: {rel_path}")
        return False

    with open(file_path, 'r') as f:
        content = f.read()

    # Skip if already converted
    if 'asyncHandler' in content:
        print(f"✅ Already converted: {rel_path}")
        return False

    # Skip if doesn't have async function exports
    if 'export async function' not in content:
        return False

    print(f"🔄 Converting: {rel_path}")

    original_content = content

    # Step 1: Add asyncHandler import if not present
    if "import { asyncHandler }" not in content:
        # Find first import line
        import_match = re.search(r'^import\s', content, re.MULTILINE)
        if import_match:
            insert_pos = import_match.start()
            import_line = "import { asyncHandler } from '@/lib/api-error';\n"
            content = content[:insert_pos] + import_line + content[insert_pos:]

    # Step 2: Update NextResponse/NextRequest imports
    # Remove NextResponse from imports, keep NextRequest if present
    content = re.sub(
        r"import\s*{\s*NextResponse\s*}\s*from\s*['\"]next/server['\"];?\s*\n?",
        "",
        content
    )
    content = re.sub(
        r"import\s*{\s*NextRequest\s*,\s*NextResponse\s*}\s*from\s*['\"]next/server['\"];?",
        "import { NextRequest } from 'next/server';",
        content
    )
    content = re.sub(
        r"import\s*{\s*NextResponse\s*,\s*NextRequest\s*}\s*from\s*['\"]next/server['\"];?",
        "import { NextRequest } from 'next/server';",
        content
    )

    # Step 3: Convert async function exports to const with asyncHandler
    # This regex matches the function signature and captures it
    def replace_function(match):
        method = match.group(1)  # GET, POST, PUT, DELETE, PATCH
        params = match.group(2)  # function parameters
        return f'export const {method} = asyncHandler(async {params}'

    content = re.sub(
        r'export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*(\([^)]*\))',
        replace_function,
        content
    )

    # Step 4: Replace NextResponse.json with Response.json
    content = re.sub(r'NextResponse\.json', 'Response.json', content)

    # Step 5: Remove try-catch blocks
    # This is complex, so we'll do a simpler approach - just remove the try-catch wrapper
    # Look for patterns like:
    # export const GET = asyncHandler(async (...) => {
    #   try {
    #     ... code ...
    #   } catch (error) {
    #     ... error handling ...
    #   }
    # }

    # For each handler, find and remove try-catch
    for method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
        # Pattern to match the entire handler
        pattern = rf'(export const {method} = asyncHandler\(async \([^)]*\)(?:\s*:\s*Promise<Response>)?\s*=>\s*{{)\s*try\s*{{'
        if re.search(pattern, content):
            # This handler has a try-catch, need to unwrap it
            # Find the try block
            start_match = re.search(pattern, content)
            if start_match:
                # Find matching closing braces
                # This is simplified - in complex cases might need manual review
                start_pos = start_match.end()

                # Look for the catch block
                catch_pattern = r'\s*}\s*catch\s*\([^)]*\)\s*{[^}]*(?:{[^}]*}[^}]*)*}\s*}\);'
                catch_match = re.search(catch_pattern, content[start_pos:])

                if catch_match:
                    # Remove try { at start and } catch(...) {...} }); at end
                    before_try = content[:start_match.end()]
                    try_content = content[start_match.end():start_pos + catch_match.start()]
                    after_catch = content[start_pos + catch_match.end():]

                    # Remove the opening try {
                    before_try = before_try[:-5]  # Remove 'try {'

                    # Remove one level of closing braces from try_content
                    try_content = try_content.rstrip()
                    if try_content.endswith('}'):
                        try_content = try_content[:-1].rstrip()

                    content = before_try + '\n  ' + try_content + '\n});' + after_catch

    # Only write if content changed
    if content != original_content:
        # Create backup
        backup_path = str(file_path) + '.backup'
        with open(backup_path, 'w') as f:
            f.write(original_content)

        # Write converted content
        with open(file_path, 'w') as f:
            f.write(content)

        print(f"✨ Converted successfully: {rel_path}")
        return True

    return False

def main():
    """Main conversion function"""
    print("="*60)
    print("API Route Handler Conversion Script")
    print("Converting to asyncHandler pattern...")
    print("="*60)
    print()

    # Find all route.ts files that still need conversion
    result = subprocess.run(
        ['find', '/home/user/buenasv2/app/api', '-name', 'route.ts', '-type', 'f'],
        capture_output=True,
        text=True
    )

    all_files = [f.strip() for f in result.stdout.split('\n') if f.strip()]

    # Filter to only files with 'export async function'
    files_to_convert = []
    for file_path in all_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                if 'export async function' in content and 'asyncHandler' not in content:
                    rel_path = file_path.replace('/home/user/buenasv2/', '')
                    if not any(skip in rel_path for skip in SKIP_FILES):
                        files_to_convert.append(file_path)
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")

    print(f"Found {len(files_to_convert)} files to convert\n")

    converted_count = 0
    failed_files = []

    for file_path in files_to_convert:
        try:
            if convert_route_file(file_path):
                converted_count += 1
        except Exception as e:
            print(f"❌ Error converting {file_path}: {e}")
            failed_files.append((file_path, str(e)))

    print()
    print("="*60)
    print("Conversion Summary")
    print("="*60)
    print(f"Total files found: {len(all_files)}")
    print(f"Files needing conversion: {len(files_to_convert)}")
    print(f"Successfully converted: {converted_count}")
    print(f"Failed: {len(failed_files)}")

    if failed_files:
        print("\nFailed files:")
        for file_path, error in failed_files:
            print(f"  - {file_path}: {error}")

    print("\n✅ Conversion complete!")
    print("\nNote: Some files may need manual review for:")
    print("  - Complex try-catch blocks")
    print("  - Nested error handling")
    print("  - Custom response patterns")

if __name__ == '__main__':
    main()
