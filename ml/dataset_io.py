"""Read quoted multiline report narratives without losing word boundaries."""
import csv
import io


def read_dataset_rows(raw):
    return list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline="")))
