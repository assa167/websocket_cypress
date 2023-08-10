const basicURL = "https://admin-api-shared.staging.exberry-uat.io";

Cypress.Commands.add('authenticate', () => {
  const requestBody = {
    "email": "qacandidate@gmail.com",
    "password": "p#xazQI!Y%z^L34a#"
  };

  cy.request('POST', basicURL + '/api/auth/token', requestBody)
    .then((response) => {
      Cypress.env('authTokenObject', response.body);
      Cypress.env('authToken', response.body.token);
    });
});

Cypress.Commands.add('createCalendarAndSaveId', () => {
  const authToken = Cypress.env('authToken');

  const uniqueName = `D_${Date.now()}`;

  const requestBody = {
    "tradingDays": [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY"
    ],
    "name": uniqueName,
    "timeZone": "+01:00"
  };

  cy.request({
    method: 'POST',
    url: basicURL + '/api/v2/calendars',
    body: requestBody,
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  }).then((response) => {
    Cypress.env('calendar', response.body);
    Cypress.env('calendarId', response.body.id);
  });
});

Cypress.Commands.add('createInstrumentAndSave', () => {
  const authToken = Cypress.env('authToken');
  const calendarId = Cypress.env('calendarId');

  const uniqueName = `D${Date.now()}`;

  const requestBody = {
    "symbol": uniqueName,
    "quoteCurrency": "USD",
    "calendarId": calendarId,
    "pricePrecision": "6",
    "quantityPrecision": "2",
    "minQuantity": "1",
    "maxQuantity": "100000",
    "activityStatus": "ACTIVE",
    "description": "Instrument",
  };

  cy.request({
    method: 'POST',
    url: basicURL + '/api/v2/instruments',
    body: requestBody,
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  }).then((response) => {
    Cypress.env('instrument', response.body);
  });
});

Cypress.Commands.add('createMP', () => {
  const authToken = Cypress.env('authToken');

  const uniqueName = `D${Date.now()}`;
  const uniqueCompId = `S${Date.now()}`;

  const requestBody = {
    "name": uniqueName,
    "compId": uniqueCompId
  };

  cy.request({
    method: 'POST',
    url: basicURL + '/api/mps',
    body: requestBody,
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  }).then((response) => {
    Cypress.env('mp', response.body);
    Cypress.env('mpId', response.body.id);
  });
});

Cypress.Commands.add('createAPIKeys', () => {
  const authToken = Cypress.env('authToken');
  const mpId = Cypress.env('mpId');
  const label = `label${Date.now()}`;

  const requestBody = {
    "label": label,
    "permissions": ["market-service:market:order_book_depth",
      "market-service:market:order_book_state",
      "market-service:market:place_order",
      "market-service:market:cancel_order",
      "market-service:market:modify_order",
      "market-service:market:replace_order",
      "market-service:market:mass_cancel",
      "market-service:market:execution_reports",
      "market-service:market:mass_order_status",
      "market-service:market:trades",
      "reporting:mp:orders",
      "reporting:mp:trades"
    ],
    "cancelOnDisconnect": false
  };

  cy.request({
    method: 'POST',
    url: basicURL + '/api/mps/' + mpId + '/api-keys',
    body: requestBody,
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  }).then((response) => {
    Cypress.env('keys', response.body);
    Cypress.env('secret', response.body.secret);
    Cypress.env('apiKey', response.body.apiKey);
  });
});
