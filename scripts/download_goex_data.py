#!/usr/bin/env python3
"""
Download GOEX GAF files based on metadata/goex.yaml

This script downloads Gene Ontology (GO) annotation files in GAF format from
the EBI GOEX repository for organisms listed in the metadata file.

Usage:
    python scripts/download_goex_data.py <output_directory>

Arguments:
    output_directory    Directory where downloaded GAF files will be saved.
                       Will be created if it doesn't exist.

Examples:
    # Download to goex/gaf directory
    python scripts/download_goex_data.py goex/gaf

    # Download to a custom directory
    python scripts/download_goex_data.py /data/goex/downloads

    # Dry-run mode (preview without downloading)
    python scripts/download_goex_data.py goex/gaf --dry-run

    # Show help
    python scripts/download_goex_data.py --help

Requirements:
    - PyYAML (pip install pyyaml)
    - metadata/goex.yaml file must exist in the current working directory

Output:
    Files are named in the format: {code}_{taxon_id}_{proteome_id}.gaf.gz
    Example: HUMAN_9606_UP000005640.gaf.gz

Notes:
    - The script skips files that already exist in the output directory
    - Progress is displayed for each organism
    - A summary report is printed at the end
    - Downloads are atomic (written to temp file first, then renamed)
"""

import sys
import yaml
import urllib.request
import urllib.parse
import os
import argparse
import tempfile
from pathlib import Path
from urllib.error import HTTPError, URLError
from typing import Dict, Optional, Tuple

# Configuration
DEFAULT_METADATA_FILE = "metadata/goex.yaml"
DEFAULT_BASE_URL = "https://ftp.ebi.ac.uk/pub/contrib/goa/goex/current/gaf/"
USER_AGENT = "GOEX-Downloader/1.0 (Python script for downloading GO annotations)"
CHUNK_SIZE = 8192  # 8KB chunks for streaming


def parse_taxon_id(taxon_id_str: str) -> str:
    """Extract numeric taxon ID from NCBITaxon:XXXXX format"""
    return taxon_id_str.split(":")[-1]


def parse_proteome_id(proteome_id_str: str) -> str:
    """Extract proteome ID from uniprot.proteome:UPXXXXXXXXX format"""
    return proteome_id_str.split(":")[-1]


def construct_filename(organism: Dict[str, str]) -> str:
    """Construct the GAF filename from organism metadata"""
    code = organism.get("code_uniprot")
    taxon = parse_taxon_id(organism.get("taxon_id"))
    proteome = parse_proteome_id(organism.get("uniprot_proteome_id"))

    return f"{code}_{taxon}_{proteome}.gaf.gz"


def download_file(url: str, output_path: str) -> bool:
    """
    Download a file from URL to output_path using streaming and atomic writes.

    Args:
        url: URL to download from
        output_path: Final destination path for the file

    Returns:
        True if download succeeded, False otherwise
    """
    try:
        print(f"Downloading: {url}")

        # Create request with User-Agent header
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

        # Download to temporary file first (atomic write)
        output_dir = os.path.dirname(output_path) or '.'
        with tempfile.NamedTemporaryFile(mode='wb', dir=output_dir, delete=False) as tmp_file:
            temp_path = tmp_file.name

            try:
                with urllib.request.urlopen(req) as response:
                    # Stream download in chunks (memory efficient)
                    total_size = 0
                    while True:
                        chunk = response.read(CHUNK_SIZE)
                        if not chunk:
                            break
                        tmp_file.write(chunk)
                        total_size += len(chunk)

                # Validate downloaded file
                if total_size == 0:
                    os.unlink(temp_path)
                    print(f"  ✗ Error: Downloaded file is empty")
                    return False

                # Move temp file to final location (atomic on same filesystem)
                os.replace(temp_path, output_path)

                # Format file size for display
                size_mb = total_size / (1024 * 1024)
                print(f"  ✓ Saved to: {output_path} ({size_mb:.2f} MB)")
                return True

            except Exception:
                # Clean up temp file on error
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                raise

    except HTTPError as e:
        print(f"  ✗ HTTP Error {e.code}: {e.reason}")
        return False
    except URLError as e:
        print(f"  ✗ URL Error: {e.reason}")
        return False
    except OSError as e:
        print(f"  ✗ File I/O Error: {e}")
        return False
    except Exception as e:
        print(f"  ✗ Unexpected error: {str(e)}")
        return False

