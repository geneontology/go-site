import os
import re
import glob
import pathlib

from typing import List, Optional
from dataclasses import dataclass



@dataclass
class PairedSource:
    annotation: os.PathLike
    gpi: Optional[os.PathLike]
    unmatched: bool = False

def align_source(source_file: os.PathLike) -> PairedSource:
    # Convert incoming path into a pathlib Path
    source_file = pathlib.Path(source_file)

    if source_file.suffix == ".gaf":
        return PairedSource(source_file, gpi=None)
    elif source_file.suffix == ".gpad":
        dataset = dataset_name_from_src(str(source_file))
        # If there's a corresponding gpi, then we have a gpad+gpi
        gpi_name = dataset_gpi(dataset)
        gpi = pathlib.Path(source_file.resolve().parent, gpi_name)
        if gpi.exists():
            return PairedSource(source_file, gpi=gpi)
        else:
            print("No GPI for {}!".format(source_file))
            return PairedSource(source_file, gpi=None, unmatched=True)


def align_sources(source_dir: os.PathLike) -> List[PairedSource]:
    """
    This takes a source directory with downloaded annotation and GPI file sources. And returns the paths
    of the annotations and possibly any paired gpi source in a list for processing later.

    This assumes that sources have file names of the form: `[dataset]-src.[gaf|gpad|gpi]`. And for any
    `[dataset]-src.gpad`, there MUST be a `[dataset]-src.gpi`. If not the `unmatched` flag in `PairedSource`
    will be `True`, indicating a missing GPI, and an error. Callers can decide what to do with this information.
    """

    sources = []
    for path in pathlib.Path(source_dir).glob("*-src.*"):
        aligned = align_source(path)
        if aligned is not None:
            sources.append(align_source(path))

    return sources

def dataset_name_from_src(filename: str) -> str:
    """
    dataset filenames can come in as `<dataset>-src.<ext>` or `<dataset>__<mixin>-src.<ext>`
    """

    # splitting on "__" will always put the result in a list of at least one item. We want the left side either way.
    return filename.rsplit("-", maxsplit=1)[0].split("__", maxsplit=1)[0]

def dataset_gpi(dataset: str) -> str:
    """
    Recreate the source filename given a dataset name.
    """
    return "{dataset}-src.gpi".format(dataset=dataset)

