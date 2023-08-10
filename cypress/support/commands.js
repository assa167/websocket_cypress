import './admin-part';

Cypress.Commands.add('initializeWebSocket', (url) => {
  const socket = new WebSocket(url);

  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => {
      resolve(socket);
    });

    socket.addEventListener('error', (event) => {
      reject(event);
    });
  });
});

Cypress.Commands.add('socketRequest', (socket, message) => {
  return new Promise((resolve) => {
    socket.addEventListener('message', (event) => {
      const receivedMessage = JSON.parse(event.data);
      resolve(receivedMessage);
    });

    socket.send(JSON.stringify(message));
  });
});
