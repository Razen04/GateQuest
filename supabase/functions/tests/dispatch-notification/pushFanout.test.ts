// Pure-function tests for the shared push fanout helpers.

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { chunkArray, classifyEndpointError } from '../../_shared/pushFanout.ts';

// chunkArray
Deno.test('chunkArray: splits evenly', () => {
    const chunks = chunkArray([1, 2, 3, 4, 5, 6], 2);
    assertEquals(chunks.length, 3);
    assertEquals(chunks[0], [1, 2]);
    assertEquals(chunks[1], [3, 4]);
    assertEquals(chunks[2], [5, 6]);
});

Deno.test('chunkArray: handles remainder', () => {
    const chunks = chunkArray([1, 2, 3, 4, 5], 2);
    assertEquals(chunks.length, 3);
    assertEquals(chunks[0], [1, 2]);
    assertEquals(chunks[1], [3, 4]);
    assertEquals(chunks[2], [5]);
});

Deno.test('chunkArray: handles empty input', () => {
    assertEquals(chunkArray([], 10), []);
});

Deno.test('chunkArray: handles size larger than array', () => {
    assertEquals(chunkArray([1, 2], 100), [[1, 2]]);
});

Deno.test('chunkArray: handles size exactly equal to length', () => {
    assertEquals(chunkArray([1, 2, 3], 3), [[1, 2, 3]]);
});

// classifyEndpointError

Deno.test('classifyEndpointError: 410 is dead', () => {
    assertEquals(classifyEndpointError(410), 'dead');
});

Deno.test('classifyEndpointError: 404 is dead', () => {
    assertEquals(classifyEndpointError(404), 'dead');
});

Deno.test('classifyEndpointError: 429 is retry', () => {
    assertEquals(classifyEndpointError(429), 'retry');
});

Deno.test('classifyEndpointError: 500 is retry', () => {
    assertEquals(classifyEndpointError(500), 'retry');
});

Deno.test('classifyEndpointError: 502 is retry', () => {
    assertEquals(classifyEndpointError(502), 'retry');
});

Deno.test('classifyEndpointError: 400 is ignore', () => {
    assertEquals(classifyEndpointError(400), 'ignore');
});

Deno.test('classifyEndpointError: 401 is ignore', () => {
    assertEquals(classifyEndpointError(401), 'ignore');
});

Deno.test('classifyEndpointError: undefined is ignore', () => {
    assertEquals(classifyEndpointError(undefined), 'ignore');
});
