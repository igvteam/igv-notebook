/**
 * Mock objects to emulate the browser "File" class for use with Jupyter and Colab notebooks.  These objects delegate
 * actual file reading to python.
 */

// Use a self-evaluating function to keep variables in this file scope

(function () {

    const isColab =  window.google !== undefined && window.google.colab
    const isNotebook =  !isColab &&  window.Jupyter !== undefined

    igv.createNotebookLocalFile = function (options) {
        if (isColab) {
            return new ColabLocalFile(options)
        } else if (isNotebook) {
            return new JupyterLocalFile(options)
        } else {
            return undefined;  //TODO -- throw error?
        }
    }


    // Start up a Comm object if in a Jupyter Notebook environment (i.e. not Colab or JupyterLab).
    let comm
    const pendingRequests = new Map()
    if (isNotebook) {
        console.log('registering comm')
        comm = Jupyter.notebook.kernel.comm_manager.new_comm('file_request', {})
        // Register a handler
        comm.on_msg(function (msg) {
            const id = msg.content.data.id
            const data = msg.content.data.data
            pendingRequests.set(id, data)
        })
    }

    /**
     * Emulates a browser "File" for Jupyter notebooks.  File reading is delegated to python via Comms messaging.
     * Polling is used to synchronize the async message passing.
     *
     * NOTE: This will not work for JupyterLab
     */
    class JupyterLocalFile {

        constructor({path, name, start, end}) {
            this.type = 'JupyterLocalFile'
            this.path = path
            this.name = name || path
            this.start = start
            this.end = end
        }

        /**
         * Returns a new Blob object containing the data in the specified range of bytes of the blob on which it's called.
         * @param start An index into the Blob indicating the first byte to include in the new Blob
         * @param end  An index into the Blob indicating the first byte that will *not* be included in the new Blob
         * @param contentType
         * @returns {*}
         */
        slice(start, end) {
            return new JupyterLocalFile({path: this.path, name: this.name, start, end})
        }

        /**
         * Returns a promise that resolves with an ArrayBuffer containing the entire contents of the Blob as binary data.
         *
         * @returns {Promise<*>}
         */
        async arrayBuffer() {

            const id = uniqueID()
            const path = this.path
            const promise = new Promise((resolve, reject) => {
                let count = 0

                function poll() {

                    if (count > 100) {
                        console.error(`error reading ${path}: timed out`)
                        reject(`error reading ${path}: timed out`)
                    }

                    count++
                    if (pendingRequests.has(id)) {
                        const data = pendingRequests.get(id)
                        const dataString = atob(data)
                        const bytes = new Uint8Array(dataString.length)
                        for (var i = 0; i < dataString.length; i++) {
                            bytes[i] = dataString.charCodeAt(i)
                        }
                        pendingRequests.delete(id)
                        resolve(bytes.buffer)
                    } else {
                        setTimeout(poll, 100)
                    }
                }

                poll()
            })

            const msg = (this.start === undefined) ?
                {id: id, 'path': this.path, 'method': 'arrayBuffer'} :
                {id: id, 'path': this.path, 'method': 'arrayBuffer', 'start': this.start, 'end': this.end}

            comm.send(msg)

            return promise
        }

        /**
         * Returns a promise that resolves with a USVString containing the entire contents of the Blob interpreted as UTF-8 text.
         *
         * @returns {Promise<string>}
         */
        async text() {
            throw Error("text not implemented")
        }

        stream() {
            throw Error("stream not implemented")
        }
    }

    /**
     * Emulates a browser "File" for Colab environments.
     */
    class ColabLocalFile {

        constructor({path, name, start, end}) {
            this.type = 'ColabLocalFile'
            this.path = path
            this.name = name || path
            this.start = start
            this.end = end
        }

        /**
         * Returns a new Blob object containing the data in the specified range of bytes of the blob on which it's called.
         * @param start An index into the Blob indicating the first byte to include in the new Blob
         * @param end  An index into the Blob indicating the first byte that will *not* be included in the new Blob
         * @param contentType
         * @returns {*}
         */
        slice(start, end) {
            return new ColabLocalFile({path: this.path, name: this.name, start, end})
        }

        /**
         * Returns a promise that resolves with an ArrayBuffer containing the entire contents of the Blob as
         * binary data.
         */
        async arrayBuffer() {

            const args = (this.start === undefined) ?
                [this.path] :
                [this.path, this.start.toString(), this.end.toString()]

            const result = await google.colab.kernel.invokeFunction(
                'ReadFile', // The callback name.
                args, // The arguments.
                {}) // kwargs
            const data = result.data["text/plain"]
            const dataString = atob(data.substring(2, data.length - 1))
            const bytes = new Uint8Array(dataString.length)
            for (var i = 0; i < dataString.length; i++) {
                bytes[i] = dataString.charCodeAt(i)
            }
            return bytes.buffer
        }

        /**
         * Returns a promise that resolves with a USVString containing the entire contents of the Blob interpreted as UTF-8 text.
         *
         * @returns {Promise<string>}
         */
        async text() {
            throw Error("text not implemented")
        }

        stream() {
            throw Error("stream not implemented")
        }
    }

    let counter = 0

    function uniqueID() {
        return `${Math.random()}-${counter++}`
    }

})()