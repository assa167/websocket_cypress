import './admin-part';
import sha256 from "crypto-js/hmac-sha256";
import cloneDeep from "lodash/cloneDeep";
import { addStreamCommands } from '@lensesio/cypress-websocket-testing';

addStreamCommands();

Cypress.Commands.add('createExchangeGWSession', ({ onMessageReceived, apiKeyData, url }) => {
  return cy.stream({ url })
    .then((wsSubject) => {
      return new Cypress.Promise((resolve, reject) => {
        const receivedEvents = {};

        let sid = 0;

        const sendMessage = (messageRequest) => {
          const formattedRequest = { sid: ++sid, ...messageRequest };
          wsSubject.next(formattedRequest);
          console.log('Exchange GW request message', { formattedRequest });
        };

        const closeConnection = () => wsSubject.complete();

        wsSubject.subscribe({
          next: (message) => {
            if (!receivedEvents[message.q]) {
              receivedEvents[message.q] = [];
            }
            receivedEvents[message.q].push(message);

            console.log('Exchange GW response message', {
              message,
              allReceivedMessages: cloneDeep(receivedEvents)
            });

            onMessageReceived({
              currentMessage: message,
              currentQMessagesCount: receivedEvents[message.q].length,
              allReceivedMessages: receivedEvents,
              sendMessage,
              closeConnection
            });

            if (message.q === "exchange.market/createSession" && message.sig === 1) {
              resolve({ sendMessage, closeConnection });
            }
          },
          error: (error) => {
            console.error('Exchange GW error message', error);
            reject(error);
          },
          complete: () => {}
        })

// Create session
        const apiKey = apiKeyData.apiKey;
        const secret = apiKeyData.secret;
        const timestamp = String(Date.now());
        sendMessage({
          q: "exchange.market/createSession",
          d: {
            apiKey,
            timestamp,
            signature: sha256(`"apiKey":"${apiKey}","timestamp":"${timestamp}"`, secret).toString()
          }
        });
      })
    })
})
