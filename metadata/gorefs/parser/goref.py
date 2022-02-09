import io
from typing import Dict, Optional, Tuple, Union

import yamldown


class GoRef:
    def __init__(self, yamldown_path: str) -> None:
        self.yd_path = yamldown_path

    def parse(
        self, portion: Optional[str] = None
    ) -> Union[Tuple[Dict, str], Dict, str]:
        with open(self.yd_path, "r") as file:
            self.yd_content = file.read()
    
        f = io.StringIO(self.yd_content)
        yaml, md = yamldown.load(f)

        if portion == "yaml":
            return yaml
        elif portion == "md":
            return md

        return (yaml, md)
