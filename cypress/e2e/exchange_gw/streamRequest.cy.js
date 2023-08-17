context('Websocket cy.streamRequests() Command', () => {
  before(() => {
    cy.authenticate();
    cy.createCalendarAndSaveId();
    cy.createInstrumentAndSave();
    cy.createMP();
    cy.createAPIKeys();
  });

  it('test placeOrder Buy', () => {
    cy.createExchangeGWSession({
      onMessageReceived: ({ currentMessage, currentQMessagesCount, allReceivedMessages }) => {
        if(currentMessage.q === 'v1/exchange.market/placeOrder') {
          console.log("currrent message" +currentMessage);
        }
      },
      apiKeyData: {
        apiKey: Cypress.env('apiKey'),
        secret: Cypress.env('secret'),
      },
      url: 'wss://sandbox-shared.staging.exberry-uat.io',
    }).then(({ sendMessage, closeConnection }) => {
      const instrument = Cypress.env('instrument');

      sendMessage({
        'd': {
          'orderType': 'Limit',
          'side': 'Buy',
          'quantity': 76.55,
          'price': 10.1234,
          'instrument': instrument.symbol,
          'timeInForce': 'GTC',
          'mpOrderId': String(Date.now()),
        },
        'q': 'v1/exchange.market/placeOrder',
      });

      sendMessage({
        'd': {
          'orderType': 'Limit',
          'side': 'Sell',
          'quantity': 77.55,
          'price': 10.1234,
          'instrument': instrument.symbol,
          'timeInForce': 'GTC',
          'mpOrderId': String(Date.now()),
        },
        'q': 'v1/exchange.market/placeOrder',
      });

      sendMessage({
        'd': {
          'trackingNumber': 0,
        },
        'q': 'v1/exchange.market/executionReports',
      });


      sendMessage({
        'd': {
          'trackingNumber': 0,
        },
        'q': 'v1/exchange.market/trades',
      });
      closeConnection();

    });
  });
});
