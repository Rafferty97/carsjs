import Spline from './spline';
import Arc from './curve/arc';
import Car from './car';
import Track from './track';
import MergeController from './controller/mergectrl';
import DivergeController from './controller/divergectrl';
const delta = 0.025;
let canv = document.getElementById("canvas");
let ctx = canv.getContext("2d");
ctx.transform(4, 0, 0, 4, 50, 100);
//const curve = PolyCurve.parseCurve([0, 0, 0, 'l', 100, 'c', 50, 0, 0.02, 'a', 100, 0.02, 'c', 50, 0.02, -0.05]);
//const curve = PolyCurve.parseCurve([0, 0, 0, 'l', 50, 'b', 50, 0, 50, 50, 'l', 60]);
//const curve = new Line(0, 0, 300, 0);
const curve = new Arc(200, 50, 50, 0, 1, 50 * 2 * Math.PI);
//const curve = new Line(300, 25, 0, 25);
function drawLine(p, s1, s2, ds) {
    let pos = p(s1);
    ctx.moveTo(pos[0], pos[1]);
    for (let s = s1 + ds; s < s2; s += ds) {
        pos = p(s);
        ctx.lineTo(pos[0], pos[1]);
    }
    pos = p(s2);
    ctx.lineTo(pos[0], pos[1]);
}
function drawCar(car) {
    const { p, a } = car.XYA();
    ctx.save();
    ctx.transform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), p[0], p[1]);
    ctx.beginPath();
    ctx.setLineDash([]);
    const l = car.l / 2, w = car.w / 2;
    ctx.moveTo(-l, -w);
    ctx.lineTo(l, -w);
    ctx.lineTo(l, w);
    ctx.lineTo(-l, w);
    ctx.lineTo(-l, -w);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}
ctx.lineWidth = 0.2;
const rhs = false;
const sor = rhs ? -1 : 1;
const spline = new Spline([{ x: 0, y: sor * 10, dydx: 0 }, { x: 50, y: sor * 10, dydx: 0 }, { x: 150, y: sor * 6, dydx: 0 }, { x: curve.length, y: sor * 6, dydx: 0 }]);
const spline2 = new Spline([{ x: 0, y: sor * 10, dydx: 0 }, { x: 50, y: sor * 10, dydx: 0 }, { x: 150, y: sor * 6, dydx: 0 }]);
const spline3 = new Spline([{ x: curve.length - 75, y: sor * 4.5, dydx: 0 }, { x: curve.length, y: sor * 8.5, dydx: 0 }]);
const track1 = new Track(curve, spline2.translate(sor * -1.5), false);
const track2 = new Track(curve, Spline.Constant(sor * 4.5, 0, 150), false);
const track3 = new Track(curve, Spline.Constant(sor * 0, 0, curve.length), true);
const track4 = new Track(curve, Spline.Constant(sor * 4, 0, curve.length), true);
const track5 = new Track(curve, Spline.Constant(sor * 4.5, 150, curve.length - 75), false);
const track6 = new Track(curve, Spline.Constant(sor * 4.5, curve.length - 75, curve.length), false);
const track7 = new Track(curve, spline3, false);
track1.connectTo(track5);
track2.connectTo(track5);
track3.connectTo(track3);
track4.connectTo(track4);
track5.connectTo(track6);
track5.connectTo(track7);
track6.connectTo(track2);
track7.connectTo(track1);
const tracks = [track1, track2, track3, track4, track5, track6, track7];
const cars = [];
const ctrls = [];
for (let i = 0; i < 25; i++)
    cars.push(new Car(track1, 6 * i));
for (let i = 0; i < 15; i++)
    cars.push(new Car(track2, 6 * i));
for (let i = 0; i < 14; i++)
    cars.push(new Car(track3, 6 * i));
for (let i = 0; i < 4; i++)
    cars.push(new Car(track4, 6 * i));
