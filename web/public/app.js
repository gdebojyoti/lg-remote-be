window.onload = () => {
  const buttonSetElm = document.getElementById("button-set")
  buttonSetElm.addEventListener("click", e => {
    const clickedElm = e.target

    // exit for invalid selections
    if (!clickedElm || !clickedElm.dataset.key) {
      return
    }

    callApi(clickedElm.dataset.key)
  })
}

function callApi (buttonKey) {
  const apiDetails = {
    type: "click"
  }
  switch (buttonKey) {
    case 'VOLUP': {
      apiDetails.url = '/volume/up'
      apiDetails.type = null
      break
    }
    case 'VOLDWN': {
      apiDetails.url = '/volume/down'
      apiDetails.type = null
      break
    }
    case 'VOL10':
    case 'VOL20':
    case 'VOL30':
    case 'VOL40':
    case 'VOL50': {
      apiDetails.type = null
      const str = buttonKey
      const match = str.match(/\d+$/)
      
      if (match) {
        const number = parseInt(match[0], 10)
        apiDetails.url = `/volume/set/${number}`
      }
      break
    }
    case "UP":
    case "DOWN":
    case "LEFT":
    case "RIGHT":
    case "MENU":
    case "HOME":
    case "ENTER":
    case "MUTE":
    case "BACK": {
      apiDetails.url = '/pointer-features'
      apiDetails.key = buttonKey
      break
    }
  }

  const { url, type, key } = apiDetails
  console.log("typetypetype", type)

  // exit if url doesn't exist
  if (!url) {
    return
  }

  window.fetch(url, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type, key
    })
    // body: JSON.stringify({
    //   "type": "click",
    //   "x": -20,
    //   "y": 0,
    //   "key": "ENTER"
    // })
  })
}