import Curve from './curve';
import Line from './line';
import Arc from './arc';
import Clothoid from './clothoid';
import BezierCurve from './beziercurve';
import { orientPoints } from '../util';
export default class PolyCurve extends Curve {
    constructor(curves) {
        super();
        this.curves = curves;
        this.len = curves.reduce((s, c) => s + c.length, 0);
    }
    static parseCurve(description) {
        const arr = description;
        const curves = [];
        let [x, y, a] = arr;
        for (let i = 3; i < arr.length;) {
            const t = arr[i];
            let c = null;
            let d, p;
            switch (t) {
                case 'l':
                    c = Line.polar(x, y, a, arr[i + 1]);
                    i += 2;
                    break;
                case 'a':
                    d = arr[i + 2] > 0 ? 1 : -1;
                    c = new Arc(x, y, Math.abs(1 / arr[i + 2]), a - (d * 0.5 * Math.PI), d, arr[i + 1]);
                    i += 3;
                    break;
                case 'c':
                    c = new Clothoid(x, y, a, arr[i + 2], arr[i + 3], arr[i + 1]);
                    i += 4;
                    break;
                case 'b':
                    p = [[0, 0]];
                    i += 1;
                    while (typeof arr[i] == 'number') {
                        p.push(arr.slice(i, i + 2));
                        i += 2;
                    }
                    c = new BezierCurve(...orientPoints(p, x, y, a));
                    break;
            }
            if (c == null)
                break;
            curves.push(c);
            [x, y] = c.XY(c.length);
            a = c.angle(c.length);
        }
        return new PolyCurve(curves);
    }
    get length() {
        return this.len;
    }
    getCurveS(s) {
        let c = 0, ls = s;
        while ((ls > this.curves[c].length) && (c < this.curves.length - 1)) {
            ls -= this.curves[c].length;
            c++;
        }
        return { c: this.curves[c], ls };
    }
    XY(s, l = 0) {
        const { c, ls } = this.getCurveS(s);
        return c.XY(ls, l);
    }
    baseAngle(s) {
        const { c, ls } = this.getCurveS(s);
        return c.baseAngle(ls);
    }
    baseCurve(s) {
        const { c, ls } = this.getCurveS(s);
        return c.baseCurve(ls);
    }
}
