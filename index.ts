import PolyCurve from './curve/polycurve';
import Line from './curve/line';
import Clothoid from './curve/clothoid';
import BezierCurve from './curve/beziercurve';
import Spline from './spline';
import Arc from './curve/arc';
import Car, { LCDirection } from './car';
import Track from './track';
import Lane from './lane';
import MergeController from './controller/mergectrl';
import DivergeController from './controller/divergectrl';
import Road from './road';
import drawRoad from './drawroad';
import ConflictArea from './conflictarea';

const delta = 0.05;// 0.025;

let canv = <HTMLCanvasElement> document.getElementById("canvas");
let ctx = canv.getContext("2d");

ctx.transform(4, 0, 0, 4, 20, 20);

//const curve = PolyCurve.parseCurve([0, 0, 0, 'l', 100, 'c', 50, 0, 0.02, 'a', 100, 0.02, 'c', 50, 0.02, -0.05]);
//const curve = PolyCurve.parseCurve([0, 0, 0, 'l', 50, 'b', 50, 0, 50, 50, 'l', 80]);
//const curve = new Line(0, 0, 300, 0);
//const curve = new Arc(200, 50, 50, 0, 1, 50 * 2 * Math.PI);
//const curve = new Line(300, 25, 0, 25);

// DO SHIT

const curveWE = new Line(0, 75, 300, 75);
const curveNS = new Line(150, 0, 150, 150);
const curveNW = new BezierCurve([150, 60], [150, 75], [135, 75]);
const curveNE = new BezierCurve([150, 60], [150, 75], [165, 75]);
const curveSW = new BezierCurve([150, 90], [150, 75], [135, 75]);
const curveSE = new BezierCurve([150, 90], [150, 75], [165, 75]);

const roadE = new Road(curveWE, 165, 300, [-3, -7], [-3, -7]);
const roadN = new Road(curveNS, 0, 60, [-3, -7], [-3, -7]);
const roadW = new Road(curveWE, 0, 135, [-3, -7], [-3, -7]);
const roadS = new Road(curveNS, 90, 150, [-3, -7], [-3, -7]);
const roadNW = new Road(curveNW, 0, curveNW.length, [-3], [-7]);
const roadNE = new Road(curveNE, 0, curveNE.length, [-7], [-3]);
const roadSW = new Road(curveSW, 0, curveNW.length, [-7], [-3]);
const roadSE = new Road(curveSE, 0, curveNE.length, [-3], [-7]);
const roadWE = new Road(curveWE, 135, 165, [-3, -7], [-3, -7]);
const roadNS = new Road(curveNS, 60, 90, [-3, -7], [-3, -7]);

for (let j=0; j<4; j++) {
  for (let i=0; i<4; i++) new Car(roadE.tracks[j % 2].lanes[j - (j % 2)], 10*i, 0);
  for (let i=0; i<2; i++) new Car(roadN.tracks[j % 2].lanes[j - (j % 2)], 10*i, 0);
  for (let i=0; i<4; i++) new Car(roadW.tracks[j % 2].lanes[j - (j % 2)], 10*i, 0);
  for (let i=0; i<2; i++) new Car(roadS.tracks[j % 2].lanes[j - (j % 2)], 10*i, 0);
}

const roads = [roadE, roadN, roadW, roadS, roadNW, roadNE, roadSW, roadSE, roadWE, roadNS];

