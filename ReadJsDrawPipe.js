// v2.0
// Created by Gabor Süli - Zenesis GmbH
// last update: 02.02.2024

function CalcLength(x0, y0, x1, y1) {
	let dx = x1 - x0;
	let dy = y1 - y0;
	let Length = Math.sqrt(dx * dx + dy * dy);
  
	return Length;
  }


  

function CalcDirection(dX, dY) {
	let Direction = 0;
  
	if (Math.abs(dX) < eps) {
	  if (dY > eps) {
			  //UP
		Direction = 90;
	  } else {
			  //DOWN
		Direction = 270;
	  }
	} else {
	  if (Math.abs(dY) > eps) {
		Direction = (Math.atan(dY / dX) / Math.PI) * 180;
  
		if (dX < -eps && dY < -eps) {
		  Direction += 180;
		}
		if (dX < -eps && dY > eps) {
		  Direction += 180;
		}
	  } else {
		if (dX > -eps) {
				  //RIGHT
		  Direction = 0;
		} else {
				  //LEFT
		  Direction = 180;
		}
	  }
	}
  
	if (Direction < 0) {
	  Direction += 360;
	}
	if (Direction + eps > 360) {
	  Direction -= 360;
	}
  
	if (Math.abs(Direction) < 0.0001 || Math.abs(Direction - 360) < 0.0001) {
	  Direction = 0;
	}
  
	return Direction;
  }
  


const mj = window.markerjs2;

var eps = 0.0001;
var debug = false;

function optimisePipeLine(PipeData, ContourData) {
    let optimPipeData = {
        ...PipeData,
        points: []
    };

    // Helper function to create a line segment
    function createSegment(x0, y0, x1, y1) {
        return { x0: x0, y0: y0, x1: x1, y1: y1 };
    }

    // Start with the first segment
    let currentPoint = PipeData.points[0];
    optimPipeData.points.push(currentPoint);

    let i = 1;
    while (i < PipeData.points.length - 1) {
        let bestSegment = null;
        let bestLength = 0;

        // Try to find the longest possible segment from current point
        for (let j = i; j < PipeData.points.length - 1; j++) {
            let testSegment = createSegment(currentPoint.x1, currentPoint.y1, PipeData.points[j].x1, PipeData.points[j].y1);
            let testDir = CalcDirection(testSegment.x1 - testSegment.x0, testSegment.y1 - testSegment.y0);		
	
            if (!collisionWithRoomBoundaries(ContourData, testSegment, testDir)) {
                let testLength = CalcLength(testSegment.x0, testSegment.y0, testSegment.x1, testSegment.y1);
                if (testLength > bestLength) {
                    bestSegment = testSegment;
                    bestLength = testLength;
                }
            }
        }

        // If a valid segment is found, add it to the optimized pipeline
        if (bestSegment) {
            optimPipeData.points.push({
                x0: bestSegment.x0,
                y0: bestSegment.y0,
                z0: currentPoint.z1, // Maintain the same z-coordinate
                x1: bestSegment.x1,
                y1: bestSegment.y1,
                z1: currentPoint.z1,
                storyIdx: currentPoint.storyIdx,
                Length: bestLength,
                zoneguid: currentPoint.zoneguid,
                linecolor: currentPoint.linecolor,
                joint: currentPoint.joint,
                jointPoint: currentPoint.jointPoint,
                systemgroup: currentPoint.systemgroup
            });

            currentPoint = {
                x0: bestSegment.x0,
                y0: bestSegment.y0,
                z0: currentPoint.z1,
                x1: bestSegment.x1,
                y1: bestSegment.y1,
                z1: currentPoint.z1,
                storyIdx: currentPoint.storyIdx,
                Length: bestLength,
                zoneguid: currentPoint.zoneguid,
                linecolor: currentPoint.linecolor,
                joint: currentPoint.joint,
                jointPoint: currentPoint.jointPoint,
                systemgroup: currentPoint.systemgroup
            };
            i = PipeData.points.findIndex(p => p.x1 === bestSegment.x1 && p.y1 === bestSegment.y1);
        } else {
            // If no valid segment is found, move to the next point
            i++;
            if (i < PipeData.points.length - 1) {
                currentPoint = PipeData.points[i];
                optimPipeData.points.push(currentPoint);
            }
        }
    }

    // Add the last segment to keep the same direction as input
    let lastSegment = PipeData.points[PipeData.points.length - 1];
    optimPipeData.points.push(lastSegment);

    return optimPipeData;
}



// function optimisePipeLine(PipeData, ContourData) {

// 	let optimPipeData = {...PipeData};

// 	console.log("PipeData", PipeData);

// 	// Here you can optimise the Pipeline route
// 	// Request is to find a way, which is shorter, but still keep the segment directions, what we defined. 
// 	// Technicaly we are looking for the section points for the piperoute segments, where we can cut the route. 
// 	// If the new line crosses the contour line, we have to recalculate (or drop) it.

