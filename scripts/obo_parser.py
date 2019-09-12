import networkx as nx
import re

from enum import Enum

import requests
import sys

class TermState:
    ANY = 1
    VALID = 2
    OBSOLETED = 3
    MERGED = 4

def value(var):
    return var if var is not None else "N/A"
    
def relationValue(array):
    if array is None:
        return "N/A"
    
    
    
class NamedEntity:
    
    def __init__(self):
        self.id = None
        self.label = None
    
    
class Term:
    
    def __init__(self):
        self.id = None
        self.alt_ids = None
        self.is_obsolete = False
        self.is_a = None
        self.namespace = None
        self.name = None
        self.comment = None
        self.synonyms = None
        self.definition = None
        self.created_by = None
        self.creation_date = None
        self.subsets = None
        self.xrefs = None
        self.intersection_of = None
        self.relationship = None
        
        
    def count_metas(self, includeXRefs = True):
        count = 0
        if self.id:
            count += 1
        if self.alt_ids:
            count += len(self.alt_ids)
        # if self.is_obsolete:
        #     count += 1
        if self.namespace:
            count += 1
        if self.name:
            count += 1
        if self.comment:
            count += 1
        if self.synonyms:
            count += len(self.synonyms)
        if self.definition:
            count += 1
        if self.subsets:
            count += len(self.subsets)
        if self.xrefs and includeXRefs:
            count += len(self.xrefs)
        return count
        
    def count_structurals(self):
        count = 0
        if self.is_a:
            count += len(self.is_a)
        if self.relationship:
            count += len(self.relationship)
        if self.intersection_of:
            count == len(self.intersection_of)
        return count
        

    def is_merged(self):
        return self.alt_ids is not None
        
        
    def has_alt_id(self, query):
        if self.alt_ids is None:
            return False
        for id in self.alt_ids:
            if id == query:
                return True
        return False
        
        
    def add_intersection_of(self, relationship, target_id, target_label):
        if self.intersection_of is None:
            self.intersection_of = []

        relation = Relation()
        if relationship == "":
            relation.name = "is_a"
        else:
            relation.name = relationship

#        print("relation: " + relation.name + " id: " + target_id + " label: " + target_label)

        target = NamedEntity()
        target.id = target_id
        target.label = target_label
        
        relationTarget = RelationTarget()
        relationTarget.relation = relation
        relationTarget.target = target
        
#        self.intersection_of.append(relationTarget)
        self.intersection_of.append(relation.name + " " + target_id)
        
    def add_relationship(self, relationship, target_id, target_label):
        if self.relationship is None:
            self.relationship = []

        relation = Relation()
        if relationship == "":
            relation.name = "is_a"
        else:
            relation.name = relationship

#        print("relation: " + relation.name + " id: " + target_id + " label: " + target_label)

        target = NamedEntity()
        target.id = target_id
        target.label = target_label
        
        relationTarget = RelationTarget()
        relationTarget.relation = relation
        relationTarget.target = target
        
