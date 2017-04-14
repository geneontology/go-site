from setuptools import setup, find_packages

setup(
    name="rule-runner",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "click==6.7",
        "requests==2.13.0",
        "pyYaml==3.12",
        "pykwalify==1.6.0",
        "SPARQLWrapper==1.8.0"
    ],
    entry_points='''
        [console_scripts]
        rulerunner=rulerunner.main:cli
    '''
)
