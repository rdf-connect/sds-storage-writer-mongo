import { describe, expect, test } from "vitest";
import { extractProcessors, extractSteps, Source } from "@rdfc/js-runner";
const prefixes = `
@prefix js: <https://w3id.org/conn/js#>.
@prefix ws: <https://w3id.org/conn/ws#>.
@prefix : <https://w3id.org/conn#>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
`;

describe("SDS storage writer tests", () => {
    test("ingest configuration", async () => {
        const value = `${prefixes}
  <> owl:imports <./node_modules/@rdfc/js-runner/ontology.ttl>, <./processor.ttl>.
  
  [ ] a :Channel;
    :reader <jr>;
    :writer <jw>.
  <jr> a js:JsReaderChannel.
  <jw> a js:JsWriterChannel.
  
  [ ] a js:Ingest;
    js:dataInput <jr>;
    js:metadataInput <jr>;
    js:database [
      js:url <http://me.db>;
      js:metadata "meta";
      js:data "data";
      js:index "index";
    ].
  `;
        const baseIRI = process.cwd() + "/config.ttl";
        console.log(baseIRI);

        const source: Source = {
            value,
            baseIRI,
            type: "memory",
        };

        const { processors, quads, shapes: config } = await extractProcessors(source);
        expect(processors.length).toBe(1);

        const proc = processors[0];
        expect(proc).toBeDefined();

        const argss = extractSteps(proc, quads, config);
        expect(argss.length).toBe(1);
        expect(argss[0].length).toBe(3);

        const [[i, mi, db]] = argss;
        testReader(i);
        testReader(mi);
        expect(db).toBeDefined();
        expect(db.url).toBe("http://me.db");
        expect(db.index).toBe("index");
        expect(db.metadata).toBe("meta");
        expect(db.data).toBe("data");

        await checkProc(proc.file, proc.func);
    });
});

function testReader(arg: any) {
    expect(arg).toBeInstanceOf(Object);
    expect(arg.ty).toBeDefined();
    expect(arg.config.channel).toBeDefined();
    expect(arg.config.channel.id).toBeDefined();
}

async function checkProc(location: string, func: string) {
    const mod = await import("file://" + location);
    expect(mod[func]).toBeDefined();
}
