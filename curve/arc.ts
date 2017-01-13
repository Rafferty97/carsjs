import Curve from './curve';

export default class Arc extends Curve
{
  centre: [number, number];
  radius: number;
  len: number;
  ang: number;
  direction: number;

  constructor(x: number, y: number, r: number, a: number, d: number, len: number)
  {
    super();
    this.centre = [x - (r * Math.cos(a)), y - (r * Math.sin(a))];
    this.radius = r;
    this.len = len;
    this.ang = a;
    this.direction = d;
  }

  get length(): number
  {
    return this.len;
  }

  XY(s: number, l: number = 0): [number, number]
  {
    const r = this.radius + (this.direction * l);
    const a = this.ang + (this.direction * (s / this.radius));
    return [
      this.centre[0] + (r * Math.cos(a)),
      this.centre[1] + (r * Math.sin(a))
    ];
  }

  baseAngle(s: number): number
  {
    return this.ang + (this.direction * (s / this.radius)) + (this.direction * 0.5 * Math.PI);
  }

  baseCurve(s: number): number
  {
    return (this.direction * (1 / this.radius));
  }
}