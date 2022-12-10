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

    const isColab = window.google !== undefined && window.google.colab
    const isNotebook = !isColab && window.Jupyter !== undefined

    let svgComm
    if (isNotebook) {
        svgComm = Jupyter.notebook.kernel.comm_manager.new_comm('svg', {})
    }

    async function toSVG(displayID, locus, svg) {
        //console.log(isNotebook + " " + locus)
        if (isNotebook) {
            svgComm.send({
                "display_id": displayID,
                "locus": locus,
                "svg": svg
            })
        }
    }

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

            const convertTrackData = (data) => {
                convert(data)
                convert(data, "index")
                if (!data.indexURL) {
                    data.indexed = false
                }
            }

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

                                data.sync = true

                                if (isNotebook) {
                                    const toSVGButton = {
                                        label: "To SVG",
                                        callback: (browser) => {
                                            const locus = browser.referenceFrameList.map(rf => rf.getLocusString()).join(' ')
                                            const svg = browser.toSVG()
                                            toSVG(browserID, locus, svg)
                                        }
                                    }
                                    data.customButtons = [toSVGButton]
                                }

                                if (data.reference) {
                                    for (let pre of ["fasta", "index", "cytoband", "compressedIndex", "alias"]) {
                                        convert(data.reference, pre)
                                    }
                                    if (data.reference.tracks) {
                                        for (let t of data.reference.tracks) {
                                            convert(t)
                                            convert(t, "index")
                                            if (!t.indexURL) {
                                                t.indexed = false
                                            }
                                        }
                                    }
                                }

                                if (data.tracks) {
                                    for (let t of data.tracks) {
                                        convert(t)
                                        convert(t, "index")
                                        if (!t.indexURL) {
                                            t.indexed = false
                                        }
                                    }
                                }

                                const newBrowser = await igv.createBrowser(container, data)
                                this.browserCache.set(browserID, newBrowser)
                                break

                            case "loadTrack":
                                convertTrackData(data)
                                await browser.loadTrack(data)
                                break

                            case "loadROI":
                                if(Array.isArray(data)) {
                                    data.map(convertTrackData)
                                } else {
                                    convertTrackData(data)
                                }
                                await browser.loadROI(data)
                                break

                            case "clearROIs":
                                await browser.clearROIs()
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

                            case "toSVG":
                                const displayId = data
                                const svg = browser.toSVG()
                                const locus = browser.referenceFrameList.map(rf => rf.getLocusString()).join(' ')
                                toSVG(displayId, locus, svg)
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
                return convertURL(path)
            }
        }
    }

    /**
     * Convert relative URLs to absolute.  Primarily for Jupyter Lab, not generally needed for Jupyter Notebook
     * @param url
     * @returns {*}
     */
    function convertURL(url) {

        const pageURL = window.location.href

        if (!url ||
            url.startsWith("https://") ||
            url.startsWith("http://") ||
            url.startsWith("gs://") ||
            url.startsWith("data:")) {
            return url
        } else if (isColab) {
            // Interpret relative url as a path.
            igv.createNotebookLocalFile({path: url})
        } else if (isNotebook) {
            // Jupyter Notebook
            //
            // Examples
            // https://hub-binder.mybinder.ovh/user/igvteam-igv-notebook-tnlb45ie/notebooks/examples/BamFiles-Jupyter.ipynb
            //   => https://hub-binder.mybinder.ovh/user/igvteam-igv-notebook-tnlb45ie/files/examples/data/gstt1_sample.bam",

            const baseURL = document.querySelector('body').getAttribute('data-base-url')
            const notebookPath = document.querySelector('body').getAttribute('data-notebook-path')
            const notebookName = document.querySelector('body').getAttribute('data-notebook-name')
            const notebookDir = notebookPath.slice(0, -1 * notebookName.length)

            //`${location.origin}${base_path}files/${nb_dir}${url}`
            if (url.startsWith("/")) {
                url = `files${url}`
                return encodeURI(`${location.origin}${baseURL}${url}`)
            } else {
                // URL is relative to notebook
                return encodeURI(`${location.origin}${baseURL}files/${notebookDir}${url}`)
            }
        } else if (pageURL.includes("/lab/")) {
            // Jupyter Lab

            // Examples
            // http://localhost:8888/lab/workspaces/auto-N/tree/examples/BamFiles.ipynb
            //     =>  http://localhost:8888/files/examples/data/gstt1_sample.bam
            //
            // https://hub.gke2.mybinder.org/user/igvteam-igv-notebook-5ivkyktt/lab/tree/examples/BamFiles.ipynb
            //    => https://hub.gke2.mybinder.org/user/igvteam-igv-notebook-5ivkyktt/files/examples/data/gstt1_sample.bam

            const baseIndex = pageURL.indexOf("/lab/")
            const baseURL = pageURL.substring(0, baseIndex)

            if (url.startsWith("/")) {
                return encodeURI(`${baseURL}/files${url}`)
            } else if (pageURL.includes("/tree/")) {
                // Interpret URL as relative to notebook location.  This is not reliable, '/tree/' is not always in the page URL
                const treeIndex = pageURL.indexOf("/tree/") + 6
                const lastSlashIndex = pageURL.lastIndexOf("/")
                const notebookDir = pageURL.substring(treeIndex, lastSlashIndex)
                return encodeURI(`${baseURL}/files/${notebookDir}/${url}`)
            } else {
                // We don't know how to determine the notebook path
                console.warn("Page url missing '/tree/'.  Can't determine notebook path.")
                return encodeURI(`${baseURL}/files/${url}`)
            }
        } else {
            // We should never get here,
            return encodeURI(url)
        }
    }


    function convert(config, prefix) {
        const urlProp = prefix ? prefix + "URL" : "url"
        const pathProp = prefix ? prefix + "Path" : "path"
        if (config[urlProp]) {
            config[urlProp] = convertURL(config[urlProp])
        } else if (config[pathProp]) {
            config[urlProp] = createNotebookFile(config[pathProp])
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