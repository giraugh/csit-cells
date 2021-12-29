// Get elements
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

// Set canvas size
canvas.width = 512
canvas.height = 512

// Config grid
const gridWidth = 30
const gridHeight = 30
const cellWidth = canvas.width / gridWidth
const cellHeight = canvas.height / gridHeight

// Config cell colours
const cellColours = {
  0: '#b22222',
  1: 'white',
  2: '#d89090'
}

// Config anim timing
const START_DELAY = 5

// Modulo util
const mod = (a, n) =>
  ((a % n) + n) % n

// Init grid
const grid = []
const gridBuff = [] // Buffer for GFX
for (let i = 0; i < gridWidth; i++) {
  grid[i] = []
  for (let j = 0; j < gridHeight; j++) {
    grid[i][j] = Math.random() < .5 ? 0 : 1
  }
}

// Util for counting neighbours with given values
const neighbours = (grid, x, y, f=(v)=>v>0) => {
  // Count alive neighbours  
  let nc = 0
  for (let xx = -1; xx < 2; xx++) {
    for (let yy = -1; yy < 2; yy++) {
      if (xx != 0 || yy != 0) {
        nx = mod(x+xx, gridWidth)
        ny = mod(y+yy, gridHeight)
        nc += f(grid[nx][ny]) ? 1 : 0
      }
    }
  }
  return nc
}

// Define GOL effect
const gameOfLife = (grid, x, y, chance=1, doDie=true, doBirth=true) => {
  let alive = grid[x][y] > 0
  let nc = neighbours(grid, x, y)
  if (Math.random() < chance) {
    if (alive && nc < 2) {
      if (doDie)
        grid[x][y] = 0
    } else if (alive && nc > 3) {
      if (doDie)
        grid[x][y] = 0
    } else if (!alive && nc == 3) {
      if (doBirth)
        grid[x][y] = 1
    }
  }
}

// Define method for saving the frame as a png
const saveFrame = (frame) => {
  const img = canvas.toDataURL()
  const downloadLink = document.createElement('a')
  downloadLink.download = `frame_${frame}`
  downloadLink.href = img
  downloadLink.click()
}

// Setup draw loop
const draw = (t = 0) => () => {
  // Draw grid
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      const cellValue = grid[i][j]
      ctx.fillStyle = cellColours[cellValue]
      ctx.fillRect(cellWidth*i, cellHeight*j, cellWidth, cellHeight)
    }
  }

  // Effect?
  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      if (false /*decay*/) {
        gameOfLife(grid, i, j, 0.1, true, false) 
        if (grid[i][j] > 0 && Math.random() < .1)
          grid[i][j] = 0
      }

      if (t > START_DELAY && t < 20)
        // Slow GOL
        gameOfLife(grid, i, j, 0.1)
      if (t > 20 && t < 40)
        // Faster GOL
        gameOfLife(grid, i, j, 0.3)
      if (t > 40 && t < 90) {
        // Filling GOL
        gameOfLife(grid, i, j, 0.3, true)
        gameOfLife(grid, i, j, 0.7, false)
      }
      if (t > 90 && t < 110) {
        // Fill w/ white
        if (grid[i][j] != 1) {
          if (Math.random() < .3)
            grid[i][j] = 1
        }
      }
      if (t == 111){
        // Spawn bg in the center
        grid[Math.floor(gridWidth/2)][Math.floor(gridHeight/2)] = 0
      }
      if (t > 110 && t < 135) {
        // Grow background back
        const nc = neighbours(grid, i, j, v => v == 0)
        if (Math.random() < .15*nc) {
          grid[i][j] = 0
        }
      }
      if (t > 135) {
        // Grow the logo back
        const nc = neighbours(grid, i, j, v => v > 0)
        if (gridBuff[i][j] > 0 && Math.random() < .1*(1+nc))
          grid[i][j] = gridBuff[i][j]
      }
    }
  }

  if (t < 145)
    saveFrame(t)
  window.setTimeout(draw(t+1), 300)
}

// Create image from base logo
const img = document.createElement('img')
img.src = 'baseLogo.png'
img.setAttribute('crossOrigin', '')

// When the image loads, blit it onto the grid
img.onload = () => {
  // Draw the image
  ctx.drawImage(img, 0, 0)

  // Get pixel data
  const pixData = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  for (let i = 0; i < gridWidth; i++) {
    for (let j = 0; j < gridHeight; j++) {
      const cx = Math.floor((i+.5)*cellWidth)
      const cy = Math.floor((j+.5)*cellHeight)
      const offset = (cy * canvas.width + cx) * 4
      const pix = [
        pixData[offset],
        pixData[offset+1],
        pixData[offset+2],
        pixData[offset+3]
      ]

      // Is bg?
      if (pix[0] == 0xb2 && pix[1] == 0x22 && pix[2] == 0x22) {
        grid[i][j] = 0
      } else {
        if (pix[0] == 0xd8 && pix[1] == 0x90 && pix[2] == 0x90) {
          grid[i][j] = 2
        } else {
          grid[i][j] = 1
        }
      }
    }
  }

  // Save initial grid for gfx
  for (let i = 0; i < gridWidth; i++) {
    gridBuff[i] = []
    for (let j = 0; j < gridHeight; j++) {
      gridBuff[i][j] = grid[i][j]
    }
  }

  // Start draw loop
  draw()()
}
