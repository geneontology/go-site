#!/usr/bin/env python3
"""
Minerva to YAML Converter

A command line tool to convert Minerva JSON files to LinkML YAML format
using the gocam-py library.

[Editor's note: This script is an experiment with Roo Code and
model anthropic/claude-sonnet.]

This script:
1. Opens a given folder
2. Processes each .json file in the folder (top-level only)
3. Reads files as minerva model JSON
4. Converts to LinkML gocam-py YAML using the existing gocam python package
5. Outputs .yaml files with same name in the same folder

Usage:
    python minerva_to_gocam_yaml_converter.py /path/to/json/files
    python minerva_to_gocam_yaml_converter.py /path/to/json/files --verbose
    python minerva_to_gocam_yaml_converter.py /path/to/json/files --dry-run
"""

import json
import logging
import sys
from pathlib import Path
from typing import List, Tuple

import click
import yaml
from gocam.datamodel import Model
from gocam.translation import MinervaWrapper


class ConversionError(Exception):
    """Custom exception for conversion-related errors."""
    pass


def setup_logging(verbose: bool) -> logging.Logger:
    """
    Configure logging based on verbosity level.

    Args:
        verbose: If True, enable DEBUG level logging

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(__name__)

    # Clear existing handlers to avoid duplicate messages
    logger.handlers = []

    # Set handler for the logger to output to the console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )
    logger.addHandler(console_handler)

    if verbose:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.INFO)

    return logger


def find_json_files(directory: Path) -> List[Path]:
    """
    Find all .json files in the given directory (non-recursive).

    Args:
        directory: Directory to search for JSON files

    Returns:
        List of Path objects for JSON files, sorted alphabetically
    """
    json_files = []

    # Use glob to find all .json files at the top level only
    for json_file in directory.glob("*.json"):
        # Skip hidden files (starting with '.')
        if not json_file.name.startswith('.'):
            json_files.append(json_file)

    # Sort files alphabetically for consistent processing order
    return sorted(json_files)


def validate_conversion(original_json: dict, converted_model: Model) -> bool:
    """
    Basic validation to ensure conversion completed successfully.

    Args:
        original_json: Original JSON data
        converted_model: Converted Model object

    Returns:
        bool: True if validation passes, False otherwise
    """
    if converted_model is None:
        return False

    # Check that the model has basic required fields
    if not hasattr(converted_model, 'id') or converted_model.id is None:
        return False

    return True


def convert_minerva_json_to_yaml(json_file_path: Path, logger: logging.Logger) -> bool:
    """
    Convert a single Minerva JSON file to YAML format.

    Args:
        json_file_path: Path to the input JSON file
        logger: Logger instance for reporting progress and errors

    Returns:
        bool: True if conversion successful, False otherwise
    """
    try:
        logger.debug(f"Starting conversion of {json_file_path}")

        # Load JSON file
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            logger.debug(f"Successfully loaded JSON from {json_file_path}")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in file {json_file_path}: {e}")
            return False
        except FileNotFoundError:
            logger.error(f"File not found: {json_file_path}")
            return False
        except PermissionError:
            logger.error(f"Permission denied reading file: {json_file_path}")
            return False

        # Convert using MinervaWrapper
        try:
            model = MinervaWrapper.minerva_object_to_model(json_data)
            logger.debug(f"Successfully converted JSON to Model object for {json_file_path}")
        except Exception as e:
            logger.error(f"Failed to convert Minerva JSON to Model for {json_file_path}: {e}")
            return False

        # Validate conversion
        if not validate_conversion(json_data, model):
            logger.error(f"Validation failed for converted model from {json_file_path}")
            return False

        # Serialize model to dictionary
        try:
            model_dict = model.model_dump(exclude_none=True)
            logger.debug(f"Successfully serialized model to dictionary for {json_file_path}")
        except Exception as e:
            logger.error(f"Failed to serialize model to dictionary for {json_file_path}: {e}")
            return False

        # Generate output file path (same directory, same name, .yaml extension)
        output_path = json_file_path.with_suffix('.yaml')

        # Write YAML file
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                yaml.dump(model_dict, f, sort_keys=False, default_flow_style=False)
            logger.info(f"Successfully converted {json_file_path.name} -> {output_path.name}")
            return True
        except PermissionError:
            logger.error(f"Permission denied writing file: {output_path}")
            return False
        except Exception as e:
            logger.error(f"Failed to write YAML file {output_path}: {e}")
            return False

    except Exception as e:
        logger.error(f"Unexpected error converting {json_file_path}: {e}")
        return False


@click.command()
@click.argument('folder_path', type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path))
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging with detailed conversion steps')
@click.option('--dry-run', is_flag=True, help='Show what files would be converted without actually converting them')
def main(folder_path: Path, verbose: bool, dry_run: bool):
    """
    Convert Minerva JSON files to LinkML YAML format.

    This tool processes all .json files in the specified folder (non-recursive)
    and converts them to YAML format using the gocam-py library. Output files
    are created in the same directory with .yaml extension.

    FOLDER_PATH: Path to the directory containing JSON files to convert
    """
    # Setup logging
    logger = setup_logging(verbose)

    logger.info(f"Starting Minerva to YAML conversion in directory: {folder_path}")

    # Find JSON files
    json_files = find_json_files(folder_path)

    if not json_files:
        logger.warning(f"No .json files found in directory: {folder_path}")
        return

    logger.info(f"Found {len(json_files)} JSON file(s) to process")

    if dry_run:
        logger.info("DRY RUN MODE - No files will be converted")
        logger.info("Files that would be converted:")
        for json_file in json_files:
            output_file = json_file.with_suffix('.yaml')
            logger.info(f"  {json_file.name} -> {output_file.name}")
        return

    # Process each JSON file
    successful_conversions = 0
    failed_conversions = 0

    for json_file in json_files:
        logger.debug(f"Processing file {json_file}")

        try:
            if convert_minerva_json_to_yaml(json_file, logger):
                successful_conversions += 1
            else:
                failed_conversions += 1
        except KeyboardInterrupt:
            logger.info("Conversion interrupted by user")
            break
        except Exception as e:
            logger.error(f"Unexpected error processing {json_file}: {e}")
            failed_conversions += 1

    # Summary report
    total_files = successful_conversions + failed_conversions
    logger.info(f"Conversion complete. Processed {total_files} file(s)")
    logger.info(f"Successful conversions: {successful_conversions}")

    if failed_conversions > 0:
        logger.warning(f"Failed conversions: {failed_conversions}")
        sys.exit(1)
    else:
        logger.info("All conversions completed successfully!")


if __name__ == "__main__":
    main()
