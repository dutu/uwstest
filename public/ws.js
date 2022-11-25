
ws = new WebSocket(`ws://${window.location.hostname}:${window.location.port}/times2`)

let intervalId
let counter
ws.onopen = function () {
  document.getElementById('xx').innerHTML = 'Websocket open'
  counter = 0
  intervalId = setInterval(() => {
    document.getElementById('xx').innerHTML += `<br>${counter}`
    ws.send(`${counter}`)
    counter += 1
  }, 1000)
}

ws.onmessage = function (evt) {
  document.getElementById('xx').innerHTML += evt.data
}

ws.onclose = function () {
  document.getElementById('xx').innerHTML += '\nWebsocket closed'
  clearInterval(intervalId)
}
