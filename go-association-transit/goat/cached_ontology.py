import os

from ontobio import ontol_factory
from ontobio import ontol

from collections import defaultdict

class KeyDefaultDict(defaultdict):
    """
    This calls `default_factory` with the missing key as the one parameter
    """

    def __missing__(self, key):
        if self.default_factory is None:
            return super().__missing__(key)

        value = self.default_factory(key)
        self[key] = value

        return value

__ontology = KeyDefaultDict(lambda key: ontol_factory.OntologyFactory().create(key))

def from_file(path) -> ontol.Ontology:
    """
    Check if `path` is in the cached ontology, and if it is, return it.
    Otherwise, build the ontology from the path.
    """
    abs_path = os.path.abspath(os.path.normpath(path))

    return __ontology[abs_path]
