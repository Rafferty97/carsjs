export function __clothoid(_c) {
  const dt = 0.01;
  const a = Math.sqrt(2);
  const c = _c > 0 ? _c / a : -_c / a;
  let t = 0, x = 0, y = 0;
  while (t < c) {
     x += Math.cos(t*t) * Math.min(dt, c - t);
     y += Math.sin(t*t) * Math.min(dt, c - t);
     t += dt;
  }
  return _c > 0 ? [a * x, a * y] : [-a * x, -a * y];
}

export function clothoid(_c) {
  const a = 2;
  const aa = Math.sqrt(Math.PI);
  const c = (_c*_c) / a;
  let x=0, y=0;
  if (c < 4) {
    const c_a = [1.595769140, -0.000001702, -6.808568854, -0.000576361, 6.920691902, -0.016898657,-3.050485660, -0.075752419, 0.850663781, -0.025639041, -0.150230960, 0.034404779];
    const c_b = [-0.000000033, 4.255387524, 0.000092810, -7.780020400, -0.009520895, 5.075161298, -0.138341947, -1.363729124, -0.403349276, 0.702222016, -0.216195929, 0.019547031];
    let x4 = 1, f = c / 4;
    for (let n=0; n<12; n++) {
      x += c_a[n] * x4;
      y += c_b[n] * x4;
      x4 *= f;
    }
    x *= Math.sqrt(f);
    y *= Math.sqrt(f);
    let _x = x, _y = y;
    x = _x * Math.cos(c) + _y * Math.sin(c);
    y = _x * Math.sin(c) - _y * Math.cos(c);
  } else {
    const c_c = [0, -0.024933975, 0.000003936, 0.005770956, 0.000689892, -0.009497136, 0.011948809, -0.006748873, 0.000246420, 0.002102967, -0.001217930, 0.000233939];
    const c_d = [0.199471140, 0.000000023, -0.009351341, 0.000023006, 0.004851466, 0.001903218, -0.017122914, 0.029064067, -0.027928955, 0.016497308, -0.005598515, 0.000838386];
    let x4 = 1, f = 4 / c;
    for (let n=0; n<12; n++) {
      x += c_c[n] * x4;
      y += c_d[n] * x4;
      x4 *= f;
    }
    x *= Math.sqrt(f);
    y *= Math.sqrt(f);
    let _x = x, _y = y;
    x = _x * Math.cos(c) + _y * Math.sin(c) + 0.5;
    y = _x * Math.sin(c) - _y * Math.cos(c) + 0.5;
  }
  return _c > 0 ? [aa * x, aa * y] : [-aa * x, -aa * y];
}

export default class ClothoidPath
{
  constructor(x, y, a, _sc, _ec, l)
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
    this.a = a - (0.5 * Math.pow(sc * this._sc, 2) * (this.inv ? -1 : 1));
    this._m1 = Math.cos(this.a);
    this._m2 = -Math.sin(this.a);
    this._m3 = Math.sin(this.a);
    this._m4 = Math.cos(this.a);
  }

  get length() {
    return this.l;
  }

  get blength() {
    return this.l;
  }

  pos(s) {
    let p = clothoid((this.sc * this._sc) + (s / this._sc)).map(x => x * this._sc);
    if (this.inv) p[1] = -p[1];
    p[0] += this._o[0];
    p[1] += this._o[1];
    return [
      this.x + this._m1 * p[0] + this._m2 * p[1],
      this.y + this._m3 * p[0] + this._m4 * p[1]
    ];
  }

  posOffset(s, l) {
    const p = this.pos(s);
    const a = this.ang(s);
    p[0] += l * Math.cos(a + 0.5 * Math.PI);
    p[1] += l * Math.sin(a + 0.5 * Math.PI);
    return p;
  }

  ang(s) {
    return this.a + 0.5 * Math.pow((this.sc * this._sc) + (s / this._sc), 2) * (this.inv ? -1 : 1);
  }

  curve(s) {
    return (this.sc + (s / this.l) * (this.ec - this.sc)) * (this.inv ? -1 : 1);
  }

  bpos(s) { return this.pos(s); }
  bang(s) { return this.ang(s); }
  bcurve(s) { return this.curve(s); }
  lat(s) { return 0; }
  latd(s) { return 0; }
  maptobase(s) { return s; }
  mapfrombase(s) { return s; }
}