def main() -> int:
    """
    Main function to download GOEX GAF files.

    Returns:
        0 on success, 1 on failure
    """
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="Download GOEX GAF files based on metadata/goex.yaml",
        epilog="""
Examples:
  %(prog)s goex/gaf
  %(prog)s /data/goex/downloads
  %(prog)s goex/gaf --dry-run
  %(prog)s goex/gaf --metadata custom_metadata.yaml

Files are downloaded from:
  https://ftp.ebi.ac.uk/pub/contrib/goa/goex/current/gaf/

Output files are named: {code}_{taxon_id}_{proteome_id}.gaf.gz
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "output_dir",
        metavar="OUTPUT_DIR",
        help="directory where downloaded GAF files will be saved (created if needed)"
    )
    parser.add_argument(
        "--metadata",
        metavar="FILE",
        default=DEFAULT_METADATA_FILE,
        help=f"path to metadata YAML file (default: {DEFAULT_METADATA_FILE})"
    )
    parser.add_argument(
        "--base-url",
        metavar="URL",
        default=DEFAULT_BASE_URL,
        help=f"base URL for downloads (default: {DEFAULT_BASE_URL})"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="preview what would be downloaded without actually downloading"
    )
    args = parser.parse_args()

    output_dir = args.output_dir
    metadata_file = args.metadata
    base_url = args.base_url
    dry_run = args.dry_run

    # Validate and create output directory
    try:
        Path(output_dir).mkdir(parents=True, exist_ok=True)
    except OSError as e:
        print(f"Error: Cannot create output directory '{output_dir}': {e}", file=sys.stderr)
        return 1

    # Load metadata
    try:
        print(f"Loading metadata from {metadata_file}...")
        with open(metadata_file, 'r') as f:
            metadata = yaml.safe_load(f)
    except FileNotFoundError:
        print(f"Error: Metadata file not found: {metadata_file}", file=sys.stderr)
        return 1
    except yaml.YAMLError as e:
        print(f"Error: Failed to parse YAML metadata: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Error: Failed to load metadata: {e}", file=sys.stderr)
        return 1

    organisms = metadata.get("organisms", [])
    if not organisms:
        print("Error: No organisms found in metadata", file=sys.stderr)
        return 1

    print(f"Found {len(organisms)} organisms in metadata")
    print(f"Output directory: {output_dir}")
    if dry_run:
        print("Mode: DRY RUN (no files will be downloaded)")
    print()

    # Download files
    success_count = 0
    fail_count = 0
    skipped_count = 0

    for i, organism in enumerate(organisms, 1):
        full_name = organism.get("full_name", "Unknown")
        code = organism.get("code_uniprot", "N/A")

        print(f"[{i}/{len(organisms)}] {full_name} ({code})")

        # Skip if missing required fields
        if not all([organism.get("code_uniprot"),
                   organism.get("taxon_id"),
                   organism.get("uniprot_proteome_id")]):
            print("  ⚠ Skipping: Missing required metadata fields")
            fail_count += 1
            continue

        # Construct filename and URL
        filename = construct_filename(organism)
        url = urllib.parse.urljoin(base_url, filename)
        output_path = os.path.join(output_dir, filename)

        # Check if already downloaded
        if os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            size_mb = file_size / (1024 * 1024)
            print(f"  ○ Already exists: {output_path} ({size_mb:.2f} MB)")
            success_count += 1
            continue

        # Dry-run mode
        if dry_run:
            print(f"  [DRY RUN] Would download: {url}")
            print(f"            to: {output_path}")
            skipped_count += 1
        else:
            # Download
            if download_file(url, output_path):
                success_count += 1
            else:
                fail_count += 1

        print()  # Blank line for readability

    # Summary
    print("\n" + "="*60)
    print(f"Download Summary:")
    print(f"  Total organisms: {len(organisms)}")
    if dry_run:
        print(f"  Already exist: {success_count}")
        print(f"  Would download: {skipped_count}")
        print(f"  Would fail (missing metadata): {fail_count}")
    else:
        print(f"  Successfully downloaded/existing: {success_count}")
        print(f"  Failed: {fail_count}")
    print("="*60)

    # Return appropriate exit code
    if fail_count > 0 and not dry_run:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
