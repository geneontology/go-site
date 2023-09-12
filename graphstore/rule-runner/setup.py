from setuptools import setup, find_packages

setup(
    name="rule-runner",
    version="0.2.1",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "click",
        "requests",
        "pyYaml",
        "pykwalify",
        "SPARQLWrapper",
        "yamldown",
        "rdflib"
    ],
    entry_points='''
        [console_scripts]
        sparta=rulerunner.main:cli
    '''
)
