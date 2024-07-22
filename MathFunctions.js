function DefineSectPoint(x0, y0, x1, y1, dir0, x2, y2, dir1) {
  let SecPoint = {};
  SecPoint.type = false; // no section
  SecPoint.x = 0.0;
  SecPoint.y = 0.0;

  if (Math.abs(dir0 - dir1) > eps && Math.abs(Math.abs(dir0 - dir1) - 180) > eps) {
    let Elev0 = CalcElev(dir0);
    let Elev1 = CalcElev(dir1);

    if (Elev0.type == false) {
      let dx2 = x0 - x2;
      SecPoint.x = x0;
      SecPoint.y = y2 + Elev1.value * dx2;
      SecPoint.type =
        PointOnLine(x0, y0, x1, y1, SecPoint.x, SecPoint.y, eps) > eps;
    } else {
      if (Elev1.type == false) {
        let dx2 = x2 - x0;
        SecPoint.x = x2;
        SecPoint.y = y0 + Elev0.value * dx2;
        SecPoint.type =
          PointOnLine(x0, y0, x1, y1, SecPoint.x, SecPoint.y, eps) > eps;
      } else {
        SecPoint.x =
          (y0 - x0 * Elev0.value + x2 * Elev1.value - y2) /
          (Elev1.value - Elev0.value);
        SecPoint.y = y0 + Elev0.value * (SecPoint.x - x0);
        SecPoint.type =
          PointOnLine(x0, y0, x1, y1, SecPoint.x, SecPoint.y, eps) > eps;
      }
    }
  } else {
    let LineOnVector1 = PointOnLine(
      x2,
      y2,
      x2 + 1000 * Math.cos((dir1 / 180) * Math.PI),
      y2 + 1000 * Math.sin((dir1 / 180) * Math.PI),
      x0,
      y0,
      eps
    );

    if (LineOnVector1 > eps) {
      let dist0 = Math.sqrt((x0 - x2) * (x0 - x2) + (y0 - y2) * (y0 - y2));
      let dist1 = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
      if (dist0 < dist1) {
        SecPoint.x = x0;
        SecPoint.y = y0;
        SecPoint.type = true;
      } else {
        SecPoint.x = x1;
        SecPoint.y = y1;
        SecPoint.type = true;
      }
    }
  }

  return SecPoint;
}

// 	Line1 = {"x0": PipeLines[PL][PLS].x0, "y0": PipeLines[PL][PLS].y0, "x1": PipeLines[PL][PLS].x1, "y1": PipeLines[PL][PLS].y1};
// 	Line2 = {"x0": PipeLines[PL][PLS].x0, "y0": PipeLines[PL][PLS].y0, "x1": PipeLines[PL][PLS].x1, "y1": PipeLines[PL][PLS].y1};
//  PointTolerance = eps;

function LineInLine(Line1, Line2, PointTolerance) {
  // Define if one lines is overlapping with an other;

  // if the direction is different, than it is not relevant anymore
  let Dir1 = CalcDirection(Line1.x1 - Line1.x0, Line1.y1 - Line1.y0);
  let Dir2 = CalcDirection(Line2.x1 - Line2.x0, Line2.y1 - Line2.y0);
  let SameDirection = false;
  let Overlapping = { value: false, type: "" };

  if (
    Math.abs(Dir1 - Dir2) < eps ||
    Math.abs(Math.abs(Dir1 - Dir2) - 180) < eps
  ) {
    SameDirection = true;
  }

  if (SameDirection == true) {
    let Point1OnLine = PointOnLine(
      Line2.x0,
      Line2.y0,
      Line2.x1,
      Line2.y1,
      Line1.x0,
      Line1.y0,
      PointTolerance
    );
    let Point2OnLine = PointOnLine(
      Line2.x0,
      Line2.y0,
      Line2.x1,
      Line2.y1,
      Line1.x1,
      Line1.y1,
      PointTolerance
    );
    let Point3OnLine = PointOnLine(
      Line1.x0,
      Line1.y0,
      Line1.x1,
      Line1.y1,
      Line2.x0,
      Line2.y0,
      PointTolerance
    );
    let Point4OnLine = PointOnLine(
      Line1.x0,
      Line1.y0,
      Line1.x1,
      Line1.y1,
      Line2.x1,
      Line2.y1,
      PointTolerance
    );

    if (
      Point1OnLine == 2 ||
      Point2OnLine == 2 ||
      Point3OnLine == 2 ||
      Point4OnLine == 2
    ) {
      Overlapping.value = true;
    }

    if (Point1OnLine > eps) {
      Overlapping.type = "ConnectP1L2";
      if (Point1OnLine == 2) {
        Overlapping.type = "OverlapP1";
        Overlapping.value = true;
      }
      if (Point2OnLine > eps) {
        Overlapping.type = "1LineIn2";
        Overlapping.value = true;
      }
    } else {
      if (Point3OnLine > eps) {
        Overlapping.type = "ConnectP3L1";
        if (Point2OnLine > 1) {
          Overlapping.type = "OverlapL1L2";
          Overlapping.value = true;
        } else {
          if (Point4OnLine > eps) {
            Overlapping.type = "2LineIn1";
          }
        }
      } else {
        if (Point4OnLine > eps) {
          Overlapping.type = "ConnectP4L1";
          if (Point2OnLine > 1) {
            Overlapping.type = "OverlapL2L1";
          }
        }
      }
    }
  }

  return Overlapping;
}

