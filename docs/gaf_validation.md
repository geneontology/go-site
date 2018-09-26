# GAF Validation

## Metadata Datasets YAML

The various groups that have GAFs for the Gene Ontology to process and validate
start as the `source` URL. This is in this repository, under `metadata/datasets/`.
We download each GAF file using this URL, and this is what is processed.

## Ontobio Parsing and Validation

Ontobio parses the GAF files and ensures first that the files are in the correct
format. Then each line is validated for correct ID usage, dates, compliance to
GO Rules and other various checks. Once this is done we output a report on any
issues found.

## PAINT Parsing and Combining

If the GAF being processed has a corresponding PAINT GAF associated with it, ontobio
will find, download, and validate it like in the above step. Then the validated
PAINT GAF is combined into the main validated GAF from above. This is done by
first placing the GAF header from the PAINT GAF after the header of the original
group GAF from above. Last the PAINT GAF annotations are pasted on end of the
above validated GAF file, creating a combined mod+PAINT GAF file. This is the
file that we release from the data pipeline
