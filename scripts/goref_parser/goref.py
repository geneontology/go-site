import os
import io
from typing import Dict, Optional, Tuple, Union

import yamldown

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class GoRef:
    def __init__(self, goref_path: str) -> None:
        self.yd_path = goref_path

    @property
    def goref_path(self):
        return os.path.join(self.yd_path)

    @goref_path.setter
    def goref_path(self, goref_path: str):
        self.yd_path = goref_path

    def parse(
        self, portion: Optional[str] = None
    ) -> Union[Tuple[Dict, str], Dict, str]:
        with open(self.yd_path, "r") as file:
            yaml, md = yamldown.load(file)

        if portion == "yaml":
            return yaml
        elif portion == "md":
            return md

        return (yaml, md)
