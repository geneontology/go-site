import click
import os

def groups_dir():
    return os.path.join(os.getcwd(), "target", "groups")

def group_names():
    return os.listdir(groups_dir())

def group_files(group):
    return [os.path.join(groups_dir(), group, filename) for filename in os.listdir(os.path.join(groups_dir(), group))]

def modification_time(path):
    return os.path.getmtime(path)

def group_files_times(group):
    return sorted([modification_time(path) for path in group_files(group)])

def group_time_delta(group):
    times = group_files_times(group)
    return times[-1] - times[0]

def all_groups_timing():
    return { group: group_time_delta(group) for group in group_names() }

def display(timings: dict) -> str:
    lines = ["{group} : {timing} seconds".format(group=group, timing=timings[group]) for group in timings]
    return "\n".join(lines)

def optional_file_write(writable, text):
    if writable:
        writable.write(text)

@click.command()
@click.argument("group", required=False)
@click.option("--record", type=click.File("w"))
def timing(group, record):
    if not group:
        timings = display(all_groups_timing())
    else:
        timings = "{group} : {timing} seconds".format(group=group, timing=group_time_delta(group))

    click.echo(timings)
    optional_file_write(record, timings)


if __name__ == "__main__":
    timing()
