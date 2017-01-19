import Curve from './curve';

export default class Line extends Curve
{
  start: [number, number];
  normal: [number, number];
  len: number;
  ang: number;

  constructor(x1: number, y1: number, x2: number, y2: number)
  {
    super();
    this.start = [x1, y1];
    const dx = x2 - x1, dy = y2 - y1;
    this.len = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    this.normal = [dx / this.len, dy / this.len];
    this.ang = Math.atan2(dy, dx);
  }

  static polar(x: number, y: number, a: number, l: number): Line
  {
    const line = new Line(0, 0, 1, 1);
    line.start = [x, y];
    line.len = l;
    line.normal = [Math.cos(a), Math.sin(a)];
    line.ang = a;
    return line;
  }

  get length(): number
  {
    return this.len;
  }

  XY(s: number, l: number = 0): [number, number]
  {
    return [
      this.start[0] + (s * this.normal[0]) - (l * this.normal[1]),
      this.start[1] + (s * this.normal[1]) + (l * this.normal[0])
    ];
  }

  baseAngle(s: number): number
  {
    return this.ang;
  }

  baseCurve(s: number): number
  {
    return 0;
  }
}