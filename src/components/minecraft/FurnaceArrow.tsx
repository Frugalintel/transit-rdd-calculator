"use client"

interface FurnaceArrowProps {
  isProcessing?: boolean
  className?: string
}

export function FurnaceArrow({ isProcessing = false, className = "" }: FurnaceArrowProps) {
  // Pixel dimensions for a blocky Minecraft-style arrow
  // The arrow is 22 pixels wide x 16 pixels tall at 2x scale = 44x32 final size
  const pixelSize = 2
  
  // Arrow shape defined as rows of pixels
  // 0 = empty, 1 = filled
  // This creates the classic furnace arrow shape (symmetric)
  const arrowPixels = [
    // Row 0-4: Top of arrowhead tapers in (1→2→3→4→5 pixels)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0], // tip - 1 pixel
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], // 2 pixels
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0], // 3 pixels
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0], // 4 pixels
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0], // 5 pixels
    // Row 5-11: Shaft with arrowhead expanding (6→7→8 then 8→7→6 pixels on head side)
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // shaft + 6 pixels
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // shaft + 7 pixels
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // shaft + 8 pixels
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // center - widest (shaft + 9 pixels = full width)
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // shaft + 8 pixels
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0], // shaft + 7 pixels
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0], // shaft + 6 pixels
    // Row 12-16: Bottom of arrowhead tapers out (5→4→3→2→1 pixels) - SYMMETRIC with top
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0], // 5 pixels
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0], // 4 pixels
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0], // 3 pixels
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0], // 2 pixels
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0], // tip - 1 pixel (was missing!)
  ]

  const width = 22 * pixelSize
  const height = 17 * pixelSize // 17 rows now for symmetry

  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        imageRendering: 'pixelated'
      }}
    >
      {/* Background (empty arrow) - dark gray */}
      <svg 
        className="absolute inset-0" 
        width={width} 
        height={height} 
        viewBox={`0 0 ${22} ${17}`}
        style={{ imageRendering: 'pixelated' }}
        shapeRendering="crispEdges"
      >
        {arrowPixels.map((row, y) => 
          row.map((pixel, x) => 
            pixel === 1 ? (
              <rect 
                key={`bg-${x}-${y}`} 
                x={x} 
                y={y} 
                width={1} 
                height={1} 
                fill="#8b8b8b"
              />
            ) : null
          )
        )}
      </svg>
      
      {/* Foreground (filled arrow) - white, with clip animation */}
      <div 
        className={`absolute inset-0 overflow-hidden ${isProcessing ? 'furnace-arrow-animate' : ''}`}
        style={{ 
          clipPath: isProcessing ? undefined : 'inset(0 100% 0 0)',
        }}
      >
        <svg 
          width={width} 
          height={height} 
          viewBox={`0 0 ${22} ${17}`}
          style={{ imageRendering: 'pixelated' }}
          shapeRendering="crispEdges"
        >
          {arrowPixels.map((row, y) => 
            row.map((pixel, x) => 
              pixel === 1 ? (
                <rect 
                  key={`fg-${x}-${y}`} 
                  x={x} 
                  y={y} 
                  width={1} 
                  height={1} 
                  fill="#ffffff"
                />
              ) : null
            )
          )}
        </svg>
      </div>
    </div>
  )
}