// 	return optimPipeData;
// }


  
function collisionWithRoomBoundaries(ContourObject, segLine, lineDir) {
	// ContourObject.points contains: x; y; (z) points
	// segline contains: x0; y0; (z0), x1, y1, (z1) points
	// linedir is an angle, which defines the segment line direction in grad (0 - 360, 0 is on X axis to positive direction);
	// returns: collistiondetected true / false;
	let roomBoundaries = ContourObject;
	let collisionDetected = false;

	// Loop to check for collisions with roomBoundaries
	for (let y = 0; y < roomBoundaries.points.length - 1; y++) {
		let roomContLine = {x0: roomBoundaries.points[y].x, y0: roomBoundaries.points[y].y, x1: roomBoundaries.points[y + 1].x, y1: roomBoundaries.points[y + 1].y};
		let roomContDir = CalcDirection(roomContLine.x1 - roomContLine.x0, roomContLine.y1 - roomContLine.y0);
		let sectPointWall = DefineSectPoint(roomContLine.x0, roomContLine.y0, roomContLine.x1, roomContLine.y1, roomContDir, segLine.x0, segLine.y0, lineDir);

		if (sectPointWall.type) {
			// Your bigest mistake were here - you transfered to much variables to the function and so, the result was wrong "segLine.x2"!!
			let pointOnSegment = PointOnLine(segLine.x0, segLine.y0, segLine.x1, segLine.y1, sectPointWall.x, sectPointWall.y, eps);
			let pointOnWall = PointOnLine(roomContLine.x0, roomContLine.y0, roomContLine.x1, roomContLine.y1, sectPointWall.x, sectPointWall.y, eps);
			let SegLength = CalcLength(segLine.x0, segLine.y0, segLine.x1, segLine.y1);
			let newSegLength = CalcLength(segLine.x0, segLine.y0, sectPointWall.x, sectPointWall.y);

			if(pointOnSegment && pointOnWall){
				if (newSegLength > eps && Math.abs(newSegLength - SegLength) > eps){
					console.log("WallSectionFound", sectPointWall.type, segLine.x0, segLine.y0, segLine.x1, segLine.y1, "|" ,sectPointWall.x, sectPointWall.y);
					collisionDetected = true;
				}
			}
		}
	}
	return collisionDetected;
}

function ReadJSDrawonCanvas(testData) {

	let PipeData = PipesystemObject(testData);
	let ContourData = ContourObject(testData);
	let DrawContainer = [];
	
	
	let optimisedPipeData = optimisePipeLine(PipeData, ContourData);

	// Add ContourData to DrawingContainer
	let DataToAdd = storeElementsInDrawContainer(ContourData);	
	if(DataToAdd){
		DrawContainer.push(...DataToAdd);
	}

	// Add PipeData to DrawingContainer
	DataToAdd = storeElementsInDrawContainer(optimisedPipeData);	
	if(DataToAdd){
		DrawContainer.push(...DataToAdd);
	}
	
	let BBox = BoundingBox(DrawContainer);
	clearCanvas();
	DrawInCanvas(DrawContainer, BBox);

}


function storeElementsInDrawContainer(PolyData){
	
	let DrawData = [];
		
	// Lines *************************************************************************

	let pointNumber = PolyData.points.length -1;
	let pointStartEnd = false;
	if (PolyData.points[0].x0 && PolyData.points[0].x1){
		pointNumber = PolyData.points.length;
		pointStartEnd = true;

	}

	for (let Pn = 0; Pn < pointNumber; Pn++) {
		let x0, y0, x1, y1;  
		if (pointStartEnd){
			x0 = PolyData.points[Pn].x0;
			y0 = PolyData.points[Pn].y0;
			x1 = PolyData.points[Pn].x1;
			y1 = PolyData.points[Pn].y1;
		} else {
			x0 = PolyData.points[Pn].x;
			y0 = PolyData.points[Pn].y;
			x1 = PolyData.points[Pn+1].x;
			y1 = PolyData.points[Pn+1].y;
		}	

		DrawData.push ({
			type: "line",
			layer: "default",
			x0: x0,
			y0: y0,
			x1: x1,
			y1: y1,
			lineColor: PolyData.lineColor,
			lineType: PolyData.lineType,
		});
	}

	return DrawData;
}