function PointOnLine(x0, y0, x1, y1, x2, y2, PointTolerance) {
  if (!PointTolerance) {
    PointTolerance = eps;
  }
  let PoL = 0; // 0 - not on line; 1 - on line edge; 2 - in line
  let SectTol = 0.001; // Tolerance for section points on line

  let LineLength = CalcLength(x0, y0, x1, y1);
  let SegLength1 = CalcLength(x0, y0, x2, y2);
  let SegLength2 = CalcLength(x1, y1, x2, y2);

  if (Math.abs(LineLength - (SegLength1 + SegLength2)) < SectTol) {
    if (SegLength1 < PointTolerance || SegLength2 < PointTolerance) {
      PoL = 1;
    } else {
      PoL = 2;
    }
  }

  return PoL;
}

function DefineDistance(
  x10,
  y10,
  x11,
  y11,
  x2,
  y2,
  DiffTolerance,
  ShowConsole
) {
  // Defines a perpendicular Distance from a line
  let dx = x11 - x10;
  let dy = y11 - y10;
  let MainDir = CalcDirection(dx, dy);
  let SecDir = MainDir + 90;
  let Dist = {};

  let SectPoint = DefineSectPoint(x10, y10, x11, y11, MainDir, x2, y2, SecDir);

  // if(ShowConsole){
  // 	console.log("SectPoint", x10, y10, x11, y11, MainDir, x2, y2, SecDir, SectPoint);
  // }

  if (SectPoint.type == true) {
    let PoOnL = PointOnLine(x10, y10, x11, y11, SectPoint.x, SectPoint.y, eps);
    if (PoOnL > eps) {
      let dxL = x2 - SectPoint.x;
      let dyL = y2 - SectPoint.y;

      Dist.value = Math.sqrt(dxL * dxL + dyL * dyL);
      Dist.sectx = SectPoint.x;
      Dist.secty = SectPoint.y;
    } else {
      Dist.value = null;
      Dist.sectx = null;
      Dist.secty = null;
    }
  } else {
    Dist.value = null;
    Dist.sectx = null;
    Dist.secty = null;
  }

  if (Dist.value == null) {
    let dist1 = CalcLength(x10, y10, x2, y2);
    let dist2 = CalcLength(x11, y11, x2, y2);

    if (dist1 < DiffTolerance || dist2 < DiffTolerance) {
      Dist.value = Math.min(dist1, dist2);
      Dist.sectx = SectPoint.x;
      Dist.secty = SectPoint.y;
    }
  }

  return Dist;
}

function CalcElev(dir) {
  // defines an elevation to the Lines
  let Elev = {};
  Elev.type = true;
  Elev.value = 0;

  if (dir == 90 || dir == 270) {
    Elev.type = false;
  } else {
    Elev.type = true;
    Elev.value = Math.tan((dir / 180) * Math.PI);
  }

  return Elev;
}

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
