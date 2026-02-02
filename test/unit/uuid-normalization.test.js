const expect = require('chai').expect;

// Import the schemaUtils module to test the normalization
const schemaUtils = require('../../lib/schemaUtils');

describe('UUID normalization', function () {
    it('should strip urn:uuid: prefix from string values', function () {
        const input = 'urn:uuid:550e8400-e29b-41d4-a716-446655440000';
        const normalized = schemaUtils._normalizeUuidValues(input);

        expect(normalized).to.equal('550e8400-e29b-41d4-a716-446655440000');
        expect(normalized).to.not.match(/^urn:uuid:/);
    });

    it('should handle plain UUID strings without modification', function () {
        const input = '550e8400-e29b-41d4-a716-446655440000';
        const normalized = schemaUtils._normalizeUuidValues(input);

        expect(normalized).to.equal('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle objects with urn:uuid: values', function () {
        const input = {
            id: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000',
            name: 'Test'
        };
        const normalized = schemaUtils._normalizeUuidValues(input);

        expect(normalized.id).to.equal('550e8400-e29b-41d4-a716-446655440000');
        expect(normalized.name).to.equal('Test');
    });

    it('should handle arrays with urn:uuid: values', function () {
        const input = [
            { id: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000' },
            { id: 'urn:uuid:6ba7b810-9dad-11d1-80b4-00c04fd430c8' }
        ];
        const normalized = schemaUtils._normalizeUuidValues(input);

        expect(normalized[0].id).to.equal('550e8400-e29b-41d4-a716-446655440000');
        expect(normalized[1].id).to.equal('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    });

    it('should handle nested objects', function () {
        const input = {
            user: {
                id: 'urn:uuid:550e8400-e29b-41d4-a716-446655440000',
                contacts: [
                    { contactId: 'urn:uuid:6ba7b810-9dad-11d1-80b4-00c04fd430c8' }
                ]
            }
        };
        const normalized = schemaUtils._normalizeUuidValues(input);

        expect(normalized.user.id).to.equal('550e8400-e29b-41d4-a716-446655440000');
        expect(normalized.user.contacts[0].contactId).to.equal('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
    });

    it('should not modify non-UUID strings', function () {
        const input = {
            name: 'John Doe',
            email: 'john@example.com',
            age: 30
        };
        const normalized = schemaUtils._normalizeUuidValues(input);

        expect(normalized).to.deep.equal(input);
    });

    it('should handle null and undefined', function () {
        expect(schemaUtils._normalizeUuidValues(null)).to.be.null;
        expect(schemaUtils._normalizeUuidValues(undefined)).to.be.undefined;
    });
});
