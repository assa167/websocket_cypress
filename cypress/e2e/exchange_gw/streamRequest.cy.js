context('Websocket cy.streamRequests() Command', () => {
  before(() => {
    cy.authenticate();
    cy.createCalendarAndSaveId();
    cy.createInstrumentAndSave();
    cy.createMP();
    cy.createAPIKeys();
    Cypress.config('defaultCommandTimeout', 40000);
  });
  const url = 'wss://sandbox-shared.staging.exberry-uat.io';
  let config;
  let results;
  let streamTimeout = 100000;

  it('create session', () => {

    cy.createExchangeGWSession({
      onMessageReceived: ({ currentMessage, currentQMessagesCount, allReceivedMessages }) => {
        results = {
          currentMessage: currentMessage,
          currentQMessagesCount: currentQMessagesCount,
          allReceivedMessages: allReceivedMessages,
        };

        console.log({ results });
      },
      apiKeyData: {
        apiKey: Cypress.env('apiKey'),
        secret: Cypress.env('secret'),
      },
      url: url,
    }).then(({ sendMessage, closeConnection }) => {
        config = {
          url: url,
          serializer: sendMessage,
        };
      },
    );
  });

  it('test placeOrder Buy', () => {
    const instrument = Cypress.env('instrument');

    let options = {
      retryUntilFn: (currentMessage, currentQMessagesCount, allReceivedMessages) => {
        return currentMessage && currentQMessagesCount && allReceivedMessages &&
          currentMessage.q === 'v1/exchange.market/placeOrder' &&
          currentMessage.sid === 2 &&
          currentQMessagesCount === 2 &&
          allReceivedMessages['v1/exchange.market/placeOrder'].length === 2;
      },
      startUpMessage: {
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
      },
    };

    cy.wrap(null, { timeout: streamTimeout }).then(() => cy.streamRequest(config, options)).then(() => {
      cy.wrap(null, { timeout: streamTimeout * 2 }).should(() => {
        expect(results).to.not.be.undefined;
        expect(results.currentQMessagesCount).to.equal(2);
        expect(results.allReceivedMessages['v1/exchange.market/placeOrder'].length).to.equal(2);

        const placeOrderReports = results.allReceivedMessages['v1/exchange.market/placeOrder'];

        const firstPlaceOrderReport = placeOrderReports[0];
        expect(firstPlaceOrderReport.sid).to.equal(2);

        const secondPlaceOrderReport = placeOrderReports[1];
        expect(secondPlaceOrderReport.sid).to.equal(2);

      });
    });
  });

  it('test placeOrder Sell', () => {
    const instrument = Cypress.env('instrument');

    let options = {
      retryUntilFn: (currentMessage, currentQMessagesCount, allReceivedMessages) => {
        return currentMessage && currentQMessagesCount && allReceivedMessages &&
          currentMessage.q === 'v1/exchange.market/placeOrder' &&
          currentMessage.sid === 3 &&
          currentQMessagesCount === 4 &&
          allReceivedMessages['v1/exchange.market/placeOrder'].length === 4;
      },
      startUpMessage: {
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
      },
    };

    cy.wrap(null, { timeout: streamTimeout }).then(() => cy.streamRequest(config, options)).then(() => {
      cy.wrap(null, { timeout: streamTimeout * 4 }).should(() => {
        expect(results).to.not.be.undefined;
        expect(results.currentQMessagesCount).to.equal(4);
        expect(results.allReceivedMessages['v1/exchange.market/placeOrder'].length).to.equal(4);

        const placeOrderReports = results.allReceivedMessages['v1/exchange.market/placeOrder'];

        const firstPlaceOrderReport = placeOrderReports[2];
        expect(firstPlaceOrderReport.sid).to.equal(3);

        const secondPlaceOrderReport = placeOrderReports[3];
        expect(secondPlaceOrderReport.sid).to.equal(3);
      });
    });
  });

  it('test execution reports', () => {
    const instrument = Cypress.env('instrument');

    let options = {
      retryUntilFn: () => {
        return currentMessage && currentQMessagesCount && allReceivedMessages &&
          currentMessage.q === 'v1/exchange.market/executionReports' &&
          currentMessage.sid === 4 &&
          currentQMessagesCount === 4 &&
          allReceivedMessages['v1/exchange.market/executionReports'].length === 4;
      },
      startUpMessage: {
        'd': {
          'trackingNumber': 0,
        },
        'q': 'v1/exchange.market/executionReports',
      },
    };

    cy.wrap(null, { timeout: streamTimeout }).then(() => cy.streamRequest(config, options)).then(() => {
      cy.wrap(null, { timeout: streamTimeout }).should(() => {
        expect(results).to.not.be.undefined;
        expect(results.currentQMessagesCount).to.equal(4);
        expect(results.allReceivedMessages['v1/exchange.market/executionReports']).to.have.lengthOf(4);

        const executionReports = results.allReceivedMessages['v1/exchange.market/executionReports'];

        const firstReport = executionReports[0].d;
        expect(firstReport.eventId).to.equal(1);
        expect(firstReport.filledQuantity).to.equal(0);
        expect(firstReport.instrument).to.equal(instrument.symbol);
        expect(firstReport.marketModel).to.equal('T');
        expect(firstReport.messageType).to.equal('Add');
        expect(firstReport.side).to.equal('Buy');

        const secondReport = executionReports[1].d;
        expect(secondReport.messageType).to.equal('Executed');
        expect(secondReport.orderId).to.equal(1);
        expect(secondReport.side).to.equal('Buy');

        const thirdReport = executionReports[2].d;
        expect(thirdReport.messageType).to.equal('Executed');
        expect(thirdReport.orderId).to.equal(2);
        expect(thirdReport.side).to.equal('Sell');

        const fourthReport = executionReports[3].d;
        expect(fourthReport.messageType).to.equal('Add');
        expect(fourthReport.orderId).to.equal(2);
        expect(fourthReport.side).to.equal('Sell');
      });
    });
  });

  it('test trades', () => {
    const instrument = Cypress.env('instrument');

    let options = {
      retryUntilFn: () => {
        return currentMessage && currentQMessagesCount &&
          currentMessage.q === 'v1/exchange.market/trades' &&
          currentMessage.sid === 5 &&
          currentQMessagesCount === 2 &&
          allReceivedMessages['v1/exchange.market/trades'].length === 2;
      },
      startUpMessage: {
        'd': {
          'trackingNumber': 0,
        },
        'q': 'v1/exchange.market/trades',
      },
    };

    cy.wrap(null, { timeout: streamTimeout }).then(() => cy.streamRequest(config, options)).then(() => {
      cy.wrap(null, { timeout: streamTimeout }).should(() => {
        expect(results).to.not.be.undefined;
        expect(results.currentQMessagesCount).to.equal(2);
        expect(results.allReceivedMessages['v1/exchange.market/trades'].length).to.equal(2);

        const trades = results.allReceivedMessages['v1/exchange.market/trades'];

        const firstTrade = trades[0].d;
        expect(firstTrade.actionType).to.equal('MatchedTrade');
        expect(firstTrade.eventId).to.equal(2);
        expect(firstTrade.instrument).to.equal(instrument.symbol);
        expect(firstTrade.makerTaker).to.equal('Maker');

        const secondTrade = trades[1].d;
        expect(secondTrade.actionType).to.equal('MatchedTrade');
        expect(secondTrade.eventId).to.equal(2);
        expect(secondTrade.instrument).to.equal(instrument.symbol);
        expect(secondTrade.makerTaker).to.equal('Taker');
      });
    });
  });
});
