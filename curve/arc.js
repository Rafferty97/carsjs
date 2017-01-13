import Curve from './curve';
export default class Arc extends Curve {
    constructor(x, y, r, a, d, len) {
        super();
        this.centre = [x - (r * Math.cos(a)), y - (r * Math.sin(a))];
        this.radius = r;
        this.len = len;
        this.ang = a;
        this.direction = d;
    }
    get length() {
        return this.len;
    }
    XY(s, l = 0) {
        const r = this.radius + (this.direction * l);
        const a = this.ang + (this.direction * (s / this.radius));
        return [
            this.centre[0] + (r * Math.cos(a)),
            this.centre[1] + (r * Math.sin(a))
        ];
    }
    baseAngle(s) {
        return this.ang + (this.direction * (s / this.radius)) + (this.direction * 0.5 * Math.PI);
    }
    baseCurve(s) {
        return (this.direction * (1 / this.radius));
    }
}
