import {expect} from "chai";
import { processIt } from "./process";
const fs = require('fs');

describe("Test passing in a JSON style input", () => {
  it("Process JSON style input", () => {
    const file = fs.readFileSync("./payload.json");
    const input = JSON.parse(file.toString('utf8'));
    const myResult = processIt(input);
    expect(myResult).to.equal(12);
  }),

  it("Process JSON style input", () => {
    const file = fs.readFileSync("./payload.json");
    const input = JSON.parse(file.toString('utf8'));
    const myResult = processIt(input);
    expect(myResult).to.equal(11);
  })
})