import Spline from './Spline';
import { measureLength } from './util';

export default class LinePathLat
{
  constructor(x, y, a, l, so, eo, soa, eoa)
  {
    this.x = x;
    this.y = y;
    this.spline = new Spline(so, eo, soa, eoa, l);
    this.a = a;
    this.l = l;
    this.n = [Math.cos(this.a), Math.sin(this.a)];
    this.ll = 1;
    this.ll = measureLength(t => this.pos(t), 1000);
  }

  get length() {
    return this.ll;
  }

  get blength() {
    return this.l;
  }

  posOffset(_s, r) {
    const s = _s * (this.l / this.ll);
    return [
      this.x + this.n[0] * s - this.n[1] * r,
      this.y + this.n[1] * s + this.n[0] * r
    ];
  }

  pos(_s) {
    const s = _s * (this.l / this.ll);
    return this.posOffset(_s, this.spline.y(s));
  }

  ang(_s) {
    const s = _s * (this.l / this.ll);
    return this.a + Math.atan(this.spline.yd(s));
  }

  curve(s) {
    return 0;
  }

  bpos(s) {
    return [
      this.x + this.n[0] * s,
      this.y + this.n[1] * s
    ];
  }

  bang() {
    return this.a;
  }

  bcurve() {
    return 0;
  }

  lat(s) { return this.spline.y(s); }
  latd(s) { return this.spline.yd(s); }
  maptobase(s) { return s * (this.blength / this.length); }
  mapfrombase(s) { return s * (this.length / this.blength); }
}