//for (let i=0; i<4; i++) track4.cars[0].changeLane(track3, 50);
//for (let i=0; i<4; i++) track3.cars[0].changeLane(track4, 50);
tracks.forEach(t => t.ctx = ctx);
cars.forEach(t => t.ctx = ctx);
const [m1, m2] = [0, 80];
const [m3, m4] = [curve.length - 30, curve.length - 15];
ctrls.push(new MergeController([track1, track2], m1, m2));
ctrls.push(new DivergeController([track6, track7], m3, m4));
let light = 'green';
setInterval(() => {
    let p;
    ctx.clearRect(-100, -100, 1000, 1000);
    ctx.beginPath();
    ctx.setLineDash([]);
    drawLine(s => curve.XY(s, sor * 2 + spline3.Y(s)), spline3.x1, spline3.x2, 2);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.setLineDash([]);
    drawLine(s => curve.XY(s, sor * -6), 0, curve.length, 2);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.setLineDash([2, 5]);
    drawLine(s => curve.XY(s, sor * -2), 0, curve.length, 2);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.setLineDash([]);
    drawLine(s => curve.XY(s, sor * 2), 0, curve.length, 2);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.setLineDash([]);
    drawLine(s => curve.XY(s, sor * 2.5), 0, curve.length, 2);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.setLineDash([1, 2.5]);
    drawLine(s => curve.XY(s, sor * 6.5), 0, 50, 2);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.setLineDash([]);
    drawLine(s => curve.XY(s, sor * 0.5 + spline.Y(s)), 0, spline3.x1, 2);
    ctx.stroke();
    ctx.closePath();
    const lightpos = curve.length * 0.5;
    ctx.beginPath();
    ctx.setLineDash([]);
    p = curve.XY(lightpos, sor * -6);
    ctx.moveTo(p[0], p[1]);
    p = curve.XY(lightpos, sor * 2);
    ctx.lineTo(p[0], p[1]);
    ctx.strokeStyle = light == 'amber' ? 'orange' : light;
    ctx.stroke();
    ctx.strokeStyle = 'black';
    ctx.closePath();
    // Calculate conditions
    tracks.forEach(track => {
        track.clearConditions();
    });
    tracks.forEach(track => {
        track.calculateConditions();
    });
    ctrls.forEach(ctrl => ctrl.calculateConditions());
    if (light == 'red') {
        tracks[2].propogateBack(lightpos, { type: 'stop', x: curve.length * 0.5, coord: 'base' }, 500, 2);
        tracks[3].propogateBack(lightpos, { type: 'stop', x: lightpos, coord: 'base' }, 500, 2);
    }
    if (light == 'amber') {
        tracks[2].propogateBack(lightpos, { type: 'amber', x: curve.length * 0.5, coord: 'base' }, 500, 5);
        tracks[3].propogateBack(lightpos, { type: 'amber', x: lightpos, coord: 'base' }, 500, 5);
    }
    curve.drawLine(m1, ctx);
    curve.drawLine(m2, ctx);
    // Step and draw cars
    cars.forEach(car => {
        drawCar(car);
        car.step(delta);
        /*const ss = car.track.baseSLdL(car.fx).s;
        car.track.SLdLfromBaseS(car.fx).s;
        ctx.beginPath();
        ctx.setLineDash([]);
        p = curve.XY(ss, -6);
        ctx.moveTo(p[0], p[1]);
        p = curve.XY(ss, 2);
        ctx.lineTo(p[0], p[1]);
        ctx.stroke();
        ctx.closePath();*/
    });
}, 1000 * delta * 0.25);
let redtimer = 0;
window.addEventListener('keydown', event => {
    if (event.keyCode == 83) {
        light = 'amber';
        redtimer = setTimeout(() => light = 'red', 500);
    }
    if (event.keyCode == 71) {
        light = 'green';
        clearTimeout(redtimer);
    }
    if (event.keyCode == 65) {
        const car = track3.cars[0]; //Math.floor(track3.cars.length * Math.random())];
        car.changeLane(track4, 50);
    }
    if (event.keyCode == 66) {
        const car = track4.cars[0]; //Math.floor(track4.cars.length * Math.random())];
        car.changeLane(track3, 50);
    }
    if (event.keyCode == 67) {
        const t3 = track3.cars.concat([]);
        t3.forEach(car => car.changeLane(track4, 50));
        const t4 = track4.cars.concat([]);
        t4.forEach(car => car.changeLane(track3, 50));
    }
    if (event.keyCode == 68) {
        cars.push(new Car(track1));
    }
});
