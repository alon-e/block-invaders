const Util = require('./util');

const BlockInfo = function() {
    this.options = {
        height: 0,
        difficulty: 0,
        hash: 0,
        total_fees: 0,
        block_reward: 0,
        avg_transaction_sizes: [0, 0, 0]
    };
};

BlockInfo.prototype.fetchData = function() {
    //get tip block
    //fetch transactions
    //total fees
    //bin transactions for score
    //output:
    // - height
    // - difficulty
    // - total fees
    // - (block reward - nice to have)
    // - 3 avg transaction sizes
    fetch("https://blockstream.info/api/" + "blocks/tip")
        .then(r => r.json())
        .then(r => {
            height = r[0]["height"];
            difficulty = r[0]["id"].lastIndexOf("0".repeat(18));
            hash = r[0]["id"]
            return fetch("https://blockstream.info/api/" + "block/" + hash + "/txs")
            .then(r => r.json())
            .then( r => {
                if (!r[0].vin[0]["is_coinbase"]) {
                    console.error("could not find coinbase! hash:" + hash);
                    return
                }
                total_fees = r[0].vout[0].value / 100000000;
                block_reward = 12.5; //NICE TO HAVE - check block height
                l = [];
                for (i = 1; i < r.length; i++) {
                    l.push(
                        (r[i].vin.map(x => x.prevout.value).reduce((x, y) => x + y, 0)
                        - r[i].vout.map(x => x.value).reduce((x, y) => x + y, 0)) / 100000000
                    )
                }
                l.sort();
                avg_transaction_sizes = [l[0], l[l.length / 2], l[l.length - 1]];

                return {
                    height,
                    difficulty,
                    hash,
                    total_fees,
                    block_reward,
                    avg_transaction_sizes
                };
            })
        })
        .then(data => {
            this.options = data;
        });
};

module.exports = BlockInfo;
