describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('ion-input[formControlName="serverName"]').should('be.visible');
    cy.get('ion-input[formControlName="username"]').should('be.visible');
    cy.get('ion-input[formControlName="password"]').should('be.visible');
    cy.get('ion-button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty required fields', () => {
    cy.get('ion-button[type="submit"]').click();
    cy.get('ion-toast').should('contain', 'Please fill in required fields');
  });

  it('should navigate to monitors on successful login', () => {
    cy.mockZmApi();
    
    cy.get('ion-input[formControlName="serverName"] input').type('test-server');
    cy.get('ion-input[formControlName="url"] input').type('http://test.com');
    cy.get('ion-input[formControlName="apiurl"] input').type('http://test.com/api');
    cy.get('ion-input[formControlName="streamingurl"] input').type('http://test.com/stream');
    cy.get('ion-input[formControlName="username"] input').type('testuser');
    cy.get('ion-input[formControlName="password"] input').type('testpass');
    cy.get('ion-button[type="submit"]').click();
    
    cy.wait('@login');
    cy.url().should('include', '/monitors');
  });

  it('should handle login error', () => {
    cy.intercept('POST', '**/host/login.json', { 
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('loginError');
    
    cy.get('ion-input[formControlName="serverName"] input').type('test-server');
    cy.get('ion-input[formControlName="url"] input').type('http://test.com');
    cy.get('ion-input[formControlName="apiurl"] input').type('http://test.com/api');
    cy.get('ion-input[formControlName="streamingurl"] input').type('http://test.com/stream');
    cy.get('ion-input[formControlName="username"] input').type('testuser');
    cy.get('ion-input[formControlName="password"] input').type('wrongpass');
    cy.get('ion-button[type="submit"]').click();
    
    cy.wait('@loginError');
    cy.get('ion-toast').should('contain', 'Login failed');
  });
});
