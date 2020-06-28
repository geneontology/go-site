import json
import requests

# This is a hard coded list of evidence, better organized for readability
ev_all = ['EXP', 'IDA', 'IMP', 'IGI',  'IPI', 'IEP', 'IGC', 'RCA', 'IBA', 'IKR', 'IC', 'NAS', 'ND', 'TAS', 'HDA', 'HEP', 'HGI', 'HMP', 'ISA', 'ISM', 'ISO', 'ISS', 'IEA']


def golr_fetch(golr_base_url, select_query):
    r = requests.get(golr_base_url + select_query)
    response = r.json()
    return response


# utility function to build a list from a solr/golr facet array
def build_list(items_list, min_size = None):
    ls = []
    for i in range(0, len(items_list), 2):
        if min_size is None or items_list[i + 1] > min_size:
            ls.append(items_list[i])
    return ls

# utility function to transform a list [A, 1, B, 2] into a map {A: 1, B: 2}
def build_map(items_list, min_size = None):
    map = {}
    for i in range(0, len(items_list), 2):
        if min_size is None or items_list[i + 1] > min_size:
            map[items_list[i]] = items_list[i + 1]
    return map

# utility function to build a reverse map: { "a": 1, "b": 1, "c": 2 } -> {1: ["a", "b"], 2: ["c"]}
def build_reverse_map(map):
    reverse_map = { }
    for key, val in map.items():
        ls = []
        if val in reverse_map:
            ls = reverse_map[val]
        else:
            reverse_map[val] = ls
        ls.append(key)
    return reverse_map

# utility function to cluster elements of an input map based on another map of synonyms
def cluster_map(input_map, synonyms):
    cluster = { }
    for key, val in input_map.items():
        temp = synonyms[key]
        if temp in cluster:
            val_cluster = cluster[temp]
            cluster[temp] = val_cluster + val
        else:
            cluster[temp] = val
    return cluster

# similar as above but the value of each key is also a map
def cluster_complex_map(input_map, synonyms):
    cluster = { }
    for key, val in input_map.items():
        temp = synonyms[key]
        # print("working on : " , key , val)
        if temp in cluster:
            temp_cluster = cluster[temp]
            # print("cluster already found : ", temp , temp_cluster)
            for key_cluster, val_cluster in temp_cluster.items():
                temp_cluster[key_cluster] = val_cluster + val[key_cluster]
        else:
            cluster[temp] = val
    return cluster


# reorder map (python 3.6 keeps order in which items are inserted in map: https://stackoverflow.com/questions/613183/how-do-i-sort-a-dictionary-by-value)
def ordered_map(map):
    ordered_map = { }
    for w in sorted(map, key=map.get, reverse=True):
        ordered_map[w] = map[w]
    return ordered_map
    
def extract_map(map, key_str):
    extracted = { }
    for key, val in map.items():
        if key_str in key:
            extracted[key] = val
    return extracted


def merge_dict(dict_total, dict_diff):
    new_dict = { }
    for key, val in dict_total.items():
        if type(val) == str:
            new_dict[key] = val
        elif type(val) == int or type(val) == float:
            if val == 0:
                diff_val = dict_diff[key] if key in dict_diff else 0
                new_dict[key] = str(diff_val) + " / " + str(val) + "\t0%"
            else:
                diff_val = dict_diff[key] if key in dict_diff else 0
                new_dict[key] = str(diff_val) + " / " + str(val) + "\t" + str(round(100 * diff_val / val, 2)) + "%"
        elif type(val) == dict:
            diff_val = dict_diff[key] if key in dict_diff else { }
            new_dict[key] = merge_dict(val, diff_val)
        else:
            print("should not happened ! " , val , type(val))
    return new_dict

def minus_dict(dict1, dict2):
    new_dict = { }
    for key, val in dict1.items():
        if type(val) == str:
            new_dict[key] = val
        elif type(val) == int or type(val) == float:
                diff_val = dict2[key] if key in dict2 else 0
                new_dict[key] = val - diff_val
        elif type(val) == dict:
            diff_val = dict2[key] if key in dict2 else { }
            new_dict[key] = merge_dict(val, diff_val)
        else:
            print("should not happened ! " , val , type(val))
    return new_dict    

def has_taxon(stats, taxon_id):
    for taxon in stats["annotations"]["by_taxon"]:
        if taxon_id in taxon:
            return True
    return False
    
def added_removed_species(current_stats, previous_stats):
    results = {
        "added" : { },
        "removed" : { }
    }

    for taxon in current_stats["annotations"]["by_taxon"]:
        taxon_id = taxon.split("|")[0]
        if not has_taxon(previous_stats, taxon_id):
            results["added"][taxon] = current_stats["annotations"]["by_taxon"][taxon]

    for taxon in previous_stats["annotations"]["by_taxon"]:
        taxon_id = taxon.split("|")[0]
        if not has_taxon(current_stats, taxon_id):
            results["removed"][taxon] = previous_stats["annotations"]["by_taxon"][taxon]
        
    return results    


def bioentity_type(str_type):
    """
    In a nutshell, collapse all RNA related types into RNA
    """
    if "RNA" in str_type or "ribozyme" in str_type or "transcript" in str_type:
        return "RNA_cluster"
    return str_type

def sum_map_values(map):
    """
    Utility function to sum up the values of a map. Assume the map values are all numbers
    """
    total = 0
    for key, val in map.items():
        total += val
    return total

def write_json(key, content):
    with open(key, 'w') as outfile:
        try:
            json.dump(content, outfile, indent=2)
        finally:
            outfile.close()
 
def write_text(key, content):
    with open(key, 'w') as outfile:
        try:
            outfile.write(content)
        finally:
            outfile.close()

