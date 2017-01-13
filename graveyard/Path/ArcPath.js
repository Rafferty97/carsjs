export default class ArcPath
{
  constructor(x, y, a, c, l)
  {
    this.x = x;
    this.y = y;
    this.a = a;
    this.c = c;
    this.l = l;
    this.r = 1 / c;
    this._ox = x - this.r * Math.cos(this.a - 0.5 * Math.PI);
    this._oy = y - this.r * Math.sin(this.a - 0.5 * Math.PI);
  }

  get length() {
    return this.l;
  }

  get blength() {
    return this.l;
  }

  posOffset(s, o) {
    const r = this.r - o;
    return [
      this._ox + r * Math.cos(this.a + s * this.c - 0.5 * Math.PI),
      this._oy + r * Math.sin(this.a + s * this.c - 0.5 * Math.PI)
    ];
  }

  pos(s) {
    return [
      this._ox + this.r * Math.cos(this.a + s * this.c - 0.5 * Math.PI),
      this._oy + this.r * Math.sin(this.a + s * this.c - 0.5 * Math.PI)
    ];
  }

  ang(s) {
    return this.a + s * this.c;
  }

  curve(s) {
    return this.c;
  }

  bpos(s) { return this.pos(s); }
  bang(s) { return this.ang(s); }
  bcurve(s) { return this.curve(s); }
  lat(s) { return 0; }
  latd(s) { return 0; }
  maptobase(s) { return s; }
  mapfrombase(s) { return s; }
}
