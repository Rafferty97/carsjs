import Curve from './curve';
function clothoid(_c) {
    const a = 2;
    const aa = Math.sqrt(Math.PI);
    const c = (_c * _c) / a;
    let x = 0, y = 0;
    if (c < 4) {
        const c_a = [1.595769140, -0.000001702, -6.808568854, -0.000576361, 6.920691902, -0.016898657, -3.050485660, -0.075752419, 0.850663781, -0.025639041, -0.150230960, 0.034404779];
        const c_b = [-0.000000033, 4.255387524, 0.000092810, -7.780020400, -0.009520895, 5.075161298, -0.138341947, -1.363729124, -0.403349276, 0.702222016, -0.216195929, 0.019547031];
        let x4 = 1, f = c / 4;
        for (let n = 0; n < 12; n++) {
            x += c_a[n] * x4;
            y += c_b[n] * x4;
            x4 *= f;
        }
        x *= Math.sqrt(f);
        y *= Math.sqrt(f);
        let _x = x, _y = y;
        x = _x * Math.cos(c) + _y * Math.sin(c);
        y = _x * Math.sin(c) - _y * Math.cos(c);
    }
    else {
        const c_c = [0, -0.024933975, 0.000003936, 0.005770956, 0.000689892, -0.009497136, 0.011948809, -0.006748873, 0.000246420, 0.002102967, -0.001217930, 0.000233939];
        const c_d = [0.199471140, 0.000000023, -0.009351341, 0.000023006, 0.004851466, 0.001903218, -0.017122914, 0.029064067, -0.027928955, 0.016497308, -0.005598515, 0.000838386];
        let x4 = 1, f = 4 / c;
        for (let n = 0; n < 12; n++) {
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
export default class Clothoid extends Curve {
    constructor(x, y, a, c1, c2, l) {
        super();
        const scale = Math.sqrt(l / Math.abs(c2 - c1));
        this.inv = (c2 > c1 ? 1 : -1);
        this.c_b = scale * c1;
        this.c_m = (1 / scale) * this.inv;
        this.x = 0;
        this.y = 0;
        this.a = 0;
        this.a = a - this.baseAngle(0);
        this.mat = [
            scale * Math.cos(this.a), scale * -Math.sin(this.a),
            scale * Math.sin(this.a), scale * Math.cos(this.a)
        ];
        const mp = this.XY(0);
        this.x = x - mp[0];
        this.y = y - mp[1];
        this.len = l;
    }
    get length() {
        return this.len;
    }
    XY(s, l = 0) {
        let pos = clothoid(this.c_m * s + this.c_b);
        pos[0] *= this.inv;
        pos = [
            this.x + this.mat[0] * pos[0] + this.mat[1] * pos[1],
            this.y + this.mat[2] * pos[0] + this.mat[3] * pos[1]
        ];
        if (l != 0) {
            const a = this.baseAngle(s);
            pos[0] += l * Math.sin(a);
            pos[1] += l * -Math.cos(a);
        }
        return pos;
    }
    baseAngle(s) {
        return this.a + (0.5 * Math.pow(this.c_m * s + this.c_b, 2) * this.inv);
    }
    baseCurve(s) {
        return this.inv * this.c_m * (this.c_m * s + this.c_b);
    }
}
