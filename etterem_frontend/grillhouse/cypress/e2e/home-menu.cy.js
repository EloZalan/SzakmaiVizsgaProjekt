describe('Home Page And Menu', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/backend/api/menu-categories', [
      { id: 1, name: 'Levesek' },
      { id: 2, name: 'Főételek' },
    ]).as('getCategories');

    cy.intercept('GET', '**/backend/api/menu-items', [
      {
        id: 10,
        name: 'Húsleves',
        description: 'Gazdag, házias leves.',
        price: 1490,
        category_id: 1,
        image_url: null,
      },
      {
        id: 20,
        name: 'Marhapörkölt',
        description: 'Lassú tűzön főzve.',
        price: 3490,
        category_id: 2,
        image_url: null,
      },
    ]).as('getMenuItems');
  });

  it('loads home and toggles full menu panel', () => {
    cy.visit('/');
    cy.wait('@getCategories');
    cy.wait('@getMenuItems');

    cy.contains('h2', 'Kiváló Ételeink').should('be.visible');
    cy.contains('button', 'Teljes Menu megtekintése').should('be.visible').click();

    cy.contains('h3', 'Teljes Menu').should('be.visible');
    cy.contains('.menu-card__name', 'Húsleves').should('be.visible');

    cy.contains('button', 'Teljes Menu elrejtése').click();
    cy.contains('h3', 'Teljes Menu').should('not.exist');
  });
});
