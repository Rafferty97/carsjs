import Road from './road';
import Car from './car';

function drawLine(ctx, p: (n: number) => [number, number], s1: number, s2: number, ds: number)
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

function drawCar(ctx, car: Car)
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

export default function drawRoad(ctx, road: Road)
{
  road.tracks.forEach(track => {
    track.lanes.forEach(lane => {
      if (!lane.lc) {
        drawLine(ctx, s => lane.getXYfromBaseX(s), 0, track.x2 - track.x1, 1);
      }
      lane.cars.forEach(car => {
        drawCar(ctx, car);
      });
    });
  });
}