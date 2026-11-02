function calcAlpha(z: number) {
  const kVuc = Math.max(0, Math.min(1, (0.80 - z) / (0.80 - 0.18)));
  const aVuc = 0.95 * Math.pow(kVuc, 1.2);

  const kChau = Math.max(0, Math.min(1, (0.95 - z) / (0.95 - 0.20)));
  const aChau = 0.92 * Math.pow(kChau, 1.2);

  const kSea = Math.max(0, Math.min(1, (0.75 - z) / (0.75 - 0.18)));
  const aSea = 0.85 * Math.pow(kSea, 1.2);

  return { aVuc, aChau, aSea };
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

const zOut = 0.12;
const rOut = calcAlpha(zOut);
console.log(`Zoom out (${zOut}): Vực = ${rOut.aVuc.toFixed(2)}, Châu = ${rOut.aChau.toFixed(2)}, Biển = ${rOut.aSea.toFixed(2)}`);
assert(rOut.aVuc >= 0.94, 'Zoom out Vực is dark and bold (>= 0.94)');
assert(rOut.aChau >= 0.91, 'Zoom out Châu is dark and bold (>= 0.91)');

const zMid = 0.45;
const rMid = calcAlpha(zMid);
console.log(`Zoom mid (${zMid}): Vực = ${rMid.aVuc.toFixed(2)}, Châu = ${rMid.aChau.toFixed(2)}, Biển = ${rMid.aSea.toFixed(2)}`);
assert(rMid.aVuc < rOut.aVuc, 'Zooming in makes Vực fade');
assert(rMid.aChau < rOut.aChau, 'Zooming in makes Châu fade');

const zIn = 1.0;
const rIn = calcAlpha(zIn);
console.log(`Zoom in (${zIn}): Vực = ${rIn.aVuc.toFixed(2)}, Châu = ${rIn.aChau.toFixed(2)}, Biển = ${rIn.aSea.toFixed(2)}`);
assert(rIn.aVuc === 0, 'Zoom in Vực completely fades out');
assert(rIn.aChau === 0, 'Zoom in Châu completely fades out');

console.log('Map zoom label fade test passed successfully!');
