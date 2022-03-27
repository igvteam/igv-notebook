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

                                data.url = convert(data.url)
                                if (data.reference) {
                                    if(data.reference.fastaPath) {
                                        data.reference.fastaURL =convert(data.reference.fastaPath)
                                    }
                                    if(data.reference.indexPath) {
                                        data.reference.indexURL = convert(data.reference.indexPath)
                                    }
                                    if(data.reference.cytobandPath) {
                                        data.reference.cytobandURL = convert(data.reference.cytobandPath)
                                    }
                                    if(data.reference.compressedIndexPath) {
                                        data.reference.compressedIndexURL = convert(data.reference.compressedIndexPath)
                                    }
                                    if (data.reference.tracks) {
                                        for (let t of data.reference.tracks) {
                                            if(t.path) {
                                                t.url = convert(t.path)
                                            }
                                            if(t.indexPath) {
                                                t.indexURL = convert(t.indexPath)
                                            }
                                        }
                                    }
                                }
                                if (data.tracks) {
                                    if(t.path) {
                                        t.url = convert(t.path)
                                    }
                                    if(t.indexPath) {
                                        t.indexURL = convert(t.indexPath)
                                    }
                                }

                                const newBrowser = await igv.createBrowser(container, data)
                                this.browserCache.set(browserID, newBrowser)
                                break

                            case "loadTrack":
                                if(data.path) {
                                    data.url = convert(data.path)
                                }
                                if (data.indexPath) {
                                    data.indexURL = convert(data.indexPath)
                                }
                                if(!data.indexURL) {
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
    function convert(path) {
        if (!path ||
            path.startsWith("https://") || path.startsWith("http://") || path.startsWith("gs://") || path.startsWith("data:")) {
            return path
        } else {
            // Try to create a notebook file.  If no notebook file implementation is available for the kernel in
            // use (e.g. JupyterLab) just return 'path'
            const nbFile = igv.createNotebookLocalFile({path})
            return nbFile || path
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