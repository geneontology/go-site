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
Header:
! gpad-version: 2.2
!
! generated-by: GOC
!
! date-generated: <date>
!
! This annotation file was assembled by the GOC data validation pipeline (http://geneontology.org/docs/submitting-go-annotations) using the metadata provided at https://github.com/geneontology/go-site/blob/master/metadata/datasets/<group>.yaml
!
! This file contains annotations validated and processed from the following datasets:
!   * mgi.gpad
!   * paint_mgi.gaf
!
! Following are the headers from the above source files used to generate this file:
! ===================================================================================
!
!   mgi.gpad
!   --------
!   <contents of mgi header, with version annotation skipped>
!
!
!   paint_mgi.gpad
!   --------------
!   <Contents of paint_mgi, with version annotation skipped>

"""

import collections
import pathlib
import datetime
import functools

from dataclasses import dataclass, field
from typing import DefaultDict, Dict, List, Optional, Tuple

class OrderEntryDict(collections.OrderedDict):
    """
    Store items in the order the keys were last added
    Taken from https://docs.python.org/3/library/collections.html#collections.OrderedDict
    """

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self.move_to_end(key)

@dataclass
class AnnotationsWithHeaders:
    dataset_headers_and_annotations: OrderEntryDict
    base_header: List[str] = field(default_factory=lambda: [
        "gpad-version: 2.0",
        "",
        "generated-by: GOC",
        "",
        "date-generated: {}".format(str(datetime.datetime.now().strftime("%Y-%m-%dT%H:%M"))),
        ""
        "This annotation file was assembled by the GOC data validation pipeline (http://geneontology.org/docs/submitting-go-annotations)", 
        "using the metadata provided at https://github.com/geneontology/go-site/blob/master/metadata/datasets/{group}.yaml",
        "",
    ])

    @classmethod
    def from_dataset_name(cls, directory: str, dataset_name: str):
        annotation_path, header_path = annotation_and_header_file_from_base_path(pathlib.Path(directory), dataset_name)
        annotations = []
        headers = []
        with open(annotation_path) as ann:
            annotations = [line for line in ann.readlines() if not line.startswith("!") and not line.strip() == ""]

        with open(header_path) as head:
            headers = [line.strip().replace("!", "") for line in head.readlines()]

        datasets = OrderEntryDict()
        datasets[dataset_name] = (annotations, headers)
        return AnnotationsWithHeaders(datasets)

    def add_dataset(self, directory: str, dataset_name: str):
        annotation_path, header_path = annotation_and_header_file_from_base_path(pathlib.Path(directory), dataset_name)
        annotations = []
        headers = []
        with open(annotation_path) as ann:
            annotations = [line for line in ann.readlines() if not line.startswith("!") and not line.strip() == ""]

        with open(header_path) as head:
            headers = [line.strip().replace("!", "") for line in head.readlines()]

        self.dataset_headers_and_annotations[dataset_name] = (annotations, headers)

    def header(self, group: str = "unknown") -> List[str]:
        """
        ! Base
        ! List
        !   * dataset names
        ! The following are the headers
        ! =============================
        !   dataset name
        !   ------------
        !   <header>
        """
        manifest_message = "Following are the headers from the above source files used to generate this file:"
        
        base_formatted = [b.format(group=group) for b in self.base_header]
        header_file_list = ["  * {ds}".format(ds=source_filename("blah", ds)) for ds in self.dataset_headers_and_annotations.keys()]
        subheader_message = [
            manifest_message,
            "=" * len(manifest_message)
        ]

        subheaders = list(functools.reduce(
            lambda acc, el: acc + el,
            [sub_header_entry(ds, subheader)
                for (ds, (_, subheader)) in 
                    self.dataset_headers_and_annotations.items()], []))

        return base_formatted + header_file_list + [""] + subheader_message + subheaders
    
    def annotations(self) -> List[str]:
        all_annotations = []
        for (_, (annotations, _)) in self.dataset_headers_and_annotations.items():
            all_annotations.extend(annotations)
        
        return all_annotations


    def name(self) -> str:
        return list(self.dataset_headers_and_annotations.keys())[0]

    def write(self, path: str):
        with open(path, "w") as outfile:
            outfile.writelines(["! " + header + "\n" for header in self.header()])
            outfile.writelines(self.annotations())


def annotation_and_header_file_from_base_path(pristine_dir: pathlib.Path, base_name: str) -> Tuple[pathlib.Path, pathlib.Path]:
    """
    Computes the header and annotation path for the given dataset name path.

    Args:
        pristine_dir (pathlib.Path): Path to the pristine directory
        base_path (str): something like: "mgi_valid"
    """
    annotation_path = pristine_dir.joinpath(base_name).with_suffix(".gpad")
    header_path = pristine_dir.joinpath(base_name).with_suffix(".header")
    return (annotation_path, header_path)

def sub_header_entry(dataset: str, header: List[str]) -> List[str]:
    """
    !   mgi.gpad
    !   --------
    !   <contents of mgi header, with version annotation skipped>
    """
    dataset_source_file = source_filename("blah", dataset)
    hr = "  " + "-" * len(dataset_source_file)
    return [""] + ["  " + dataset_source_file, hr] + ["  " + h for h in header] + [""]

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

def source_filename(source_dir: str, dataset: str) -> str:
    return "{}.gaf".format(dataset)


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

