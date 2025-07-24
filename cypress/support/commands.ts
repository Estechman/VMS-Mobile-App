

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<void>;
      mockZmApi(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (username: string = 'testuser', password: string = 'testpass') => {
  cy.visit('/login');
  cy.get('ion-input[formControlName="serverName"] input').type('test-server');
  cy.get('ion-input[formControlName="url"] input').type('http://test.com');
  cy.get('ion-input[formControlName="apiurl"] input').type('http://test.com/api');
  cy.get('ion-input[formControlName="streamingurl"] input').type('http://test.com/stream');
  cy.get('ion-input[formControlName="username"] input').type(username);
  cy.get('ion-input[formControlName="password"] input').type(password);
  cy.get('ion-button[type="submit"]').click();
});

Cypress.Commands.add('mockZmApi', () => {
  cy.intercept('POST', '**/host/login.json', { 
    fixture: 'login-success.json' 
  }).as('login');
  
  cy.intercept('GET', '**/monitors.json*', { 
    fixture: 'monitors.json' 
  }).as('monitors');
  
  cy.intercept('GET', '**/events.json*', { 
    fixture: 'events.json' 
  }).as('events');
});
