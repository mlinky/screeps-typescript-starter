export const SpawnPriority = {

    base: {
        manager: 300,
    },

    cluster: {
        firstTransport: 500,
        // tslint:disable-next-line:object-literal-sort-keys
        firstMiner: 501,
        firstWorker: 502,
        miner: 510,
        transport: 511,
        worker: 512,
        minMiner: 520,
        upgrader: 530
    },

    remote: {
        reserve: 800,
        // tslint:disable-next-line:object-literal-sort-keys
        miner: 801,
        transport: 802,
        worker: 803,
        increment: 5
    },

    maximum: 9999

}
