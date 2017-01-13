import { default as Spline } from './spline';
export function wrapAngle(ang) {
    while (ang > Math.PI)
        ang -= 2 * Math.PI;
    while (ang < -Math.PI)
        ang += 2 * Math.PI;
    return ang;
}
function getTangentAtMidPoint(points) {
    let t = (points[1].y - points[0].y) / (points[1].x - points[0].x);
    t += (points[2].y - points[1].y) / (points[2].x - points[1].x);
    return 0.5 * t;
}
export function getApproxArcLengthParam(p, t1, t2, steps) {
    const dx = (t2 - t1) / steps;
    let l = 0;
    let ct1 = t1, p1 = p(ct1);
    let points = [];
    points.push({ x: 0, y: ct1, dydx: 0 });
    for (let i = 1; i <= steps; i++) {
        const ct2 = t1 + (dx * i);
        const p2 = p(ct2);
        const cl = vecLen(vecDiff(p2, p1));
        points.push({ x: l + cl, y: ct2, dydx: 0 });
        if (points.length >= 3) {
            const dydx = getTangentAtMidPoint(points.slice(points.length - 3));
            points[points.length - 2].dydx = dydx;
        }
        ct1 = ct2;
        p1 = p2;
        l += cl;
    }
    const li = points.length - 1;
    points[0].dydx = (points[1].y - points[0].y) / (points[1].x - points[0].x);
    points[li].dydx = (points[li].y - points[li - 1].y) / (points[li].x - points[li - 1].x);
    const spline = new Spline(points);
    return {
        t: spline.Y.bind(spline),
        s: spline,
        l
    };
}
export function vecDiff(v1, v2) {
    return v1.map((x, i) => x - v2[i]);
}
export function vecLen(v) {
    return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}
export function orientPoints(points, x, y, a) {
    const mat = [
        Math.cos(a), -Math.sin(a),
        Math.sin(a), Math.cos(a)
    ];
    return points.map(p => [
        x + mat[0] * p[0] + mat[1] * p[1],
        y + mat[2] * p[0] + mat[3] * p[1]
    ]);
}
