import { createDefaultBoard } from '../src/lib/defaults';
import { calculateRequiredParts } from '../src/lib/lumberPlanner';

const design = createDefaultBoard();
console.log('Design:', design.style, design.dimensions);

const cutList = calculateRequiredParts(design);
console.log('Cut list length:', cutList.length);
console.log('Cut list:', JSON.stringify(cutList, null, 2));
