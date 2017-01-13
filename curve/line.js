import Curve from './curve';
export default class Line extends Curve {
    constructor(x1, y1, x2, y2) {
        super();
        this.start = [x1, y1];
        const dx = x2 - x1, dy = y2 - y1;
        this.len = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        this.normal = [dx / this.len, dy / this.len];
        this.ang = Math.atan2(dy, dx);
    }
    static polar(x, y, a, l) {
        const line = new Line(0, 0, 1, 1);
        line.start = [x, y];
        line.len = l;
        line.normal = [Math.cos(a), Math.sin(a)];
        line.ang = a;
        return line;
    }
    get length() {
        return this.len;
    }
    XY(s, l = 0) {
        return [
            this.start[0] + (s * this.normal[0]) + (l * this.normal[1]),
            this.start[1] + (s * this.normal[1]) - (l * this.normal[0])
        ];
    }
    baseAngle(s) {
        return this.ang;
    }
    baseCurve(s) {
        return 0;
    }
}
