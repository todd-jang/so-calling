-- MaxScript to generate Texas-style brick wall
-- Run this in 3ds Max via Scripting -> Run Script

fn createBrickWall length height = (
    for h = 0 to (height-1) do (
        for i = 0 to (length-1) do (
            b = box length:10 width:20 height:5
            offset = if (mod h 2 == 0) then 0 else 10
            b.pos = [i * 21 + offset, 0, h * 6]
            b.materialID = (random 1 5)
        )
    )
)

createBrickWall 20 15
