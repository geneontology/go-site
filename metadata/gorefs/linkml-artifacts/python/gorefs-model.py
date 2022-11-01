# Auto generated from gorefs-model.yaml by pythongen.py version: 0.9.0
# Generation date: 2022-11-01T15:13:24
# Schema: GO_REF
#
# id: https://w3id.org/geneontology
# description: LinkML schema representing the structure of GO_REF metadata
# license: https://creativecommons.org/publicdomain/zero/1.0/

import dataclasses
import sys
import re
from jsonasobj2 import JsonObj, as_dict
from typing import Optional, List, Union, Dict, ClassVar, Any
from dataclasses import dataclass
from linkml_runtime.linkml_model.meta import EnumDefinition, PermissibleValue, PvFormulaOptions

from linkml_runtime.utils.slot import Slot
from linkml_runtime.utils.metamodelcore import empty_list, empty_dict, bnode
from linkml_runtime.utils.yamlutils import YAMLRoot, extended_str, extended_float, extended_int
from linkml_runtime.utils.dataclass_extensions_376 import dataclasses_init_fn_with_kwargs
from linkml_runtime.utils.formatutils import camelcase, underscore, sfx
from linkml_runtime.utils.enumerations import EnumDefinitionImpl
from rdflib import Namespace, URIRef
from linkml_runtime.utils.curienamespace import CurieNamespace
from linkml_runtime.linkml_model.types import Boolean, Integer, String, Uriorcurie
from linkml_runtime.utils.metamodelcore import Bool, URIorCURIE

metamodel_version = "1.7.0"
version = None

# Overwrite dataclasses _init_fn to add **kwargs in __init__
dataclasses._init_fn = dataclasses_init_fn_with_kwargs

# Namespaces
ECO = CurieNamespace('ECO', 'http://purl.obolibrary.org/obo/eco.owl')
GO_REF = CurieNamespace('GO_REF', 'http://geneontology.org/')
J = CurieNamespace('J', 'http://purl.obolibrary.org/obo/eco.owl')
PMID = CurieNamespace('PMID', 'http://purl.obolibrary.org/obo/eco.owl')
LINKML = CurieNamespace('linkml', 'https://w3id.org/linkml/')
XSD = CurieNamespace('xsd', 'http://www.w3.org/2001/XMLSchema#')
DEFAULT_ = GO_REF


# Types
class Identifier(String):
    type_class_uri = XSD.string
    type_class_curie = "xsd:string"
    type_name = "Identifier"
    type_model_uri = GO_REF.Identifier


# Class references
class GoRefId(Identifier):
    pass


@dataclass
class GoRefCollection(YAMLRoot):
    _inherited_slots: ClassVar[List[str]] = []

    class_class_uri: ClassVar[URIRef] = GO_REF.GoRefCollection
    class_class_curie: ClassVar[str] = "GO_REF:GoRefCollection"
    class_name: ClassVar[str] = "GoRefCollection"
    class_model_uri: ClassVar[URIRef] = GO_REF.GoRefCollection

    gorefs: Optional[Union[Union[str, GoRefId], List[Union[str, GoRefId]]]] = empty_list()

    def __post_init__(self, *_: List[str], **kwargs: Dict[str, Any]):
        if not isinstance(self.gorefs, list):
            self.gorefs = [self.gorefs] if self.gorefs is not None else []
        self.gorefs = [v if isinstance(v, GoRefId) else GoRefId(v) for v in self.gorefs]

        super().__post_init__(**kwargs)


