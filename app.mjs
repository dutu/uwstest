import path from 'path'
import fs from 'fs'
import uWS from 'uWebSockets.js'
import Debug from 'debug'

const port = parseInt(process.env.PORT) || 5000
const dbg = Debug('uWS')
Debug.enable('uWS')
async function startUWebSocketsServer() {
    let uWebSocketsServer = uWS.App({})
        .ws('/*', {
            compression: 0,
            idleTimeout: 52,
            sendPingsAutomatically: true,
            maxPayloadLength: 16 * 1024 * 1024,
            upgrade: (res, req, context) => {
                // console.log('An Http connection wants to become WebSocket, URL: ' + req.getUrl() + '!');
                /* Keep track of abortions */
                const upgradeAborted = { aborted: false }

                /* You MUST copy data out of req here, as req is only valid within this immediate callback */
                const url = req.getUrl()
                const secWebSocketKey = req.getHeader('sec-websocket-key')
                const secWebSocketProtocol = req.getHeader('sec-websocket-protocol')
                const secWebSocketExtensions = req.getHeader('sec-websocket-extensions')

                /* You MUST register an abort handler to know if the upgrade was aborted by peer */
                res.onAborted(() => {
                    /* We can simply signal that we were aborted */
                    upgradeAborted.aborted = true
                })

                res.upgrade({ url: url }, secWebSocketKey,  secWebSocketProtocol, secWebSocketExtensions, context)
            },

            open: (ws) => {
                let topic = ws.url.substring(1)
                dbg(`WebSocket connected to /${topic}`)
            },

            message: (ws, ArrayBufferMessage, isBinary) => {
                let message = Buffer.from(ArrayBufferMessage).toString()
                if (message === "") {
                    ws.send('')
                    return
                }

                if (ws.url === "/times2") {
                    ws.send(` * 2 = ${parseInt(message) * 2}`)
                }
            },

            pong: (ws, message) => {
            },

            drain: (ws) => {
            },

            close: (ws, code, message) => {
            }
        })
        .get('/api/:worker', (res, req) => {
            res.onAborted(() => {
                res.aborted = true
            })

            const workerName = req.getParameter(0)
            if (workerName === 'alice') {
                if (!res.aborted) {
                    res.end(`Bob`)
                }
            } else {
                res.writeStatus('404')
                res.end(`No API for ${workerName}`)
            }

        })
        .any('/*', (res, req) => {
            let file
            const url = req.getUrl()
            if (path.extname(url) === '') {
                file = path.join(path.resolve(), '/public', url, 'index.html')
            } else {
                file = path.join(path.resolve(), '/public', url)
            }

            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file)
                dbg(`200 ${url}`)
                res.writeStatus('200')
                res.end(content)
            } else {
                dbg(`404 ${url}`)
                res.writeStatus('404')
                res.end('Nothing to see here!')
            }
        })

    uWebSocketsServer.listen(port, (listenSocket) => {
        if (listenSocket) {
            dbg(`uWebSocketsServer listening to port ${port}`)
        }
    })
}

await startUWebSocketsServer(port)
