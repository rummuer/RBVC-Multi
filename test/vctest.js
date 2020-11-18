const vc = artifacts.require('vc');
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
const w = require('web3-utils');
const v = require('web3')
let result = "disagreed";
contract('vc', (accounts) => {
    let v;
    let n = accounts.length - 1; // number of workers
    let p = 0; // percentage of lazy workers
    let mNum = (p * n) / 100; //number of lazy workers
    let hNum = n - mNum; // number of honest workers
    var Worker = [];
    for (var i = 0; i < hNum; i++) {
        Worker[i] = {
            address: accounts[i + 1],
            Ran: 10,
            RanCommit: "0x1a192fabce13988b84994d4296e6cdc418d55e2f1d7f942188d4040b94fc57ac",
            ISH: "0x1a192fabce13988b84994d4296e6cdc418d55e2f1d7f942188d4040b94fc57ac"
        };
    }
    for (var i = hNum; i < n; i++) {
        Worker[i] = {
            address: accounts[i + 1],
            Ran: 11,
            RanCommit: "0x7880aec93413f117ef14bd4e6d130875ab2c7d7d55a064fac3c2f7bd51516380",
            ISH: "0x1a192fabce13988b84994d4296e6cdc418d55e2f1d7f942188d4040b94fc57ad"
        };
    }
    var sorted = [];
    var size = Worker.length;
    var j;

    for (var i = 0; i < size; i++) {
        var min = 0;
        var max = Worker.length;
        j = Math.floor(Math.random() * (+max - +min)) + +min;
      //  console.log("random=" + j + "  " + "size=" + Worker.length);
        sorted[i] = Worker[j];
        Worker.splice(j, 1);
    }
   // console.log(sorted);

    Worker = sorted;

    it("contract created", async () => {
        v = await vc.new({ from: accounts[0] });
           });

    it("job created", async () => {
      let a1=  await v.createJob(10, 20, { from: accounts[0], value: 10000000000000000000 });
      console.log("create"+a1.receipt.gasUsed);
    });
    it("Intent", async () => {
        for (i = 1; i < accounts.length; i++) {
            var wAddress = Worker[i - 1].address;
            let ranCommit = Worker[i - 1].RanCommit;
            a1= await v.showIntent(ranCommit, { from: wAddress, value: 10000000000000000000 });
             }
             console.log("intent"+a1.receipt.gasUsed);
    });
    let c;
    let r = 0;
    describe('round 1', function() {
        r++;
        it("compute success", async () => {
            c = await v.compute("salt");
           console.log("compute="+c.receipt.gasUsed);
            // truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
            console.log("commit="+d.receipt.gasUsed);
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
            console.log("reveal="+e.receipt.gasUsed);
        });
        it("Check success", async () => {
            let e = await v.check();
            console.log("Check="+e.receipt.gasUsed);
        });
        let p1;
        it("Payout Success", async () => {
            p1 = await v.payout();
            result = p1.logs[0].args.c
            console.log(result);
            console.log("payout="+p1.receipt.gasUsed);
        });
    })
    console.log(result);
    /*
    describe('round 2', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            //  truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
    describe('round 3', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            // truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
  /*  describe('round 4', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            // truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
    describe('round 5', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            // truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
    describe('round 6', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            // truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
    describe('round 7', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            //  truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
    describe('round 8', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            //truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
    describe('round 9', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            //  truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) 
    describe('round 10', function() {
        it("compute success", async () => {
            c = await v.compute("salt");
            //  truffleAssert.prettyPrintEmittedEvents(c);
        });

        it("worker committed", async () => {
            r++;
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    var comValue = w.keccak256(Worker[i].ISH, Worker[i].Ran);
                    d = await v.commitISH(comValue, {
                        from: c.logs[i].args._worker_address,
                    });
                }
            }
        });
        it("worker revealed", async () => {
            for (var i = 0; i < c.logs.length; i++) {
                if (c.logs[i].args._selected == true && c.logs[i].args.round == r) {
                    e = await v.revealISH(Worker[i].ISH, Worker[i].Ran.toString(), {
                        from: c.logs[i].args._worker_address
                    });
                }
            }
        });
        it("Check success", async () => {
            let e = await v.check();

        });
        let p1;
        it("Payout Success", async () => {
            let payout = await v.payout();
            // truffleAssert.prettyPrintEmittedEvents(p1);
        });
    }) */
});