// NS Wrap
roadS.tracks[0].connectTo(roadN.tracks[0], [[0, 0], [2, 2]]);
roadN.tracks[1].connectTo(roadS.tracks[1], [[0, 0], [2, 2]]);
// WE Wrap
roadE.tracks[0].connectTo(roadW.tracks[0], [[0, 0], [2, 2]]);
roadW.tracks[1].connectTo(roadE.tracks[1], [[0, 0], [2, 2]]);
// North -> South
roadN.tracks[0].connectTo(roadNS.tracks[0], [[0, 0], [2, 2]]);
roadNS.tracks[0].connectTo(roadS.tracks[0], [[0, 0], [2, 2]]);
// South -> North
roadS.tracks[1].connectTo(roadNS.tracks[1], [[0, 0], [2, 2]]);
roadNS.tracks[1].connectTo(roadN.tracks[1], [[0, 0], [2, 2]]);
// West -> East
roadW.tracks[0].connectTo(roadWE.tracks[0], [[0, 0], [2, 2]]);
roadWE.tracks[0].connectTo(roadE.tracks[0], [[0, 0], [2, 2]]);
// East -> West
roadE.tracks[1].connectTo(roadWE.tracks[1], [[0, 0], [2, 2]]);
roadWE.tracks[1].connectTo(roadW.tracks[1], [[0, 0], [2, 2]]);
// West -> North
roadW.tracks[0].connectTo(roadNW.tracks[1], [[2, 0]]);
roadNW.tracks[1].connectTo(roadN.tracks[1], [[0, 2]]);
// West -> South
roadW.tracks[0].connectTo(roadSW.tracks[1], [[0, 0]]);
roadSW.tracks[1].connectTo(roadS.tracks[0], [[0, 0]]);
// East -> North
roadE.tracks[1].connectTo(roadNE.tracks[1], [[0, 0]]);
roadNE.tracks[1].connectTo(roadN.tracks[1], [[0, 0]]);
// East -> South
roadE.tracks[1].connectTo(roadSE.tracks[1], [[2, 0]]);
roadSE.tracks[1].connectTo(roadS.tracks[0], [[0, 2]]);
// North -> East
roadN.tracks[0].connectTo(roadNE.tracks[0], [[2, 0]]);
roadNE.tracks[0].connectTo(roadE.tracks[0], [[0, 2]]);
// North -> West
roadN.tracks[0].connectTo(roadNW.tracks[0], [[0, 0]]);
roadNW.tracks[0].connectTo(roadW.tracks[1], [[0, 0]]);
// South -> East
roadS.tracks[1].connectTo(roadSE.tracks[0], [[0, 0]]);
roadSE.tracks[0].connectTo(roadE.tracks[0], [[0, 0]]);
// South -> West
roadS.tracks[1].connectTo(roadSW.tracks[0], [[2, 0]]);
roadSW.tracks[0].connectTo(roadW.tracks[1], [[0, 2]]);

const ca = new ConflictArea(roads);

let cursorX = 0, cursorY = 0;

setInterval(() => {

  ctx.clearRect(-100, -100, 1000, 1000);

  roads.forEach(r => r.resetConditions());
  ca.resetConditions();
  roads.forEach(r => r.calculateConditions());
  ca.calculateConditions();
  roads.forEach(r => r.step(delta));

  ctx.lineWidth = 0.2;
  ctx.strokeStyle = 'black';
  roads.forEach(r => drawRoad(ctx, r));
  //ca.draw(ctx);

  /*ctx.strokeStyle = 'green';
  for (const car of roadNW.tracks[0].lanes[0].incomingCars(0, 'lane', 100)) {
    const p = car.XY();
    ctx.beginPath();
    ctx.arc(p[0], p[1], 1, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
  }*/

}, 1000 * delta * 0.25);

function choose(...items)
{
  return items[Math.floor(items.length * Math.random())];
}

document.onmousemove = function(e){
  cursorX = (e.pageX - 20) / 4;
  cursorY = (e.pageY - 20) / 4;
}

/*window.addEventListener('keydown', (event) => {
  const dir = (event.keyCode == 65);
  for (let i=0; i<50; i++) {
    const cars = road.tracks[0].lanes[dir ? choose(2) : choose(0)].cars;
    if (cars.length == 0) continue;
    const car = cars[Math.floor(cars.length * Math.random())];
    car.changeLanes(dir ? LCDirection.Right : LCDirection.Left);
    break;
  }
});*/

const ind = [[8, 3], [8, 3], [4, 7], [4, 7], [6, 1], [6, 1], [2, 5], [2, 5], [2, 7], [8, 1], [2, 3], [4, 1], [6, 7], [8, 5], [5, 4], [3, 6]];

function conflicts(r1, r2)
{
  if (r1[0] == r2[0]) return false;
  if (r1[1] == r2[1]) return true;
  let arr = [
    { a: 0, b: r1[0] },
    { a: 0, b: r1[1] },
    { a: 1, b: r2[0] },
    { a: 1, b: r2[1] }
  ];
  arr.sort((a, b) => a.b - b.b);
  return arr[0].a == arr[2].a;
}

function getMap()
{
  return ind.map(r1 => ind.map(r2 => conflicts(r1, r2) ? 'X' : '-').join(''));
}

//console.log(JSON.stringify(getMap()));