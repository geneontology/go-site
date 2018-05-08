import gzip
import json
from ontobio.io.gafparser import GafParser
from ontobio.io.entityparser import GpiParser

with open("datasets.json") as f:
    datasets = json.load(f)

for dataset in datasets:
    if dataset["submitter"] != "paint" and dataset["type"] == "gaf" and dataset["submitter"] == "pombase":
        with open("target/groups/{}/{}.gpi".format(dataset["dataset"], dataset["dataset"])) as gpi_f:
            for l in gpi_f.readlines():
                gpi_line, obj = GpiParser().parse_line(l)
                if len(obj) > 0:
                    gpi_line = obj[0]
                    obj_id = gpi_line["id"].split(":")[1]
                    print(obj_id + " - " + gpi_line["label"])
                    # print(gpi_line)