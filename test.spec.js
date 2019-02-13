"use strict";
exports.__esModule = true;
var chai_1 = require("chai");
var process_1 = require("./process");
var fs = require('fs');
describe("Test passing in a JSON style input", function () {
    it("Process JSON style input", function () {
        var file = fs.readFileSync("./payload.json");
        var input = JSON.parse(file.toString('utf8'));
        var myResult = process_1.processIt(input);
        chai_1.expect(myResult).to.equal(12);
    });
});
