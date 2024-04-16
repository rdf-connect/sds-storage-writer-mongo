import { describe, expect, test } from "@jest/globals";
import { extractProcessors, extractSteps, Source } from "@ajuvercr/js-runner";
const prefixes = `
@prefix js: <https://w3id.org/conn/js#>.
@prefix ws: <https://w3id.org/conn/ws#>.
@prefix : <https://w3id.org/conn#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
`;

function testReader(arg: any) {
  expect(arg).toBeInstanceOf(Object);
  expect(arg.config.channel).toBeDefined();
  expect(arg.config.channel.id).toBeDefined();
  expect(arg.ty).toBeDefined();
}

async function checkProc(location: string, func: string) {
  const mod = await import("file://" + location);
  expect(mod[func]).toBeDefined();
}

test("ingest configuration", async () => {
  const value = `${prefixes}
<> owl:imports <./node_modules/@ajuvercr/js-runner/ontology.ttl>, <./processor.ttl>.

[ ] a :Channel;
  :reader <jr>;
  :writer <jw>.
<jr> a js:JsReaderChannel.
<jw> a js:JsWriterChannel.

[ ] a js:Ingest;
  js:dataInput <jr>;
  js:metadataInput <jr>;
  js:database <http://me.db>;
  js:pageSize 500;
  js:branchSize 3;
  js:minBucketSpan 600.
`;
  const baseIRI = process.cwd() + "/config.ttl";
  console.log(baseIRI);

  const source: Source = {
    value,
    baseIRI,
    type: "memory",
  };

  const { processors, quads, shapes: config } = await extractProcessors(source);
  expect(processors.length).toBe(2);

  const proc = processors[0];
  expect(proc).toBeDefined();

  const argss = extractSteps(proc, quads, config);
  expect(argss.length).toBe(1);
  expect(argss[0].length).toBe(6);

  const [[i, mi, db, pageSize, branchSize, minBucketSpan]] = argss;
  testReader(i);
  testReader(mi);
  expect(db).toBeDefined();
  expect(db).toBe("http://me.db");
  expect(pageSize).toBe(500);
  expect(branchSize).toBe(3);
  expect(minBucketSpan).toBe(600);

  await checkProc(proc.file, proc.func);
});

