import os
def version():
    filepath = os.path.join(os.path.dirname(__file__), 'VERSION')
    with open(filepath) as version_file:
       return version_file.read().strip()