#        self.relationship.append(relationTarget)
        self.relationship.append(relation.name + " " + target_id)
        
        
    def add_is_a(self, is_a):
        if self.is_a is None:
            self.is_a = []
        self.is_a.append(is_a)
        
    def add_alternate_id(self, alt_id):
        if self.alt_ids is None:
            self.alt_ids = []
        self.alt_ids.append(alt_id)
        
    def add_synonym(self, synonym):
        if self.synonyms is None:
            self.synonyms = []
        self.synonyms.append(synonym)
        
    def add_subset(self, subset):
        if self.subsets is None:
            self.subsets = []
        self.subsets.append(subset)
        
    def add_xref(self, xref):
        if self.xrefs is None:
            self.xrefs = []
        self.xrefs.append(xref)

    def equals(self, other):
        return self.id == other.id and self.is_obsolete == other.is_obsolete and self.alt_ids == other.alt_ids and self.name == other.name and self.is_a == other.is_a and self.namespace == other.namespace and self.definition == other.definition and self.comment == other.comment and self.synonyms == other.synonyms and self.subsets == other.subsets and self.xrefs == other.xrefs and self.relationship == other.relationship and self.intersection_of == other.intersection_of

    def structural_equals(self, other):
        return self.is_a == other.is_a and self.relationship == other.relationship and self.intersection_of == other.intersection_of

    def meta_equals(self, other, includeXRefs = True):
        if includeXRefs:
            return self.id == other.id and self.is_obsolete == other.is_obsolete and self.alt_ids == other.alt_ids and self.name == other.name and self.namespace == other.namespace and self.definition == other.definition and self.comment == other.comment and self.synonyms == other.synonyms and self.subsets == other.subsets and self.xrefs == other.xrefs
        return self.id == other.id and self.is_obsolete == other.is_obsolete and self.alt_ids == other.alt_ids and self.name == other.name and self.namespace == other.namespace and self.definition == other.definition and self.comment == other.comment and self.synonyms == other.synonyms and self.subsets == other.subsets

    def explain_structural_differences(self, other):
        reasons = {}
        if self.is_a != other.is_a:
            reasons["is_a"] = {"current": value(self.is_a), "previous": value(other.is_a) }
        if self.relationship != other.relationship:
            reasons["relationship"] = {"current": value(self.relationship), "previous": value(other.relationship) }
        if self.intersection_of != other.intersection_of:
            reasons["intersection_of"] = {"current": value(self.intersection_of), "previous": value(other.intersection_of) }
        return reasons

    def explain_meta_differences(self, other, includeXRefs = True):
        reasons = {}
        if self.id != other.id:
            reasons["id"] = {"current": value(self.id), "previous": value(other.id) }
        if self.is_obsolete != other.is_obsolete:
            reasons["is_obsolete"] = {"current": value(self.is_obsolete), "previous": value(other.is_obsolete) }
        if self.alt_ids != other.alt_ids:
            reasons["alt_ids"] = {"current": value(self.alt_ids), "previous": value(other.alt_ids) }
        if self.name != other.name:
            reasons["name"] = {"current": value(self.name), "previous": value(other.name) }
        if self.namespace != other.namespace:
            reasons["namespace"] = {"current": value(self.namespace), "previous": value(other.namespace) }
        if self.definition != other.definition:
            reasons["definition"] = {"current": value(self.definition), "previous": value(other.definition) }
        if self.comment != other.comment:
            reasons["comment"] = {"current": value(self.comment), "previous": value(other.comment) }
        if self.synonyms != other.synonyms:
            reasons["synonyms"] = {"current": value(self.synonyms), "previous": value(other.synonyms) }
        if self.subsets != other.subsets:
            reasons["subsets"] = {"current": value(self.subsets), "previous": value(other.subsets) }
        if self.xrefs != other.xrefs and includeXRefs:
            reasons["xrefs"] = {"current": value(self.xrefs), "previous": value(other.xrefs) }
        return reasons
        
    def explain_differences(self, other):
        reasons = {}
        if self.id != other.id:
            reasons["id"] = {"current": value(self.id), "previous": value(other.id) }
        if self.is_obsolete != other.is_obsolete:
            reasons["is_obsolete"] = {"current": value(self.is_obsolete), "previous": value(other.is_obsolete) }
        if self.alt_ids != other.alt_ids:
            reasons["alt_ids"] = {"current": value(self.alt_ids), "previous": value(other.alt_ids) }
        if self.name != other.name:
            reasons["name"] = {"current": value(self.name), "previous": value(other.name) }
        if self.namespace != other.namespace:
            reasons["namespace"] = {"current": value(self.namespace), "previous": value(other.namespace) }
        if self.definition != other.definition:
            reasons["definition"] = {"current": value(self.definition), "previous": value(other.definition) }
        if self.comment != other.comment:
            reasons["comment"] = {"current": value(self.comment), "previous": value(other.comment) }
        if self.synonyms != other.synonyms:
            reasons["synonyms"] = {"current": value(self.synonyms), "previous": value(other.synonyms) }
        if self.subsets != other.subsets:
            reasons["subsets"] = {"current": value(self.subsets), "previous": value(other.subsets) }
        if self.xrefs != other.xrefs:
            reasons["xrefs"] = {"current": value(self.xrefs), "previous": value(other.xrefs) }
        if self.is_a != other.is_a:
            reasons["is_a"] = {"current": value(self.is_a), "previous": value(other.is_a) }
        if self.relationship != other.relationship:
            reasons["relationship"] = {"current": value(self.relationship), "previous": value(other.relationship) }
        if self.intersection_of != other.intersection_of:
            reasons["intersection_of"] = {"current": value(self.intersection_of), "previous": value(other.intersection_of) }
        return reasons
        
    def __str__(self):
        return self.id + "\t" + self.name
        
