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
        with open(self.goref_path, "r") as file:
            self.yd_content = file.read()
    
        f = io.StringIO(self.yd_content)
        yaml, md = yamldown.load(f)

        if portion == "yaml":
            return yaml
        elif portion == "md":
            return md

        return (yaml, md)
