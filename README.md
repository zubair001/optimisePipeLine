# PipeLine Optimisition in Room Contour.
Its a javascript project to reduce the pipeline length in the Room. 

You get a room contour and a pipeline route in different Javascript objects:
1. PipeData
2. ContourData

Write a code in the "optimisePipeline" function in the file "ReadJsDrawPipe.js", that finds the better route.
You have 6 testcases, please try to write a code, that finds the good way in all of them. 

Ssome necessary functions to the code:

collisionWithRoomBoundaries
This function defines, if a segment has an intersection point to room contour polygon, or not
DefineSectPoint
This function helps to define the section point between two segments.
It defines not only the section point, but also the value, if the section point is on the first or/ and on the secound segment or nor of them.
CalcDirection
Defines a line direction in graad (0 - 360).
CalcLength
Defines the distance two points in 2D (x; y)


Testenvironment can be started with "index_drawPipe.html".
