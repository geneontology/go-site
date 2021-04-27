"""
"Shovel2Pile" -- actually called "Assembly"
    * This is the point where PAINT and other Mixed In annotations should be merged into the final output annotation files.
    * Headers also properly joined
    * Final <dataset> = Sum[<dataset>.header, <mixin0>.header, <mixin1>.header, ...] + Sum[<dataset>, <mixin0>, <mixin1>, ...]
    * example, paint_mgi will have in metadata: `merges_into: mgi`.
        1. download-annotation-sources.py annotations -g mgi -g paint -x [the rest of paint]
           * sources: mgi.gpad, paint_mgi.gpad, 
        2. goat pristine sources/
           * pristine: mgi_valid.gpad, paint_mgi_valid.gpad
        3. goat assemble
           * assemble: mgi.gpad (contains mgi_valid and paint_mgi_valid), paint_mgi.gpad

* So how does assemble know that paint_mgi_valid should be mixed into mgi_valid?
      * mgi_valid -> mgi; paint_mgi_valid -> paint_mgi; <mixin>_<dataset>
         * paint_mgi is a mixin because when we match <mixin>_<dataset> <dataset> matches an existing source, namely "mgi".
         * We find potential mixins by the filename, and separate on the first underscore. If we get a mixin pattern, we can check if the <dataset> part of the name corresponds to an existing file in "pristine". If it does, then we have a <dataset>, and a <mixin>_<dataset> match.
         * A drawback with this is we're *very* tied to the filenames and dataset names
"""

import collections
from dataclasses import dataclass

from typing import DefaultDict, Dict, List, Optional, Tuple

@dataclass
class AssembleCollection():
    headers: List[str]
    associations: List[str]

    @classmethod
    def initial(cls):  # type AssembleCollection
        return AssembleCollection([], [])

    @classmethod
    def with_path(primary_filepath):
        assemble_collection = AssembleCollection.initial()
        return assemble_collection

    def add_mixin(self, filepath):
        # First append to headers. Include separator to differentiate between mixin.
        """
        ! header_primary
        ! how do differentiate between mixin
        ! Mix_in header
        ! Separate another mixin
        ! Mixin2 header
        """
        pass

    def write(self, outpath):
        pass


def pristine_name(filename: str) -> str:
    """
    Given a filename of a "pristine" annotation file, figure out the dataset name.

    Pristine filenames take the form of `{name}_valid` or `{name}__{mixin}_valid`. The name of the dataset is the `{name}` portion.
    This should be flexible and lack of underscore should just mean the whole filename is the dataset name.

    Args:
        filename (str): Name of the pristine file without preceeding directories and with extension removed.
    """

    return filename.split("__", maxsplit=1)[0]

def pristine_filename_from_dataset(dataset: str) -> str:
    return "{dataset}_valid".format(dataset=dataset)


def mixin_name_from_valid(filename: str) -> Optional[Tuple[str, str]]:
    """
    Mixin dataset names look like `{mixin}__{dataset}_valid` so `dataset` may be a mixin if it could have that form.

    Datasets that have no underscore separated name are definitely not mixins.

    Once we have a possible mixin candidate (the results of this function) we can check the pristine directory for the candidate dataset filename.
    If it exists, then the given dataset is a mixin.
    """
    name_split = filename.replace("_valid", "").split("__", maxsplit=1)
    if len(name_split) == 1:
        # Just one item means we do not have a mixin
        return None
    
    return tuple((filename, name_split[1]))


def confirm_mixin_candidate(pristine_files: List[str], candidate_mixin: Tuple[str, str]) -> bool:
    """
    Confirms if a given candidate mixin should really be mixed in by checking that the file to mix into is present
    Args:
        pristine_files (str): list of file names in the pristine directory
        candidate_mixin (Tuple[str, str]): candidate mixin from `mixin_name_from_valid` where the 1st element is the mixin, and 2nd is what dataset to mix into

    Returns:
        bool: True if the file is found, False otherwise
    """
    mix_into = "{}_valid".format(candidate_mixin[1])
    return mix_into in pristine_files


def find_all_mixin(pristine_files: List[str]) -> Dict[str, List[str]]:
    """
    Args:
        pristine_files (List[str]): List of all files in the pristine directory
    """
    mixin_candidates = [] # type: List[Tuple[str, str]]
    for p in pristine_files:
        candidate = mixin_name_from_valid(p)
        if candidate is not None:
            mixin_candidates.append(candidate)
    
    confirmed_mixins = [c for c in mixin_candidates if confirm_mixin_candidate(pristine_files, c)]

    # Last, let's make a map from every dataset d -> Mix
    # mixins are: [mix, d]
    # Reminder that the mix name is the full mixin filename, like: paint_mgi__mgi_valid
    dataset_mixins = collections.defaultdict(list) # type: Dict[str, List[str]]
    
    for p in pristine_files:
        dataset_mixins[p] = []
        for (mix, d) in confirmed_mixins:
            if p == pristine_filename_from_dataset(d):
                # If dataset name for p == d, then mix is a mixin for p
                dataset_mixins[p].append(mix)

    return dataset_mixins

