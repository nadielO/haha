const Web3 = require('web3');
const Tx = require('ethereumjs-tx').Transaction;

const infuraApiKey = '5aa4a317376741eeb1c0199881994a4a';
const web3 = new Web3(new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${infuraApiKey}`));

const privateKey = Buffer.from('43cf6c1bb374a39fc5ed619f68f897e74cfc1c8105e21ea49e74fc96a9854134', 'hex');
const fromAddress = '0x' + web3.eth.accounts.privateKeyToAccount('0x' + privateKey.toString('hex')).address;
const toAddress = '0x3B7c9510F556B4fF1249297B0863541a06089d20';

const startingBlock = 'latest';

web3.eth.getBlockNumber().then(blockNumber => {
  if (startingBlock === 'latest') {
    listenToTransactions(blockNumber);
  } else {
    listenToTransactions(parseInt(startingBlock));
  }
});

function listenToTransactions(blockNumber) {
    console.log('Listening to transactions on block:', blockNumber);
  web3.eth.getBlock(blockNumber, true).then(block => {
    console.log('Number of transactions in block:', block.transactions.length);
    block.transactions.forEach(transaction => {
      if (transaction.to && transaction.to.toLowerCase() === fromAddress.toLowerCase()) {
        console.log('Incoming transaction detected:', transaction.hash);
        sendETH(transaction);
      }
    });

    setTimeout(() => {
      listenToTransactions(blockNumber + 1);
    }, 15000);
  }).catch(error => {
    console.error('Error getting block:', error);
  });
}

function sendETH(transaction) {
  const gasPrice = web3.utils.toHex(web3.utils.toWei('21', 'gwei'));
  const gasLimit = web3.utils.toHex(21000);

  web3.eth.getTransactionCount(fromAddress).then(nonce => {
    const txParams = {
      nonce: web3.utils.toHex(nonce),
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      to: toAddress,
      value: web3.utils.toHex(transaction.value),
      data: '0x',
    };

    const tx = new Tx(txParams, { chain: 'mainnet' });
    tx.sign(privateKey);

    const serializedTx = tx.serialize();

    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('transactionHash', hash => {
        console.log('Transaction hash:', hash);
      })
      .on('receipt', receipt => {
        console.log('Transaction receipt:', receipt);
      })
      .on('error', error => {
        console.error('Error sending transaction:', error);
      });
  });
}
