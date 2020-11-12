from setuptools import setup, find_packages

setup(
    name="goat",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "ontobio",
        "click"
    ],
    entry_points="""
        [console_scripts]
        goat=goat.goat:cli
    """
)
