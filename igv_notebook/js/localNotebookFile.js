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


    igv.createNotebookLocalFile = function (options) {

        if (isColab()) {
            return new ColabLocalFile(options)
        } else {
            return new NotebookLocalFile(options)
        }
    }


    let comm
    const pendingRequests = new Map()
    if (!isColab()) {
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
     * Emuulates a browser "File"
     */
    class NotebookLocalFile {

        constructor({path, name, start, end}) {
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
            return new NotebookLocalFile({path: this.path, name: this.name, start, end})
        }

        /**
         * Returns a promise that resolves with an ArrayBuffer containing the entire contents of the Blob as binary data.
         *
         * @returns {Promise<*>}
         */
        async arrayBuffer() {

            const id = uniqueID()
            const path = this.path
            const promise = new Promise((resolve) => {
                let count = 0

                function poll() {

                    if (count > 50) {
                        alert(`error reading ${path}: timed out`)
                        console.error(`error reading ${path}: timed out`)
                        resolve(undefined)
                    }

                    count++
                    if (pendingRequests.has(id)) {
                        const data = pendingRequests.get(id)
                        console.log(`data: ${data}`)
                        const dataString = atob(data)
                        const bytes = new Uint8Array(dataString.length)
                        for (var i = 0; i < dataString.length; i++) {
                            bytes[i] = dataString.charCodeAt(i)
                        }
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
     * Emulates a browser "File" for Colab environments
     */
    class ColabLocalFile {

        constructor({path, name, start, end}) {
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
         * Returns a promise that resolves with an ArrayBuffer containing the entire contents of the Blob as binary data.
         *
         * @returns {Promise<*>}
         */
        async arrayBuffer() {

            const id = uniqueID()
            const path = this.path

            const args = (this.start === undefined) ?
                [this.path] :
                [this.path, this.start.toString(), this.end.toString()]

            const data = await google.colab.kernel.invokeFunction(
                'ReadFile', // The callback name.
                args, // The arguments.
                {}) // kwargs
            //const text = result.data['application/json'];

            return data
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


    function isColab() {
        return window.google && window.google.colab
    }

    let counter = 0
    function uniqueID() {
        return `${Math.random()}-${counter++}`
    }

})()