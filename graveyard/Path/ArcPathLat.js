import Spline from './Spline';
import { measureLength } from './util';

export default class ArcPathLat
{
  constructor(x, y, a, c, l, so, eo, soa, eoa)
  {
    this.x = x;
    this.y = y;
    this.spline = new Spline(so, eo, soa, eoa, l);
    this.a = a;
    this.c = c;
    this.l = l;
    this.r = 1 / c;
    this._ox = x - this.r * Math.cos(this.a - 0.5 * Math.PI);
    this._oy = y - this.r * Math.sin(this.a - 0.5 * Math.PI);
    this.ll = 1;
    this.ll = measureLength(t => this.pos(t), 1000);
  }

  get length() {
    return this.ll;
  }

  get blength() {
    return this.l;
  }

  posOffset(_s, o) {
    const s = _s * (this.l / this.ll);
    const r = this.r - o;
    return [
      this._ox + r * Math.cos(this.a + s * this.c - 0.5 * Math.PI),
      this._oy + r * Math.sin(this.a + s * this.c - 0.5 * Math.PI)
    ];
  }

  pos(_s) {
    const s = _s * (this.l / this.ll);
    return this.posOffset(_s, this.spline.y(s));
  }

  ang(_s) {
    const s = _s * (this.l / this.ll);
    return this.a + s * this.c + Math.atan(this.spline.yd(s));
  }

  curve(s) {
    return this.c;
  }

  bpos(s) {
    return [
      this._ox + this.r * Math.cos(this.a + s * this.c - 0.5 * Math.PI),
      this._oy + this.r * Math.sin(this.a + s * this.c - 0.5 * Math.PI)
    ];
  }

  bang(s) {
    return this.a + s * this.c;
  }

  bcurve() {
    return this.c;
  }

  lat(s) { return this.spline.y(s); }
  latd(s) { return this.spline.yd(s); }
  maptobase(s) { return s * (this.blength / this.length); }
  mapfrombase(s) { return s * (this.length / this.blength); }
}
