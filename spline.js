;
export default class Spline {
    constructor(points) {
        this.segments = [];
        if (points.length < 2)
            return;
        this._x1 = points[0].x;
        this._x2 = points[points.length - 1].x;
        this._y1 = points[0].y;
        this._y2 = points[points.length - 1].y;
        for (let i = 0; i < points.length - 1; i++) {
            const cp1 = points[i], cp2 = points[i + 1];
            const l = cp2.x - cp1.x, l2 = l * l, l3 = l2 * l, l4 = l3 * l;
            this.segments.push({
                x: cp1.x,
                a: -((2 * l * ((cp2.y - cp1.y) - cp1.dydx * l) - l2 * (cp2.dydx - cp1.dydx)) / l4),
                b: -((l3 * (cp2.dydx - cp1.dydx) - 3 * l2 * ((cp2.y - cp1.y) - cp1.dydx * l)) / l4),
                c: cp1.dydx,
                d: cp1.y
            });
        }
    }
    static Constant(c, x1, x2) {
        return new Spline([{ x: x1, y: c, dydx: 0 }, { x: x2, y: c, dydx: 0 }]);
    }
    get x1() { return this._x1; }
    get x2() { return this._x2; }
    Y(x) {
        let s = 0;
        while ((s < this.segments.length - 1) && (this.segments[s + 1].x < x))
            s++;
        x -= this.segments[s].x;
        const x2 = x * x, x3 = x2 * x;
        const { a, b, c, d } = this.segments[s];
        return a * x3 + b * x2 + c * x + d;
    }
    dYdX(x) {
        let s = 0;
        while ((s < this.segments.length - 1) && (this.segments[s + 1].x < x))
            s++;
        x -= this.segments[s].x;
        const x2 = x * x;
        const { a, b, c } = this.segments[s];
        return 3 * a * x2 + 2 * b * x + c;
    }
    YdY(x) {
        let s = 0;
        while ((s < this.segments.length - 1) && (this.segments[s + 1].x < x))
            s++;
        x -= this.segments[s].x;
        const x2 = x * x, x3 = x2 * x;
        const { a, b, c, d } = this.segments[s];
        return { y: a * x3 + b * x2 + c * x + d, dydx: 3 * a * x2 + 2 * b * x + c };
    }
    translate(t) {
        const spline = new Spline([]);
        spline._x1 = this._x1;
        spline._x2 = this._x2;
        spline.segments = this.segments.map(s => {
            let { x, a, b, c, d } = s;
            d += t;
            return { x, a, b, c, d };
        });
        return spline;
    }
    X(y, accuracy, approxx = null) {
        const t = (y - this._y1) / (this._y2 - this._y1);
        let x = approxx === null ? (this._x1 + t * (this._x2 - this._x1)) : approxx;
        for (let i = 0; i < 1000; i++) {
            const ty = this.Y(x) - y;
            const dy = this.dYdX(x);
            const nx = x - (ty / dy);
            if (Math.abs(y / dy) < accuracy)
                return nx;
            x = nx;
        }
        return x;
    }
}