function DrawInCanvas(DrawContainer, BBox) {

	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");

	let scaleX = Math.abs(BBox.maxx - BBox.minx);
	let scaleY = Math.abs(BBox.maxy - BBox.miny);
	let scale = Math.min(1200 / scaleX, 1000 / scaleY);

	let MoveX = -BBox.minx;
	let MoveY = -BBox.miny;

	ctx.strokeStyle = "#000000";

	for (let dL = 0; dL < DrawContainer.length; dL++) {

		let dx = (DrawContainer[dL].x1 - DrawContainer[dL].x0);
		let dy = (DrawContainer[dL].y1 - DrawContainer[dL].y0);
		let LineLength = Math.sqrt((dx * dx) + (dy * dy));

		if (DrawContainer[dL].type == "line" || DrawContainer[dL].type == "polyline") {
			if (Math.abs(LineLength) > eps) {

				ctx.beginPath();
				let MoveHere = MoveX;
				if (DrawContainer[dL].lineColor) { ctx.strokeStyle = DrawContainer[dL].lineColor }

				ctx.moveTo((DrawContainer[dL].x0 + MoveHere) * scale, (DrawContainer[dL].y0 + MoveY) * scale);
				ctx.lineTo((DrawContainer[dL].x1 + MoveHere) * scale, (DrawContainer[dL].y1 + MoveY) * scale);
				ctx.stroke();

			} else {

				let Circle = { "x": DrawContainer[dL].x0, "y": DrawContainer[dL].y0, "Radius": 0.1, "Alfa": 0, "Beta": 360, "lineColor": DrawContainer[dL].lineColor, "storyIdx": DrawContainer[dL].storyIdx };

				drawCircle(Circle, BBox);
			}
		}

		if (DrawContainer[dL].type == "circle"){

			let Circle = { "x": DrawContainer[dL].x0, "y": DrawContainer[dL].y0, "Radius": DrawContainer[dL].rad, "Alfa": 0, "Beta": 360, "lineColor": DrawContainer[dL].lineColor, "storyIdx": DrawContainer[dL].storyIdx};
				drawCircle(Circle, BBox);
		}
	}
}

function drawCircle(Circle, BBox) {

	// Circle = {"x", "y", "Radius", "Alfa", "Beta", "lineColor", "storyIdx"};

	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	ctx.strokeStyle = "#000000";

	let scaleX = Math.abs(BBox.maxx - BBox.minx);
	let scaleY = Math.abs(BBox.maxy - BBox.miny);
	let scale = Math.min(1200 / scaleX, 1000 / scaleY);

	let MoveX = -BBox.minx;
	let MoveY = -BBox.miny;

	ctx.beginPath();

	if (Circle.lineColor) { ctx.strokeStyle = Circle.lineColor }
	ctx.arc((Circle.x + MoveX) * scale, (Circle.y + MoveY) * scale, Circle.Radius * scale, (Circle.Alfa / 180) * Math.PI, (Circle.Beta / 180) * Math.PI);
	ctx.stroke();

}


function DrawSVGonCanvas(DrawContainer, BBox) {

	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	ctx.strokeStyle = "#000000";

	let scaleX = Math.abs(BBox.maxx - BBox.minx);
	let scaleY = Math.abs(BBox.maxy - BBox.miny);
	let scale = Math.min(1200 / scaleX, 1000 / scaleY);

	let MoveX = -BBox.minx;
	let MoveY = -BBox.miny;

	ctx.strokeStyle = "#000000";

	for (let dL = 0; dL < DrawContainer.length; dL++) {
		if (DrawContainer[dL].type == "symbol") {

			let img = new Image();
			img.onload = function () {
				ctx.translate((DrawContainer[dL].x + MoveX) * scale, (DrawContainer[dL].y + MoveY) * scale);
				ctx.rotate(DrawContainer[dL].rot / 180 * Math.PI);
				ctx.drawImage(img, 0, 0);
				ctx.rotate(-DrawContainer[dL].rot / 180 * Math.PI);
				ctx.translate(-(DrawContainer[dL].x + MoveX) * scale, -(DrawContainer[dL].y + MoveY) * scale);

				ctx.restore();
			}

			img.src = DrawContainer[dL].url;
			ctx.restore();
		}
	}
}


function clearCanvas() {
	let c = document.getElementById("myCanvas");
	let ctx = c.getContext("2d");
	if (ctx) {
		ctx.clearRect(0, 0, c.width, c.height);
	}
}

function BoundingBox(DrawContainer) {
	let BBox = {};
	BBox.minx = 1000000;
	BBox.miny = 1000000;
	BBox.maxx = -1000000;
	BBox.maxy = -1000000;

	for (let Ln = 0; Ln < DrawContainer.length; Ln++) {
		
		if (DrawContainer[Ln]?.x0, DrawContainer[Ln]?.y0){
			if (DrawContainer[Ln]?.x0 < BBox.minx || DrawContainer[Ln]?.x1 < BBox.minx) {
				BBox.minx = Math.min(DrawContainer[Ln].x0, DrawContainer[Ln].x1);
			}
			if (DrawContainer[Ln].y0 < BBox.miny || DrawContainer[Ln].y1 < BBox.miny) {
				console.log("miny", Ln, DrawContainer[Ln].y0, DrawContainer[Ln].y1);
				BBox.miny = Math.min(DrawContainer[Ln].y0, DrawContainer[Ln].y1);
			}

			if (DrawContainer[Ln]?.x0 > BBox.maxx || DrawContainer[Ln]?.x1 > BBox.maxx) {
				BBox.maxx = Math.max(DrawContainer[Ln].x0, DrawContainer[Ln].x1);
			}
			if (DrawContainer[Ln]?.y1 > BBox.maxy || DrawContainer[Ln]?.y1 > BBox.maxy) {
				BBox.maxy = Math.max(DrawContainer[Ln].y0, DrawContainer[Ln].y1);
			}
		}
	}
	
	BBox.minx -= 5.0;
	BBox.miny -= 5.0;
	BBox.maxx += 5.0;
	BBox.maxy += 5.0;

	return BBox;
}
