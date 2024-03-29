import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
var BigNumber = require('bignumber.js');


export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.airlines = [];
        this.fundedAirlines = [];
        this.flights = [];
        this.passengers = [];
        this.oracles = [];

        this.appAddress = config.appAddress;
    }


    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            let self = this;
            // authorize owner
            this.owner = accts[0];
            self.flightSuretyData.methods
            .authorizeCaller(this.appAddress)
            .send({from: this.owner}, (error, result) => {
              if(error)
                console.log(error);
              else
                console.log("owner authorized");
            });

            console.log("Owner: " + this.owner);
            console.log("appAddress: " + this.appAddress);
            let counter = 1;

            this.airlines.push(self.appAddress);
            while(this.airlines.length < 2) {
                let curr_accts = accts[counter++]

                self.flightSuretyApp.methods
                .registerAirline(curr_accts, "airline" + (counter))
                .send({from: this.owner, gas: 5000000, gasPrice: 20000000}, (error, result) => {
                });
                this.airlines.push(curr_accts);
                this.fund(curr_accts,10);
                this.fundedAirlines.push(curr_accts);
            }

            while(this.passengers.length < 2) {
                this.passengers.push(accts[counter++]);
            }

                this.updateDataLists('funded-airline', this.airlines);
                this.updateDataLists('passenger-insurance', this.passengers);
                this.updateDataLists('passenger-purchase', this.passengers);
                this.updateDataLists('passenger-withdraw', this.passengers);
                this.updateDataLists('flights-insurance', this.flights);
                this.updateDataLists('flight-oracle', this.flights);
                this.updateDataLists('flights-withdraw', this.flights);
                callback();

                });

        }

        updateDataLists(elements, listings){
            var box = document.getElementById(elements);
            while(box.firstChild)
                box.removeChild(box.lastChild);

            listings.forEach(function(item){
                var option = document.createElement('option');
                option.value = item;
                box.appendChild(option);
            });
        }

        async registerAirline(airline, name, callback){
            let self = this;

            let payload = {
                airlineAddress: airline,
                name: name,
                sender: self.owner
            };

            console.log("payload.airlineAddress:", payload.airlineAddress);
            console.log("payload.name:", payload.name);
            console.log("payload.sender:", payload.sender);
            console.log("Owner: " + this.owner);
            console.log("appAddress: " + this.appAddress);

                self.flightSuretyApp.methods
                .registerAirline(payload.airlineAddress, payload.name)
                .send({from: this.owner, gas: 5000000, gasPrice: 20000000}, (error, result) => {
                    console.log(error);

                    self.airlines.push(payload.airlineAddress);
                    for(let i = 0; i < self.airlines.length; i++)
                    {
                        console.log( (i+1) + ".th airline " + self.airlines[i]);
                    }

                    if (error)
                    {
                        console.log(error);
                        callback(error,payload);
                    }
                    else
                    {
                        this.updateDataLists('funded-airline', this.airlines);
                        self.flightSuretyApp.methods.getAirlineCounts().call({from:this.owner}, (error, result) => {
                            console.log("Airline Count: " + result);
                        });
                        callback(error,payload);
                    }
                });
        }

        async fund(airline, fund, callback){
            let self = this;
            let fund_wei = this.web3.utils.toWei(fund.toString(), "ether");

            console.log("fund_eth: " + fund);
            console.log("fund_wei:" + fund_wei);

            let payload = {
                airlineAddress: airline,
                fund: fund_wei,
                sum: -10
            };

            self.flightSuretyData.methods
                .fund()
                .send({from: payload.airlineAddress, value: fund_wei}, (error, result) => {
                    if (error)
                    {
                        console.log("fund error " +  error);
                        callback(error,payload);
                    }
                    else
                    {
                        this.updateDataLists('flights-airline', this.airlines);

                        self.flightSuretyData.methods
                        .getFunds(payload.airlineAddress)
                        .call((error, result) => {
                            payload.sum = result;
                            console.log("addresses: " + payload.airlineAddress);
                            console.log("Sum Fund: " + payload.sum);
                            if(callback)callback(error, payload);
                        });

                    }
                });
        }

        async registerFlight(airline, flight, destination, callback){
            let self = this;

            let payload = {
                airlineAddress: airline,
                destination: destination,
                flight: flight,
                timestamp: Math.floor(Date.now() / 1000)
            };

            self.flightSuretyApp.methods
                .registerFlight(payload.airlineAddress, payload.flight, payload.destination, payload.timestamp)
                .call({from: payload.airlineAddress}, (error, result) => {
                    if (error)
                    {
                        console.log("fund error " +  error);
                        callback(error,payload);
                    }
                    else
                    {
                        
                        self.flights.push([payload.flight,'@', payload.timestamp].join(''));
                        this.updateDataLists('flights-insurance', this.flights);
                        this.updateDataLists('flight-oracle', this.flights);
                        this.updateDataLists('flights-withdraw', this.flights);
                        console.log("flight registration successful!");
                        console.log("Fligt_Registration", payload.airlineAddress, payload.flight, payload.timestamp);
                        callback(error, payload);
                    }
                });
        }

        async purchaseInsurance(passenger, flight, amount, callback) {
            let self = this;
            let amount_wei = this.web3.utils.toWei(amount.toString(), "ether");

            let payload = {
                passenger : passenger,
                flight : flight,
                fund : amount_wei,
                insurance: "0"
            };

            self.flightSuretyData.methods
                .buy(payload.flight)
                .send({from: payload.passenger, value: payload.fund, gas: 5000000, gasPrice: 20000000}, (error, result) => {
                    if (error)
                    {
                        console.log("flight: " + payload.flight);
                        console.log("passenger: " + payload.passenger);
                        console.log("fund: " + payload.fund);
                        console.log("error while purchasing insurance: " +  error);
                        callback(error, payload);
                    }
                    else
                    {
                        console.log("insurance purchased!");

                        self.flightSuretyData.methods
                            .getInsurance(flight, passenger)
                            .call((error, result) => {
                                if (error)
                                    console.log("Error: ", error);

                                payload.insurance = result;
                                payload.flight = flight;
                                console.log("passenger: ", payload.passenger);
                                console.log("flight: ", payload.flight);
                                console.log("insurance: ", payload.insurance);
                                callback(error, payload);
                            });
                    }
                });
        }


        async checkInsurance(passenger, flight, callback) {
            let self = this;

            let payload = {
                passenger : passenger,
                flight : flight,
                insurance: "0"
            };

            self.flightSuretyData.methods
                .getInsurance(flight, passenger)
                .call((error, result) => {
                    if (error)
                        console.log("Error: ", error);

                    payload.insurance = result;
                    console.log("purchased amount: ", result);
                    document.getElementById("show-insurance").value = result;
                    callback(error, payload);
                });
        }

        async withdraw(passenger, flight, callback) {
            let self = this;

            let payload = {
                passenger : passenger,
                flight : flight,
                credit: "0"
            };

            self.flightSuretyData.methods
                .pay()
                .call((error, result) => {
                    if(!error)
                    {
                        callback(error, payload);
                    }
                });
        }

        isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
                .isOperational()
            .call({ from: self.owner}, callback);
        }

        fetchFlightStatus(flightAndTime, callback) {
            let self = this;
            let data = flightAndTime.split('@');
            let payload = {
                airline: self.airlines[0],
                flight: data[0],
                timestamp: data[1]
            };
            console.log("fetchFlightStatus");
            console.log("airline: ", payload.airline);
            console.log("flight: ", payload.flight);
            console.log("timestamp: ", payload.timestamp);

            self.flightSuretyApp.methods
                .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
                .send({ from: self.owner}, (error, result) => {
                    callback(error, payload);
                });
        }

    }
