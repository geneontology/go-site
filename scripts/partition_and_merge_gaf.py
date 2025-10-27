#!/usr/bin/env python3
"""
Partition and merge gzipped GAF files into N groups.

This script takes gzipped files from a directory, partitions them into N groups
(round-robin), unzips them, filters out comment lines, and streams the content
into N output files.

Usage:
    python scripts/partition_and_merge_gaf.py <input_dir> <output_dir> <output_prefix> <num_groups>

Arguments:
    input_dir       Directory containing gzipped files
    output_dir      Directory to write output files to
    output_prefix   Prefix for output files (e.g., 'merged' → merged_1.gaf.gz, merged_2.gaf.gz, ...)
    num_groups      Number of groups to partition files into (positive integer)

Examples:
    # Partition into 4 groups
    python scripts/partition_and_merge_gaf.py goex/gaf output merged 4

    # Partition into 10 groups with custom output
    python scripts/partition_and_merge_gaf.py data/input data/output combined 10

    # Show help
    python scripts/partition_and_merge_gaf.py --help

Output:
    Creates N gzipped files named: {output_prefix}_1.gaf.gz, {output_prefix}_2.gaf.gz, ..., {output_prefix}_N.gaf.gz
    Files in input directory are distributed round-robin across groups.

Notes:
    - Comment lines (starting with '!') are filtered out
    - Files are processed in sorted order for reproducibility
    - Streaming approach keeps memory usage low
    - Only processes .gz and .gaf.gz files
"""

import sys
import gzip
import argparse
from pathlib import Path
from typing import List, TextIO


def is_comment_line(line: str) -> bool:
    """
    Check if a line is a comment (starts with '!').

    Args:
        line: Line to check

    Returns:
        True if line is a comment, False otherwise
    """
    return line.startswith('!')


def process_gzipped_file(input_path: Path, output_file: TextIO, file_num: int, total_files: int) -> tuple[int, int]:
    """
    Process a single gzipped file, filtering comments and writing to output.

    Args:
        input_path: Path to input gzipped file
        output_file: Open file handle to write to
        file_num: Current file number (for progress)
        total_files: Total number of files (for progress)

    Returns:
        Tuple of (lines_written, lines_skipped)
    """
    lines_written = 0
    lines_skipped = 0

    try:
        print(f"  [{file_num}/{total_files}] Processing: {input_path.name}")

        with gzip.open(input_path, 'rt', encoding='utf-8') as f:
            for line in f:
                if is_comment_line(line):
                    lines_skipped += 1
                else:
                    output_file.write(line)
                    lines_written += 1

        print(f"      → Written: {lines_written:,} lines, Skipped: {lines_skipped:,} comments")

    except gzip.BadGzipFile as e:
        print(f"      ✗ Error: Not a valid gzip file: {e}", file=sys.stderr)
    except UnicodeDecodeError as e:
        print(f"      ✗ Error: Unicode decode error: {e}", file=sys.stderr)
    except Exception as e:
        print(f"      ✗ Error processing file: {e}", file=sys.stderr)

    return lines_written, lines_skipped


def partition_files(files: List[Path], num_groups: int) -> List[List[Path]]:
    """
    Partition files into N groups using round-robin distribution.

    Args:
        files: List of file paths
        num_groups: Number of groups to create

    Returns:
        List of lists, where each sublist is a group of files
    """
    groups = [[] for _ in range(num_groups)]

    for i, file_path in enumerate(files):
        group_index = i % num_groups
        groups[group_index].append(file_path)

    return groups


def main() -> int:
    """
    Main function to partition and merge gzipped files.

    Returns:
        0 on success, 1 on failure
    """
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description="Partition and merge gzipped GAF files into N groups",
        epilog="""
Examples:
  %(prog)s goex/gaf output merged 4
  %(prog)s data/input data/output combined 10

Output files are gzipped and named: {output_prefix}_1.gaf.gz, {output_prefix}_2.gaf.gz, etc.
Files are distributed round-robin across groups.
Comment lines (starting with '!') are filtered out.
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "input_dir",
        metavar="INPUT_DIR",
        help="directory containing gzipped files"
    )
    parser.add_argument(
        "output_dir",
        metavar="OUTPUT_DIR",
        help="directory to write output files to"
    )
    parser.add_argument(
        "output_prefix",
        metavar="OUTPUT_PREFIX",
        help="prefix for output files (e.g., 'merged' creates merged_1.gaf.gz, merged_2.gaf.gz, ...)"
    )
    parser.add_argument(
        "num_groups",
        metavar="NUM_GROUPS",
        type=int,
        help="number of groups to partition files into"
    )
    parser.add_argument(
        "--pattern",
        metavar="GLOB",
        default="*.gz",
        help="glob pattern for input files (default: *.gz)"
    )
    parser.add_argument(
        "--output-ext",
        metavar="EXT",
        default=".gaf.gz",
        help="extension for output files (default: .gaf.gz)"
    )

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_prefix = args.output_prefix
    num_groups = args.num_groups
    pattern = args.pattern
    output_ext = args.output_ext

    # Validate inputs
    if not input_dir.exists():
        print(f"Error: Input directory does not exist: {input_dir}", file=sys.stderr)
        return 1

    if not input_dir.is_dir():
        print(f"Error: Input path is not a directory: {input_dir}", file=sys.stderr)
        return 1

    if num_groups < 1:
        print(f"Error: Number of groups must be at least 1, got: {num_groups}", file=sys.stderr)
        return 1

    # Create output directory if it doesn't exist
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        print(f"Error: Failed to create output directory {output_dir}: {e}", file=sys.stderr)
        return 1

    # Find all gzipped files
    input_files = sorted(input_dir.glob(pattern))

    if not input_files:
        print(f"Error: No files matching '{pattern}' found in {input_dir}", file=sys.stderr)
        return 1

    print(f"Found {len(input_files)} gzipped files in {input_dir}")
    print(f"Partitioning into {num_groups} groups\n")

    # Partition files into groups
    groups = partition_files(input_files, num_groups)

    # Process each group
    total_lines_written = 0
    total_lines_skipped = 0

    for group_num, group_files in enumerate(groups, 1):
        if not group_files:
            print(f"Group {group_num}: No files assigned")
            continue

        output_filename = output_dir / f"{output_prefix}_{group_num}{output_ext}"
        print(f"Group {group_num}: {len(group_files)} files → {output_filename}")

        group_lines_written = 0
        group_lines_skipped = 0

        try:
            with gzip.open(output_filename, 'wt', encoding='utf-8') as output_file:
                for file_num, input_file in enumerate(group_files, 1):
                    written, skipped = process_gzipped_file(
                        input_file,
                        output_file,
                        file_num,
                        len(group_files)
                    )
                    group_lines_written += written
                    group_lines_skipped += skipped

            print(f"  Group {group_num} totals: {group_lines_written:,} lines written, "
                  f"{group_lines_skipped:,} comments skipped\n")

            total_lines_written += group_lines_written
            total_lines_skipped += group_lines_skipped

        except OSError as e:
            print(f"Error: Failed to write output file {output_filename}: {e}", file=sys.stderr)
            return 1
        except Exception as e:
            print(f"Error: Unexpected error processing group {group_num}: {e}", file=sys.stderr)
            return 1

    # Summary
    print("=" * 60)
    print(f"Summary:")
    print(f"  Input files processed: {len(input_files)}")
    print(f"  Output groups created: {num_groups}")
    print(f"  Total lines written: {total_lines_written:,}")
    print(f"  Total comments skipped: {total_lines_skipped:,}")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
