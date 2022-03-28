/**
 * Global handler for igv.js messages.  Messages have the form
 * {
 *     command  -- the command to execute
 *     id -- the id of the igv.js browser, if applicable
 *     data -- any data needed for the command
 * }
 */

// Use a self-evaluating function to keep variables in this file scope, with the execption of the global handler

(function () {

    console.log("Installing IGVMessageHandler")

    class MessageHandler {

        constructor() {
            this.browserCache = new Map()
            this.messageQueue = new Queue()
        }

        on(msg) {
            this.messageQueue.enqueue(msg)
            this.processQueue()
        }

        async processQueue() {
            if (!this.processing) {
                this.processing = true
                while (!this.messageQueue.isEmpty()) {
                    const msg = this.messageQueue.dequeue()
                    const command = msg.command
                    const browserID = msg.id
                    const data = msg.data
                    const browser = this.browserCache.get(browserID)
                    try {
                        switch (command) {
                            case "createBrowser":
                                const container = document.getElementById(browserID)  // <= created from python

                                const toSVGButton = {
                                    label: "To SVG",
                                    callback: (browser) => {
                                        // Dangerous -- replaces browser object with svg rendering.  Non reversible
                                        const parser = new DOMParser()
                                        const doc = parser.parseFromString(browser.toSVG(), "image/svg+xml")
                                        //const container = document.getElementById(browserID)
                                        container.innerHTML = ""
                                        container.appendChild(doc.documentElement)
                                        this.browserCache.delete(browserID)
                                    }
                                }
                                data.customButtons = [toSVGButton]

                                if (data.reference) {
                                    if (data.reference.fastaURL) {
                                        data.reference.fastaURL = convertURL(data.reference.fastaURL)
                                    } else if (data.reference.fastaPath) {
                                        data.reference.fastaURL = createNotebookFile(data.reference.fastaPath)
                                    }
                                    if (data.reference.indexURL) {
                                        data.reference.indexURL = convertURL(data.reference.indexURL)
                                    } else if (data.reference.indexPath) {
                                        data.reference.indexURL = createNotebookFile(data.reference.indexPath)
                                    }
                                    if (data.reference.cytobandURL) {
                                        data.reference.cytobandURL = convertURL(data.reference.cytobandURL)
                                    } else if (data.reference.cytobandPath) {
                                        data.reference.cytobandURL = createNotebookFile(data.reference.cytobandPath)
                                    }
                                    if (data.reference.compressedIndexURL) {
                                        data.reference.compressedIndexURL = convertURL(data.reference.compressedIndexURL)
                                    } else if (data.reference.compressedIndexPath) {
                                        data.reference.compressedIndexURL = createNotebookFile(data.reference.compressedIndexPath)
                                    }
                                    if (data.reference.tracks) {
                                        for (let t of data.reference.tracks) {
                                            if (t.url) {
                                                t.url = convertURL(t.url)
                                            } else if (t.path) {
                                                t.url = createNotebookFile(t.path)
                                            }
                                            if (t.indexURL) {
                                                t.indexURL = convertURL(t.indexURL)
                                            } else if (t.indexPath) {
                                                t.indexURL = createNotebookFile(t.indexPath)
                                            }
                                            if (!t.indexURL) {
                                                t.indexed = false
                                            }
                                        }
                                    }
                                }
                                if (data.tracks) {
                                    for (let t of data.tracks) {
                                        if (t.url) {
                                            t.url = convertURL(t.url)
                                        } else if (t.path) {
                                            t.url = createNotebookFile(t.path)
                                        }
                                        if (t.indexURL) {
                                            t.indexURL = convertURL(t.indexURL)
                                        } else if (t.indexPath) {
                                            t.indexURL = createNotebookFile(t.indexPath)
                                        }
                                        if (!t.indexURL) {
                                            t.indexed = false
                                        }
                                    }
                                }

                                const newBrowser = await igv.createBrowser(container, data)
                                this.browserCache.set(browserID, newBrowser)
                                break

                            case "loadTrack":
                                if (data.url) {
                                    data.url = convertURL(data.url)
                                } else if (data.path) {
                                    data.url = createNotebookFile(data.path)
                                }
                                if (data.indexURL) {
                                    data.indexURL = convertURL(data.indexURL)
                                } else if (data.indexPath) {
                                    data.indexURL = createNotebookFile(data.indexPath)
                                }
                                if (!data.indexURL) {
                                    data.indexed = false
                                }
                                await browser.loadTrack(data)

                                break

                            case "search":
                                browser.search(data)
                                break

                            case "zoomIn":
                                browser.zoomIn()
                                break

                            case "zoomOut":
                                browser.zoomOut()
                                break

                            case "remove":
                                this.browserCache.delete(browserID)
                                document.getElementById(browserID).parentNode.removeChild(container)
                                break

                            default:
                                console.error("Unrecognized method: " + msg.command)
                        }
                    } catch (e) {
                        console.error(e)
                    }
                }
                this.processing = false
            }
        }
    }

    /**
     * Potentially convert a path to a local File-like object.
     * @param path
     * @returns {*}
     */
    function createNotebookFile(path) {
        if (!path ||
            path.startsWith("https://") || path.startsWith("http://") || path.startsWith("gs://") || path.startsWith("data:")) {
            return path
        } else {
            // Try to create a notebook file.  If no notebook file implementation is available for the kernel in
            // use (e.g. Jupyter Lab) treat as a URL.
            const nbFile = igv.createNotebookLocalFile({path})
            if (nbFile != null) {
                return nbFile
            } else {
                // Try to treat as relative URL.  This may or may not work
                return convertURL(url)
            }
        }
    }

    /**
     * Convert relative URLs to absolute.  Primarily for Jupyter Lab, not generally needed for Jupyter Notebook
     * @param url
     * @returns {*}
     */
    function convertURL(url) {
        if (!url ||
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("gs://") ||
            url.startsWith("data:")) {
            return url
        } else {

            let pageURL = window.location.href
            if(pageURL.includes("/lab/") && pageURL.includes("/tree/")) {
                // Jupyter Lab

                // Examples
                // http://localhost:8888/lab/workspaces/auto-N/tree/examples/BamFiles.ipynb
                //     =>  http://localhost:8888/files/examples/data/gstt1_sample.bam
                //
                // https://hub.gke2.mybinder.org/user/igvteam-igv-notebook-5ivkyktt/lab/tree/examples/BamFiles.ipynb
                //    => https://hub.gke2.mybinder.org/user/igvteam-igv-notebook-5ivkyktt/files/examples/data/gstt1_sample.bam

                const baseIndex = pageURL.indexOf("/lab/")
                const baseURL = pageURL.substring(0, baseIndex)
                if(url.startsWith("/files/")) {
                    return baseURL + url
                } else if (url.startsWith("/")) {
                    return baseURL + "/files" + url
                } else {
                    // Interpret URL as relative to notebook location
                    const treeIndex = pageURL.indexOf("/tree/") + 6
                    const lastSlashIndex = pageURL.lastIndexOf("/")
                    const notebookPath = pageURL.substring(treeIndex, lastSlashIndex)
                    return baseURL + "/files/" + notebookPath + "/" + url
                }
            } else {
               // Jupyter Notebook
                if(url.startsWith("/") && !url.startsWith("/files/")) {
                    return "/files" + url
                } else {
                    return url
                }
            }
        }
    }

    class Queue {
        constructor() {
            this.elements = []
        }

        enqueue(e) {
            this.elements.push(e)
        }

        dequeue() {
            return this.elements.shift()
        }

        isEmpty() {
            return this.elements.length == 0
        }

        peek() {
            return !this.isEmpty() ? this.elements[0] : undefined
        }

        length() {
            return this.elements.length
        }
    }

    window.igv.MessageHandler = new MessageHandler()

    console.log("igv.MessageHandler installed")

})()