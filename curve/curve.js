import { wrapAngle } from '../util';
export default class Curve {
    get length() {
        return 0;
    }
    XY(s, l = 0) {
        return [s, -l];
    }
    baseAngle(s) {
        return 0;
    }
    baseCurve(s) {
        return 0;
    }
    angle(s, dlds = 0) {
        return wrapAngle(this.baseAngle(s) + Math.atan(dlds));
    }
    getParallelDist(s, point) {
        const ang = this.baseAngle(s);
        const a = Math.cos(ang);
        const b = Math.sin(ang);
        const p = this.XY(s);
        const c = a * p[0] + b * p[1];
        const [x, y] = point;
        return a * x + b * y - c;
    }
    getParallelDistDeriv(s, point) {
        const theta = this.baseAngle(s);
        const dtheta = this.baseCurve(s);
        const cost = Math.cos(theta);
        const sint = Math.sin(theta);
        const [x, y] = point;
        const [xs, ys] = this.XY(s);
        return (dtheta * cost * (y - ys)) - (dtheta * sint * (x - xs)) - 1;
    }
    getClosestPoint(point, accuracy, init = 0) {
        let s = init, d = Infinity;
        for (let i = 0; i < 1000; i++) {
            const y = this.getParallelDist(s, point);
            const ns = s - (y / this.getParallelDistDeriv(s, point));
            if (Math.abs(y) < accuracy)
                return ns;
            s = ns;
        }
        return s;
    }
    SL(p, approxs = null) {
        if (approxs == null) {
            approxs = 0;
            let d = Infinity;
            for (let s = 0; s < this.length; s += 5) {
                const tp = this.XY(s);
                const td = Math.pow(tp[0] - p[0], 2) + Math.pow(tp[1] - p[1], 2);
                if (td < d) {
                    d = td;
                    approxs = s;
                }
            }
        }
        const s = this.getClosestPoint(p, 0.001, approxs);
        const a = this.baseAngle(s);
        const bp = this.XY(s, 0);
        const l = ((p[0] - bp[0]) * Math.sin(a)) - ((p[1] - bp[1]) * Math.cos(a));
        return { s, l };
    }
    reverse() {
        return new ReverseCurve(this);
    }
    drawLine(s, ctx, y1, y2) {
        ctx.beginPath();
        let p = this.XY(s, y1);
        ctx.moveTo(p[0], p[1]);
        p = this.XY(s, y2);
        ctx.lineTo(p[0], p[1]);
        ctx.stroke();
        ctx.closePath();
    }
}
class ReverseCurve extends Curve {
    constructor(curve) {
        super();
        this.c = curve;
    }
    get length() { return this.c.length; }
    XY(s, l = 0) {
        return this.c.XY(this.c.length - s, -l);
    }
    baseAngle(s) {
        let a = this.c.baseAngle(this.c.length - s) + Math.PI;
        if (a > Math.PI)
            a -= 2 * Math.PI;
        return a;
    }
    baseCurve(s) {
        return -this.c.baseCurve(this.c.length - s);
    }
}
