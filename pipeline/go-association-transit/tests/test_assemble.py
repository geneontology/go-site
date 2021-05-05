from goat import assemble

import functools

def test_create_annotation_with_headers():
    h = assemble.AnnotationsWithHeaders.from_dataset_name("tests/resources", "mgi_test")
    assert len(h.dataset_headers_and_annotations) == 1
    assert h.name() == "mgi_test"
    (annotations, headers) = h.dataset_headers_and_annotations["mgi_test"]
    assert len(annotations) == 119
    assert len(h.annotations()) == 119

def test_add_mixin():
    h = assemble.AnnotationsWithHeaders.from_dataset_name("tests/resources", "mgi_test")
    h.add_dataset("tests/resources", "mgi_test2")
    
    assert h.name() == "mgi_test"
    assert len(h.dataset_headers_and_annotations) == 2
    assert len(h.annotations()) == 238
    # print(functools.reduce(lambda acc, el: acc + "\n! " + el, h.header(), ""))
