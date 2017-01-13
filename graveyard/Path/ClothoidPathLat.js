import Spline from './Spline';
import { measureLength } from './util';
import { clothoid } from './ClothoidPath';

export default class ClothoidPathLat
{
  constructor(x, y, a, _sc, _ec, l, so, eo, soa, eoa)
  {
    let sc, ec;
    this.inv = false;
    if (_sc < _ec) {
      sc = _sc; ec = _ec;
    } else {
      this.inv = true;
      sc = -_sc; ec = -_ec;
    }
    this.x = x;
    this.y = y;
    this.sc = sc;
    this.ec = ec;
    this.l = l;
    this._sc = Math.sqrt(l / Math.abs(ec - sc));
    this._o = clothoid(this.sc * this._sc).map(x => -x * this._sc);
    if (this.inv) this._o[1] = -this._o[1];
    this.spline = new Spline(so, eo, soa, eoa, l);
    this.a = a - (0.5 * Math.pow(sc * this._sc, 2) * (this.inv ? -1 : 1));
    this._m1 = Math.cos(this.a);
    this._m2 = -Math.sin(this.a);
    this._m3 = Math.sin(this.a);
    this._m4 = Math.cos(this.a);
    this.ll = 1;
    this.ll = measureLength(t => this.pos(t), 1000);
  }

  get length() {
    return this.ll;
  }

  get blength() {
    return this.l;
  }

  _pos(s) {
    let p = clothoid((this.sc * this._sc) + (s / this._sc)).map(x => x * this._sc);
    if (this.inv) p[1] = -p[1];
    p[0] += this._o[0];
    p[1] += this._o[1];
    return [
      this.x + this._m1 * p[0] + this._m2 * p[1],
      this.y + this._m3 * p[0] + this._m4 * p[1]
    ];
  }

  posOffset(_s, l) {
    const s = _s * (this.l / this.ll);
    const p = this._pos(s);
    const a = this._ang(s);
    p[0] += l * Math.cos(a + 0.5 * Math.PI);
    p[1] += l * Math.sin(a + 0.5 * Math.PI);
    return p;
  }

  pos(_s) {
    const s = _s * (this.l / this.ll);
    return this.posOffset(_s, this.spline.y(s));
  }

  _ang(s) {
    return this.a + 0.5 * Math.pow((this.sc * this._sc) + (s / this._sc), 2) * (this.inv ? -1 : 1);
  }

  ang(_s) {
    const s = _s * (this.l / this.ll);
    return this._ang(s) + Math.atan(this.spline.yd(s));
  }

  curve(s) {
    return (this.sc + (s / this.ll) * (this.ec - this.sc)) * (this.inv ? -1 : 1);
  }

  bpos(s) {
    return this._pos(s);
  }

  bang(s) {
    return this._ang(s);
  }

  bcurve(s) {
    return (this.sc + (s / this.l) * (this.ec - this.sc)) * (this.inv ? -1 : 1);
  }

  lat(s) { return this.spline.y(s); }
  latd(s) { return this.spline.yd(s); }
  maptobase(s) { return s * (this.blength / this.length); }
  mapfrombase(s) { return s * (this.length / this.blength); }
}
