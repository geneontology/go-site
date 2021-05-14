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
import re

from dataclasses import dataclass, field
from typing import ClassVar, DefaultDict, Dict, List, Optional, Pattern, Tuple

class OrderEntryDict(collections.OrderedDict):
    """
    Store items in the order the keys were last added
    Taken from https://docs.python.org/3/library/collections.html#collections.OrderedDict
    """

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self.move_to_end(key)

@dataclass(frozen=True)
class Dataset:
    group: str
    dataset: str
    mixin: Optional[str]
    file_type: str

    source_regex: ClassVar[Pattern] = re.compile(r"((?P<group>\w+?)__)?(?P<dataset>\w+?)(__(?P<mixin>\w+?))?-src")
    pristine_regex: ClassVar[Pattern] = re.compile(r"((?P<group>\w+?)__)?(?P<dataset>\w+?)(__(?P<mixin>\w+?))?_valid")
    # Python specific note: we can name capturing groups with ?P<name> immediately inside a group

    @classmethod
    def from_source(cls, path: pathlib.Path):
        """
        source path: [{group}__]{dataset}__{mixin}-src.{type}
        """
        ftype = path.suffix.replace(".", "")
        path_name = path.with_suffix("").name
        match_groups = cls.source_regex.match(path_name).groupdict()
        group = match_groups["group"] if match_groups["group"] is not None else "unknown"
        
        return Dataset(group, match_groups["dataset"], match_groups["mixin"], ftype)

    
    @classmethod
    def from_pristine(cls, path: pathlib.Path):
        ftype = path.suffix.replace(".", "")
        path_name = path.with_suffix("").name
        match_groups = cls.pristine_regex.match(path_name).groupdict()
        group = match_groups["group"] if match_groups["group"] is not None else "unknown"
        
        return Dataset(group, match_groups["dataset"], match_groups["mixin"], ftype)

    def source_path(self, source: str) -> pathlib.Path:
        if self.mixin is not None:
            return pathlib.Path(source).joinpath("{group}__{dataset}__{mixin}-src.{type}".format(group=self.group, dataset=self.dataset, mixin=self.mixin, type=self.file_type))
        else:
            return pathlib.Path(source).joinpath("{group}__{dataset}-src.{type}".format(group=self.group, dataset=self.dataset, type=self.file_type))
    
    def pristine_path(self, pristine: str) -> pathlib.Path:
        if self.mixin is not None:
            return pathlib.Path(pristine).joinpath("{group}__{dataset}__{mixin}_valid.{type}".format(group=self.group, dataset=self.dataset, mixin=self.mixin, type=self.file_type))
        else:
            return pathlib.Path(pristine).joinpath("{group}__{dataset}_valid.{type}".format(group=self.group, dataset=self.dataset, type=self.file_type))

    def header_path(self, pristine: str) -> pathlib.Path:
        if self.mixin is not None:
            return pathlib.Path(pristine).joinpath("{group}__{dataset}__{mixin}_valid.header".format(group=self.group, dataset=self.dataset, mixin=self.mixin))
        else:
            return pathlib.Path(pristine).joinpath("{group}__{dataset}_valid.header".format(group=self.group, dataset=self.dataset))

    def assemble_path(self, assemble: str) -> pathlib.Path:
        return pathlib.Path(assemble).joinpath("{dataset}.{type}".format(dataset=self.dataset, type=self.file_type))


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
    def from_dataset(cls, directory: str, dataset: Dataset):
        annotation_path = dataset.pristine_path(directory)
        header_path = dataset.header_path(directory)

        annotations = []
        headers = []
        with open(annotation_path) as ann:
            annotations = [line for line in ann.readlines() if not line.startswith("!") and not line.strip() == ""]

        with open(header_path) as head:
            headers = [line.strip().replace("!", "") for line in head.readlines()]

        datasets = OrderEntryDict()
        datasets[dataset.dataset] = (annotations, headers)
        return AnnotationsWithHeaders(datasets)

    def add_dataset(self, directory: str, dataset: Dataset):
        annotation_path = dataset.pristine_path(directory)
        header_path = dataset.header_path(directory)

        annotations = []
        headers = []
        with open(annotation_path) as ann:
            annotations = [line for line in ann.readlines() if not line.startswith("!") and not line.strip() == ""]

        with open(header_path) as head:
            headers = [line.strip().replace("!", "") for line in head.readlines()]

        self.dataset_headers_and_annotations[dataset.dataset] = (annotations, headers)

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

    def write(self, path: str, group: str):
        with open(path, "w") as outfile:
            outfile.writelines(["! " + header + "\n" for header in self.header(group)])
            outfile.writelines(self.annotations())


def sub_header_entry(dataset: str, header: List[str]) -> List[str]:
    """
    !   mgi.gpad
    !   --------
    !   <contents of mgi header, with version annotation skipped>
    """
    dataset_source_file = source_filename("blah", dataset)
    hr = "  " + "-" * len(dataset_source_file)
    return [""] + ["  " + dataset_source_file, hr] + ["  " + h for h in header] + [""]


def pristine_filename_from_dataset(dataset: str) -> str:
    return "{dataset}_valid".format(dataset=dataset)

def source_filename(source_dir: str, dataset: str) -> str:
    return "{}.gaf".format(dataset)


def find_all_mixin(pristine_files: List[str]) -> Dict[Dataset, List[Dataset]]:
    """
    For a list of filenames, produce a dictionary of filename to set of mixins

    Args:
        pristine_files (List[str]): List of all files in the pristine directory
    """
    dataset_mixins = collections.defaultdict(list)
    datasets = [Dataset.from_pristine(pathlib.Path(path)) for path in pristine_files]

    for d in datasets:
        dataset_mixins[d] = []

    for dataset in datasets:
        if dataset.mixin is not None:
            # this is the file that this dataset should be merged into
            # If this "mix into" file exists in the `pristine_files` then we've confirmed the mixin
            for ds in datasets:
                if ds.dataset == dataset.mixin:
                    # If there is a ds that matches the mixin target, then we know dataset is a mixin of ds
                    dataset_mixins[ds].append(dataset)

    return dataset_mixins

