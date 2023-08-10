import sha256 from "crypto-js/hmac-sha256";

function bodyRequests(timestamp) {
  const instrument = Cypress.env('instrument');
  expect(instrument).to.exist;

  const messageBuy = {
    "d": {
      "orderType": "Limit",
      "side": "Buy",
      "quantity": 76.55,
      "price": 10.1234,
      "instrument": instrument.symbol,
      "timeInForce": "GTC",
      "mpOrderId": timestamp
    },
    "q": "v1/exchange.market/placeOrder",
    "sid": 1
  };

  const messageSell = {
    "d": {
      "orderType": "Limit",
      "side": "Sell",
      "quantity": 77.55,
      "price": 10.1234,
      "instrument": instrument.symbol,
      "timeInForce": "GTC",
      "mpOrderId": String(Date.now())
    },
    "q": "v1/exchange.market/placeOrder",
    "sid": 2
  };

  const executionReports = {
    "d": {
      "trackingNumber": 0
    },
    "q": "v1/exchange.market/executionReports",
    "sid": 103
  };

  const trades = {
    "d": {
      "trackingNumber": 0
    },
    "q": "v1/exchange.market/trades",
    "sid": 104
  };
  return {messageBuy, messageSell, executionReports, trades};
}

function createSessionBodyRequest() {
  const apiKey = Cypress.env('apiKey');
  const secret = Cypress.env('secret');

  expect(secret).to.exist;
  expect(apiKey).to.exist;

  const timestamp = String(Date.now());
  const signature = sha256(`"apiKey":"${apiKey}","timestamp":"${timestamp}"`, secret).toString();

  const message = {
    "d": {
      "apiKey": apiKey,
      "timestamp": timestamp,
      "signature": signature
    },
    "q": "exchange.market/createSession",
    "sid": 1
  };
  return {timestamp, message};
}

function wsRequests() {
  const {timestamp, message} = createSessionBodyRequest();

  const websocketUrl = 'wss://sandbox-shared.staging.exberry-uat.io';

  cy.initializeWebSocket(websocketUrl).then((socket) => {
    cy.socketRequest(socket, message).then((receivedSessionMessage) => {

      cy.wrap(receivedSessionMessage).should(() => {
        expect(receivedSessionMessage).to.exist;
      }).then(() => {
        expect(receivedSessionMessage.q).to.equal("exchange.market/createSession");
      });

      const {messageBuy, messageSell, executionReports, trades} = bodyRequests(timestamp);

      cy.wait(2000);
      cy.socketRequest(socket, messageBuy).then((receivedBuyMessage) => {

        cy.wrap(receivedBuyMessage).should(() => {
          expect(receivedBuyMessage).to.exist;
        }).then(() => {
          expect(receivedBuyMessage.q).to.equal("v1/exchange.market/placeOrder");
        });
        cy.wait(2000);
        cy.socketRequest(socket, messageSell).then((receivedSellMessage) => {

          cy.wrap(receivedSellMessage).should(() => {
            expect(receivedSellMessage).to.exist;
          }).then(() => {
            expect(receivedSellMessage.q).to.equal("v1/exchange.market/placeOrder");
          });
          cy.socketRequest(socket, executionReports).then((receivedExecutionReportsMessage) => {
            cy.wrap(receivedExecutionReportsMessage).should(() => {
              expect(receivedExecutionReportsMessage).to.exist;
            })
            cy.socketRequest(socket, trades).then((receivedTradesMessage) => {
              cy.wrap(receivedTradesMessage).should(() => {
                expect(receivedTradesMessage).to.exist;
              })
            });
          });
        });
      });
    });
  });
}

describe('Create session and Place Orders', () => {
  it('should create session and place orders', () => {
    cy.authenticate().then(() => {
      cy.createCalendarAndSaveId().then(() => {
        cy.createInstrumentAndSave().then(() => {
          cy.authenticate().then(() => {
            cy.createMP().then(() => {
              cy.createAPIKeys().then(() => {
                wsRequests();
              });
            });
          });
        });
      });
    });
  });
});