@dataclass
class GoRef(YAMLRoot):
    _inherited_slots: ClassVar[List[str]] = []

    class_class_uri: ClassVar[URIRef] = GO_REF.GoRef
    class_class_curie: ClassVar[str] = "GO_REF:GoRef"
    class_name: ClassVar[str] = "GoRef"
    class_model_uri: ClassVar[URIRef] = GO_REF.GoRef

    id: Union[str, GoRefId] = None
    authors: Optional[str] = None
    is_obsolete: Optional[Union[bool, Bool]] = None
    year: Optional[int] = None
    layout: Optional[str] = None
    title: Optional[str] = None
    comments: Optional[Union[str, List[str]]] = empty_list()
    external_accession: Optional[Union[Union[str, URIorCURIE], List[Union[str, URIorCURIE]]]] = empty_list()
    url: Optional[Union[str, URIorCURIE]] = None
    citation: Optional[Union[str, URIorCURIE]] = None
    alt_id: Optional[Union[Union[str, URIorCURIE], List[Union[str, URIorCURIE]]]] = empty_list()
    evidence_codes: Optional[Union[Union[str, URIorCURIE], List[Union[str, URIorCURIE]]]] = empty_list()

    def __post_init__(self, *_: List[str], **kwargs: Dict[str, Any]):
        if self._is_empty(self.id):
            self.MissingRequiredField("id")
        if not isinstance(self.id, GoRefId):
            self.id = GoRefId(self.id)

        if self.authors is not None and not isinstance(self.authors, str):
            self.authors = str(self.authors)

        if self.is_obsolete is not None and not isinstance(self.is_obsolete, Bool):
            self.is_obsolete = Bool(self.is_obsolete)

        if self.year is not None and not isinstance(self.year, int):
            self.year = int(self.year)

        if self.layout is not None and not isinstance(self.layout, str):
            self.layout = str(self.layout)

        if self.title is not None and not isinstance(self.title, str):
            self.title = str(self.title)

        if not isinstance(self.comments, list):
            self.comments = [self.comments] if self.comments is not None else []
        self.comments = [v if isinstance(v, str) else str(v) for v in self.comments]

        if not isinstance(self.external_accession, list):
            self.external_accession = [self.external_accession] if self.external_accession is not None else []
        self.external_accession = [v if isinstance(v, URIorCURIE) else URIorCURIE(v) for v in self.external_accession]

        if self.url is not None and not isinstance(self.url, URIorCURIE):
            self.url = URIorCURIE(self.url)

        if self.citation is not None and not isinstance(self.citation, URIorCURIE):
            self.citation = URIorCURIE(self.citation)

        if not isinstance(self.alt_id, list):
            self.alt_id = [self.alt_id] if self.alt_id is not None else []
        self.alt_id = [v if isinstance(v, URIorCURIE) else URIorCURIE(v) for v in self.alt_id]

        if not isinstance(self.evidence_codes, list):
            self.evidence_codes = [self.evidence_codes] if self.evidence_codes is not None else []
        self.evidence_codes = [v if isinstance(v, URIorCURIE) else URIorCURIE(v) for v in self.evidence_codes]

        super().__post_init__(**kwargs)


# Enumerations


# Slots
class slots:
    pass

slots.authors = Slot(uri=GO_REF.authors, name="authors", curie=GO_REF.curie('authors'),
                   model_uri=GO_REF.authors, domain=None, range=Optional[str])

slots.id = Slot(uri=GO_REF.id, name="id", curie=GO_REF.curie('id'),
                   model_uri=GO_REF.id, domain=None, range=URIRef)

slots.is_obsolete = Slot(uri=GO_REF.is_obsolete, name="is_obsolete", curie=GO_REF.curie('is_obsolete'),
                   model_uri=GO_REF.is_obsolete, domain=None, range=Optional[Union[bool, Bool]])

slots.year = Slot(uri=GO_REF.year, name="year", curie=GO_REF.curie('year'),
                   model_uri=GO_REF.year, domain=None, range=Optional[int])

slots.layout = Slot(uri=GO_REF.layout, name="layout", curie=GO_REF.curie('layout'),
                   model_uri=GO_REF.layout, domain=None, range=Optional[str])

slots.title = Slot(uri=GO_REF.title, name="title", curie=GO_REF.curie('title'),
                   model_uri=GO_REF.title, domain=None, range=Optional[str])

slots.comments = Slot(uri=GO_REF.comments, name="comments", curie=GO_REF.curie('comments'),
                   model_uri=GO_REF.comments, domain=None, range=Optional[Union[str, List[str]]])

slots.external_accession = Slot(uri=GO_REF.external_accession, name="external_accession", curie=GO_REF.curie('external_accession'),
                   model_uri=GO_REF.external_accession, domain=None, range=Optional[Union[Union[str, URIorCURIE], List[Union[str, URIorCURIE]]]])

slots.url = Slot(uri=GO_REF.url, name="url", curie=GO_REF.curie('url'),
                   model_uri=GO_REF.url, domain=None, range=Optional[Union[str, URIorCURIE]])

slots.citation = Slot(uri=GO_REF.citation, name="citation", curie=GO_REF.curie('citation'),
                   model_uri=GO_REF.citation, domain=None, range=Optional[Union[str, URIorCURIE]])

slots.alt_id = Slot(uri=GO_REF.alt_id, name="alt_id", curie=GO_REF.curie('alt_id'),
                   model_uri=GO_REF.alt_id, domain=None, range=Optional[Union[Union[str, URIorCURIE], List[Union[str, URIorCURIE]]]])

slots.evidence_codes = Slot(uri=GO_REF.evidence_codes, name="evidence_codes", curie=GO_REF.curie('evidence_codes'),
                   model_uri=GO_REF.evidence_codes, domain=None, range=Optional[Union[Union[str, URIorCURIE], List[Union[str, URIorCURIE]]]])

slots.gorefs = Slot(uri=GO_REF.gorefs, name="gorefs", curie=GO_REF.curie('gorefs'),
                   model_uri=GO_REF.gorefs, domain=None, range=Optional[Union[Union[str, GoRefId], List[Union[str, GoRefId]]]])