import PolyCurve from './curve/polycurve';
import Line from './curve/line';
import Clothoid from './curve/clothoid';
import BezierCurve from './curve/beziercurve';
import Spline from './spline';
import Arc from './curve/arc';
import Car from './car';
import Track from './track';
import Lane from './lane';
import MergeController from './controller/mergectrl';
import DivergeController from './controller/divergectrl';

const delta = 0.05;// 0.025;

let canv = <HTMLCanvasElement> document.getElementById("canvas");
let ctx = canv.getContext("2d");

ctx.transform(4, 0, 0, 4, 50, 100);

const curve = PolyCurve.parseCurve([0, 0, 0, 'l', 100, 'c', 50, 0, 0.02, 'a', 100, 0.02, 'c', 50, 0.02, -0.05]);
//const curve = PolyCurve.parseCurve([0, 0, 0, 'l', 50, 'b', 50, 0, 50, 50, 'l', 60]);
//const curve = new Line(0, 0, 300, 0);
//const curve = new Arc(200, 50, 50, 0, 1, 50 * 2 * Math.PI);
//const curve = new Line(300, 25, 0, 25);

function drawLine(p: (n: number) => [number, number], s1: number, s2: number, ds: number)
{
  let pos = p(s1);
  ctx.beginPath();
  ctx.moveTo(pos[0], pos[1]);
  for (let s = s1 + ds; s < s2; s += ds) {
    pos = p(s);
    ctx.lineTo(pos[0], pos[1]);
  }
  pos = p(s2);
  ctx.lineTo(pos[0], pos[1]);
  ctx.stroke();
  ctx.closePath();
}

function drawCar(car: Car)
{
  const { p, a } = car.XYA();
  ctx.save();
  ctx.transform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), p[0], p[1]);
  ctx.beginPath();
  ctx.setLineDash([]);
  const l = car.l / 2, w = car.w / 2;
  ctx.moveTo(-l, -w);
  ctx.lineTo( l, -w);
  ctx.lineTo( l,  w);
  ctx.lineTo(-l,  w);
  ctx.lineTo(-l, -w);
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

const rhs = false;
const sor = rhs ? -1 : 1;

const tracks: Track[] = [];

const spline1 = new Spline([{ x: 0, y: sor * 6.5, dydx: 0 }, { x: 50, y: sor * 6.5, dydx: 0 }, { x: 100, y: sor * 2.5, dydx: 0 }, { x: 125, y: sor * 2.5, dydx: 0 }]);
const spline2 = spline1.translate(2);
const spline3 = new Spline([{ x: 0, y: sor * 2.5, dydx: 0 }, { x: 25, y: sor * 2.5, dydx: 0 }, { x: 75, y: sor * 6.5, dydx: 0 }, { x: 200, y: sor * 6.5, dydx: 0 }]);
const spline4 = spline3.translate(2);

tracks.push(new Track(curve, 0, 125, [
  new Lane(Spline.Constant(sor * 2.5, 0, 200)),
  new Lane(spline1)
  ]));
tracks.push(new Track(curve, 125, curve.length, [
  new Lane(Spline.Constant(sor * 2.5, 0, 200)),
  new Lane(spline3)
  ]));
tracks.push(new Track(curve, 0, curve.length, [
  new Lane(Spline.Constant(sor * 2.5, 0, 200)),
  new Lane(Spline.Constant(sor * 6.5, 0, 200))
  ], true));

tracks[0].connectTo(tracks[1], [[0, 0], [0, 1], [1, 0], [1, 1]]);
tracks[1].connectTo(tracks[0], [[0, 0], [1, 1]]);
tracks[2].connectTo(tracks[2], [[0, 0], [1, 1]]);

tracks[0].addMergeSection([0, 1], 65, 130);
tracks[1].addMergeSection([0, 1], 0, 60);

for (let i=0; i<20; i++) new Car(tracks[1].lanes[0], 7*i, 0);
for (let i=0; i<20; i++) new Car(tracks[1].lanes[1], 7*i, 0);
for (let i=0; i<20; i++) new Car(tracks[2].lanes[0], 7*i, 0);
for (let i=0; i<20; i++) new Car(tracks[2].lanes[1], 7*i, 0);

tracks.forEach(track => track.lanes.forEach(lane => lane.cars.forEach(car => { car.ctx = ctx; })));

setInterval(() => {

  ctx.clearRect(-100, -100, 1000, 1000);

  tracks.forEach(track => {
    track.resetConditions();
  });
  tracks.forEach(track => {
    track.calculateConditions();
  });
  tracks.forEach(track => {
    track.step(delta);
  });

  ctx.lineWidth = 0.2;
  ctx.strokeStyle = 'black';

  ctx.setLineDash([]);
  drawLine(s => curve.XY(s, 0.5), 0, curve.length, 1);
  drawLine(s => curve.XY(s, -0.5), 0, curve.length, 1);
  ctx.setLineDash([2, 4]);
  drawLine(s => curve.XY(s, 4.5), 0, 50, 1);
  drawLine(s => curve.XY(s, 4.5), 200, curve.length, 1);
  drawLine(s => curve.XY(s, -4.5), 0, curve.length, 1);
  ctx.setLineDash([]);
  drawLine(s => curve.XY(s, spline2.Y(s)), 0, 125, 1);
  drawLine(s => curve.XY(s, spline4.Y(s - 125)), 125, curve.length, 1);
  drawLine(s => curve.XY(s, -8.5), 0, curve.length, 1);

  tracks.forEach(track => {
    track.lanes.forEach(lane => {
      lane.cars.forEach(car => {
        drawCar(car);
        //const bc = car.lane.getBaseCoords(car.x, car.v);
        //drawLine(s => curve.XY(bc.x, s), -10, 10, 10);
      });
    });
  });

}, 1000 * delta * 0);