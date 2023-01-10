import setuptools

with open("README.md", "r") as fh:
    longdescription =  fh.read()

with open('igv_notebook/VERSION') as version_file:
    version = version_file.read().strip()

setuptools.setup(name='igv-notebook',
                 packages=['igv_notebook'],
                 version=version,
                 description='Package for embedding the igv.js genome visualization in IPython notebooks',
                 long_description=longdescription,
                 long_description_content_type="text/markdown",
                 license='MIT',
                 author='Jim Robinson',
                 url='https://github.com/igvteam/igv-notebook',
                 keywords=['igv', 'bioinformatics', 'genomics', 'visualization', 'ipython', 'jupyter'],
                 install_requires=['ipykernel', 'ipython', 'requests'],
                 classifiers=[
                     'Development Status :: 4 - Beta',
                     'Intended Audience :: Science/Research',
                     'Intended Audience :: Developers',
                     'License :: OSI Approved :: MIT License',
                     'Programming Language :: Python',
                     'Framework :: IPython',
                 ],
                 package_data={'igv_notebook': ['VERSION', 'VERSION_IGV', 'js/messageHandler.js', 'js/localNotebookFile.js', 'js/igv.min.js']},
                 )
