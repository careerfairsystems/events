'use strict';

describe('Arkadevents E2E Tests:', function () {
  describe('Test Arkadevents page', function () {
    it('Should report missing credentials', function () {
      browser.get('http://localhost:3001/arkadevents');
      expect(element.all(by.repeater('arkadevent in arkadevents')).count()).toEqual(0);
    });
  });
});
