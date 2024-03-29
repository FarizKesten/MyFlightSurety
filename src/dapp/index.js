
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;
    let contract = new Contract('localhost', () => {

        contract.flightSuretyApp.events.FlightStatusInfo({fromBlock: 0}, function (error, event){
            if (error) console.log(error)
            else
            {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: event + ' ' + event.returnValues.flight + ' ' + event.returnValues.timestamp} ]);
            }
        });

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        // User-submitted transaction
        DOM.elid('register-airline').addEventListener('click', async() => {
            let airline = DOM.elid('registered-airline').value;
            let name = DOM.elid('registered-name').value;

            // register airline
            contract.registerAirline(airline, name, (error, result) => {
                display('Airlines', 'register airlines', [{label: 'airline registered', error: error, value:result.airlineAddress + ' : ' +  result.name}]);
            });
        });

        DOM.elid('fund-airline').addEventListener('click', async() => {
            let airline = DOM.elid('chosen-airline-to-fund').value;
            let fund = DOM.elid('fund').value;

            // fund airline
            contract.fund(airline, fund, (error, result) => {
                display('Airlines', 'fund airlines', [{label: 'fund airlines', error: error, value:result.airlineAddress + ' : ' +  result.fund + ' : ' +  result.sum.toString()}]);
            });
        });

        DOM.elid('register-flight').addEventListener('click', async() => {
            let flight = DOM.elid('flight-number').value;
            let destination = DOM.elid('destination').value;
            let airline = DOM.elid('airline-address').value;

            // register flight
            contract.registerFlight(airline, flight, destination, (error, result) => {
                display('Flights', 'register flight', [{label: 'register flight', error: error, value:result.flight + ' : ' +  result.destination}]);
            });
        });

        DOM.elid('purchase').addEventListener('click', async() => {
            let passenger = DOM.elid('passenger-ins').value;
            let flight = DOM.elid('flight-ins').value;
            let amount = DOM.elid('insurance').value;

            // purchase insurance for a flight
            contract.purchaseInsurance(passenger, flight, amount, (error, result) => {
                display('Passenger', 'purchase insurance', [{label: 'purchase insurance', error: error, value:result.passenger + ' : ' +  result.flight + ' : ' +  result.insurance}]);
            });
        });

        DOM.elid('ShowPurchase').addEventListener('click', async() => {
            let passenger = DOM.elid('passenger-check').value;
            let flight = DOM.elid('flight-check').value;

            // purchase insurance for a flight
            contract.checkInsurance(passenger, flight, (error, result) => {
                display('Passenger', 'show insurance', [{label: 'show insurance', error: error, value:result.passenger + ' : ' +  result.flight + ' : ' +  result.insurance}]);
            });
        });


        DOM.elid('Withdraw').addEventListener('click', async() => {
            let passenger = DOM.elid('passenger-claim').value;
            let flight = DOM.elid('flight-claim').value;

            // purchase insurance for a flight
            contract.withdraw(passenger, flight, (error, result) => {
                if(error)
                {
                    console.log(error);
                    alert("Error! Could not withdraw the credit.");
                }
                else
                {
                    display('Passenger', 'compensated', [{label: 'withdrawn:', error: error, value:result.passenger + ' : ' +  result.flight + ' : ' +  result.compensation}]);
                }
            });
        });

        DOM.elid('check-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight').value;

            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });

    });
})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    });
    displayDiv.append(section);
}

