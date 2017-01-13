import Curve from './curve';
import { getApproxArcLengthParam } from '../util';
export function getPascalLine(n) {
    const line = [1];
    let last = 1;
    for (let i = 1; i <= n; i++) {
        const next = last * (n - i + 1) / i;
        line.push(next);
        last = next;
    }
    return line;
}
export default class BezierCurve extends Curve {
    constructor(points) {
        super();
        this.points = points;
        this.pascal = getPascalLine(this.points.length - 1);
        this.pascalm1 = getPascalLine(this.points.length - 2);
        const alp = getApproxArcLengthParam(this._XY.bind(this), 0, 1, 100);
        this.len = alp.l;
        this.TfromS = alp.t;
    }
    get length() {
        return this.len;
    }
    _XY(t) {
        const n = this.points.length - 1;
        let p = [0, 0];
        this.points.forEach((point, i) => {
            const f = this.pascal[i] * Math.pow(t, i) * Math.pow(1 - t, n - i);
            p[0] += f * point[0];
            p[1] += f * point[1];
        });
        return p;
    }
    XY(s, l = 0) {
        let pos = this._XY(this.TfromS(s));
        if (l != 0) {
            const a = this.baseAngle(s);
            pos[0] += l * Math.sin(a);
            pos[1] += l * -Math.cos(a);
        }
        return pos;
    }
    baseAngle(s) {
        const t = this.TfromS(s);
        const n = this.points.length - 1;
        let p = [0, 0];
        for (let i = 0; i < n; i++) {
            const f = this.pascalm1[i] * Math.pow(t, i) * Math.pow(1 - t, n - i - 1);
            p[0] += f * (this.points[i + 1][0] - this.points[i][0]);
            p[1] += f * (this.points[i + 1][1] - this.points[i][1]);
        }
        ;
        return Math.atan2(p[1], p[0]);
    }
    baseCurve(s) {
        return 50 * (this.baseAngle(s + 0.01) - this.baseAngle(s - 0.01));
    }
}
