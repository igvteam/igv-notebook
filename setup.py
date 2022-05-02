import setuptools

with open("README.md", "r") as fh:
    longdescription =  fh.read()

setuptools.setup(name='igv-notebook',
                 packages=['igv_notebook'],
                 version='0.2.3',
                 description='Package for embedding the igv.js genome visualization in IPython notebooks',
                 long_description=longdescription,
                 long_description_content_type="text/markdown",
                 license='MIT',
                 author='Jim Robinson',
                 url='https://github.com/igvteam/igv-notebook',
                 keywords=['igv', 'bioinformatics', 'genomics', 'visualization', 'ipython', 'jupyter'],
                 classifiers=[
                     'Development Status :: 4 - Beta',
                     'Intended Audience :: Science/Research',
                     'Intended Audience :: Developers',
                     'License :: OSI Approved :: MIT License',
                     'Programming Language :: Python',
                     'Framework :: IPython',
                 ],
                 package_data={'igv_notebook': ['js/messageHandler.js', 'js/localNotebookFile.js', 'js/igv.min.js']},
                 )
