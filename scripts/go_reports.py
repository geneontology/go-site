# This script is the one to launch at every release to compute the full set of stats and changes between this and the previous release
# The script can also be used to compute the changes between any two releases by selecting older go-stats and OBO files

import json
import sys, getopt, os

import go_stats
import go_ontology_changes
import go_annotation_changes

import go_stats_utils as utils


def print_help():
    print('\nUsage: python go_reports.py -g <current_golr_url> -d <release_date> -s <previous_stats_url> -n <previous_stats_no_pb_url> -c <current_obo_url> -p <previous_obo_url> -r <previous_references_url> -o <output_rep>\n')


def main(argv):
    golr_url = ''
    previous_stats_url = ''
    previous_stats_no_pb_url = ''
    current_obo_url = ''
    previous_obo_url = ''    
    previous_references_url = ''
    output_rep = ''
    release_date = ''

    print(len(argv))
    if len(argv) < 16:
        print_help()
        sys.exit(2)

    try:
        opts, argv = getopt.getopt(argv,"g:s:n:c:p:o:d:r:",["golrurl=", "pstats=", "pnstats=", "cobo=", "pobo=", "orep=", "date=", "ref="])
    except getopt.GetoptError:
        print_help()
        sys.exit(2)

    for opt, arg in opts:
        if opt == '-h':
            print_help()
            sys.exit()
        elif opt in ("-g", "--golrurl"):
            golr_url = arg
            if not golr_url.endswith("/"):
                golr_url = golr_url + "/"
        elif opt in ("-s", "--pstats"):
            previous_stats_url = arg
        elif opt in ("-n", "--pnstats"):
            previous_stats_no_pb_url = arg
        elif opt in ("-c", "--cobo"):
            current_obo_url = arg
        elif opt in ("-p", "--pobo"):
            previous_obo_url = arg
        elif opt in ("-r", "--ref"):
            previous_references_url = arg
        elif opt in ("-o", "--orep"):
            output_rep = arg
        elif opt in ("-d", "--date"):
            release_date = arg

    if not output_rep.endswith("/"):
        output_rep += "/"

    if not os.path.exists(output_rep):
        os.mkdir(output_rep)


    # actual names of the files to be generated - can change here if needed
    output_stats =  output_rep + "go-stats.json"
    output_stats_no_pb =  output_rep + "go-stats-no-pb.json"
    output_references = output_rep + "go-references.tsv"
    output_pmids = output_rep + "go-pmids.tsv"
    output_pubmed_pmids = output_rep + "GO.uid"
    output_ontology_changes = output_rep + "go-ontology-changes.json"
    output_ontology_changes_tsv = output_rep + "go-ontology-changes.tsv"
    output_stats_summary = output_rep + "go-stats-summary.json"
    output_annotation_changes = output_rep + "go-annotation-changes.json"
    output_annotation_changes_tsv = output_rep + "go-annotation-changes.tsv"
    output_annotation_changes_no_pb = output_rep + "go-annotation-changes_no_pb.json"
    output_annotation_changes_no_pb_tsv = output_rep + "go-annotation-changes_no_pb.tsv"


    # 1 - Executing go_stats script
    print("\n\n1a - EXECUTING GO_STATS SCRIPT (INCLUDING PROTEIN BINDING)...\n")
    json_stats = go_stats.compute_stats(golr_url, release_date)
    print("DONE.")

    print("\n\n1b - EXECUTING GO_STATS SCRIPT (EXCLUDING PROTEIN BINDING)...\n")
    json_stats_no_pb = go_stats.compute_stats(golr_url, release_date, True)
    print("DONE.")

    print("\n\n1c - EXECUTING GO_STATS SCRIPT (RETRIEVING PREVIOUS REFERENCES LIST)...\n")
    previous_references_ids = utils.fetch(previous_references_url).text
    previous_references_ids = previous_references_ids.split("\n")
    previous_references_ids = list(map(lambda x: x.split("\t")[0], previous_references_ids))
    print("DONE.")

    print("\n\n1d - EXECUTING GO_STATS SCRIPT (CREATING CURRENT REFERENCES LIST)...\n")
    references = go_stats.get_references()
    references_lines = []
    for k,v in references.items():
        references_lines.append(k + "\t" + str(v))
    current_references_ids = list(map(lambda x: x.split("\t")[0], references_lines))

    pmids_lines = list(filter(lambda x: "PMID:" in x, references_lines))
    pmids_ids = list(map(lambda x: x.split("\t")[0].split(":")[1], pmids_lines))

    utils.write_text(output_references, "\n".join(references_lines))
    utils.write_text(output_pmids, "\n".join(pmids_lines))
    utils.write_text(output_pubmed_pmids, "\n".join(pmids_ids))
    print("DONE.")


    # 2 - Executing go_ontology_changes script
    print("\n\n2 - EXECUTING GO_ONTOLOGY_CHANGES SCRIPT...\n")
    json_onto_changes = go_ontology_changes.compute_changes(current_obo_url, previous_obo_url)
    utils.write_json(output_ontology_changes, json_onto_changes)

    tsv_onto_changes = go_ontology_changes.create_text_report(json_onto_changes) 
    utils.write_text(output_ontology_changes_tsv, tsv_onto_changes)
    print("DONE.")


    # 3 - Executing go_annotation_changes script
    print("\n\n3a - EXECUTING GO_ANNOTATION_CHANGES SCRIPT (INCLUDING PROTEIN BINDING)...\n")
    previous_stats = utils.fetch(previous_stats_url).json()    
    json_annot_changes = go_annotation_changes.compute_changes(json_stats, previous_stats)
    print("DONE.")
    
    print("\n\n3b - EXECUTING GO_ANNOTATION_CHANGES SCRIPT (EXCLUDING PROTEIN BINDING)...\n")
    previous_stats_no_pb = utils.fetch(previous_stats_no_pb_url).json()    # WE STILL NEED TO CORRECT THAT: 1 FILE OR SEVERAL FILE ? IF SEVERAL, ONE MORE PARAMETER
    json_annot_no_pb_changes = go_annotation_changes.compute_changes(json_stats_no_pb, previous_stats_no_pb)
    print("DONE.")


    # 4 - Refining go-stats with ontology stats
    print("\n\n4 - EXECUTING GO_REFINE_STATS SCRIPT...\n")
    merged_annotations_diff = utils.merge_dict(json_stats, json_annot_changes)
    json_annot_changes = merged_annotations_diff


    ontology = json_onto_changes["summary"]["current"].copy()
    del ontology["release_date"]
    ontology["changes_created_terms"] = json_onto_changes["summary"]["changes"]["created_terms"]
    ontology["changes_valid_terms"] = json_onto_changes["summary"]["changes"]["valid_terms"]
    ontology["changes_obsolete_terms"] = json_onto_changes["summary"]["changes"]["obsolete_terms"]
    ontology["changes_merged_terms"] = json_onto_changes["summary"]["changes"]["merged_terms"]

    ontology["changes_biological_process_terms"] = json_onto_changes["summary"]["changes"]["biological_process_terms"]
    ontology["changes_molecular_function_terms"] = json_onto_changes["summary"]["changes"]["molecular_function_terms"]
    ontology["changes_cellular_component_terms"] = json_onto_changes["summary"]["changes"]["cellular_component_terms"]

    json_stats = {
        "release_date" : json_stats["release_date"],
        "ontology" : ontology,
        "annotations" : json_stats["annotations"],
        "taxa" : json_stats["taxa"],
        "bioentities" : json_stats["bioentities"],
        "references" : json_stats["references"]
    }
    print("\n4a - SAVING GO-STATS...\n")
    utils.write_json(output_stats, json_stats)
    print("DONE.")


    json_stats_no_pb = {
        "release_date" : json_stats_no_pb["release_date"],
        "ontology" : ontology,
        "annotations" : json_stats_no_pb["annotations"],
        "taxa" : json_stats_no_pb["taxa"],
        "bioentities" : json_stats_no_pb["bioentities"],
        "references" : json_stats_no_pb["references"]
    }
    print("\n4b - SAVING GO-STATS-NO-PB...\n")
    utils.write_json(output_stats_no_pb, json_stats_no_pb)
    print("DONE.")


    annotations_by_reference_genome = json_stats["annotations"]["by_model_organism"]
    for taxon in annotations_by_reference_genome:
        for ecode in annotations_by_reference_genome[taxon]["by_evidence"]:
            annotations_by_reference_genome[taxon]["by_evidence"][ecode]["B"] = json_stats["annotations"]["by_model_organism"][taxon]["by_evidence"][ecode]["F"] - json_stats_no_pb["annotations"]["by_model_organism"][taxon]["by_evidence"][ecode]["F"]
        for ecode in annotations_by_reference_genome[taxon]["by_evidence_cluster"]:
            annotations_by_reference_genome[taxon]["by_evidence_cluster"][ecode]["B"] = json_stats["annotations"]["by_model_organism"][taxon]["by_evidence_cluster"][ecode]["F"] - json_stats_no_pb["annotations"]["by_model_organism"][taxon]["by_evidence_cluster"][ecode]["F"]

    bioentities_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        bioentities_by_reference_genome[key] = json_stats["bioentities"]["by_filtered_taxon"]["cluster"][key] if key in json_stats["bioentities"]["by_filtered_taxon"]["cluster"] else { }
        # TODO: we don't have a way to filter on bioentity documents without direct annotations to PB ?
        # for btype in bioentities_by_reference_genome[key]:
        #     val = json_stats_no_pb["bioentities"]["by_filtered_taxon"]["cluster"][key]["F"] if (key in json_stats_no_pb["bioentities"]["by_filtered_taxon"]["cluster"] and "F" in json_stats_no_pb["bioentities"]["by_filtered_taxon"]["cluster"][key]) else 0
        #     bioentities_by_reference_genome[key][btype]["B"] = bioentities_by_reference_genome[key][btype]["F"] - val

    references_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        references_by_reference_genome[key] = json_stats["references"]["all"]["by_filtered_taxon"][key] if key in json_stats["references"]["all"]["by_filtered_taxon"] else { }

    pmids_by_reference_genome = { }
    for taxon in go_stats.reference_genomes_ids:
        key = go_stats.taxon_label(taxon)
        pmids_by_reference_genome[key] = json_stats["references"]["pmids"]["by_filtered_taxon"][key] if key in json_stats["references"]["pmids"]["by_filtered_taxon"] else { }
        




    # This is to modify the structure of the annotation changes based on recent requests
    print("\n4c - SAVING GO-ANNOTATION-CHANGES...\n")
    json_annot_changes = go_annotation_changes.alter_annotation_changes(json_stats, previous_stats, current_references_ids, previous_references_ids, json_annot_changes)
    utils.write_json(output_annotation_changes, json_annot_changes)
    tsv_annot_changes = go_annotation_changes.create_text_report(json_annot_changes)
    utils.write_text(output_annotation_changes_tsv, tsv_annot_changes)
    print("DONE.")


    print("\n4d - SAVING GO-ANNOTATION-NO-PB-CHANGES...\n")
    json_annot_no_pb_changes = go_annotation_changes.alter_annotation_changes(json_stats_no_pb, previous_stats_no_pb, current_references_ids, previous_references_ids, json_annot_no_pb_changes)
    utils.write_json(output_annotation_changes_no_pb, json_annot_no_pb_changes)
    tsv_annot_changes_no_pb = go_annotation_changes.create_text_report(json_annot_no_pb_changes)
    utils.write_text(output_annotation_changes_no_pb_tsv, tsv_annot_changes_no_pb)
    print("DONE.")




    json_stats_summary = {
        "release_date" : json_stats["release_date"],
        "ontology" : ontology,
        "annotations" : {
            "total" : json_stats["annotations"]["total"],
            "total_no_pb" : json_stats_no_pb["annotations"]["total"],
            "total_pb" : json_stats["annotations"]["total"] - json_stats_no_pb["annotations"]["total"],
            "by_aspect" : {
                "P" : json_stats["annotations"]["by_aspect"]["P"],
                "F" : json_stats["annotations"]["by_aspect"]["F"],
                "C" : json_stats["annotations"]["by_aspect"]["C"],
                "B" : json_stats["annotations"]["by_aspect"]["F"] - json_stats_no_pb["annotations"]["by_aspect"]["F"]
            },
            "by_bioentity_type_cluster" : json_stats["annotations"]["by_bioentity_type"]["cluster"],
            "by_bioentity_type_cluster_no_pb" : json_stats_no_pb["annotations"]["by_bioentity_type"]["cluster"],
            "by_qualifier" : json_stats["annotations"]["by_qualifier"],
            "by_evidence_cluster" : json_stats["annotations"]["by_evidence"]["cluster"],
            "by_evidence_cluster_no_pb" : json_stats_no_pb["annotations"]["by_evidence"]["cluster"],
            "by_model_organism" : annotations_by_reference_genome
        },
        "taxa" : {
            "total" : json_stats["taxa"]["total"],
            "filtered" : json_stats["taxa"]["filtered"],
        },
        "bioentities" : {
            "total" : json_stats["bioentities"]["total"],
            "total_no_pb" : json_stats_no_pb["bioentities"]["total"],
            "by_type_cluster" : json_stats["bioentities"]["by_type"]["cluster"],
            "by_type_cluster_no_pb" : json_stats_no_pb["bioentities"]["by_type"]["cluster"],
            "by_model_organism" : bioentities_by_reference_genome
        },
        "references" : {
            "all" : {
                "total" : json_stats["references"]["all"]["total"],
                "total_no_pb" : json_stats_no_pb["references"]["all"]["total"],
                "added" : json_annot_changes["summary"]["changes"]["references"]["added"],
                "removed" : json_annot_changes["summary"]["changes"]["references"]["removed"],
                "by_model_organism" : references_by_reference_genome
            },
            "pmids" : {
                "total" : json_stats["references"]["pmids"]["total"],
                "total_no_pb" : json_stats_no_pb["references"]["pmids"]["total"],
                "added" : json_annot_changes["summary"]["changes"]["pmids"]["added"],
                "removed" : json_annot_changes["summary"]["changes"]["pmids"]["removed"],
                "by_model_organism" : pmids_by_reference_genome
            }
        },
    }

    # removing by_reference_genome.by_evidence
    for gen in json_stats_summary["annotations"]["by_model_organism"]:
        del json_stats_summary["annotations"]["by_model_organism"][gen]["by_evidence"]
    print("\n4e - SAVING GO-STATS-SUMMARY...\n")
    utils.write_json(output_stats_summary, json_stats_summary)
    print("DONE.")


    # Indicate all processes finished
    print("SUCCESS.")




if __name__ == "__main__":
   main(sys.argv[1:])
   