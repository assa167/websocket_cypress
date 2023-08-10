describe('End-to-End Test', () => {
  it('should perform end-to-end scenario', () => {
    cy.authenticate().then(() => {
      cy.createCalendarAndSaveId().then(() => {
        cy.createInstrumentAndSave().then(() => {

          const authToken = Cypress.env('authToken');
          const calendarId = Cypress.env('calendarId');
          const instrument = Cypress.env('instrument');

          expect(authToken).to.exist;
          expect(calendarId).to.exist;
          expect(instrument).to.exist;
        });
      });
    });
  });
});

describe('Create MP and API Keys', () => {
  it('should create an MP and API Keys', () => {
    cy.authenticate().then(() => {
      cy.createMP().then(() => {
        cy.createAPIKeys().then(() => {

          const mp = Cypress.env('mp');
          const mpId = Cypress.env('calendarId');
          const keys = Cypress.env('keys');
          const secret = Cypress.env('secret');
          const apiKey = Cypress.env('apiKey');
          const instrument = Cypress.env('instrument');

          expect(mp).to.exist;
          expect(mpId).to.exist;
          expect(keys).to.exist;
          expect(secret).to.exist;
          expect(apiKey).to.exist;
        });
      });
    });
  });
});
