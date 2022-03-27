import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

let oracles = [];


const ORACLES_COUNT = 20;
// skip first 20 accounts for passengers, airlines and so on..
const ORACLES_OFFSET = 20;

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;
const STATUS_ARRAY  = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER
];

web3.eth.getAccounts((error, accts) => {
  let owner = accts[0];

  flightSuretyData.methods
  .authorizeCaller(config.appAddress)
  .send({from: owner}, (error, result) => {
    if(error)
      console.log(error);
  });

  //register oracles at the start
  flightSuretyApp.methods
  .getOracleRegistrationFee().call({from:owner}, (error, fee) => {
          console.log("oracle fee: " + fee);
          //based from oracles.js test code
          for(let a=ORACLES_OFFSET; a<ORACLES_COUNT + ORACLES_OFFSET; a++) {
              let curr_accts = accts[a];
              flightSuretyApp.methods
              .registerOracle()
              .send({from: curr_accts, value:fee, gas: 5000000, gasPrice: 20000000}, (error, result) =>
              {
                  if(error)
                    console.log(error);
                  else {
                    console.log("registering oracle " + curr_accts + " at " + fee + " ETH");
                    // register the oracles
                    flightSuretyApp.methods
                    .getMyIndexes()
                    .call({from: curr_accts},(error, result) => {
                      if (error) {
                        console.log(error);
                      }
                      else {
                        let oracle = {address: curr_accts, index: result};
                        console.log(`Oracle: ${JSON.stringify(oracle)}`);
                        oracles.push(oracle);
                      }
                    });
                  }
              });
          }
      });
});


// wait for a request sent by user to get an oracle answer..
flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
  console.log(event);
  if (error) {
    console.log(error);
  }
  else {
    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;
    // randomize result to simulate a functioning oracle
    let statusCode = STATUS_ARRAY[Math.floor(Math.random() * STATUS_ARRAY.length)];

    for(let idx=0; idx<oracles.length; idx++) {
      if(oracles[idx].index.includes(index)) {
        flightSuretyApp.methods
        .submitOracleResponse(index, airline, flight, timestamp, statusCode)
        .send({from: oracles[idx].address}, (error, result) => {
          if(error) {
            console.log(error);
          } 
          else {
            console.log('\nOracle-Reply', idx, statusCode, flight, timestamp);
          }
        });
      }
    }
  }
});

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
})

export default app;


