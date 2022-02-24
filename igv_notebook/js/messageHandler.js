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
                    let browser = this.browserCache.get(browserID)
                    try {
                        switch (command) {

                            case "createBrowser":
                                const div = document.getElementById(browserID)  // <= created from python
                                browser = await igv.createBrowser(div, data)
                                this.browserCache.set(browserID, browser)
                                break

                            case "loadTrack":
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
                                document.getElementById(browserID).parentNode.removeChild(div)
                                break

                            case "toSVG":
                                return browser.toSVG()

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

    window.IGVMessageHandler = new MessageHandler()

    console.log("IGVMessageHandler installed")

})()