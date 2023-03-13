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

    function convertUrlsAndPaths(session) {
        if (session.reference) {
            for (let pre of ["fasta", "index", "cytoband", "compressedIndex", "alias"]) {
                convert(session.reference, pre)
            }
            if (session.reference.tracks) {
                for (let t of session.reference.tracks) {
                    convert(t)
                    convert(t, "index")
                    if (!t.indexURL) {
                        t.indexed = false
                    }
                }
            }
        }

        if (session.tracks) {
            for (let t of session.tracks) {
                convert(t)
                convert(t, "index")
                if (!t.indexURL) {
                    t.indexed = false
                }
            }
        }
    }

    /**
     * Return true if the sessionJson object contains only absolute URLs to resources
     */
    function safeToWeblink(sessionJson) {
        const unsafe = (url) => typeof url.startsWith != 'function' || !url.startsWith("http")
        if (sessionJson.reference) {
            if (unsafe(sessionJson.reference.fastaURL)) return false
        }
        if (sessionJson.tracks) {
            const urls = sessionJson.tracks.filter(t => t.url).map(t => t.url)
            if (urls.some(unsafe)) return false
        }
        return true
    }

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

                                // custom button bar
                                const customButtonDiv = document.createElement('div')
                                customButtonDiv.style = `background: #f3f3f3;padding: 5px;border-color: #bfbfbf;border-style: solid;border-width: thin;border-radius: 3px;`
                                container.appendChild(customButtonDiv)

                                data.sync = true
                                convertUrlsAndPaths(data)

                                const newBrowser = await igv.createBrowser(container, data)
                                this.browserCache.set(browserID, newBrowser)

                                // Add igv-notebook button bar
                                const toJsonButton = document.createElement('button')
                                toJsonButton.innerText = "Save Session"
                                toJsonButton.style = "margin-right:5px"
                                toJsonButton.addEventListener('click', (evt) => {
                                    let fn
                                    if (isNotebook) {
                                        fn = prompt("Filename:", "session.json")
                                    } else {
                                        fn = "session.json"
                                    }
                                    if (fn) {
                                        const json = newBrowser.toJSON()
                                        const jsonString = JSON.stringify(json, null, '\t')
                                        download(fn, jsonString)
                                    }
                                })
                                customButtonDiv.appendChild(toJsonButton)

                                const webLinkNode = document.createElement('a')
                                webLinkNode.target = "igvWeb"
                                webLinkNode.innerText = "Link to IGV-Web"
                                webLinkNode.style.display = "none"

                                const shareButton = document.createElement('button')
                                shareButton.innerText = "Show IGV-Web Link"
                                shareButton.style = "margin-right:5px"
                                shareButton.addEventListener('click', async (evt) => {

                                    if (safeToWeblink(newBrowser.toJSON())) {
                                        const sessionURL = `https://igv.org/app?sessionURL=blob:${newBrowser.compressedSession()}`
                                        const shortURL = await shortenURL(sessionURL)
                                        webLinkNode.innerText = "Link to IGV-Web"
                                        webLinkNode.setAttribute("href", shortURL)
                                        webLinkNode.style.display = "inline-block"
                                        shareButton.innerText = "Update IGV-Web Link"
                                    } else {
                                        webLinkNode.innerText = "Cannot link -- non URL resources used"
                                        webLinkNode.style.display = "inline-block"
                                    }
                                })
                                customButtonDiv.appendChild(shareButton)
                                customButtonDiv.appendChild(webLinkNode)

                                if (isNotebook) {
                                    const toSVGButton = document.createElement('button')
                                    toSVGButton.innerText = "To SVG"
                                    toSVGButton.style = "float:right"
                                    toSVGButton.addEventListener('click', (evt) => {
                                        const locus = newBrowser.referenceFrameList.map(rf => rf.getLocusString()).join(' ')
                                        const svg = newBrowser.toSVG()
                                        toSVG(browserID, locus, svg)
                                    })
                                    customButtonDiv.appendChild(toSVGButton)
                                }

                                break

                            case "loadSession":
                                convertUrlsAndPaths(data)
                                browser.loadSessionObject(data)
                                break

                            case "loadTrack":
                                convertTrackData(data)
                                await browser.loadTrack(data)
                                break

                            case "loadROI":
                                if (Array.isArray(data)) {
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
        } else if (pageURL.includes("/lab")) {

            console.log("Jupyter lab")
            // Jupyter Lab

            // Examples
            // http://localhost:8888/lab/workspaces/auto-N/tree/examples/BamFiles.ipynb
            //     =>  http://localhost:8888/files/examples/data/gstt1_sample.bam
            //
            // https://hub.gke2.mybinder.org/user/igvteam-igv-notebook-5ivkyktt/lab/tree/examples/BamFiles.ipynb
            //    => https://hub.gke2.mybinder.org/user/igvteam-igv-notebook-5ivkyktt/files/examples/data/gstt1_sample.bam

            const baseIndex = pageURL.indexOf("/lab")
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
        if (config[pathProp]) {
            config[urlProp] = createNotebookFile(config[pathProp])
        } else if (config[urlProp]) {
            config[urlProp] = convertURL(config[urlProp])
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

    function download(filename, text) {

        const data = URL.createObjectURL(new Blob([text], {type: "application/octet-stream"}))
        const element = document.createElement('a')
        element.setAttribute('href', data)
        element.setAttribute('download', filename)
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
    }

    async function shortenURL(url) {
        const endpoint = "https://2et6uxfezb.execute-api.us-east-1.amazonaws.com/dev/tinyurl/"
        const enc = encodeURIComponent(url)
        const response = await fetch(`${endpoint}${enc}`)
        if (response.ok) {
            return response.text()
        } else {
            throw new Error(response.statusText)
        }
    }

    console.log("igv.MessageHandler installed")

})()