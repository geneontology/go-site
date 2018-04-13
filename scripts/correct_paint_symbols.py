import gzip
import json
import os.path
from ontobio.io.gafparser import GafParser
from ontobio.io.assocwriter import GafWriter
from ontobio.io.entityparser import GpiParser

with open("datasets.json") as f:
    datasets = json.load(f)

ds_level_dict = {}
for dataset in datasets:
    # ds_level_dict = {}
    if dataset["submitter"] != "paint" and dataset["type"] == "gaf" and dataset["submitter"] == "pombase":
        # Assuming gpi was constructed w/o paint gafs merged in yet
        ds = dataset["dataset"]
        with open("target/groups/{}/{}.gpi".format(ds, ds)) as gpi_f:
            for l in gpi_f.readlines():
                gpi_line, obj = GpiParser().parse_line(l)
                if len(obj) > 0:
                    gpi_line = obj[0]
                    obj_id = gpi_line["id"].split(":")[1]
                    # if gpi_line["id"] == "PomBase:SPAC23H4.18c":
                    #     print(l)
                    ds_level_dict[gpi_line["id"]] = gpi_line["label"]
                    # print(obj_id + " - " + gpi_line["label"])
                    # print(gpi_line)
        # print(len(ds_level_dict))

        # Dictionary's been made
        paint_gaf_file = "target/groups/paint_{}/paint_{}.gaf".format(ds, ds)
        path, leaf = os.path.split(paint_gaf_file)
        fixed_gaf = leaf.split(".gaf")[0] + "_fixed.gaf"

        with open(fixed_gaf, 'w') as ff:
            writer = GafWriter(ff)
            with open(paint_gaf_file) as paint_gaf_f:
                error_count = 0
                for pl in paint_gaf_f.readlines():
                    parse_result = GafParser().parse_line(pl)
                    assoc = parse_result.associations[0]  # Should only be one assoc?
                    if "subject" in assoc:
                        subj_id = assoc["subject"]["id"]
                        subj_label = assoc["subject"]["label"]
                        if subj_id in ds_level_dict and ds_level_dict[subj_id] != subj_label:
                            error_count += 1
                            print("Paint GAF " + subj_label + " doesn't match " + ds_level_dict[subj_id] + " from GPI for " + subj_id)
                            assoc["subject"]["label"] = ds_level_dict[subj_id]
                    writer.write_assoc(assoc)


print(str(error_count) + " errors")
# print(ds_level_dict["PomBase:SPAC23H4.18c"])
print(str(len(ds_level_dict.keys())) + " keys in dict")
# print(len(ds_level_dict))
# pipeline/target/groups/paint_pombase/paint_pombase.gaf