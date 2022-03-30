from setuptools import setup, find_packages

setup(
    name="rule-runner",
    version="0.2.1",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "click",
        "requests",
        "pyYaml==5.4.1",
        "pykwalify==1.6.0",
        "SPARQLWrapper==1.8.0",
        "yamldown",
        "rdflib==4.2.2"
    ],
    entry_points='''
        [console_scripts]
        sparta=rulerunner.main:cli
    '''
)
