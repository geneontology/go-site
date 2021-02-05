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
        if path.suffix == ".gaf":
            sources.append(PairedSource(path, gpi=None))
        elif path.suffix == ".gpad":
            # Find a gpi
            dataset = path.stem.split("-")[0]
            gpi = pathlib.Path(path.resolve().parent, "{}-src.gpi".format(dataset))
            if gpi.exists():
                sources.append(PairedSource(path, gpi=gpi))
            else:
                # Switch to logging?
                print("No GPI for {}!".format(path))
                sources.append(PairedSource(path, gpi=None, unmatched=True))

    return sources
