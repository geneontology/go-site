import io
from typing import Dict, Optional, Tuple, Union

import yamldown


class GoRef:
    def __init__(self, yamldown_path: str) -> None:
        with open(yamldown_path, "r") as file:
            self.yd_content = file.read()

    def parse(
        self, portion: Optional[str] = None
    ) -> Union[Tuple[Dict, str], Dict, str]:
        f = io.StringIO(self.yd_content)
        yaml, md = yamldown.load(f)

        if portion == "yaml":
            return yaml
        elif portion == "md":
            return md

        return (yaml, md)
