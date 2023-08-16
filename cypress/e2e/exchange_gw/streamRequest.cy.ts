context("Websocket cy.streamRequests() Command", () => {
  before(() => {
    cy.authenticate();
    cy.createCalendarAndSaveId();
    cy.createInstrumentAndSave();
    cy.createMP();
    cy.createAPIKeys();
  });

  it("create Session", () => {
    const {messageBuy, messageSell, executionReports, trades} = bodyRequests();

    cy.createExchangeGWSession({
      onMessageReceived: ({ currentMessage, currentQMessagesCount, allReceivedMessages }) => {
        // Type annotation with 'any' to handle messages of any type
        const receivedMessage: any = currentMessage;

        console.log("Received message:", receivedMessage);

        if (receivedMessage.q === "v1/exchange.market/executionReports") {
          // Perform specific actions or assertions for execution reports
          console.log("Received an execution report!");
        }

        console.log("Total received messages:", allReceivedMessages);
      },
      apiKeyData: {
        apiKey: Cypress.env('apiKey'),
        secret: Cypress.env('secret')
      },
      url: 'wss://sandbox-shared.staging.exberry-uat.io'
    }).then(({ sendMessage, closeConnection }) => {
      console.log(sendMessage);
      console.log(closeConnection);

    });
  });
});

function bodyRequests() {
  const instrument = Cypress.env('instrument');

  const messageBuy = {
    "d": {
      "orderType": "Limit",
      "side": "Buy",
      "quantity": 76.55,
      "price": 10.1234,
      "instrument": instrument.symbol,
      "timeInForce": "GTC",
      "mpOrderId": String(Date.now())
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