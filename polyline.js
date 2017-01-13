import { vecDiff, vecLen } from './util';
export default class PolyLine {
    constructor(x, y) {
        this.s = x.length;
        this.x = x;
        this.y = y;
        this.m = new Array(this.s);
        this.mi = new Array(this.s);
        for (let i = 0; i < this.s - 1; i++) {
            this.m[i] = (this.y[i + 1] - this.y[i]) / (this.x[i + 1] - this.x[i]);
            this.mi[i] = 1 / this.m[i];
        }
    }
    findSegmentX(x) {
        if (x < this.x[0])
            return 0;
        if (x > this.x[this.s - 1])
            return this.s - 2;
        let s1 = 0, s2 = this.s - 1;
        while (s2 - s1 > 1) {
            const p = s1 + Math.floor((s2 - s1) / 2);
            if (x < this.x[p])
                s2 = p;
            else
                s1 = p;
        }
        return s1;
    }
    findSegmentY(y) {
        if (y < this.y[0])
            return 0;
        if (y > this.y[this.s - 1])
            return this.s - 2;
        let s1 = 0, s2 = this.s - 1;
        while (s2 - s1 > 1) {
            const p = s1 + Math.floor((s2 - s1) / 2);
            if (y < this.y[p])
                s2 = p;
            else
                s1 = p;
        }
        return s1;
    }
    Y(x) {
        const s = this.findSegmentX(x);
        return this.y[s] + this.m[s] * (x - this.x[s]);
    }
    X(y) {
        const s = this.findSegmentY(y);
        return this.x[s] + this.mi[s] * (y - this.y[s]);
    }
    dYdX(x) {
        return this.m[this.findSegmentX(x)];
    }
    dXdY(y) {
        return this.mi[this.findSegmentY(y)];
    }
    YdY(x) {
        const s = this.findSegmentX(x);
        return {
            y: this.y[s] + this.m[s] * (x - this.x[s]),
            dydx: this.m[s]
        };
    }
    XdX(y) {
        const s = this.findSegmentY(y);
        return {
            x: this.x[s] + this.mi[s] * (y - this.y[s]),
            dxdy: this.mi[s]
        };
    }
    static createArcLengthMap(pos, t1, t2, d, accuracy = 0.1) {
        const x = [0], y = [0];
        const maxErr = d * accuracy;
        let lp = pos(t1), ls = 0, lt = t1, dt = d;
        while (lt < t2) {
            let ds = vecLen(vecDiff(lp, pos(lt + dt)));
            while (Math.abs(ds - d) > maxErr) {
                dt *= (d / ds);
                ds = vecLen(vecDiff(lp, pos(lt + dt)));
            }
            lp = pos(lt + dt);
            ls += ds;
            lt += dt;
            x.push(ls);
            y.push(lt);
        }
        return new PolyLine(x, y);
    }
}