class Relation:
    
    def __init__(self):
        id = None
        name = None
        namespace = None
        xref = None
        is_transitive = False
        
    def __str__(self):
        return self.id + "\t" + self.name


class RelationTarget:

    def __init__(self):
        id = None
        relation = None # Relation
        target = None   # NamedEntity


# TODO: I have to add the is_a: term_id ! term_name but I have to add it in the edges of the graph
# TODO: I can also add the consider (who link to other term_ids)
# TODO: Other relations: intersection_of, relationship
class OBO_Parser:
    
    term_key = "[Term]"
    type_def_key = "[Typedef]"
    header = None
    obo_graph = None
    relation_graph = None
    
    def __init__(self, content):
        self.content = content
        self.obo_graph = nx.Graph()
        self.relation_graph = nx.Graph()
        self.header = { }
        self._parseHeader()
        self._parseTerms()
        self._parseRelations()
        print("oboparser: ", len(self.obo_graph) , " terms")
            
            
    def _parseHeader(self):
        lines = self.content.split(self.term_key)[0].split("\n")
        for line in lines:
            if len(line) == 0:
                continue
            kv = re.split(":(?=\s)", line)
#            print("line: " , line , " kv: ", kv)
            self.header[kv[0].strip()] = kv[1].strip()
        print(self.header)


    def _parseTerms(self):
        terms = self.content.split(self.term_key)
        for i in range(1, len(terms)):
            term = Term()

            for line in terms[i].split("\n"):
                if len(line) == 0:
                    continue
                
                if line.startswith(self.type_def_key):
                    break
                
                value = re.split(":(?=\s)", line)[1].strip()
                if line.startswith("id"):
                    term.id = value
                elif line.startswith("alt_id"):
                    term.add_alternate_id(value)
                elif line.startswith("namespace"):
                    term.namespace = value
                elif line.startswith("name"):
                    term.name = value
                elif line.startswith("comment"):
                    term.comment = value
                elif line.startswith("def"):
                    term.definition = value
                elif line.startswith("synonym"):
                    term.add_synonym(value)
                elif line.startswith("subset"):
                    term.add_subset(value)
                elif line.startswith("is_obsolete"):
                    term.is_obsolete = value
                    if term.is_obsolete == "true":
                        term.is_obsolete = True
                elif line.startswith("xref"):
                    term.add_xref(value)
                elif line.startswith("is_a"):
                    term.add_is_a(value.split(" ! ")[0].strip())
                elif line.startswith("relationship"):
                    split = value.split("GO:")
                    split2 = split[1].split(" ! ");
                    target_id = "GO:" + split2[0].strip()
                    target_label = split2[1].strip()
                    term.add_relationship(split[0].strip(), target_id, target_label)
                elif line.startswith("intersection_of"):
                    split = value.split("GO:")
                    split2 = split[1].split(" ! ");
                    target_id = "GO:" + split2[0].strip()
                    target_label = split2[1].strip()
                    term.add_intersection_of(split[0].strip(), target_id, target_label)

            self.obo_graph.add_node(term.id, object=term)
            

    def _parseRelations(self):
        relations = self.content.split(self.type_def_key)

        for i in range(1, len(relations)):
            relation = Relation()

            for line in relations[i].split("\n"):
                if len(line) == 0:
                    continue
                
                value = line.split(":")[1].strip()
                if line.startswith("id"):
                    relation.id = value
                elif line.startswith("name"):
                    relation.name = value
                elif line.startswith("namespace"):
                    relation.namespace = value
                elif line.startswith("xref"):
                    relation.xref = value
                elif line.startswith("is_transitive"):
                    relation.is_transitive = value

            self.relation_graph.add_node(relation.id, object=relation)
            
            
    def get_nodes(self):
        return self.obo_graph.nodes(data=True)


    def get_terms(self, term_state = TermState.VALID):
        map = { }
        for id, data in self.obo_graph.nodes(data=True):
            if term_state == TermState.ANY or (term_state == TermState.OBSOLETED and data['object'].is_obsolete) or (term_state == TermState.VALID and not data['object'].is_obsolete):
                map[id] = data['object']
        return map
        
        
    def get_terms_in(self, aspect, term_state = TermState.VALID):
        list = []
        for id, data in self.obo_graph.nodes(data=True):
            if term_state == TermState.ANY or (term_state == TermState.OBSOLETED and data['object'].is_obsolete) or (term_state == TermState.VALID and not data['object'].is_obsolete):
                if data['object'].namespace == aspect:
                    list.append(data['object'].id)
        return list
        
    def get_merged_terms(self, term_state = TermState.VALID):
        list = set()
        for id, data in self.obo_graph.nodes(data=True):
            if term_state == TermState.ANY or (term_state == TermState.OBSOLETED and data['object'].is_obsolete) or (term_state == TermState.VALID and not data['object'].is_obsolete):
                if data['object'].alt_ids:
                    for alt_id in data['object'].alt_ids:
                        if self.term_used_as_alternate(alt_id):
                            list.add(data['object'].id)
        return list
        
    def has_term(self, query):
        return self.obo_graph.has_node(query)


    def get_term(self, query):
        if not self.has_term(query):
            return None
        return self.obo_graph.node[query]['object']
        
    
    def term_used_as_alternate(self, query):
        for id, data in self.obo_graph.nodes(data=True):
            if data['object'].has_alt_id(query):
                return True
        return False
        
    def get_alternate_terms(self, query):
        list = []
        for id, data in self.obo_graph.nodes(data=True):
            if data['object'].has_alt_id(query):
                list.append({ "id": data['object'].id , "name": data['object'].name })
        return list
        
    def count_all_metas(self, term_state = TermState.VALID, includeXRefs = True):
        count = 0
        for id, data in self.obo_graph.nodes(data=True):
            if term_state == TermState.ANY or (term_state == TermState.OBSOLETED and data['object'].is_obsolete) or (term_state == TermState.VALID and not data['object'].is_obsolete):
                count += data['object'].count_metas(includeXRefs)
        return count
        
        
    def count_all_structurals(self, term_state = TermState.VALID):
        count = 0
        for id, data in self.obo_graph.nodes(data=True):
            if term_state == TermState.ANY or (term_state == TermState.OBSOLETED and data['object'].is_obsolete) or (term_state == TermState.VALID and not data['object'].is_obsolete):
                count += data['object'].count_structurals()
        return count

    def get_children(self, root):
        children = set()
        for id, data in self.obo_graph.nodes(data=True):
            current = data['object']
            if current.is_obsolete:
                continue
            if current.is_a is None:
                continue
            if root.id in current.is_a:
                children.add(current)
                # locals = self.get_children(current)
                # for local in locals:
                #     children.add(local)
        return children


def main(argv):
    go_obo_url = "https://geneontology-public.s3.amazonaws.com/archive/2019-06-09_go.obo"
    req = requests.get(go_obo_url)
    print("obo downloaded")

    obo = OBO_Parser(req.text)
    term_id = "GO:0005515"
    term = obo.get_term(term_id)

    print("using term: ", term.id , term.name)
    derived_terms = obo.get_children(term)
    print(len(derived_terms) , " derived terms")

    derived_ids = []
    for dterm in derived_terms:
        derived_ids.append(dterm.id)

    not_derived_terms = " AND NOT \"" + "\" AND NOT \"".join(derived_ids)


    url = "http://golr-aux.geneontology.io/solr/" + "select?fq=document_category:\"bioentity\"&q=*:*&wt=json&facet=true&facet.field=type&facet.field=taxon&facet.limit=1000000&facet.mincount=1&rows=10&fq=!annotation_class_list:(\"GO:0005515\"" + not_derived_terms + "\")"
    print(url)

    req = requests.get(url)
    print(req.text)


if __name__ == "__main__":
   main(sys.argv[1:])

